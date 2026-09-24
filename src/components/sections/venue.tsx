"use client";

import { useTranslations } from "next-intl";
import { MapPin, Wifi, Users } from "lucide-react";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { WireCdmx } from "@/components/effects/wire-cdmx";
import { DotHeading } from "@/components/ui/dot-heading";
import { BlockSection } from "@/components/ui/block-section";
import { HardButton } from "@/components/ui/hard-button";
import { EVENT } from "@/lib/constants";

export function Venue() {
  const t = useTranslations("Venue");

  return (
    <BlockSection id="venue" tone="ink">
      <ScrollReveal>
        <DotHeading variant="inverted" flicker className="mb-10">
          {t("heading")}
        </DotHeading>
      </ScrollReveal>

      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <ScrollReveal>
            <p className="dot-matrix text-sm text-surface-400">{t("coords")}</p>
            <h3 className="mt-2 font-display text-5xl font-medium lowercase leading-[0.95] tracking-tighter text-surface-50 md:text-6xl">
              {t("city")}
            </h3>
            <p className="mt-4 max-w-[42ch] font-mono text-base leading-relaxed text-surface-300">
              {t("subheading")}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <p className="mt-6 inline-block border-2 border-hack-block px-4 py-2 font-mono text-sm font-semibold text-hack-block">
              {t("date_label")}
            </p>
          </ScrollReveal>

          <div className="mt-10 space-y-px border-t border-surface-700">
            {[
              { icon: Users, title: t("mode_onsite"), desc: t("mode_onsite_desc") },
              { icon: Wifi, title: t("mode_online"), desc: t("mode_online_desc") },
              { icon: MapPin, title: t("venue_tba"), desc: t("venue_tba_desc") },
            ].map((row, i) => (
              <ScrollReveal key={row.title} delay={0.15 + i * 0.1} from="left" distance={60}>
                <div className="group flex items-start gap-4 border-b border-surface-700 py-5 transition-colors duration-300 hover:bg-surface-800/60">
                  <row.icon className="mt-0.5 h-5 w-5 shrink-0 text-hack-block" />
                  <div>
                    <p className="m-0 font-display text-lg font-medium lowercase tracking-tight text-surface-50">
                      {row.title}
                    </p>
                    <p className="mt-0.5 font-mono text-sm leading-relaxed text-surface-400">
                      {row.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <ScrollReveal delay={0.2} from="scale">
          <div className="relative mx-auto w-full max-w-[520px]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-hack-block/10 blur-3xl"
            />
            <WireCdmx className="relative h-[420px] w-full md:h-[520px]" />
            <p className="dot-matrix mt-1 text-center text-[11px] text-surface-500 sm:text-xs">
              ángel de la independencia · popocatépetl · iztaccíhuatl
            </p>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal delay={0.3}>
        <div className="mt-12">
          <HardButton href={EVENT.venue.mapsUrl} variant="outline" external>
            {t("directions")}
          </HardButton>
        </div>
      </ScrollReveal>
    </BlockSection>
  );
}
