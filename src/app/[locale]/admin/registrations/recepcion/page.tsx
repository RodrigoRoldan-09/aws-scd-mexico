"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, Lock, Unlock } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  DOC_TYPES,
  ENTITY_TYPES,
  ROLES,
  countryCodeOf,
} from "@/data/attendee-form";
import { EVENT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { localePath } from "@/lib/utils";

/**
 * Control de la recepción de registros: abrir o cerrar, y un resumen de lo que
 * el formulario pregunta. El interruptor escribe `isOpen` e `isPublished` a la
 * vez porque otras rutas leen el segundo.
 */

const COUNTRY = countryCodeOf(EVENT.country);

export default function RecepcionPage() {
  const { locale } = useParams<{ locale: string }>();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/forms/attendee");
    if (!res.ok) return;
    const data = await res.json();
    setIsOpen(!!data.form?.isOpen);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async () => {
    if (isOpen === null) return;
    setSaving(true);
    try {
      const next = !isOpen;
      const res = await fetch("/api/forms/attendee/publish", {
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
          ? "Recepción abierta — el formulario ya acepta inscripciones"
          : "Recepción cerrada — el formulario dejó de aceptar inscripciones",
        "success",
      );
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const docs = DOC_TYPES[COUNTRY];
  const roles = ROLES[COUNTRY];
  const entities = ENTITY_TYPES[COUNTRY];

  const campos: { label: string; detalle: string }[] = [
    { label: "Nombre(s) y Apellido(s)", detalle: "Texto, obligatorios" },
    { label: "Correo electrónico", detalle: "Validado, y se comprueba que no esté ya registrado" },
    { label: "¿Presencial o virtual?", detalle: "Obligatorio — define el resto del formulario" },
    {
      label: "Tipo y número de documento",
      detalle: `Sólo si es presencial · ${docs.map((d) => d.label).join(" · ")}`,
    },
    { label: "Rol", detalle: `${roles.length} opciones, con buscador y campo "Otro"` },
    { label: "Entidad", detalle: `${entities.map((e) => e.label).join(" · ")}` },
    { label: "Código de conducta", detalle: "Aceptación obligatoria" },
    { label: "Tratamiento de datos", detalle: "Autorización obligatoria" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href={localePath(locale, "/admin/registrations")}
        className="mb-6 inline-flex items-center gap-2 border-2 border-surface-600 px-4 py-2.5 font-mono text-xs font-bold text-surface-200 transition-colors hover:border-aws-orange hover:text-aws-orange"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a registros
      </Link>

      <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
        recepción de registros
      </h1>

      {/* Interruptor */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-2 border-surface-600 bg-surface-800 p-6">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "h-2.5 w-2.5",
              isOpen === null
                ? "bg-surface-500"
                : isOpen
                  ? "animate-pulse bg-emerald"
                  : "bg-surface-500",
            )}
          />
          <div>
            <p className="m-0 font-mono text-sm font-bold text-surface-50">
              {isOpen === null ? "Cargando…" : isOpen ? "Abierta" : "Cerrada"}
            </p>
            <p className="m-0 font-mono text-xs text-surface-400">
              {isOpen
                ? "Cualquiera puede registrarse desde el sitio."
                : "El sitio muestra que el registro no está disponible."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/${locale === "en" ? "en/" : ""}registro`}
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
            {saving ? "Guardando…" : isOpen ? "Cerrar recepción" : "Abrir recepción"}
          </button>
        </div>
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
          <li
            key={c.label}
            className="flex gap-4 border-2 border-surface-600 bg-surface-800 px-4 py-3"
          >
            <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-aws-orange">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <span className="block font-mono text-sm text-surface-100">{c.label}</span>
              <span className="block font-mono text-xs leading-relaxed text-surface-300">
                {c.detalle}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
