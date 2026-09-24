"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { KiroGhost } from "@/components/kiro/kiro-ghost";
import { KiroMascot } from "@/components/kiro/kiro-mascot";
import { localePath } from "@/lib/utils";

export function KiroBanner() {
  const t = useTranslations("Kiro");
  const locale = useLocale();

  return (
    <section className="px-4 sm:px-6 py-10" style={{ fontFamily: "var(--font-kiro)" }}>
      <ScrollReveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-kiro-purple/30 bg-[#0c0612]">
          {/* glows + dot grid */}
          <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 120% at 80% 50%, rgba(242,166,240,0.32), transparent 62%)" }} />
          <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(rgba(242,166,240,0.9) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
          {/* roaming ghost */}
          <div aria-hidden className="pointer-events-none absolute top-6 left-0 hidden sm:block">
            <KiroGhost className="h-10 w-10 text-kiro-purple/20" style={{ animation: "kiro-roam 22s linear infinite" }} />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8 p-8 sm:p-12 md:flex-row md:justify-between md:gap-10">
            <div className="min-w-0 text-center md:text-left">
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
                {t("banner_title")}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-purple-100/75 sm:text-lg md:mx-0">
                {t("banner_desc")}
              </p>
              <Link href={localePath(locale, "/kiro")}
                className="group mt-7 inline-flex items-center justify-center gap-2 rounded-none bg-kiro-purple px-8 py-3.5 text-base font-bold text-surface-900 transition-all hover:bg-kiro-purple-light hover:shadow-[0_0_38px_rgba(242,166,240,0.55)]">
                {t("cta_more")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* big floating ghost */}
            <div className="relative shrink-0">
              <div aria-hidden className="absolute inset-0 -z-10 scale-150 rounded-full bg-kiro-purple/25 blur-3xl" />
              <KiroMascot className="h-36 w-36 text-white sm:h-44 sm:w-44" />
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
