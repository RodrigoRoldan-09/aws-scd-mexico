"use client";

import { DOC_TYPES, ENTITY_TYPES, ROLES, countryCodeOf } from "@/data/attendee-form";
import { AVAILABILITY, DIETARY, INTEREST_AREAS, SHIRT_SIZES } from "@/data/volunteer-form";
import { EVENT } from "@/lib/constants";

/**
 * Los campos que el servidor pidió antes de dejar mover a alguien.
 *
 * Cada movimiento tiene un destino que pregunta cosas que el origen no guarda
 * —el voluntariado pide talla y contacto de emergencia, la sede pide documento—.
 * En vez de crear la ficha a medias, el endpoint responde 422 con los nombres de
 * lo que falta y esto los dibuja.
 *
 * Las opciones salen de los mismos catálogos que los formularios públicos, así
 * que lo que se guarda desde acá es indistinguible de lo que llena la persona.
 */

const COUNTRY = countryCodeOf(EVENT.country);

const inputCls =
  "w-full border-2 border-surface-500 bg-surface-900 px-3 py-2.5 font-mono text-sm " +
  "text-surface-50 outline-none transition-colors focus:border-aws-orange";

function Campo({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-surface-200">
        {label}
      </span>
      {hint && <span className="font-mono text-[11px] text-surface-300">{hint}</span>}
      {children}
    </label>
  );
}

function Select({
  value, onChange, options, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function MissingFields({
  needs,
  values,
  onChange,
}: {
  needs: string[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const text = (k: string) => (typeof values[k] === "string" ? (values[k] as string) : "");
  const list = (k: string) => (Array.isArray(values[k]) ? (values[k] as string[]) : []);
  const has = (k: string) => needs.includes(k);

  const docTypes = DOC_TYPES[COUNTRY];
  const docRule = docTypes.find((d) => d.value === text("documentType"));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {has("attendance") && (
        <Campo label="Modalidad" hint="Define si se le crea pasaporte y qué correo recibe.">
          <Select
            value={text("attendance")}
            onChange={(v) => onChange("attendance", v)}
            placeholder="Elige una"
            options={[
              { value: "in-person", label: "Presencial" },
              { value: "online", label: "Online" },
            ]}
          />
        </Campo>
      )}

      {has("documentType") && (
        <Campo label="Tipo de documento">
          <Select
            value={text("documentType")}
            onChange={(v) => onChange("documentType", v)}
            placeholder="Elige uno"
            options={docTypes.map((d) => ({ value: d.value, label: d.label }))}
          />
        </Campo>
      )}

      {has("documentNumber") && (
        <Campo label="Número de documento">
          <input
            value={text("documentNumber")}
            onChange={(e) => onChange("documentNumber", e.target.value)}
            placeholder={docRule?.example ?? "Número"}
            className={inputCls}
          />
        </Campo>
      )}

      {has("role") && (
        <Campo label="Rol">
          <Select
            value={text("role")}
            onChange={(v) => onChange("role", v)}
            placeholder="Elige uno"
            options={ROLES[COUNTRY].map((r) => ({ value: r.value, label: r.label }))}
          />
        </Campo>
      )}

      {has("entityType") && (
        <Campo label="Tipo de entidad">
          <Select
            value={text("entityType")}
            onChange={(v) => onChange("entityType", v)}
            placeholder="Elige uno"
            options={ENTITY_TYPES[COUNTRY].map((e) => ({ value: e.value, label: e.label }))}
          />
        </Campo>
      )}

      {has("phone") && (
        <Campo label="Teléfono">
          <input
            value={text("phone")}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="+56 9 1234 5678"
            className={inputCls}
          />
        </Campo>
      )}

      {has("availability") && (
        <Campo label="Disponibilidad">
          <Select
            value={text("availability")}
            onChange={(v) => onChange("availability", v)}
            placeholder="Elige una"
            options={AVAILABILITY}
          />
        </Campo>
      )}

      {has("shirtSize") && (
        <Campo label="Talla de camiseta">
          <Select
            value={text("shirtSize")}
            onChange={(v) => onChange("shirtSize", v)}
            placeholder="Elige una"
            options={SHIRT_SIZES}
          />
        </Campo>
      )}

      {has("dietary") && (
        <Campo label="Alimentación" hint="De acá sale el pedido de almuerzo.">
          <Select
            value={text("dietary")}
            onChange={(v) => onChange("dietary", v)}
            placeholder="Elige una"
            options={DIETARY}
          />
        </Campo>
      )}

      {has("emergencyName") && (
        <Campo label="Contacto de emergencia">
          <input
            value={text("emergencyName")}
            onChange={(e) => onChange("emergencyName", e.target.value)}
            placeholder="Nombre y parentesco"
            className={inputCls}
          />
        </Campo>
      )}

      {has("emergencyPhone") && (
        <Campo label="Teléfono de emergencia">
          <input
            value={text("emergencyPhone")}
            onChange={(e) => onChange("emergencyPhone", e.target.value)}
            placeholder="+56 9 8765 4321"
            className={inputCls}
          />
        </Campo>
      )}

      {has("interestAreas") && (
        <div className="sm:col-span-2">
          <Campo label="Áreas de interés" hint="Al menos una. Se pueden marcar varias.">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {INTEREST_AREAS.map((a) => {
                const on = list("interestAreas").includes(a.value);
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() =>
                      onChange(
                        "interestAreas",
                        on
                          ? list("interestAreas").filter((x) => x !== a.value)
                          : [...list("interestAreas"), a.value],
                      )
                    }
                    className={`border-2 px-3 py-2 text-left font-mono text-xs font-bold transition-colors ${
                      on
                        ? "border-aws-orange bg-aws-orange text-surface-900"
                        : "border-surface-500 text-surface-200 hover:border-aws-orange hover:text-aws-orange"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </Campo>
        </div>
      )}
    </div>
  );
}
