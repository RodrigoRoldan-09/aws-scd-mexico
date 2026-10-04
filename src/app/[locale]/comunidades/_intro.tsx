"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Lightbulb, Users } from "lucide-react";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { BlockSection } from "@/components/ui/block-section";
import { DotHeading } from "@/components/ui/dot-heading";
import { HardButton } from "@/components/ui/hard-button";
import { useCountdown } from "@/hooks/use-countdown";
import { COMMUNITY_CALL_DEADLINE } from "@/data/community-call";
import { localePath } from "@/lib/utils";
import { CONTRIBUTION_FIELD, introCopyFor } from "./_intro-copy";

type Copy = ReturnType<typeof introCopyFor>;

function DeadlineCountdown({ t }: { t: Copy }) {
  const { days, hours, minutes, seconds, isExpired, isActive } =
    useCountdown(COMMUNITY_CALL_DEADLINE);

  // `isActive` sólo pasa a true tras el primer tick en cliente: así el SSR y la
  // primera pintura coinciden y no hay hydration mismatch con el reloj.
  if (!isActive) return <div className="h-[92px]" aria-hidden="true" />;

  if (isExpired) {
    return <p className="dot-matrix text-lg text-[#D85A30]">{t.closed_note}</p>;
  }

  const blocks = [
    { value: days, label: t.days },
    { value: hours, label: t.hours },
    { value: minutes, label: t.minutes },
    { value: seconds, label: t.seconds },
  ];

  return (
    <div>
      <p className="dot-matrix mb-2.5 text-sm text-[#B4B2A9]">{t.countdown_label}</p>
      <div className="flex gap-2">
        {blocks.map((b) => (
          <div key={b.label} className="flex flex-col items-center">
            <div className="min-w-[66px] rounded-[6px] border border-[#2C2550] bg-[#0E0E1A] px-3 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <span className="dot-matrix text-3xl font-bold leading-none text-[#D85A30] md:text-4xl">
                {String(b.value).padStart(2, "0")}
              </span>
            </div>
            <span className="dot-matrix mt-1.5 text-xs text-[#B4B2A9]">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <ScrollReveal>
      <DotHeading as="h3" flicker className="mb-6 text-2xl text-[#E6E4DA] md:text-3xl">
        {children}
      </DotHeading>
    </ScrollReveal>
  );
}

const body = "m-0 font-mono text-sm leading-relaxed text-[#B4B2A9] md:text-base";

/**
 * Convocatoria para comunidades aliadas: lo que se ve antes del formulario.
 * El formulario vive en `/comunidades/postular`.
 */
export function ComunidadesIntro() {
  const locale = useLocale();
  const t = introCopyFor(locale);
  const { isExpired, isActive } = useCountdown(COMMUNITY_CALL_DEADLINE);
  const closed = isActive && isExpired;
  const applyHref = localePath(locale, "/comunidades/postular");

  return (
    <div className="min-h-screen bg-[#0E0E1A] pt-8 md:pt-0">
      <BlockSection id="convocatoria" tone="ink">
        {/* Aviso al inicio */}
        <ScrollReveal>
          <div
            role="note"
            className="mb-10 flex items-center gap-3 rounded-[8px] border-2 border-[#D85A30] bg-[#D85A30]/10 px-4 py-3 md:px-5"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-[#D85A30]" aria-hidden="true" />
            <p className="dot-matrix m-0 text-sm font-bold uppercase leading-snug tracking-wide text-[#E6E4DA] md:text-base">
              {t.read_first}
            </p>
          </div>
        </ScrollReveal>

        {/* Encabezado */}
        <div className="mb-12">
          <ScrollReveal>
            <p className="dot-matrix mb-3 text-sm text-[#C143BC]">{`// ${t.eyebrow}`}</p>
            <DotHeading flicker className="text-[#E6E4DA]">
              {t.heading}
            </DotHeading>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-10">
              <p className={body}>{t.intro_1}</p>
              <p className={body}>{t.intro_2}</p>
            </div>
          </ScrollReveal>
        </div>

        {/* Cronómetro + CTA */}
        <ScrollReveal delay={0.15}>
          <div className="mb-16 flex flex-col items-start justify-between gap-8 rounded-[12px] border border-[#2C2550] bg-[#1E1838] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] md:flex-row md:items-center md:p-8">
            <DeadlineCountdown t={t} />
            <HardButton
              href={applyHref}
              pulse
              disabled={closed}
              sub={closed ? t.closed_note : undefined}
            >
              {closed ? t.cta_closed : t.cta_apply}
            </HardButton>
          </div>
        </ScrollReveal>

        {/* ¿Qué buscamos? */}
        <SubHeading>{t.seek_heading}</SubHeading>
        <ScrollReveal>
          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-10">
            <p className={`${body} font-bold text-[#E6E4DA]`}>{t.seek_lead_1}</p>
            <p className={body}>{t.seek_lead_2}</p>
          </div>
        </ScrollReveal>
        <ul className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {t.seek_items.map((item, i) => (
            <ScrollReveal key={item} delay={i * 0.05} from="scale" className="h-full">
              <li className="flex h-full list-none items-start gap-3 rounded-[12px] border border-[#2C2550] bg-[#1E1838]/60 p-5 transition-all duration-300 hover:border-[#C143BC]/60 hover:bg-[#1E1838]">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#C143BC]" aria-hidden="true" />
                <span className="font-mono text-sm leading-relaxed text-[#E6E4DA]">{item}</span>
              </li>
            </ScrollReveal>
          ))}
        </ul>
        <ScrollReveal>
          <div className="relative mb-16 overflow-hidden rounded-[12px] border-2 border-[#C143BC]/60 bg-gradient-to-br from-[#2A1B4D] via-[#1E1838] to-[#1E1838] p-6 shadow-[0_0_32px_rgba(193,67,188,0.18)] md:p-8">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#C143BC]/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] border border-[#C143BC]/50 bg-[#C143BC]/15 text-[#F2A6F0] shadow-[0_0_20px_rgba(193,67,188,0.35)]"
                aria-hidden="true"
              >
                <Lightbulb className="h-7 w-7" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-5">
                <p className="m-0 font-display text-xl font-bold leading-snug tracking-tight text-[#E6E4DA] md:text-2xl">
                  {t.seek_outro_1}
                </p>

                <div>
                  <p className="dot-matrix mb-2 text-sm text-[#C143BC]">{`// ${t.seek_field_tag}`}</p>
                  <p className={`${body} mb-2`}>{t.seek_outro_pre}</p>
                  {/* Réplica del campo tal como aparece en el formulario */}
                  <div className="rounded-[4px] border border-[#C143BC]/60 bg-[#090812] px-4 py-3 shadow-[0_0_16px_rgba(193,67,188,0.2)]">
                    <p className="m-0 font-mono text-xs font-bold uppercase leading-relaxed tracking-wider text-[#E6E4DA] sm:text-sm">
                      {CONTRIBUTION_FIELD[locale === "en" ? "en" : "es"]}{" "}
                      <span className="text-[#C143BC]">*</span>
                    </p>
                    <p className="m-0 mt-1 font-mono text-xs uppercase leading-relaxed tracking-wider text-[#8E8EA0] sm:text-sm">
                      {CONTRIBUTION_FIELD[locale === "en" ? "es" : "en"]}
                      <span
                        className="ml-1 inline-block h-4 w-[3px] translate-y-0.5 bg-[#C143BC] motion-safe:animate-pulse"
                        aria-hidden="true"
                      />
                    </p>
                  </div>
                </div>

                <p className={`${body} font-bold text-[#F2A6F0]`}>{t.seek_outro_2}</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ¿Qué recibirán? */}
        <SubHeading>{t.get_heading}</SubHeading>
        <ScrollReveal>
          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-10">
            <p className={body}>{t.get_1}</p>
            <p className={body}>{t.get_2}</p>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <div className="mb-16 flex items-start gap-4 rounded-[12px] border border-[#D85A30]/40 bg-[#D85A30]/10 p-5">
            <Users className="mt-0.5 h-6 w-6 shrink-0 text-[#D85A30]" aria-hidden="true" />
            <div>
              <p className="m-0 font-display text-lg font-bold tracking-tight text-[#E6E4DA]">
                {t.limited_title}
              </p>
              <p className="mt-1 font-mono text-sm leading-relaxed text-[#B4B2A9]">
                {t.limited_body}
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Lineamientos */}
        <SubHeading>{t.rules_heading}</SubHeading>
        <ScrollReveal>
          <p className={`${body} mb-4`}>{t.rules_lead}</p>
        </ScrollReveal>
        <ul className="m-0 mb-6 border-t border-[#2C2550] p-0">
          {t.rules_items.map((item, i) => (
            <ScrollReveal key={item} delay={i * 0.05}>
              <li className="flex list-none items-start gap-3 border-b border-[#2C2550] px-1 py-4">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#D85A30]" aria-hidden="true" />
                <span className="font-mono text-sm leading-relaxed text-[#E6E4DA]">{item}</span>
              </li>
            </ScrollReveal>
          ))}
        </ul>
        <ScrollReveal>
          <Link
            href={localePath(locale, "/codigo-conducta")}
            className="mb-16 inline-flex items-center gap-1.5 font-mono text-sm font-bold text-[#F2A6F0] underline underline-offset-4 hover:text-[#E6E4DA]"
          >
            {t.conduct_link}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </ScrollReveal>

        {/* Calendario */}
        <SubHeading>{t.dates_heading}</SubHeading>
        <ol className="m-0 mb-16 border-t border-[#2C2550] p-0">
          {t.milestones.map((m, i) => (
            <ScrollReveal key={m.date + m.title} delay={i * 0.07} from={i % 2 ? "right" : "left"} distance={60}>
              <li className="group relative grid list-none grid-cols-1 items-start gap-2 border-b border-[#2C2550] px-1 py-6 transition-colors duration-300 hover:bg-[#1E1838]/50 sm:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] sm:gap-10">
                <div
                  className="absolute bottom-[-1px] left-0 h-0.5 w-0 bg-[#D85A30] transition-[width] duration-500 group-hover:w-full"
                  aria-hidden="true"
                />
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#D85A30]" aria-hidden="true" />
                  <time className="dot-matrix text-base font-bold text-[#D85A30] md:text-lg">
                    {m.date}
                  </time>
                </div>
                <p
                  className={`m-0 pl-5 font-display text-lg tracking-tight text-[#E6E4DA] sm:pl-0 ${
                    m.highlight ? "font-bold" : "font-medium"
                  }`}
                >
                  {m.title}
                </p>
              </li>
            </ScrollReveal>
          ))}
        </ol>

        {/* ¿Quieres participar? */}
        <ScrollReveal>
          <div className="flex flex-col items-start justify-between gap-8 rounded-[12px] border border-[#2C2550] bg-[#1E1838] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] md:flex-row md:items-center md:p-8">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <DotHeading as="h3" className="text-2xl text-[#E6E4DA] md:text-3xl">
                {t.join_heading}
              </DotHeading>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-8">
                <p className={body}>{t.join_1}</p>
                <p className={body}>{t.join_2}</p>
              </div>
            </div>
            <HardButton href={applyHref} disabled={closed} sub={closed ? t.closed_note : undefined}>
              {closed ? t.cta_closed : t.cta_apply}
            </HardButton>
          </div>
        </ScrollReveal>
      </BlockSection>
    </div>
  );
}