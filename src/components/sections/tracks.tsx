"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { DotHeading } from "@/components/ui/dot-heading";
import { tracks, type StageTrack } from "@/data/tracks";

function StageCard({
  track,
  t,
}: {
  track: StageTrack;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <a
      href={track.ctaHref}
      // Aquí se mantiene el resplandor rosa y el pequeño salto hacia arriba
      className="group block relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[16px] border-2 border-[#2C2550] bg-[#1E1838] transition-all duration-300 hover:-translate-y-2 hover:border-[#C143BC] hover:shadow-[0_0_30px_rgba(193,67,188,0.3)]"
      aria-label={t(track.titleKey)}
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden">
        <Image
          src={track.image}
          alt={t(track.titleKey)}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          // Eliminamos el group-hover:scale para que la imagen se quede quieta.
          // (Si recortaste las fotos, puedes quitar el scale-[1.03] y dejar solo "object-cover")
          className="object-cover scale-[1.03]"
        />
      </div>
    </a>
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

      {/* Grid de las 4 etapas generadas por IA */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
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