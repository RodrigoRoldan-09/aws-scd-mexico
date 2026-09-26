"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { CodeLines, type CodeParagraph } from "@/components/effects/code-lines";
import { CountPictogram } from "@/components/effects/count-pictogram";
import { TalaveraTile } from "@/components/effects/talavera-tile";
import { BlockSection } from "@/components/ui/block-section";
import { DotHeading } from "@/components/ui/dot-heading";

// Cada fila cuenta con dibujos, no con cifras sueltas: 8 monitos = 800+
// asistentes, 4 nubes = 4 tracks. El número va en el texto dot-matrix.
const COUNTS = [
  { glyph: "person", count: 8, key: "stat_attendees", value: "800+" },
  { glyph: "cloud", count: 4, key: "stat_tracks", value: "4" },
  { glyph: "star", count: 5, key: "stat_speakers", value: "20+" },
] as const;

export function About() {
  const t = useTranslations("About");

  // El texto se arma como párrafos con segmentos: los `accent` se resaltan
  // dentro del bloque numerado.
  const paragraphs = useMemo<CodeParagraph[]>(
    () => [
      // 1. Primer párrafo (Descripción)
      [{ text: t("description") }],
      
      // 2. Segundo párrafo (La edición 2026...)
      [
        { text: t("code_p2_pre") },
        { text: t("code_p2_em"), accent: true },
        { text: t("code_p2_post") },
      ],
      
      // 3. Tercer párrafo (Hackathon, escenarios, etc.)
      [
        { text: t("code_p3_1") },
        { text: t("code_p3_em1"), accent: true },
        { text: t("code_p3_2") },
        { text: t("code_p3_em2"), accent: true },
        { text: t("code_p3_3") },
        { text: t("code_p3_em3"), accent: true },
        { text: t("code_p3_4") },
        { text: t("code_p3_em4"), accent: true },
        { text: t("code_p3_5") },
        { text: t("code_p3_em5"), accent: true },
        { text: t("code_p3_6") },
        { text: t("code_p3_em6"), accent: true },
      ],
    ],
    [t],
  );

  return (
    <BlockSection id="about" tone="block">
      <ScrollReveal>
        <DotHeading tone="block" variant="inverted" flicker className="mb-10">
          {t("heading")}
        </DotHeading>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <ScrollReveal delay={0.1}>
          <CodeLines paragraphs={paragraphs} tone="block" />
        </ScrollReveal>

        <div className="flex flex-col justify-center gap-7">
          {COUNTS.map((c, i) => (
            <ScrollReveal key={c.key} delay={0.15 + i * 0.1} from="right" distance={60}>
              <CountPictogram
                glyph={c.glyph}
                count={c.count}
                label={`${c.value} ${t(c.key)}`}
                tone="block"
              />
            </ScrollReveal>
          ))}

          <ScrollReveal delay={0.4}>
            <div className="mt-2 flex items-center justify-between border-t-2 border-hack-ink pt-5">
              <div className="inline-flex items-baseline gap-4">
                <span className="font-display text-6xl font-medium leading-none text-hack-ink md:text-7xl">
                  $0
                </span>
                <span className="dot-matrix text-2xl leading-none text-hack-ink md:text-3xl">
                  {t("stat_cost")}
                </span>
              </div>
              <TalaveraTile size={64} variant="hybrid" className="hidden sm:block opacity-85" />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </BlockSection>
  );
}
