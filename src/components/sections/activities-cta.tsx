"use client";

import { useTranslations, useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { localePath } from "@/lib/utils";

/**
 * Tarjeta discreta que lleva a las actividades v2 (workshops, hackatón y
 * actividades especiales). Va después de Tracks, no arriba del landing.
 */
export function ActivitiesCta() {
  const t = useTranslations("ActivitiesCTA");
  const locale = useLocale();

  return (
    <section
      id="activities"
      aria-labelledby="activities-cta-title"
      className="mx-auto max-w-[1240px] px-6 pb-20 md:pb-28"
    >
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-[16px] border-2 border-[#2C2550] bg-[#1E1838] p-6 transition-colors duration-300 hover:border-[#C143BC]/60 sm:p-10">
          {/* Rejilla de fondo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(193,67,188,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(193,67,188,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {/* Brillo de acento */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#C143BC]/20 blur-3xl"
          />

          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="font-mono text-sm text-[#C143BC]">{t("eyebrow")}</p>
              <h2
                id="activities-cta-title"
                className="font-display mt-3 text-2xl font-bold leading-tight text-[#E6E4DA] sm:text-4xl"
              >
                {t("title")}
              </h2>
              <p className="font-mono mt-4 text-sm leading-relaxed text-[#B4B2A9]">
                {t("desc")}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              <a
                href={localePath(locale, "/actividades")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] border-2 border-[#C143BC] bg-[#C143BC] px-6 py-3 font-mono text-sm font-bold text-[#0E0E1A] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(193,67,188,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A6F0]"
              >
                {t("ctaBrowse")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={localePath(locale, "/actividades/registro-actividades")}
                className="inline-flex min-h-11 items-center justify-center rounded-[6px] border-2 border-[#C143BC] bg-transparent px-6 py-3 font-mono text-sm font-bold text-[#F2A6F0] transition-colors duration-200 hover:bg-[#C143BC]/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A6F0]"
              >
                {t("ctaRegister")}
              </a>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
