"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, Lock, Unlock, Save } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { DOC_TYPES, ENTITY_TYPES, ROLES, countryCodeOf } from "@/data/attendee-form";
import {
  AVAILABILITY,
  DEFAULT_SBGS,
  DIETARY,
  INTEREST_AREAS,
  SBG_SETTING_KEY,
  SHIRT_SIZES,
} from "@/data/volunteer-form";
import { EVENT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { localePath } from "@/lib/utils";

/**
 * Convocatoria de voluntarios: abrir o cerrar, y la lista de Student Builder
 * Groups, lo único del formulario que cambia con cada edición y país.
 */

const COUNTRY = countryCodeOf(EVENT.country);

export default function ConvocatoriaVoluntariosPage() {
  const { locale } = useParams<{ locale: string }>();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [sbgs, setSbgs] = useState("");
  const [savedSbgs, setSavedSbgs] = useState("");
  const [savingSbgs, setSavingSbgs] = useState(false);

  const load = useCallback(async () => {
    const [formRes, settingRes] = await Promise.all([
      fetch("/api/forms/volunteer"),
      fetch(`/api/settings?keys=${SBG_SETTING_KEY}`),
    ]);
    if (formRes.ok) {
      const data = await formRes.json();
      setIsOpen(!!data.form?.isOpen);
    }
    if (settingRes.ok) {
      const data = (await settingRes.json()) as Record<string, string>;
      // Sin ajuste guardado se muestran los del país como punto de partida, que
      // es exactamente lo que ve la persona que llena el formulario.
      const value = data[SBG_SETTING_KEY] ?? DEFAULT_SBGS[COUNTRY].join("\n");
      setSbgs(value);
      setSavedSbgs(value);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async () => {
    if (isOpen === null) return;
    setSaving(true);
    try {
      const next = !isOpen;
      const res = await fetch("/api/forms/volunteer/publish", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Se escriben los dos: `isPublished` sigue existiendo en el modelo y lo
        // leen otras rutas; dejarlo desfasado sería una trampa silenciosa.
        body: JSON.stringify({ isOpen: next, isPublished: next }),
      });
      if (!res.ok) throw new Error("No se pudo cambiar el estado");
      setIsOpen(next);
      toast(
        next
          ? "Convocatoria abierta — el formulario ya acepta postulaciones"
          : "Convocatoria cerrada — el formulario dejó de aceptar postulaciones",
        "success",
      );
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const saveSbgs = async () => {
    setSavingSbgs(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: SBG_SETTING_KEY, value: sbgs }),
      });
      if (!res.ok) throw new Error("No se pudo guardar la lista");
      setSavedSbgs(sbgs);
      toast("Lista de Student Builder Groups actualizada", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSavingSbgs(false);
    }
  };

  const docs = DOC_TYPES[COUNTRY];
  const roles = ROLES[COUNTRY];
  const entities = ENTITY_TYPES[COUNTRY];
  const sbgCount = sbgs.split("\n").map((s) => s.trim()).filter(Boolean).length;

  const campos: { label: string; detalle: string }[] = [
    { label: "Nombre(s) y Apellido(s)", detalle: "Texto, obligatorios" },
    { label: "Correo y teléfono", detalle: "Validados, y se comprueba que no esté ya registrado como asistente" },
    {
      label: "Tipo y número de documento",
      detalle: `Obligatorio — el voluntariado es presencial · ${docs.map((d) => d.label).join(" · ")}`,
    },
    { label: "Rol", detalle: `${roles.length} opciones, con buscador y campo "Otro"` },
    { label: "Entidad", detalle: entities.map((e) => e.label).join(" · ") },
    { label: "Student Builder Group", detalle: "La lista editable de abajo, más “ninguno” y “otro”" },
    { label: "Disponibilidad", detalle: AVAILABILITY.map((a) => a.label).join(" · ") },
    { label: "Áreas de interés", detalle: `${INTEREST_AREAS.length} opciones, se pueden marcar varias` },
    { label: "Experiencia previa", detalle: "Primera vez · uno o dos eventos · varios" },
    { label: "Motivación", detalle: "Texto libre, opcional" },
    { label: "Talla de camiseta", detalle: SHIRT_SIZES.map((s) => s.label).join(" · ") },
    { label: "Alimentación", detalle: DIETARY.map((d) => d.label).join(" · ") },
    { label: "Contacto de emergencia", detalle: "Nombre y teléfono, obligatorios" },
    { label: "Código de conducta y tratamiento de datos", detalle: "Aceptación obligatoria" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href={localePath(locale, "/admin/volunteers")}
        className="mb-6 inline-flex items-center gap-2 border-2 border-surface-600 px-4 py-2.5 font-mono text-xs font-bold text-surface-200 transition-colors hover:border-aws-orange hover:text-aws-orange"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a voluntarios
      </Link>

      <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
        convocatoria de voluntarios
      </h1>

      {/* Interruptor */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-2 border-surface-600 bg-surface-800 p-6">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "h-2.5 w-2.5",
              isOpen === null ? "bg-surface-500" : isOpen ? "animate-pulse bg-emerald" : "bg-surface-500",
            )}
          />
          <div>
            <p className="m-0 font-mono text-sm font-bold text-surface-50">
              {isOpen === null ? "Cargando…" : isOpen ? "Abierta" : "Cerrada"}
            </p>
            <p className="m-0 font-mono text-xs text-surface-400">
              {isOpen
                ? "Cualquiera puede postularse desde el sitio."
                : "El sitio muestra que la convocatoria no está disponible."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/${locale === "en" ? "en/" : ""}voluntarios`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-2 border-surface-600 px-4 py-2.5 font-mono text-xs font-bold text-surface-300 transition-colors hover:border-aws-orange hover:text-aws-orange"
          >
            <Eye className="h-3.5 w-3.5" />
            Ver el formulario
          </a>
          <button
            type="button"
            onClick={toggle}
            disabled={saving || isOpen === null}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 font-mono text-xs font-bold transition-all disabled:opacity-50",
              isOpen
                ? "border-2 border-surface-600 text-surface-200 hover:border-red-400 hover:text-red-400"
                : "bg-aws-orange text-surface-900 hover:opacity-90",
            )}
          >
            {isOpen ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            {saving ? "Guardando…" : isOpen ? "Cerrar convocatoria" : "Abrir convocatoria"}
          </button>
        </div>
      </div>

      {/* Student Builder Groups */}
      <h2 className="mt-10 font-mono text-sm font-bold uppercase tracking-widest text-surface-400">
        Student Builder Groups
      </h2>
      <p className="mt-2 font-mono text-xs text-surface-300">
        Uno por línea. “Ninguno” y “Otro” se agregan solas.
      </p>

      <textarea
        value={sbgs}
        onChange={(e) => setSbgs(e.target.value)}
        rows={8}
        spellCheck={false}
        placeholder={"SBG IPN CDMX\nSBG UNAM"}
        className="mt-4 w-full resize-y border-2 border-surface-600 bg-surface-800 px-4 py-3 font-mono text-sm text-surface-100 placeholder:text-surface-400 focus:border-aws-orange focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 font-mono text-xs text-surface-300">
          {sbgCount} {sbgCount === 1 ? "grupo" : "grupos"} en la lista
          {sbgs !== savedSbgs && " · sin guardar"}
        </p>
        <button
          type="button"
          onClick={saveSbgs}
          disabled={savingSbgs || sbgs === savedSbgs}
          className="inline-flex items-center gap-2 bg-aws-orange px-5 py-2.5 font-mono text-xs font-bold text-surface-900 transition-all hover:opacity-90 disabled:opacity-40"
        >
          <Save className="h-3.5 w-3.5" />
          {savingSbgs ? "Guardando…" : "Guardar lista"}
        </button>
      </div>

      {/* Qué pregunta el formulario */}
      <h2 className="mt-10 font-mono text-sm font-bold uppercase tracking-widest text-surface-400">
        Qué se pregunta
      </h2>
      <p className="mt-2 font-mono text-xs text-surface-300">
        No se editan desde acá. Opciones para {EVENT.country}.
      </p>

      <ol className="mt-4 flex list-none flex-col gap-2 p-0">
        {campos.map((c, i) => (
          <li key={c.label} className="flex gap-4 border-2 border-surface-600 bg-surface-800 px-4 py-3">
            <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-aws-orange">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <span className="block font-mono text-sm text-surface-100">{c.label}</span>
              <span className="block font-mono text-xs leading-relaxed text-surface-300">{c.detalle}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
