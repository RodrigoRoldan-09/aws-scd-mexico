"use client";

import { useLocale, useTranslations } from "next-intl";
import { localePath } from "@/lib/utils";
import { motion } from "motion/react";
import {
  Mic,
  Laptop,
  EyeOff,
  GraduationCap,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { BlockSection } from "@/components/ui/block-section";
import { DotHeading } from "@/components/ui/dot-heading";
import { HardButton } from "@/components/ui/hard-button";
import { useCountdown } from "@/hooks/use-countdown";
import {
  CFP_DEADLINE,
  cfpMilestones,
  cfpFormats,
  cfpCriteria,
} from "@/data/cfp";

const ICONS: Record<string, LucideIcon> = {
  Mic,
  Laptop,
  EyeOff,
  GraduationCap,
  Sparkles,
};

function DeadlineCountdown() {
  const t = useTranslations("CFP");
  const { days, hours, minutes, seconds, isExpired, isActive } =
    useCountdown(CFP_DEADLINE);

  // `isActive` sólo pasa a true tras el primer tick en cliente: así el SSR y la
  // primera pintura coinciden y no hay hydration mismatch con el reloj.
  if (!isActive) return <div className="h-[92px]" aria-hidden="true" />;

  if (isExpired) {
    return <p className="dot-matrix text-lg text-[#D85A30]">{t("closed_note")}</p>;
  }

  const blocks = [
    { value: days, label: t("days") },
    { value: hours, label: t("hours") },
    { value: minutes, label: t("minutes") },
    { value: seconds, label: t("seconds") },
  ];

  return (
    <div>
      <p className="dot-matrix mb-2.5 text-sm text-[#B4B2A9]">
        {t("countdown_label")}
      </p>
      <div className="flex gap-2">
        {blocks.map((b) => (
          <div key={b.label} className="flex flex-col items-center">
            <div className="min-w-[66px] rounded-[6px] border border-[#2C2550] bg-[#0E0E1A] px-3 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <span className="dot-matrix text-3xl font-bold leading-none text-[#D85A30] md:text-4xl">
                {String(b.value).padStart(2, "0")}
              </span>
            </div>
            <span className="dot-matrix mt-1.5 text-xs text-[#B4B2A9]">
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Fila de la línea de tiempo / de tracks: hairline sutil que se rellena al hover. */
function Row({
  left,
  title,
  desc,
  dot,
}: {
  left: React.ReactNode;
  title: string;
  desc: string;
  dot?: boolean;
}) {
  return (
    <li className="group relative grid grid-cols-1 items-start gap-2 border-b border-[#2C2550] px-1 py-6 transition-colors duration-300 hover:bg-[#1E1838]/50 sm:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] sm:gap-10">
      <div
        className="absolute bottom-[-1px] left-0 h-0.5 w-0 bg-[#D85A30] transition-[width] duration-500 group-hover:w-full"
        aria-hidden="true"
      />
      <div className="flex items-center gap-3">
        {dot && <span className="h-2 w-2 shrink-0 rounded-full bg-[#D85A30]" aria-hidden="true" />}
        {left}
      </div>
      <div className={dot ? "pl-5 sm:pl-0" : "pl-0"}>
        {title && (
          <p className="m-0 font-display text-lg font-medium tracking-tight text-[#E6E4DA]">
            {title}
          </p>
        )}
        <p className={`font-mono text-sm leading-relaxed text-[#B4B2A9] ${title ? "mt-1" : "m-0"}`}>
          {desc}
        </p>
      </div>
    </li>
  );
}

export function CallForSpeakers() {
  const t = useTranslations("CFP");
  const locale = useLocale();
  const { isExpired, isActive } = useCountdown(CFP_DEADLINE);
  const closed = isActive && isExpired;

  return (
    <BlockSection id="cfp" tone="ink">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-8">
        <ScrollReveal>
          <DotHeading flicker className="mb-6 text-[#E6E4DA]">
            {t("heading")}
          </DotHeading>
          <h2
            className="m-0 max-w-[16ch] font-display font-medium leading-[1.02] tracking-tight text-[#E6E4DA]"
            style={{ fontSize: "clamp(28px,4vw,48px)" }}
          >
            {t("lead_pre")}
            <em className="not-italic text-[#D85A30]">{t("lead_em")}</em>
            {t("lead_post")}
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <p className="m-0 max-w-[38ch] font-mono text-base leading-relaxed text-[#B4B2A9]">
            {t("lead_desc")}
          </p>
        </ScrollReveal>
      </div>

      <ScrollReveal delay={0.15}>
        <div className="mb-16 flex flex-col items-start justify-between gap-8 rounded-[12px] border border-[#2C2550] bg-[#1E1838] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] md:flex-row md:items-center md:p-8">
          <DeadlineCountdown />
          <HardButton
            href={localePath(locale, "/speakers/postular")}
            pulse
            disabled={closed}
            sub={closed ? t("closed_note") : undefined}
          >
            {closed ? t("cta_closed") : t("cta_apply")}
          </HardButton>
        </div>
      </ScrollReveal>

      {/* Fechas importantes */}
      <ScrollReveal>
        <DotHeading as="h3" flicker className="mb-6 text-2xl text-[#E6E4DA] md:text-3xl">
          {t("dates_heading")}
        </DotHeading>
      </ScrollReveal>

      <ol className="mb-16 border-t border-[#2C2550]">
        {cfpMilestones.map((m, i) => (
          <ScrollReveal key={m.id} delay={i * 0.07} from={i % 2 ? "right" : "left"} distance={60}>
            <Row
              dot
              left={
                <time className="dot-matrix text-base font-bold text-[#D85A30] md:text-lg">
                  {t(m.dateKey)}
                </time>
              }
              title={t(m.titleKey)}
              desc={t(m.descKey)}
            />
          </ScrollReveal>
        ))}
      </ol>

      {/* Modalidades — cajas con diseño uniforme */}
      <ScrollReveal>
        <DotHeading as="h3" flicker className="mb-6 text-2xl text-[#E6E4DA] md:text-3xl">
          {t("formats_heading")}
        </DotHeading>
      </ScrollReveal>

      <div className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-2">
        {cfpFormats.map((f, i) => {
          const Icon = ICONS[f.icon] ?? Mic;
          return (
            <ScrollReveal key={f.id} delay={i * 0.1} from="scale" className="h-full">
              <div className="flex h-full flex-col rounded-[12px] border border-[#2C2550] bg-[#1E1838] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#D85A30]/50 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[8px] border border-[#D85A30]/30 bg-[#D85A30]/10 text-[#D85A30]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="dot-matrix text-lg font-bold leading-none text-[#D85A30]">
                    {t(f.durationKey)}
                  </span>
                </div>
                <h4 className="font-display text-xl font-bold leading-tight tracking-tight text-[#E6E4DA]">
                  {t(f.titleKey)}
                </h4>
                <p className="mt-2 font-mono text-sm leading-relaxed text-[#B4B2A9]">
                  {t(f.descKey)}
                </p>
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Criterios */}
      <ScrollReveal>
        <DotHeading as="h3" flicker className="mb-6 text-2xl text-[#E6E4DA] md:text-3xl">
          {t("criteria_heading")}
        </DotHeading>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cfpCriteria.map((c, i) => {
          const Icon = ICONS[c.icon] ?? EyeOff;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-[12px] border border-[#2C2550] bg-[#1E1838]/60 p-6 transition-all duration-300 hover:border-[#C143BC]/60 hover:bg-[#1E1838]"
            >
              <Icon className="mb-3 h-6 w-6 text-[#C143BC]" />
              <p className="m-0 font-display text-lg font-bold tracking-tight text-[#E6E4DA]">
                {t(c.titleKey)}
              </p>
              <p className="mt-1.5 font-mono text-sm leading-relaxed text-[#B4B2A9]">
                {t(c.descKey)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </BlockSection>
  );
}
