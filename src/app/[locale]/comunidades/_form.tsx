"use client";

import { useState, useRef } from "react";
import { useLocale } from "next-intl";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import { PhoneInput } from "@/components/forms/phone-input";
import { DEFAULT_COUNTRY } from "@/lib/normalize";
import { useHydrated } from "@/hooks/use-hydrated";
import { cleanWhitespace, cleanMultiline, normalizeEmail, normalizePhone, normalizeLink, findCountry } from "@/lib/normalize";
import { cn } from "@/lib/utils";
import { copyFor } from "./_copy";
import type { SummaryRow } from "@/components/forms/success-screen";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

/** Cuántos enlaces se pueden agregar como máximo. */
const MAX_LINKS = 5;
/**
 * El servidor recorta `socialUrl` a 300 caracteres sin avisar (ver
 * `parseCommunityInput`). Los enlaces se mandan unidos en una sola cadena, así
 * que el total se valida acá para que ninguno quede cortado.
 */
const MAX_LINKS_CHARS = 300;
const LINKS_SEPARATOR = ", ";

type FieldKey =
  | "communityName"
  | "metrics"
  | "contribution"
  | "contactEmail"
  | "contactPhone";

type Values = Record<FieldKey, string> & {
  contactPhoneCountry: string;
};

const EMPTY: Values = {
  communityName: "",
  metrics: "",
  contribution: "",
  contactEmail: "",
  contactPhone: "",
  contactPhoneCountry: DEFAULT_COUNTRY.code,
};

function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E6E4DA]">
        {label} {required && <span className="text-[#C143BC]">*</span>}
      </label>
      {hint && <p className="m-0 -mt-0.5 font-mono text-[11px] text-[#8E8EA0]">{hint}</p>}
      {children}
      {error && <p className="m-0 font-mono text-xs text-[#E24B4A]">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-[4px] border border-[#2C2550] bg-[#090812] px-3.5 sm:px-4 py-2.5 min-h-11 font-mono text-xs sm:text-sm text-[#E6E4DA] " +
  "placeholder:text-[#73726C] outline-none transition-all " +
  "focus:border-[#C143BC] focus:shadow-[0_0_12px_rgba(193,67,188,0.25)] focus:ring-1 focus:ring-[#C143BC]/40";

export function ComunidadesForm({
  onSubmit,
}: {
  onSubmit: (values: Record<string, unknown>, captchaToken: string, resumen: SummaryRow[]) => Promise<void>;
}) {
  const locale = useLocale();
  const t = copyFor(locale);

  const [v, setV] = useState<Values>(EMPTY);
  // Un enlace por campo. En pantalla son varias casillas; al enviar se unen con
  // coma en una sola cadena, que es lo que el servidor ya espera.
  const [links, setLinks] = useState<string[]>([""]);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<TurnstileHandle>(null);
  const captchaMounted = useHydrated() && !!siteKey;

  const set = (k: keyof Values, value: string) => {
    setV((prev) => ({ ...prev, [k]: value }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
    if (formError) setFormError("");
  };

  const clearLinkErrors = (i: number) =>
    setErrors((e) => ({ ...e, [`link_${i}`]: undefined, links: undefined }));

  const setLink = (i: number, value: string) => {
    setLinks((prev) => prev.map((l, j) => (j === i ? value : l)));
    clearLinkErrors(i);
    if (formError) setFormError("");
  };

  const addLink = () => {
    if (links.length >= MAX_LINKS) return;
    setFocusIdx(links.length);
    setLinks((prev) => [...prev, ""]);
  };

  const removeLink = (i: number) => {
    setFocusIdx(null);
    setLinks((prev) => prev.filter((_, j) => j !== i));
    // Los errores van por posición: al quitar una casilla se limpian.
    setErrors((e) => {
      const n = { ...e };
      Object.keys(n).forEach((k) => {
        if (k.startsWith("link_")) delete n[k];
      });
      delete n.links;
      return n;
    });
  };

  /** Revisa un enlace suelto. Devuelve el texto de error o el valor normalizado. */
  const checkLink = (raw: string): { error: string } | { value: string } => {
    const value = cleanWhitespace(raw);
    // Dos enlaces pegados en un mismo campo: justo lo que queremos evitar.
    if (/[,;\s]/.test(value)) return { error: t.e_socialUrl_many };
    const r = normalizeLink(value);
    if (!r.ok) return { error: t.e_socialUrl_invalid };
    return { value: r.value };
  };

  /** Al salir de la casilla: se deja el enlace ya normalizado (https, sin barra final). */
  const blurLink = (i: number) => {
    if (!cleanWhitespace(links[i])) return;
    const r = checkLink(links[i]);
    if ("error" in r) {
      setErrors((e) => ({ ...e, [`link_${i}`]: r.error }));
    } else if (r.value !== links[i]) {
      setLink(i, r.value);
    }
  };

  /**
   * Enlaces válidos, sin vacíos ni repetidos. Las casillas vacías de más se
   * ignoran: quien se arrepiente de agregar otro no tiene que borrarlo.
   */
  const collectLinks = (): { list: string[]; errs: Record<string, string> } => {
    const errs: Record<string, string> = {};
    const list: string[] = [];
    links.forEach((raw, i) => {
      if (!cleanWhitespace(raw)) return;
      const r = checkLink(raw);
      if ("error" in r) {
        errs[`link_${i}`] = r.error;
        return;
      }
      if (!list.some((x) => x.toLowerCase() === r.value.toLowerCase())) list.push(r.value);
    });
    if (Object.keys(errs).length === 0) {
      if (list.length === 0) errs.link_0 = t.e_socialUrl;
      else if (list.join(LINKS_SEPARATOR).length > MAX_LINKS_CHARS) errs.links = t.e_socialUrl_long;
    }
    return { list, errs };
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!cleanWhitespace(v.communityName)) e.communityName = t.e_communityName;
    Object.assign(e, collectLinks().errs);
    if (!cleanMultiline(v.metrics)) e.metrics = t.e_metrics;
    if (!cleanMultiline(v.contribution)) e.contribution = t.e_contribution;

    const mail = normalizeEmail(v.contactEmail);
    if (!mail.ok) e.contactEmail = mail.reason ?? t.e_contactEmail;

    const tel = normalizePhone(v.contactPhone, findCountry(v.contactPhoneCountry));
    if (!tel.ok) e.contactPhone = tel.reason ?? t.e_contactPhone;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (siteKey && !captchaToken) return;

    setSubmitting(true);
    setFormError("");

    const tel = normalizePhone(v.contactPhone, findCountry(v.contactPhoneCountry));
    // Se unen con coma aquí: al servidor le sigue llegando una sola cadena.
    const socialUrl = collectLinks().list.join(LINKS_SEPARATOR);

    const payload: Record<string, unknown> = {
      communityName: cleanWhitespace(v.communityName),
      socialUrl,
      metrics: cleanMultiline(v.metrics),
      contribution: cleanMultiline(v.contribution),
      contactEmail: normalizeEmail(v.contactEmail).value,
      contactPhone: tel.ok ? tel.value : v.contactPhone,
      contactPhoneCountry: v.contactPhoneCountry,
    };

    const summaryRows: SummaryRow[] = [
      { label: t.r_community, value: v.communityName },
      { label: t.r_social, value: socialUrl },
      { label: t.r_metrics, value: v.metrics },
      { label: t.r_contribution, value: v.contribution },
      { label: t.r_email, value: v.contactEmail },
      { label: t.r_phone, value: tel.ok ? tel.value : v.contactPhone },
    ];

    try {
      await onSubmit(payload, captchaToken, summaryRows);
    } catch (err) {
      setFormError((err as Error).message);
      setCaptchaToken("");
      captchaRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !submitting && (!siteKey || !!captchaToken);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {/* RECUADRO 01: IDENTIDAD DE LA COMUNIDAD */}
      <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
        <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
          <span className="arcade-pixel text-xs text-[#F2A6F0]">
            {t.sec_identity}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
            Comunidad
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <Field label={t.communityName} required htmlFor="c-name" error={errors.communityName}>
            <input
              id="c-name"
              value={v.communityName}
              onChange={(e) => set("communityName", e.target.value)}
              placeholder={t.communityName_ph}
              maxLength={120}
              className={cn(inputCls, errors.communityName && "border-[#E24B4A]")}
            />
          </Field>

          <Field
            label={t.socialUrl}
            required
            htmlFor="c-social-0"
            hint={t.socialUrl_hint}
            error={errors.links}
          >
            <div className="flex flex-col gap-2.5">
              {links.map((link, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-stretch gap-2">
                    <input
                      id={`c-social-${i}`}
                      value={link}
                      onChange={(e) => setLink(i, e.target.value)}
                      onBlur={() => blurLink(i)}
                      placeholder={i === 0 ? t.socialUrl_ph : t.socialUrl_ph_extra}
                      maxLength={250}
                      inputMode="url"
                      autoComplete="off"
                      autoFocus={focusIdx === i}
                      aria-label={`${t.socialUrl} — ${t.socialUrl_n} ${i + 1}`}
                      className={cn(inputCls, errors[`link_${i}`] && "border-[#E24B4A]")}
                    />
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => removeLink(i)}
                        aria-label={`${t.socialUrl_remove} ${t.socialUrl_n} ${i + 1}`}
                        className="shrink-0 min-h-11 rounded-[4px] border border-red-500/40 px-3 font-mono text-[11px] font-bold text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        {t.socialUrl_remove}
                      </button>
                    )}
                  </div>
                  {errors[`link_${i}`] && (
                    <p className="m-0 font-mono text-xs text-[#E24B4A]">{errors[`link_${i}`]}</p>
                  )}
                </div>
              ))}

              {links.length < MAX_LINKS && (
                <button
                  type="button"
                  onClick={addLink}
                  className="flex w-full min-h-11 items-center justify-center gap-2 rounded-[4px] border-2 border-dashed border-[#2C2550] bg-[#090812] py-3 font-mono text-xs font-bold text-[#B4B2A9] transition-all hover:border-[#C143BC] hover:text-[#F2A6F0]"
                >
                  {t.socialUrl_add}
                </button>
              )}
            </div>
          </Field>
        </div>
      </div>

      {/* RECUADRO 02: ALCANCE & COLABORACIÓN */}
      <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
        <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
          <span className="arcade-pixel text-xs text-[#F2A6F0]">
            {t.sec_reach}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
            Colaboración
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <Field
            label={t.metrics}
            required
            htmlFor="c-metrics"
            error={errors.metrics}
            hint={t.metrics_hint}
          >
            <textarea
              id="c-metrics"
              value={v.metrics}
              onChange={(e) => set("metrics", e.target.value)}
              placeholder={t.metrics_ph}
              maxLength={600}
              rows={3}
              className={cn(inputCls, "resize-y", errors.metrics && "border-[#E24B4A]")}
            />
          </Field>

          <Field
            label={t.contribution}
            required
            htmlFor="c-contrib"
            error={errors.contribution}
            hint={t.contribution_hint}
          >
            <textarea
              id="c-contrib"
              value={v.contribution}
              onChange={(e) => set("contribution", e.target.value)}
              placeholder={t.contribution_ph}
              maxLength={2000}
              rows={4}
              className={cn(inputCls, "resize-y", errors.contribution && "border-[#E24B4A]")}
            />
          </Field>
        </div>
      </div>

      {/* RECUADRO 03: DATOS DE CONTACTO */}
      <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
        <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
          <span className="arcade-pixel text-xs text-[#F2A6F0]">
            {t.sec_contact}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
            Contacto
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t.contactEmail}
            required
            htmlFor="c-email"
            error={errors.contactEmail}
            hint={t.contactEmail_hint}
          >
            <input
              id="c-email"
              type="email"
              inputMode="email"
              value={v.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              placeholder={t.contactEmail_ph}
              maxLength={200}
              className={cn(inputCls, errors.contactEmail && "border-[#E24B4A]")}
            />
          </Field>

          <PhoneInput
            label={t.contactPhone}
            required
            countryCode={v.contactPhoneCountry}
            onCountryChange={(c) => set("contactPhoneCountry", c)}
            value={v.contactPhone}
            onChange={(n) => set("contactPhone", n)}
            error={errors.contactPhone}
          />
        </div>
      </div>

      {/* AVISO IMPORTANTE DE POSTULACIÓN */}
      <div className="rounded-[4px] border-2 border-amber-500/60 bg-amber-500/10 p-4 sm:p-5 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
              {t.notice_title}
            </span>
            <p className="m-0 font-mono text-xs leading-relaxed text-[#E6E4DA]">
              {t.notice_body}
            </p>
          </div>
        </div>
      </div>

      {/* TURNSTILE CAPTCHA */}
      {siteKey && (
        <div className="flex items-center justify-center py-2">
          {captchaMounted ? (
            <Turnstile
              ref={captchaRef}
              siteKey={siteKey}
              theme="dark"
              appearance="interaction-only"
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken("")}
              onError={() => setCaptchaToken("")}
            />
          ) : null}
        </div>
      )}

      {siteKey && !captchaToken && !formError && (
        <p className="m-0 text-center font-mono text-xs text-[#73726C]">
          {t.captcha}
        </p>
      )}

      {formError && (
        <div className="rounded-[4px] border border-[#E24B4A] bg-[#E24B4A]/10 px-4 py-3 font-mono text-sm text-[#E24B4A]">
          {formError}
        </div>
      )}

      {/* BOTÓN DE ENVÍO */}
      <button
        type="submit"
        disabled={!canSubmit}
        className={cn(
          "w-full rounded-[4px] border-2 border-[#C143BC] bg-[#C143BC] min-h-11 px-8 py-4 font-mono text-sm sm:text-base font-bold text-[#0E0E1A] shadow-[0_0_20px_rgba(193,67,188,0.4)] transition-all",
          "hover:-translate-y-0.5 hover:bg-[#F2A6F0] hover:shadow-[0_0_28px_rgba(193,67,188,0.6)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50",
          "flex items-center justify-center gap-2",
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.submitting}
          </>
        ) : (
          t.submit
        )}
      </button>
    </form>
  );
}
