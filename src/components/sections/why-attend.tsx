"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { DotHeading } from "@/components/ui/dot-heading";

const WHY_ITEMS = [
  { num: "01", titleKey: "card_learn_title",      tagKey: "why_01_tag", descKey: "card_learn_desc" },
  { num: "02", titleKey: "card_network_title",    tagKey: "why_02_tag", descKey: "card_network_desc" },
  { num: "03", titleKey: "card_recognition_title",tagKey: "why_03_tag", descKey: "card_recognition_desc" },
];

function WhyRow({ num, titleKey, tagKey, descKey, t }: {
  num: string; titleKey: string; tagKey: string; descKey: string;
  t: (k: string) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && window.matchMedia("(hover: none)").matches) {
          clearTimeout(timer);
          setLit(true);
          timer = setTimeout(() => setLit(false), 900);
        }
      },
      { threshold: 0.55 },
    );

    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, []);

  return (
    <div
      ref={ref}
      className={`group relative grid grid-cols-1 sm:grid-cols-[minmax(80px,0.7fr)_1.2fr_2fr] gap-4 sm:gap-10 md:gap-16 items-start py-8 md:py-12 px-2 border-b border-[#2C2550] transition-colors duration-500 ${lit ? "bg-[#1E1838]/40" : "hover:bg-[#1E1838]/40"}`}
    >
      {/* Animated accent underline */}
      <div className={`absolute left-0 bottom-[-1px] h-px bg-[#C143BC] transition-[width] duration-700 ${lit ? "w-full" : "w-0 group-hover:w-full"}`} />

      {/* Number — outline → fills on hover (desktop) or scroll-enter (mobile) */}
      <span
        className={`font-display font-bold leading-none tracking-tight select-none transition-colors duration-500 ${lit ? "text-[#C143BC]" : "text-white/10 group-hover:text-[#C143BC]"} [-webkit-text-stroke:1.5px_rgba(255,255,255,0.22)] group-hover:[-webkit-text-stroke-color:var(--color-accent)] [transition:color_0.5s_ease,_-webkit-text-stroke-color_0.5s_ease]`}
        style={{ fontSize: "clamp(32px,4.5vw,58px)" }}
      >
        {num}
      </span>

      <div className="flex flex-col gap-2.5">
        <h3 className="font-display font-bold leading-tight tracking-tight text-[#E6E4DA] m-0 text-lg md:text-xl lg:text-2xl">
          {t(titleKey)}
        </h3>
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#8B84A0]">
          {t(tagKey)}
        </span>
      </div>

      <p className="font-mono text-surface-300 leading-relaxed m-0 text-sm md:text-base lg:text-[17px]">
        {t(descKey)}
      </p>
    </div>
  );
}

export function WhyAttend() {
  const t = useTranslations("About");

  return (
    <section id="why-attend" className="mx-auto max-w-[1180px] px-6 py-20 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-8 mb-10 md:mb-14">
        <ScrollReveal>
          <DotHeading as="div" variant="inverted" className="mb-5 text-xl sm:text-2xl md:text-3xl">
            {t("eyebrow")}
          </DotHeading>
          <h2 className="font-display font-bold leading-[1.02] tracking-tight max-w-[16ch] m-0"
            style={{ fontSize: "clamp(28px,4vw,48px)" }}>
            {t("section_pre")}
            <em className="not-italic text-hack-block">{t("section_em")}</em>
            {t("section_post")}
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <p className="font-mono text-surface-300 leading-relaxed max-w-[38ch] m-0 text-base md:text-lg">
            {t("section_lead")}
          </p>
        </ScrollReveal>
      </div>

      <div className="border-t border-[#2C2550]">
        {WHY_ITEMS.map((item, i) => (
          <ScrollReveal key={item.num} delay={i * 0.1} from="left" distance={70}>
            <WhyRow {...item} t={t as (k: string) => string} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
