"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { CheckCircle2, ArrowLeft, ChevronLeft } from "lucide-react";
import { FormShell } from "@/components/forms/form-shell";
import { DotHeading } from "@/components/ui/dot-heading";
import type { SummaryRow } from "@/components/forms/success-screen";
import { ComunidadesForm } from "./_form";
import { localePath } from "@/lib/utils";
import { copyFor } from "./_copy";

export function ComunidadesScreen() {
  const locale = useLocale();
  const t = copyFor(locale);
  const [resumen, setResumen] = useState<SummaryRow[] | null>(null);

  const handleSubmit = async (
    values: Record<string, unknown>,
    captchaToken: string,
    filas: SummaryRow[],
  ) => {
    const res = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: values, captchaToken }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al enviar la postulación");
    }

    setResumen(filas);
  };

  if (resumen) {
    return (
      <main className="form-block flex min-h-screen flex-col overflow-x-hidden bg-hack-block pt-20 sm:pt-28">
        <div className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 pb-20">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-hack-ink bg-hack-ink text-hack-block shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <p className="dot-matrix mb-3 text-lg leading-none text-hack-ink/75">
              // POSTULACIÓN RECIBIDA
            </p>

            <div className="flex justify-center">
              <DotHeading tone="block" variant="inverted" flicker>
                {t.title}
              </DotHeading>
            </div>

            <p className="mx-auto mt-6 max-w-[60ch] font-mono text-sm sm:text-base leading-relaxed text-hack-ink/80">
              {locale === "en"
                ? "We have received your community application. Our organizing committee will review your proposal and get in touch directly if your community is selected to partner with AWS Student Community Day Mexico 2026."
                : "Hemos recibido la postulación de tu comunidad. El comité organizador revisará la propuesta y se pondrá en contacto a través de los datos provistos en caso de que su comunidad sea seleccionada como aliada oficial del evento."}
            </p>
          </div>

          {/* Resumen de lo enviado */}
          <div className="mx-auto mt-12 max-w-2xl border-2 border-hack-ink/30 bg-white/25 p-5 sm:p-7 shadow-[6px_6px_0_0_rgba(0,0,0,0.15)]">
            <p className="dot-matrix m-0 text-base leading-none text-hack-ink/70">
              // RESUMEN DE LA POSTULACIÓN
            </p>
            <dl className="mt-4 border-t-2 border-hack-ink/20">
              {resumen.map((r) => (
                <div
                  key={r.label}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 border-b border-hack-ink/15 py-3"
                >
                  <dt className="dot-matrix shrink-0 text-xs text-hack-ink/70">{r.label}</dt>
                  <dd className="m-0 min-w-0 break-words sm:text-right font-mono text-sm text-hack-ink">
                    {r.value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href={locale === "en" ? "/en" : "/"}
              className="inline-flex min-h-11 items-center justify-center gap-2 border-2 border-hack-ink bg-hack-ink px-6 py-3 font-mono text-sm font-bold text-hack-block shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] transition-all hover:bg-hack-ink/90 active:translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === "en" ? "Return to home" : "Volver al inicio"}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <FormShell
      title={t.title}
      lead={t.lead}
      className="max-w-3xl"
      aside={
        <Link
          href={localePath(locale, "/comunidades")}
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#F2A6F0] underline underline-offset-4 hover:text-[#E6E4DA]"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {locale === "en" ? "Back to the call" : "Volver a la convocatoria"}
        </Link>
      }
    >
      <ComunidadesForm onSubmit={handleSubmit} />
    </FormShell>
  );
}