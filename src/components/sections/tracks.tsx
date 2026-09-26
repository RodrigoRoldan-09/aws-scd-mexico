"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { ChevronDown, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { DotHeading } from "@/components/ui/dot-heading";
import { TalaveraFrameCorners } from "@/components/ui/talavera-corner";
import { cn } from "@/lib/utils";
import { tracks, type StageTrack } from "@/data/tracks";

function StageCard({
  track,
  t,
}: {
  track: StageTrack;
  t: ReturnType<typeof useTranslations>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-[16px] border-2 border-[#2C2550] bg-[#1E1838] p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#C143BC] hover:shadow-[6px_6px_0_0_var(--color-hack-dim)]">
      {/* Esquineros de azulejo Talavera en estética neon */}
      <TalaveraFrameCorners
        size={22}
        color="#C143BC"
        className="opacity-40 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div>
        {/* Cabecera: número y badge de etapa */}
        <div className="flex items-center justify-between gap-2 border-b border-[#2C2550]/60 pb-3">
          <span className="font-dot text-4xl font-bold leading-none text-[#F2A6F0]/40 transition-colors group-hover:text-[#F2A6F0]">
            {track.step}
          </span>
          <span className="rounded-[4px] bg-[#C143BC] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0E0E1A]">
            {t(track.badgeKey)}
          </span>
        </div>

        {/* Título y subtítulo */}
        <div className="mt-4">
          <h3 className="m-0 font-display text-2xl font-bold tracking-tight text-[#E6E4DA] transition-colors group-hover:text-[#FFFFFF]">
            {t(track.titleKey)}
          </h3>
          <p className="mt-1 font-mono text-xs font-semibold text-[#C143BC]">
            {"// "}{t(track.subtitleKey)}
          </p>
        </div>

        {/* Descripción corta */}
        <p className="mt-3.5 font-mono text-xs leading-relaxed text-[#B4B2A9]">
          {t(track.shortDescKey)}
        </p>

        {/* Botón para expandir descripción larga */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-2.5 inline-flex items-center gap-1 font-mono text-[11px] text-[#F2A6F0] transition-colors hover:text-[#FFFFFF] focus:outline-none"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? t("toggle_less") : t("toggle_more")}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
          />
        </button>

        {/* Descripción larga animada */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-2.5 rounded-[8px] border-l-2 border-[#C143BC] bg-[#0E0E1A]/80 p-3 font-mono text-[11px] leading-relaxed text-[#E6E4DA]">
                {t(track.longDescKey)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Qué encontrarás */}
        <div className="mt-5 border-t border-[#2C2550]/40 pt-4">
          <p className="dot-matrix m-0 text-xs font-semibold uppercase tracking-wider text-[#C143BC]">
            {t("what_prefix")}
          </p>
          <ul className="m-0 mt-2.5 list-none space-y-1.5 p-0">
            {track.featuresKeys.map((fKey) => (
              <li
                key={fKey}
                className="flex items-start gap-2 font-mono text-xs leading-snug text-[#E6E4DA]/90"
              >
                <span
                  className="shrink-0 select-none font-bold text-[#C143BC]"
                  aria-hidden="true"
                >
                  ›
                </span>
                <span>{t(fKey)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ideal para */}
        <div className="mt-4 rounded-[8px] border border-[#2C2550]/80 bg-[#0E0E1A]/60 p-2.5">
          <p className="m-0 font-mono text-[11px] leading-snug text-[#8B84A0]">
            <strong className="font-semibold text-[#C143BC]">
              {t("ideal_prefix")}{" "}
            </strong>
            {t(track.idealKey)}
          </p>
        </div>

        {/* Keywords */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {track.keywords.map((kw) => (
            <span
              key={kw}
              className="rounded-[4px] border border-[#2C2550] bg-[#0E0E1A] px-2 py-0.5 font-mono text-[10px] text-[#B4B2A9]"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* CTA de la etapa */}
      <div className="mt-6 border-t border-[#2C2550]/60 pt-4">
        <a
          href={track.ctaHref}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 border-2 border-[#C143BC] bg-[#1E1838] px-4 py-2.5 text-center font-mono text-xs font-bold uppercase tracking-wider text-[#E6E4DA] shadow-[3px_3px_0_0_var(--color-hack-dim)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[#F2A6F0] hover:bg-[#C143BC] hover:text-[#000000] hover:shadow-[5px_5px_0_0_var(--color-hack-dim)] active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          <span>{t(track.ctaKey)}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}

export function Tracks() {
  const t = useTranslations("Tracks");

  return (
    <section id="tracks" className="mx-auto max-w-[1240px] px-6 py-20 md:py-28">
      {/* Encabezado de sección */}
      <div className="mb-12 flex flex-wrap items-end justify-between gap-8 md:mb-16">
        <ScrollReveal>
          <DotHeading as="div" variant="inverted" className="mb-4 text-xl sm:text-2xl md:text-3xl">
            {t("eyebrow")}
          </DotHeading>
          <h2
            className="m-0 max-w-[18ch] font-display font-medium lowercase leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(28px,4vw,48px)" }}
          >
            {t("section_pre")}
            <em className="not-italic text-hack-block">{t("section_em")}</em>
            {t("section_post")}
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p className="m-0 max-w-[42ch] font-mono text-sm leading-relaxed text-[#E6E4DA]/75 md:text-base">
            {t("section_lead")}
          </p>
        </ScrollReveal>
      </div>

      {/* Grid de las 4 etapas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tracks.map((track, i) => (
          <ScrollReveal key={track.id} delay={i * 0.08} from="scale">
            <StageCard track={track} t={t} />
          </ScrollReveal>
        ))}
      </div>

      {/* Cierre de sección */}
      <ScrollReveal delay={0.2}>
        <div className="mt-14 rounded-[16px] border-2 border-[#2C2550] bg-[#1E1838]/70 p-6 text-center shadow-[4px_4px_0_0_rgba(193,67,188,0.25)] sm:p-8">
          <p className="dot-matrix m-0 text-base font-semibold text-[#F2A6F0] sm:text-lg">
            {t("section_footer_title")}
          </p>
          <p className="mx-auto m-0 mt-2 max-w-2xl font-mono text-xs leading-relaxed text-[#B4B2A9] sm:text-sm">
            {t("section_footer_desc")}
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}
