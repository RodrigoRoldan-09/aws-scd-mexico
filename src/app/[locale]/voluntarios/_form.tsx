"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import { SearchSelect, type SelectOption } from "@/components/forms/search-select";
import { PhoneInput } from "@/components/forms/phone-input";
import { ObfuscatedEmail } from "@/components/ui/obfuscated-email";
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
import {
  AVAILABILITY,
  DIETARY,
  INTEREST_AREAS,
  MOTIVATION_MAX,
  PREVIOUS_EXPERIENCE,
  SHIRT_SIZES,
  VOLUNTEER_TEXT_MAX,
  interestAreasLabelOf,
  type Option,
} from "@/data/volunteer-form";
import { EVENT } from "@/lib/constants";
import {
  cleanWhitespace,
  findCountry,
  normalizeDocument,
  normalizeEmail,
  normalizePhone,
} from "@/lib/normalize";
import { cn } from "@/lib/utils";
import type { SummaryRow } from "@/components/forms/success-screen";
import { copyFor } from "./_copy";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

/**
 * Formulario de voluntarios. Estático, como el de asistentes: de estas
 * respuestas salen la lista de impresión, el pedido de camisetas, el de
 * alimentación y los certificados. Lo único que viene del panel es la lista de
 * Student Builder Groups.
 */

export type VolunteerValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  documentType: string;
  documentNumber: string;
  role: string;
  roleOther: string;
  entityType: string;
  entityName: string;
  sbg: string;
  sbgOther: string;
  availability: string;
  interestAreas: string[];
  previousExperience: string;
  motivation: string;
  shirtSize: string;
  dietary: string;
  dietaryOther: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyCountry: string;
};

const COUNTRY = countryCodeOf(EVENT.country);

const EMPTY: VolunteerValues = {
  firstName: "", lastName: "", email: "", phone: "", phoneCountry: COUNTRY,
  documentType: "", documentNumber: "",
  role: "", roleOther: "", entityType: "", entityName: "",
  sbg: "", sbgOther: "",
  availability: "", interestAreas: [], previousExperience: "", motivation: "",
  shirtSize: "", dietary: "", dietaryOther: "",
  emergencyName: "", emergencyPhone: "", emergencyCountry: COUNTRY,
};

/**
 * Fila de dos campos que se alinean entre sí: con `subgrid` las dos columnas
 * comparten las mismas cuatro filas (etiqueta, pista, control y error).
 */
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

function Choice({
  options,
  value,
  onChange,
  className,
  locale,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  locale: Locale;
}) {
  return (
    <div className={cn("grid gap-3", className ?? "grid-cols-1 sm:grid-cols-3")}>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center justify-between rounded-[4px] border p-3 min-h-11 text-left font-mono text-xs sm:text-sm font-bold transition-all",
              selected
                ? "border-[#C143BC] bg-[#C143BC]/15 text-[#E6E4DA] shadow-[0_0_16px_rgba(193,67,188,0.25)] ring-1 ring-[#C143BC]/40"
                : "border-[#2C2550] bg-[#090812] text-[#B4B2A9] hover:border-[#C143BC]/60 hover:text-[#E6E4DA]",
            )}
          >
            <span className="leading-snug">{labelOf(o, locale)}</span>
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full ml-2",
                selected ? "bg-[#F2A6F0] shadow-[0_0_8px_#C143BC]" : "bg-[#2C2550]",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function VoluntariosForm({
  sbgs,
  onSubmit,
  onChange,
}: {
  /** Lista editable desde el panel, ya resuelta en el servidor. */
  sbgs: Option[];
  onSubmit: (values: Record<string, unknown>, captchaToken: string, resumen: SummaryRow[]) => Promise<void>;
  onChange?: (v: VolunteerValues) => void;
}) {
  // El formulario sigue el idioma de la página, igual que el de asistentes.
  const locale = (useLocale() === "en" ? "en" : "es") as Locale;
  const t = copyFor(locale);

  const [v, setV] = useState<VolunteerValues>(EMPTY);
  const [acceptCoc, setAcceptCoc] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<TurnstileHandle>(null);
  const captchaMounted = useHydrated() && !!siteKey;

  const set = <K extends keyof VolunteerValues>(k: K, value: VolunteerValues[K]) => {
    setV((prev) => {
      const next = { ...prev, [k]: value };
      onChange?.(next);
      return next;
    });
    if (errors[k as string]) setErrors((e) => ({ ...e, [k as string]: undefined }));
    if (formError) setFormError("");
  };

  const toggleArea = (code: string) => {
    // "Donde más se necesite" es excluyente: marcarla junto a otras áreas no
    // dice nada a la hora de armar los turnos.
    const next = code === "any"
      ? (v.interestAreas.includes("any") ? [] : ["any"])
      : v.interestAreas.includes(code)
        ? v.interestAreas.filter((a) => a !== code)
        : [...v.interestAreas.filter((a) => a !== "any"), code];
    set("interestAreas", next);
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
  const sbgOptions: SelectOption[] = useMemo(
    () => sbgs.map((x) => ({ value: x.value, label: labelOf(x, locale) })),
    [sbgs, locale],
  );

  const docRule = docTypes.find((d) => d.value === v.documentType)?.rule;
  const docExample = docTypes.find((d) => d.value === v.documentType)?.example;

  const needsRoleOther = v.role === "other";
  const needsEntityName = !!v.entityType && v.entityType !== "none";
  const needsSbgOther = v.sbg === "other";

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!cleanWhitespace(v.firstName)) e.firstName = t.e_firstName;
    if (!cleanWhitespace(v.lastName)) e.lastName = t.e_lastName;

    const mail = normalizeEmail(v.email);
    if (!mail.ok) e.email = mail.reason ?? t.e_email;

    const tel = normalizePhone(v.phone, findCountry(v.phoneCountry));
    if (!tel.ok) e.phone = tel.reason;

    // El documento no es opcional acá: el voluntariado es presencial y el
    // equipo entra a la sede antes que el público.
    if (!v.documentType) e.documentType = t.e_docType;
    else {
      const rule = docTypes.find((d) => d.value === v.documentType)!.rule;
      const doc = normalizeDocument(v.documentNumber, rule);
      if (!doc.ok) e.documentNumber = doc.reason;
    }

    if (!v.role) e.role = t.e_role;
    if (needsRoleOther && !cleanWhitespace(v.roleOther)) e.roleOther = t.e_roleOther;
    if (!v.entityType) e.entityType = t.e_entityType;
    if (needsEntityName && !cleanWhitespace(v.entityName)) e.entityName = t.e_entityName;
    if (!v.sbg) e.sbg = t.e_sbg;
    if (needsSbgOther && !cleanWhitespace(v.sbgOther)) e.sbgOther = t.e_sbgOther;

    if (!v.availability) e.availability = t.e_availability;
    if (!v.interestAreas.length) e.interestAreas = t.e_areas;
    if (!v.previousExperience) e.previousExperience = t.e_experience;

    if (!v.shirtSize) e.shirtSize = t.e_shirt;
    if (!cleanWhitespace(v.emergencyName)) e.emergencyName = t.e_emergency;
    const emTel = normalizePhone(v.emergencyPhone, findCountry(v.emergencyCountry));
    if (!emTel.ok) e.emergencyPhone = emTel.reason;

    if (!acceptCoc) e.coc = t.e_coc;
    if (!acceptPrivacy) e.privacy = t.e_privacy;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /** Lo que se envía: códigos ya normalizados, no etiquetas. */
  const build = (): Record<string, unknown> => {
    const doc = docRule ? normalizeDocument(v.documentNumber, docRule) : null;
    const tel = normalizePhone(v.phone, findCountry(v.phoneCountry));
    const emTel = normalizePhone(v.emergencyPhone, findCountry(v.emergencyCountry));
    return {
      firstName: cleanWhitespace(v.firstName),
      lastName: cleanWhitespace(v.lastName),
      email: normalizeEmail(v.email).value,
      // Los teléfonos viajan con indicativo, en un solo campo: es como se
      // marcan y como los va a copiar quien coordine el día del evento.
      phone: tel.ok ? tel.value : "",
      documentType: v.documentType,
      documentNumber: doc?.ok ? doc.value : v.documentNumber,
      role: v.role,
      roleOther: needsRoleOther ? cleanWhitespace(v.roleOther) : "",
      entityType: v.entityType,
      entityName: needsEntityName ? cleanWhitespace(v.entityName) : "",
      // El SBG viaja con su nombre: la lista es editable desde el panel, así
      // que no hay catálogo fijo contra el que traducir un código.
      sbg: needsSbgOther ? cleanWhitespace(v.sbgOther) : v.sbg,
      availability: v.availability,
      interestAreas: v.interestAreas,
      previousExperience: v.previousExperience,
      motivation: cleanWhitespace(v.motivation),
      shirtSize: v.shirtSize,
      dietary: "none",
      dietaryOther: "",
      emergencyName: cleanWhitespace(v.emergencyName),
      emergencyPhone: emTel.ok ? emTel.value : "",
      acceptCoc: "true",
      acceptPrivacy: "true",
    };
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
    // Se envía de una; el repaso vive en la pantalla de gracias.
    void send();
  };

  const docLabel = (() => {
    const d = docTypes.find((x) => x.value === v.documentType);
    return d ? labelOf(d, locale) : "";
  })();
  const telefono = normalizePhone(v.phone, findCountry(v.phoneCountry));
  const telEmergencia = normalizePhone(v.emergencyPhone, findCountry(v.emergencyCountry));

  const opt = (lista: Option[], code: string) => {
    const o = lista.find((x) => x.value === code);
    return o ? labelOf(o, locale) : "";
  };

  const summaryRows: SummaryRow[] = [
    { label: t.r_name, value: `${v.firstName} ${v.lastName}`.trim() },
    { label: t.r_email, value: v.email },
    { label: t.r_phone, value: telefono.ok ? telefono.value : v.phone },
    { label: t.r_doc, value: `${docLabel} ${v.documentNumber}`.trim() },
    {
      label: t.r_entity,
      value: v.entityName || opt(entities, v.entityType),
    },
    { label: t.r_sbg, value: needsSbgOther ? v.sbgOther : v.sbg === "none" ? t.r_none : v.sbg },
    { label: t.r_availability, value: opt(AVAILABILITY, v.availability) },
    { label: t.r_areas, value: interestAreasLabelOf(v.interestAreas, locale) },
    { label: t.r_shirt, value: opt(SHIRT_SIZES, v.shirtSize) },
    {
      label: t.r_emergency,
      value: `${v.emergencyName} · ${telEmergencia.ok ? telEmergencia.value : v.emergencyPhone}`.trim(),
    },
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
            <Field label={t.firstName} required htmlFor="v-name" error={errors.firstName}>
              <input
                id="v-name"
                value={v.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder={t.firstName_ph}
                maxLength={60}
                className={cn(inputCls, errors.firstName && "border-[#E24B4A]")}
              />
            </Field>
            <Field label={t.lastName} required htmlFor="v-last" error={errors.lastName}>
              <input
                id="v-last"
                value={v.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder={t.lastName_ph}
                maxLength={60}
                className={cn(inputCls, errors.lastName && "border-[#E24B4A]")}
              />
            </Field>
          </div>

          <Field
            label={t.email}
            required
            htmlFor="v-mail"
            error={errors.email}
            hint={t.email_hint}
          >
            <input
              id="v-mail"
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

          <PhoneInput
            label={t.phone}
            required
            countryCode={v.phoneCountry}
            onCountryChange={(code) => set("phoneCountry", code)}
            value={v.phone}
            onChange={(local) => set("phone", local)}
            error={errors.phone}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t.docType} required htmlFor="v-doct" error={errors.documentType}>
              <SearchSelect
                id="v-doct"
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
              required
              htmlFor="v-docn"
              error={errors.documentNumber}
              hint={t.docNumber_hint}
            >
              <input
                id="v-docn"
                value={v.documentNumber}
                onChange={(e) => set("documentNumber", e.target.value)}
                onBlur={() => {
                  if (!docRule || !v.documentNumber.trim()) return;
                  const r = normalizeDocument(v.documentNumber, docRule);
                  setErrors((x) => ({ ...x, documentNumber: r.ok ? undefined : r.reason }));
                  if (r.ok) set("documentNumber", r.value);
                }}
                disabled={!v.documentType}
                placeholder={docExample ?? ""}
                maxLength={24}
                className={cn(
                  inputCls,
                  errors.documentNumber && "border-[#E24B4A]",
                  !v.documentType && "cursor-not-allowed opacity-50",
                )}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* RECUADRO 02: PERFIL & COMUNIDAD SBG */}
      <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
        <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
          <span className="arcade-pixel text-xs text-[#F2A6F0]">
            // 02 · Perfil & Comunidad SBG
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
            Comunidad Tech
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <Field label={t.role} required htmlFor="v-role" error={errors.role}>
            <SearchSelect
              id="v-role"
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
                <Field label={t.which} required htmlFor="v-roleo" error={errors.roleOther}>
                  <input
                    id="v-roleo"
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

          <Field label={t.entity} required htmlFor="v-ent" error={errors.entityType}>
            <SearchSelect
              id="v-ent"
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
                  label={`Nombre de tu ${entities.find((x) => x.value === v.entityType)?.label.toLowerCase() ?? "entidad"}`}
                  required
                  htmlFor="v-entn"
                  error={errors.entityName}
                >
                  <input
                    id="v-entn"
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

          <Field
            label={t.sbg}
            required
            htmlFor="v-sbg"
            error={errors.sbg}
          >
            <SearchSelect
              id="v-sbg"
              options={sbgOptions}
              value={v.sbg}
              onChange={(val) => set("sbg", val)}
              placeholder={t.select}
              searchPlaceholder={t.searchSbg}
              invalid={!!errors.sbg}
            />
          </Field>

          <AnimatePresence initial={false}>
            {needsSbgOther && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Field label={t.which} required htmlFor="v-sbgo" error={errors.sbgOther}>
                  <input
                    id="v-sbgo"
                    value={v.sbgOther}
                    onChange={(e) => set("sbgOther", e.target.value)}
                    placeholder={t.sbgOther_ph}
                    maxLength={VOLUNTEER_TEXT_MAX}
                    className={cn(inputCls, errors.sbgOther && "border-[#E24B4A]")}
                  />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RECUADRO 03: PARTICIPACIÓN & PREFERENCIAS */}
      <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
        <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
          <span className="arcade-pixel text-xs text-[#F2A6F0]">
            // 03 · Participación & Preferencias
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
            Día del Evento
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <Field label={t.availability} required error={errors.availability}>
            <Choice
              options={AVAILABILITY}
              locale={locale}
              value={v.availability}
              onChange={(val) => set("availability", val)}
              className="grid-cols-1 sm:grid-cols-3"
            />
          </Field>

          <Field
            label={t.areas}
            required
            error={errors.interestAreas}
            hint={t.areas_hint}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {INTEREST_AREAS.map((a) => {
                const on = v.interestAreas.includes(a.value);
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => toggleArea(a.value)}
                    className={cn(
                      "flex items-center justify-between rounded-[4px] border p-3.5 min-h-11 text-left font-mono text-xs sm:text-sm font-bold transition-all",
                      on
                        ? "border-[#C143BC] bg-[#C143BC]/15 text-[#E6E4DA] shadow-[0_0_16px_rgba(193,67,188,0.25)] ring-1 ring-[#C143BC]/40"
                        : "border-[#2C2550] bg-[#090812] text-[#B4B2A9] hover:border-[#C143BC]/60 hover:text-[#E6E4DA]",
                    )}
                  >
                    <span>{labelOf(a, locale)}</span>
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border transition-all",
                        on ? "border-[#C143BC] bg-[#C143BC] text-[#0E0E1A]" : "border-[#2C2550] bg-[#090812]",
                      )}
                    >
                      {on && (
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="4">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label={t.experience} required error={errors.previousExperience}>
            <Choice
              options={PREVIOUS_EXPERIENCE}
              locale={locale}
              value={v.previousExperience}
              onChange={(val) => set("previousExperience", val)}
              className="grid-cols-1 sm:grid-cols-3"
            />
          </Field>

          <Field
            label={t.motivation}
            htmlFor="v-motiv"
            hint={t.motivation_hint}
          >
            <textarea
              id="v-motiv"
              value={v.motivation}
              onChange={(e) => set("motivation", e.target.value)}
              placeholder={t.motivation_ph}
              maxLength={MOTIVATION_MAX}
              rows={4}
              className={cn(inputCls, "resize-y")}
            />
          </Field>
        </div>
      </div>

      {/* RECUADRO 04: LOGÍSTICA & CONTACTO DE EMERGENCIA */}
      <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
        <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
          <span className="arcade-pixel text-xs text-[#F2A6F0]">
            // 04 · Logística & Contacto de Emergencia
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
            Staff SCD
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <Field
            label={t.shirt}
            required
            error={errors.shirtSize}
            hint={t.shirt_hint}
          >
            <Choice
              options={SHIRT_SIZES}
              locale={locale}
              value={v.shirtSize}
              onChange={(val) => set("shirtSize", val)}
              className="grid-cols-3 sm:grid-cols-6"
            />
          </Field>

          <Field
            label={t.emergency}
            required
            htmlFor="v-emn"
            error={errors.emergencyName}
            hint={t.emergency_hint}
          >
            <input
              id="v-emn"
              value={v.emergencyName}
              onChange={(e) => set("emergencyName", e.target.value)}
              placeholder={t.emergency_ph}
              maxLength={80}
              className={cn(inputCls, errors.emergencyName && "border-[#E24B4A]")}
            />
          </Field>

          <PhoneInput
            label={t.emergencyPhone}
            required
            countryCode={v.emergencyCountry}
            onCountryChange={(code) => set("emergencyCountry", code)}
            value={v.emergencyPhone}
            onChange={(local) => set("emergencyPhone", local)}
            error={errors.emergencyPhone}
          />
        </div>
      </div>

      {/* RECUADRO 05: COMPROMISOS & ENVÍO */}
      <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
        <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
          <span className="arcade-pixel text-xs text-[#F2A6F0]">
            // 05 · Compromisos & Envío
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
            Confirmación
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            {(
              [
                ["coc", acceptCoc, setAcceptCoc, t.coc_text, t.coc_link, "/codigo-conducta"],
                ["privacy", acceptPrivacy, setAcceptPrivacy, t.privacy_text, t.privacy_link, "/privacidad"],
              ] as const
            ).map(([key, checked, setter, text, linkText, href]) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="flex cursor-pointer items-start gap-3 py-1">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setter(e.target.checked);
                      if (errors[key]) setErrors((err) => ({ ...err, [key]: undefined }));
                    }}
                    className="mt-0.5 h-6 w-6 sm:h-5 sm:w-5 min-h-6 min-w-6 shrink-0 rounded-[2px] border-[#2C2550] bg-[#090812] text-[#C143BC] accent-[#C143BC] focus:ring-1 focus:ring-[#C143BC]/40"
                  />
                  <span className="font-mono text-xs leading-relaxed text-[#B4B2A9]">
                    {text}{" "}
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#F2A6F0] underline underline-offset-4 hover:text-[#E6E4DA]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {linkText}
                    </a>
                    . <span className="text-[#C143BC]">*</span>
                  </span>
                </label>
                {errors[key] && (
                  <p className="m-0 pl-7 font-mono text-xs text-[#E24B4A]">{errors[key]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-[4px] border border-[#C143BC]/30 bg-[#16102A]/60 px-4 py-3.5">
            <p className="m-0 font-mono text-xs leading-relaxed text-[#E6E4DA]">
              {t.notice1a}{" "}
              <strong className="font-bold text-[#F2A6F0]">{t.notice1b}</strong>
              {t.notice1c}{" "}
              <Link href="/registro" className="font-bold text-[#F2A6F0] underline underline-offset-4 hover:brightness-110">
                {t.notice1link}
              </Link>
              .
            </p>
            <p className="m-0 font-mono text-xs leading-relaxed text-[#E6E4DA]">
              {t.notice2a}{" "}
              <ObfuscatedEmail
                box="contacto"
                subject="Quiero pasar de asistente a voluntario"
                className="font-bold text-[#F2A6F0] underline underline-offset-4 hover:brightness-110"
              />{" "}
              {t.notice2b}
            </p>
          </div>

          {siteKey && (
            <div className="flex items-center justify-center py-2">
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
            className="w-full rounded-[4px] border-2 border-[#C143BC] bg-[#C143BC] py-3.5 min-h-11 flex items-center justify-center font-mono text-sm font-bold text-[#0E0E1A] shadow-[0_0_20px_rgba(193,67,188,0.4)] transition-all hover:-translate-y-0.5 hover:bg-[#F2A6F0] hover:shadow-[0_0_25px_rgba(193,67,188,0.6)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? t.sending : t.submit}
          </button>
        </div>
      </div>
    </form>
  );
}
