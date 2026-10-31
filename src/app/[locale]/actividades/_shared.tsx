"use client";

import { useMemo, useState } from "react";
import { SearchSelect, type SelectOption } from "@/components/forms/search-select";
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
import type { GeneralProfilePayload } from "@/types/activities";
import type { ICustomField } from "@/models/activity";
import { EVENT } from "@/lib/constants";
import { cleanWhitespace } from "@/lib/normalize";
import { cn } from "@/lib/utils";
import type { activitiesCopyFor } from "./_copy";

/**
 * Piezas de UI y lógica compartidas por los formularios de actividades:
 * `/actividades/[slug]` (workshops/hackatones) y `/actividades/registro-actividades`.
 */

export type ActivitiesCopy = ReturnType<typeof activitiesCopyFor>;

const COUNTRY = countryCodeOf(EVENT.country);

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function hasOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return (
    Math.max(timeToMinutes(startA), timeToMinutes(startB)) <
    Math.min(timeToMinutes(endA), timeToMinutes(endB))
  );
}

export function Field({
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
      <label
        htmlFor={htmlFor}
        className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E6E4DA]"
      >
        {label} {required && <span className="text-[#C143BC]">*</span>}
      </label>
      {hint && <p className="m-0 -mt-0.5 font-mono text-[11px] text-[#8E8EA0]">{hint}</p>}
      {children}
      {error && <p className="m-0 font-mono text-xs text-[#E24B4A]">{error}</p>}
    </div>
  );
}

export function ArcadeCheckbox({
  checked,
  onChange,
  error,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex cursor-pointer items-start gap-3 py-1">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={cn(
            "mt-0.5 flex h-6 w-6 sm:h-5 sm:w-5 min-h-6 min-w-6 shrink-0 items-center justify-center rounded-[4px] border transition-all",
            checked ? "border-[#C143BC] bg-[#C143BC]" : "border-[#2C2550] bg-[#0E0E1A]",
            error && "border-[#E24B4A]",
          )}
        >
          {checked && (
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="#FFFFFF" strokeWidth="4">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </button>
        <span className="font-mono text-xs leading-relaxed text-[#B4B2A9]">{children}</span>
      </label>
      {error && <p className="m-0 pl-8 font-mono text-xs text-[#E24B4A]">{error}</p>}
    </div>
  );
}

export const inputCls =
  "w-full rounded-[4px] border border-[#2C2550] bg-[#090812] px-3.5 sm:px-4 py-2.5 min-h-11 font-mono text-xs sm:text-sm text-[#E6E4DA] " +
  "placeholder:text-[#73726C] outline-none transition-all " +
  "focus:border-[#C143BC] focus:shadow-[0_0_12px_rgba(193,67,188,0.25)] focus:ring-1 focus:ring-[#C143BC]/40";

// ── Perfil General (Flujo Híbrido cuando el correo no existe en Registration) ──

export function useGeneralProfileState() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [role, setRole] = useState("");
  const [roleOther, setRoleOther] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityName, setEntityName] = useState("");
  const [fromCommunity, setFromCommunity] = useState<"yes" | "no">("no");
  const [communityName, setCommunityName] = useState("");
  const [acceptCoc, setAcceptCoc] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  return {
    firstName, setFirstName,
    lastName, setLastName,
    documentType, setDocumentType,
    role, setRole,
    roleOther, setRoleOther,
    entityType, setEntityType,
    entityName, setEntityName,
    fromCommunity, setFromCommunity,
    communityName, setCommunityName,
    acceptCoc, setAcceptCoc,
    acceptPrivacy, setAcceptPrivacy,
  };
}

export type GeneralProfileState = ReturnType<typeof useGeneralProfileState>;

export function validateGeneralProfile(p: GeneralProfileState, t: ActivitiesCopy): Record<string, string> {
  const e: Record<string, string> = {};
  if (!cleanWhitespace(p.firstName)) e.firstName = t.e_firstName;
  if (!cleanWhitespace(p.lastName)) e.lastName = t.e_lastName;
  if (!p.role) e.role = t.e_role;
  if (p.role === "other" && !cleanWhitespace(p.roleOther)) e.roleOther = t.e_roleOther;
  if (!p.entityType) e.entityType = t.e_entityType;
  if (p.entityType && p.entityType !== "none" && !cleanWhitespace(p.entityName)) {
    e.entityName = t.e_entityName;
  }
  if (p.fromCommunity === "yes" && !cleanWhitespace(p.communityName)) {
    e.communityName = t.e_communityName;
  }
  if (!p.acceptCoc) e.coc = t.e_coc;
  if (!p.acceptPrivacy) e.privacy = t.e_privacy;
  return e;
}

export function buildGeneralProfilePayload(p: GeneralProfileState): GeneralProfilePayload {
  const needsRoleOther = p.role === "other";
  const needsEntityName = !!p.entityType && p.entityType !== "none";
  return {
    firstName: cleanWhitespace(p.firstName),
    lastName: cleanWhitespace(p.lastName),
    documentType: p.documentType || undefined,
    role: p.role,
    roleOther: needsRoleOther ? cleanWhitespace(p.roleOther) : "",
    entityType: p.entityType,
    entityName: needsEntityName ? cleanWhitespace(p.entityName) : "",
    fromCommunity: p.fromCommunity === "yes" ? "true" : "false",
    communityName: p.fromCommunity === "yes" ? cleanWhitespace(p.communityName) : "",
    acceptCoc: p.acceptCoc,
    acceptPrivacy: p.acceptPrivacy,
  };
}

export function GeneralProfileFields({
  p,
  errors,
  locale,
  t,
}: {
  p: GeneralProfileState;
  errors: Record<string, string>;
  locale: Locale;
  t: ActivitiesCopy;
}) {
  const isEn = locale === "en";
  const docTypes = DOC_TYPES[COUNTRY];
  const roles = ROLES[COUNTRY];
  const entities = ENTITY_TYPES[COUNTRY];

  const roleOptions: SelectOption[] = useMemo(
    () =>
      roles.map((r) => ({
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

  const needsRoleOther = p.role === "other";
  const needsEntityName = !!p.entityType && p.entityType !== "none";

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.firstName} required htmlFor="hyb-fname" error={errors.firstName}>
          <input
            id="hyb-fname"
            value={p.firstName}
            onChange={(e) => p.setFirstName(e.target.value)}
            placeholder={t.firstName_ph}
            maxLength={60}
            className={cn(inputCls, errors.firstName && "border-[#E24B4A]")}
          />
        </Field>
        <Field label={t.lastName} required htmlFor="hyb-lname" error={errors.lastName}>
          <input
            id="hyb-lname"
            value={p.lastName}
            onChange={(e) => p.setLastName(e.target.value)}
            placeholder={t.lastName_ph}
            maxLength={60}
            className={cn(inputCls, errors.lastName && "border-[#E24B4A]")}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.role} required htmlFor="hyb-role" error={errors.role}>
          <SearchSelect
            id="hyb-role"
            options={roleOptions}
            value={p.role}
            onChange={p.setRole}
            placeholder={t.role_ph}
            searchPlaceholder={t.searchRole}
            invalid={!!errors.role}
          />
        </Field>

        <Field label={t.docType} htmlFor="hyb-doc">
          <SearchSelect
            id="hyb-doc"
            options={docTypes.map((d) => ({ value: d.value, label: labelOf(d, locale) }))}
            value={p.documentType}
            onChange={p.setDocumentType}
            placeholder={t.select}
            searchPlaceholder={t.searchType}
          />
        </Field>
      </div>

      {needsRoleOther && (
        <Field label={t.which} required htmlFor="hyb-role-other" error={errors.roleOther}>
          <input
            id="hyb-role-other"
            value={p.roleOther}
            onChange={(e) => p.setRoleOther(e.target.value)}
            placeholder={t.which_ph}
            maxLength={FREE_TEXT_MAX}
            className={cn(inputCls, errors.roleOther && "border-[#E24B4A]")}
          />
        </Field>
      )}

      <Field label={t.entity} required htmlFor="hyb-entity" error={errors.entityType}>
        <SearchSelect
          id="hyb-entity"
          options={entityOptions}
          value={p.entityType}
          onChange={p.setEntityType}
          placeholder={t.entity_ph}
          searchPlaceholder={t.searchType}
          invalid={!!errors.entityType}
        />
      </Field>

      {needsEntityName && (
        <Field
          label={t.entityName(
            entities.find((x) => x.value === p.entityType)
              ? labelOf(entities.find((x) => x.value === p.entityType)!, locale).toLowerCase()
              : isEn
                ? "organization"
                : "institución",
          )}
          required
          htmlFor="hyb-entity-name"
          error={errors.entityName}
        >
          <input
            id="hyb-entity-name"
            value={p.entityName}
            onChange={(e) => p.setEntityName(e.target.value)}
            placeholder={t.entityName_ph}
            maxLength={FREE_TEXT_MAX}
            className={cn(inputCls, errors.entityName && "border-[#E24B4A]")}
          />
        </Field>
      )}

      {/* Comunidad */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#2C2550]/60">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E6E4DA]">
          {t.fromCommunity}
        </span>
        <div className="grid grid-cols-2 gap-3">
          {(["no", "yes"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => p.setFromCommunity(opt)}
              className={cn(
                "rounded-[4px] border py-2.5 px-3 min-h-11 flex items-center justify-center font-mono text-xs font-bold transition-all",
                p.fromCommunity === opt
                  ? "border-2 border-[#C143BC] bg-[#C143BC]/20 text-[#F2A6F0]"
                  : "border-[#2C2550] bg-[#090812] text-[#B4B2A9]",
              )}
            >
              {opt === "yes" ? t.yes : t.no}
            </button>
          ))}
        </div>
      </div>

      {p.fromCommunity === "yes" && (
        <Field label={t.communityName} required htmlFor="hyb-comm" error={errors.communityName}>
          <input
            id="hyb-comm"
            value={p.communityName}
            onChange={(e) => p.setCommunityName(e.target.value)}
            placeholder={t.communityName_ph}
            maxLength={100}
            className={cn(inputCls, errors.communityName && "border-[#E24B4A]")}
          />
        </Field>
      )}

      {/* Consentimientos para el alta general */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#2C2550]/60">
        <ArcadeCheckbox checked={p.acceptCoc} onChange={p.setAcceptCoc} error={errors.coc}>
          {t.coc_text}
          <a
            href="/codigo-conducta"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#C143BC] underline underline-offset-4"
          >
            {t.coc_link}
          </a>
          . <span className="text-[#C143BC]">*</span>
        </ArcadeCheckbox>

        <ArcadeCheckbox checked={p.acceptPrivacy} onChange={p.setAcceptPrivacy} error={errors.privacy}>
          {t.privacy_text}
          <a
            href="/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#C143BC] underline underline-offset-4"
          >
            {t.privacy_link}
          </a>
          . <span className="text-[#C143BC]">*</span>
        </ArcadeCheckbox>
      </div>
    </>
  );
}

// ── Preguntas personalizadas (`customFields`) ──

/** Devuelve `{ [errPrefix + key]: mensaje }` para los campos obligatorios sin respuesta. */
export function validateCustomFieldAnswers(
  fields: ICustomField[],
  answers: Record<string, string | boolean>,
  errPrefix: string,
  t: ActivitiesCopy,
): Record<string, string> {
  const e: Record<string, string> = {};
  for (const field of fields) {
    if (!field.required) continue;
    const val = answers[field.key];
    if (field.type === "checkbox" ? val !== true : !cleanWhitespace(String(val ?? ""))) {
      e[`${errPrefix}${field.key}`] = t.e_requiredField;
    }
  }
  return e;
}

export function CustomFieldInputs({
  fields,
  answers,
  onAnswer,
  errors,
  errPrefix,
  idPrefix,
  isEn,
  t,
}: {
  fields: ICustomField[];
  answers: Record<string, string | boolean>;
  onAnswer: (key: string, value: string | boolean) => void;
  errors: Record<string, string>;
  /** Prefijo de las llaves de error (`custom_`, `global_`, `act_<slug>_`…) */
  errPrefix: string;
  idPrefix: string;
  isEn: boolean;
  t: ActivitiesCopy;
}) {
  return (
    <div className="flex flex-col gap-5">
      {fields.map((field) => {
        const label = isEn ? field.labelEn || field.label : field.label;
        const ph = isEn ? field.placeholderEn || field.placeholder || "" : field.placeholder || "";
        const errKey = `${errPrefix}${field.key}`;
        const inputId = `${idPrefix}${field.key}`;
        const val = answers[field.key];

        if (field.type === "checkbox") {
          return (
            <ArcadeCheckbox
              key={field.key}
              checked={val === true}
              onChange={(next) => onAnswer(field.key, next)}
              error={errors[errKey]}
            >
              {label} {field.required && <span className="text-[#C143BC]">*</span>}
            </ArcadeCheckbox>
          );
        }

        if (field.type === "select") {
          const opts: SelectOption[] = (field.options ?? []).map((o) => ({
            value: o.value,
            label: isEn ? o.labelEn || o.label : o.label,
          }));
          return (
            <Field key={field.key} label={label} required={field.required} htmlFor={inputId} error={errors[errKey]}>
              <SearchSelect
                id={inputId}
                options={opts}
                value={typeof val === "string" ? val : ""}
                onChange={(nextVal) => onAnswer(field.key, nextVal)}
                placeholder={t.select}
                searchPlaceholder={t.searchType}
                invalid={!!errors[errKey]}
              />
            </Field>
          );
        }

        if (field.type === "textarea") {
          return (
            <Field key={field.key} label={label} required={field.required} htmlFor={inputId} error={errors[errKey]}>
              <textarea
                id={inputId}
                rows={3}
                value={typeof val === "string" ? val : ""}
                onChange={(e) => onAnswer(field.key, e.target.value)}
                placeholder={ph}
                maxLength={500}
                className={cn(inputCls, "resize-y", errors[errKey] && "border-[#E24B4A]")}
              />
            </Field>
          );
        }

        return (
          <Field key={field.key} label={label} required={field.required} htmlFor={inputId} error={errors[errKey]}>
            <input
              id={inputId}
              type={field.type === "url" ? "url" : "text"}
              value={typeof val === "string" ? val : ""}
              onChange={(e) => onAnswer(field.key, e.target.value)}
              placeholder={ph}
              maxLength={300}
              className={cn(inputCls, errors[errKey] && "border-[#E24B4A]")}
            />
          </Field>
        );
      })}
    </div>
  );
}
