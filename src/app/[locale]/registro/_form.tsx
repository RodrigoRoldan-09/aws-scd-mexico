"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import { SearchSelect, type SelectOption } from "@/components/forms/search-select";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  DOC_TYPES,
  ENTITY_TYPES,
  FREE_TEXT_MAX,
  ROLES,
  ROLE_GROUPS,
  countryCodeOf,
  labelOf,
  type Locale,
} from "@/data/attendee-form";
import type { SummaryRow } from "@/components/forms/success-screen";
import { copyFor } from "./_copy";
import { EVENT } from "@/lib/constants";
import { cleanWhitespace, normalizeDocument, normalizeEmail } from "@/lib/normalize";
import { cn } from "@/lib/utils";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

/**
 * Formulario de asistentes. Las preguntas viven en el código porque de ellas
 * dependen el check-in, la escarapela, el pasaporte y los filtros del panel.
 *
 * Las claves con guiones bajos son el contrato con el resto del sistema: si
 * alguna cambia, hay que migrar los registros ya guardados.
 */

export type Responses = Record<string, string>;

const COUNTRY = countryCodeOf(EVENT.country);

/** Campos del bloque de identidad, en el orden en que se muestran. */
type FieldKey =
  | "firstName"
  | "lastName"
  | "email"
  | "attendance"
  | "documentType"
  | "documentNumber"
  | "role"
  | "roleOther"
  | "entityType"
  | "entityName"
  | "fromCommunity"
  | "communityName";

const EMPTY: Record<FieldKey, string> = {
  firstName: "",
  lastName: "",
  email: "",
  attendance: "in-person",
  documentType: "",
  documentNumber: "",
  role: "",
  roleOther: "",
  entityType: "",
  entityName: "",
  fromCommunity: "no",
  communityName: "",
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

export function RegistroForm({
  onSubmit,
  volunteersOpen = false,
}: {
  onSubmit: (responses: Responses, captchaToken: string, resumen: SummaryRow[]) => Promise<void>;
  /**
   * Si la convocatoria de voluntarios está abierta.
   *
   * Lo resuelve el servidor: si estuviera cerrada, el aviso apuntaría a un
   * formulario que no acepta nada y sería peor que no decir nada.
   */
  volunteersOpen?: boolean;
}) {
  // El formulario sigue el idioma de la página: /registro y /en/registro ya
  // son dos rutas distintas.
  const locale = (useLocale() === "en" ? "en" : "es") as Locale;
  const t = copyFor(locale);

  const [v, setV] = useState<Record<FieldKey, string>>(EMPTY);
  const [acceptCoc, setAcceptCoc] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<TurnstileHandle>(null);
  const captchaMounted = useHydrated() && !!siteKey;

  // Restaurar borrador de localStorage si el usuario navega a términos y regresa
  useEffect(() => {
    try {
      const saved = localStorage.getItem("scd:draft_registro");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.v) setV((prev) => ({ ...prev, ...parsed.v }));
        if (typeof parsed.acceptCoc === "boolean") setAcceptCoc(parsed.acceptCoc);
        if (typeof parsed.acceptPrivacy === "boolean") setAcceptPrivacy(parsed.acceptPrivacy);
      }
    } catch {
      // Ignorar fallos de almacenamiento local
    }
  }, []);

  const saveDraft = (nextV: Record<FieldKey, string>, coc: boolean, priv: boolean) => {
    try {
      localStorage.setItem("scd:draft_registro", JSON.stringify({ v: nextV, acceptCoc: coc, acceptPrivacy: priv }));
    } catch {
      // Ignorar fallos
    }
  };

  const set = (k: FieldKey, value: string) => {
    setV((prev) => {
      const next = { ...prev, [k]: value };
      saveDraft(next, acceptCoc, acceptPrivacy);
      return next;
    });
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
    if (formError) setFormError("");
  };

  const docTypes = DOC_TYPES[COUNTRY];
  const roles = ROLES[COUNTRY];
  const entities = ENTITY_TYPES[COUNTRY];

  const roleOptions: SelectOption[] = useMemo(
    () => roles.map((r) => ({
      value: r.value,
      label: labelOf(r, locale),
      group: labelOf(ROLE_GROUPS[r.group], locale),
    })),
    [roles, locale],
  );
  const entityOptions: SelectOption[] = useMemo(
    () => entities.map((e) => ({ value: e.value, label: labelOf(e, locale) })),
    [entities, locale],
  );

  const docRule = docTypes.find((d) => d.value === v.documentType)?.rule;
  const docType = docTypes.find((d) => d.value === v.documentType);
  const docExample = docType?.example;
  const docExampleEn = docType?.exampleEn;

  const needsRoleOther = v.role === "other";
  // "Ninguna / Independiente" no pide nombre: quien lo elige no tiene entidad.
  const needsEntityName = !!v.entityType && v.entityType !== "none";

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!cleanWhitespace(v.firstName)) e.firstName = t.e_firstName;
    if (!cleanWhitespace(v.lastName)) e.lastName = t.e_lastName;

    const mail = normalizeEmail(v.email);
    if (!mail.ok) e.email = mail.reason ?? t.e_email;

    // Documento: deshabilitado / opcional
    if (v.documentType && v.documentNumber) {
      const rule = docTypes.find((d) => d.value === v.documentType)?.rule;
      if (rule) {
        const doc = normalizeDocument(v.documentNumber, rule);
        if (!doc.ok) e.documentNumber = doc.reason;
      }
    }

    if (!v.role) e.role = t.e_role;
    if (needsRoleOther && !cleanWhitespace(v.roleOther)) {
      e.roleOther = t.e_roleOther;
    }
    if (!v.entityType) e.entityType = t.e_entityType;
    if (needsEntityName && !cleanWhitespace(v.entityName)) {
      e.entityName = t.e_entityName;
    }

    if (v.fromCommunity === "yes" && !cleanWhitespace(v.communityName)) {
      e.communityName = t.e_communityName;
    }

    if (!acceptCoc) e.coc = t.e_coc;
    if (!acceptPrivacy) e.privacy = t.e_privacy;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /** Lo que se envía: valores ya normalizados y etiquetas legibles. */
  const build = (): Responses => {
    const doc = docRule ? normalizeDocument(v.documentNumber, docRule) : null;

    const out: Responses = {
      firstName: cleanWhitespace(v.firstName),
      lastName: cleanWhitespace(v.lastName),
      email: normalizeEmail(v.email).value,
      attendance: "in-person",
      role: v.role,
      roleOther: needsRoleOther ? cleanWhitespace(v.roleOther) : "",
      entityType: v.entityType,
      entityName: needsEntityName ? cleanWhitespace(v.entityName) : "",
      fromCommunity: v.fromCommunity === "yes" ? "true" : "false",
      communityName: v.fromCommunity === "yes" ? cleanWhitespace(v.communityName) : "",
      acceptCoc: "true",
      acceptPrivacy: "true",
    };

    if (doc?.ok) {
      out.documentType = v.documentType;
      out.documentNumber = doc.value;
    }
    return out;
  };

  const send = async () => {
    setSubmitting(true);
    setFormError("");
    try {
      await onSubmit(build(), captchaToken, summaryRows);
    } catch (err) {
      setFormError((err as Error).message);
      setCaptchaToken("");
      captchaRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Se envía de una; el repaso de los datos vive en la pantalla de gracias.
    void send();
  };

  const summaryRows: SummaryRow[] = [
    { label: t.r_name, value: `${v.firstName} ${v.lastName}`.trim() },
    { label: t.r_email, value: v.email },
    { label: t.r_mode, value: t.inPerson },
    ...(v.documentNumber
      ? [{ label: t.r_doc, value: `${docType ? labelOf(docType, locale) : ""} ${v.documentNumber}`.trim() }]
      : []),
    {
      label: t.r_role,
      value: needsRoleOther
        ? v.roleOther
        : (() => {
            const r = roles.find((x) => x.value === v.role);
            return r ? labelOf(r, locale) : "";
          })(),
    },
    {
      label: t.r_entity,
      value: needsEntityName
        ? `${v.entityName} (${entities.find((x) => x.value === v.entityType) ? labelOf(entities.find((x) => x.value === v.entityType)!, locale) : ""})`.trim()
        : entities.find((x) => x.value === v.entityType)
          ? labelOf(entities.find((x) => x.value === v.entityType)!, locale)
          : "",
    },
    ...(v.fromCommunity === "yes" && v.communityName
      ? [{ label: t.r_community, value: v.communityName }]
      : []),
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {/* RECUADRO 01: IDENTIDAD & CONTACTO */}
      <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
        <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
          <span className="arcade-pixel text-xs text-[#F2A6F0]">
            // 01 · Identidad & Contacto
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
            Requerido
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t.firstName} required htmlFor="f-name" error={errors.firstName}>
              <input
                id="f-name"
                value={v.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder={t.firstName_ph}
                maxLength={60}
                className={cn(inputCls, errors.firstName && "border-[#E24B4A]")}
              />
            </Field>
            <Field label={t.lastName} required htmlFor="f-last" error={errors.lastName}>
              <input
                id="f-last"
                value={v.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder={t.lastName_ph}
                maxLength={60}
                className={cn(inputCls, errors.lastName && "border-[#E24B4A]")}
              />
            </Field>
          </div>

          <Field label={t.email} required htmlFor="f-mail" error={errors.email} hint={t.email_hint}>
            <input
              id="f-mail"
              type="email"
              inputMode="email"
              value={v.email}
              onChange={(e) => set("email", e.target.value)}
              onBlur={() => {
                if (!v.email.trim()) return;
                const r = normalizeEmail(v.email);
                setErrors((x) => ({ ...x, email: r.ok ? undefined : r.reason }));
              }}
              placeholder={t.email_ph}
              className={cn(inputCls, errors.email && "border-[#E24B4A]")}
            />
          </Field>
        </div>
      </div>

      {/* RECUADRO 02: MODALIDAD & CONTROL DE ACCESO */}
      <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
        <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
          <span className="arcade-pixel text-xs text-[#F2A6F0]">
            // 02 · Modalidad & Acceso At IPN
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
            Sede CDMX
          </span>
        </div>

        <div className="flex flex-col gap-5">
          {/* Modalidad 100% presencial */}
          <Field label={t.attendance}>
            <div className="rounded-[4px] border-2 border-[#C143BC] bg-[#C143BC]/10 p-3 sm:p-3.5">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#F2A6F0] animate-pulse" />
                <span className="font-mono text-xs sm:text-sm font-bold text-[#F2A6F0]">
                  {t.inPerson}
                </span>
                <span className="ml-auto rounded-[2px] border border-[#C143BC]/60 bg-[#090812] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F2A6F0]">
                  {t.inPerson_badge}
                </span>
              </div>
              <p className="mt-2 m-0 font-mono text-[11px] leading-relaxed text-[#B4B2A9]">
                {t.inPerson_note}
              </p>
            </div>
          </Field>

          {/* Documento: número de documento deshabilitado */}
          <div className="grid gap-5 sm:grid-cols-[1fr_1fr]">
            <Field label={t.docType} htmlFor="f-doct" error={errors.documentType}>
              <SearchSelect
                id="f-doct"
                options={docTypes.map((d) => ({ value: d.value, label: labelOf(d, locale) }))}
                value={v.documentType}
                onChange={(val) => set("documentType", val)}
                placeholder={t.select}
                searchPlaceholder={t.searchType}
                invalid={!!errors.documentType}
              />
            </Field>
            <Field
              label={t.docNumber}
              htmlFor="f-docn"
              error={errors.documentNumber}
            >
              <input
                id="f-docn"
                disabled
                value=""
                readOnly
                placeholder={locale === "en" ? "Disabled" : "Deshabilitado"}
                className={cn(
                  inputCls,
                  "cursor-not-allowed opacity-50 bg-[#0E0E1A]/40 border-[#2C2550] text-[#73726C]",
                )}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* RECUADRO 03: PERFIL & AFILIACIÓN */}
      <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
        <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
          <span className="arcade-pixel text-xs text-[#F2A6F0]">
            // 03 · Perfil & Organización
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
            Comunidad
          </span>
        </div>

        <div className="flex flex-col gap-5">
          {/* Rol */}
          <Field label={t.role} required htmlFor="f-role" error={errors.role}>
            <SearchSelect
              id="f-role"
              options={roleOptions}
              value={v.role}
              onChange={(val) => set("role", val)}
              placeholder={t.role_ph}
              searchPlaceholder={t.searchRole}
              invalid={!!errors.role}
            />
          </Field>

          <AnimatePresence initial={false}>
            {needsRoleOther && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Field label={t.which} required htmlFor="f-roleo" error={errors.roleOther}>
                  <input
                    id="f-roleo"
                    value={v.roleOther}
                    onChange={(e) => set("roleOther", e.target.value)}
                    placeholder={t.which_ph}
                    maxLength={FREE_TEXT_MAX}
                    className={cn(inputCls, errors.roleOther && "border-[#E24B4A]")}
                  />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Entidad */}
          <Field label={t.entity} required htmlFor="f-ent" error={errors.entityType}>
            <SearchSelect
              id="f-ent"
              options={entityOptions}
              value={v.entityType}
              onChange={(val) => set("entityType", val)}
              placeholder={t.entity_ph}
              searchPlaceholder={t.search}
              invalid={!!errors.entityType}
            />
          </Field>

          <AnimatePresence initial={false}>
            {needsEntityName && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Field
                  label={t.entityName(
                    entities.find((x) => x.value === v.entityType)
                      ? labelOf(entities.find((x) => x.value === v.entityType)!, locale).toLowerCase()
                      : locale === "en" ? "organisation" : "entidad",
                  )}
                  required
                  htmlFor="f-entn"
                  error={errors.entityName}
                >
                  <input
                    id="f-entn"
                    value={v.entityName}
                    onChange={(e) => set("entityName", e.target.value)}
                    placeholder={t.entityName_ph}
                    maxLength={FREE_TEXT_MAX}
                    className={cn(inputCls, errors.entityName && "border-[#E24B4A]")}
                  />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ¿Vienes de alguna comunidad? */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#2C2550]/60">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E6E4DA]">
              {t.fromCommunity}
            </span>
            <div className="grid grid-cols-2 gap-3">
              {(["no", "yes"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set("fromCommunity", opt)}
                  className={cn(
                    "rounded-[4px] border py-2.5 px-3 min-h-11 flex items-center justify-center font-mono text-xs sm:text-sm font-bold transition-all",
                    v.fromCommunity === opt
                      ? "border-2 border-[#C143BC] bg-[#C143BC]/20 text-[#F2A6F0] shadow-[0_0_14px_rgba(193,67,188,0.25)]"
                      : "border-[#2C2550] bg-[#090812] text-[#B4B2A9] hover:border-[#C143BC]/60 hover:text-[#E6E4DA]",
                  )}
                >
                  {opt === "yes" ? t.fromCommunity_yes : t.fromCommunity_no}
                </button>
              ))}
            </div>
          </div>

          {/* Campo de texto ¿Cuál? cuando v.fromCommunity === "yes" */}
          <AnimatePresence initial={false}>
            {v.fromCommunity === "yes" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Field label={t.communityName} required htmlFor="f-community" error={errors.communityName}>
                  <input
                    id="f-community"
                    value={v.communityName}
                    onChange={(e) => set("communityName", e.target.value)}
                    placeholder={t.communityName_ph}
                    maxLength={100}
                    className={cn(inputCls, errors.communityName && "border-[#E24B4A]")}
                  />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RECUADRO 04: VALIDACIÓN, CONSENTIMIENTOS & CONFIRMACIÓN */}
      <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
        <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
          <span className="arcade-pixel text-xs text-[#F2A6F0]">
            // 04 · Confirmación de Acceso
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
            Finalizar
          </span>
        </div>

        <div className="flex flex-col gap-5">
          {/* Consentimientos */}
          <div className="flex flex-col gap-3">
            {(
              [
                ["coc", acceptCoc, setAcceptCoc, t.coc_text, t.coc_link, "/codigo-conducta"],
                ["privacy", acceptPrivacy, setAcceptPrivacy, t.privacy_text, t.privacy_link, "/privacidad"],
              ] as const
            ).map(([key, checked, setter, text, linkText, href]) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="flex cursor-pointer items-start gap-3 py-1">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => {
                      const nextVal = !checked;
                      setter(nextVal);
                      if (key === "coc") saveDraft(v, nextVal, acceptPrivacy);
                      if (key === "privacy") saveDraft(v, acceptCoc, nextVal);
                      if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
                    }}
                    className={cn(
                      "mt-0.5 flex h-6 w-6 sm:h-5 sm:w-5 min-h-6 min-w-6 shrink-0 items-center justify-center rounded-[4px] border transition-all",
                      checked ? "border-[#C143BC] bg-[#C143BC]" : "border-[#2C2550] bg-[#0E0E1A]",
                      errors[key] && "border-[#E24B4A]",
                    )}
                  >
                    {checked && (
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="#FFFFFF" strokeWidth="4">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                  <span className="font-mono text-xs leading-relaxed text-[#B4B2A9]">
                    {text}
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#C143BC] underline underline-offset-4 hover:text-[#F2A6F0]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {linkText}
                    </a>
                    . <span className="text-[#C143BC]">*</span>
                  </span>
                </label>
                {errors[key] && (
                  <p className="m-0 pl-8 font-mono text-xs text-[#E24B4A]">{errors[key]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Puerta a voluntarios */}
          <AnimatePresence initial={false}>
            {volunteersOpen && v.attendance === "in-person" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <p className="m-0 rounded-[4px] border border-[#C143BC]/40 bg-[#C143BC]/10 px-4 py-3 font-mono text-xs leading-relaxed text-[#E6E4DA]">
                  {t.volunteers_q}
                  <strong className="font-bold text-[#F2A6F0]">{t.volunteers_strong}</strong>
                  {t.volunteers_rest}
                  <Link href="/voluntarios" className="font-bold text-[#F2A6F0] underline underline-offset-4 hover:brightness-110">
                    {t.volunteers_link}
                  </Link>
                  .
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {siteKey && (
            <div className="flex items-center justify-center">
              {captchaMounted ? (
                <Turnstile
                  ref={captchaRef}
                  siteKey={siteKey}
                  theme="dark"
                  appearance="interaction-only"
                  onVerify={setCaptchaToken}
                  onExpire={() => setCaptchaToken("")}
                  onError={() => setCaptchaToken("")}
                />
              ) : null}
            </div>
          )}

          {formError && (
            <p className="m-0 rounded-[4px] border border-[#E24B4A] bg-[#E24B4A]/10 px-4 py-3 font-mono text-sm text-[#E24B4A]">
              {formError}
            </p>
          )}

          {siteKey && !captchaToken && !formError && (
            <p className="m-0 text-center font-mono text-xs text-[#73726C]">
              {t.captcha}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || (!!siteKey && !captchaToken)}
            className="w-full cursor-pointer rounded-[4px] border-2 border-[#C143BC] bg-[#C143BC] px-6 py-4 font-mono text-sm font-bold text-[#0E0E1A] shadow-[0_0_24px_rgba(193,67,188,0.45)] transition-all hover:bg-[#D970D7] active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? t.sending : t.submit}
          </button>
        </div>
      </div>
    </form>
  );
}
