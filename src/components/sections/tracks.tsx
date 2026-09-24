"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { DotHeading } from "@/components/ui/dot-heading";
import { tracks } from "@/data/tracks";

export function Tracks() {
  const t = useTranslations("Tracks");

  return (
    <section id="tracks" className="mx-auto max-w-[1180px] px-6 py-20 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-8 mb-10 md:mb-14">
        <ScrollReveal>
          <DotHeading as="div" variant="inverted" className="mb-5 text-xl sm:text-2xl md:text-3xl">
            {t("eyebrow")}
          </DotHeading>
          <h2 className="font-display font-medium lowercase leading-[1.02] tracking-tight max-w-[16ch] m-0"
            style={{ fontSize: "clamp(28px,4vw,48px)" }}>
            {t("section_pre")}
            <em className="not-italic text-hack-block">{t("section_em")}</em>
            {t("section_post")}
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <p className="text-[#E6E4DA]/70 leading-relaxed max-w-[38ch] m-0 text-base md:text-lg">
            {t("section_lead")}
          </p>
        </ScrollReveal>
      </div>

      {/* Track cards — image posters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tracks.map((track, i) => (
          <ScrollReveal key={track.id} delay={i * 0.1} from="scale">
            <article className="group relative overflow-hidden rounded-2xl border border-[#2C2550] transition-all duration-500 hover:-translate-y-1 hover:border-[#C143BC]/50 hover:shadow-[0_8px_30px_rgba(193,67,188,0.25)]">
              <Image
                src={track.image}
                alt={t(track.titleKey)}
                width={1056}
                height={1489}
                // Sin `priority`: esta sección va muy por debajo del pliegue y
                // marcar las cuatro como prioritarias precargaba 2,5 MB de PNG
                // que compiten con lo que sí se ve al entrar.
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </article>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
