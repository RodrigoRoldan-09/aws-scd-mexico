"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  ArrowUpRight, CalendarDays, Clock, MapPin, BookOpen, Gamepad2, Rocket,
} from "lucide-react";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { KiroGhost } from "@/components/kiro/kiro-ghost";
import { KiroMascot } from "@/components/kiro/kiro-mascot";
import { basePath } from "@/lib/utils";

const KIRO_SITE = "https://kiro.dev";
const RESOURCE_LINKS = {
  guides: "https://kiro.dev/docs/guides/",
  play: "https://kiro.dev/docs/guides/learn-by-playing/",
  first: "https://kiro.dev/docs/getting-started/first-project/",
};

export function KiroContent() {
  const t = useTranslations("Kiro");

  const features = [
    { img: "/images/kiro/caps/1.png", title: t("f1_title"), desc: t("f1_desc") },
    { img: "/images/kiro/caps/2.png", title: t("f2_title"), desc: t("f2_desc") },
    { img: "/images/kiro/caps/3.png", title: t("f3_title"), desc: t("f3_desc") },
    { img: "/images/kiro/caps/4.png", title: t("f4_title"), desc: t("f4_desc") },
    { img: "/images/kiro/caps/5.png", title: t("f5_title"), desc: t("f5_desc") },
    { img: "/images/kiro/caps/6.png", title: t("f6_title"), desc: t("f6_desc") },
  ];
  const resources = [
    { icon: BookOpen, title: t("r1_title"), desc: t("r1_desc"), href: RESOURCE_LINKS.guides },
    { icon: Gamepad2, title: t("r2_title"), desc: t("r2_desc"), href: RESOURCE_LINKS.play },
    { icon: Rocket, title: t("r3_title"), desc: t("r3_desc"), href: RESOURCE_LINKS.first },
  ];

  return (
    <main className="relative overflow-hidden bg-[#0a0510]" style={{ fontFamily: "var(--font-kiro)" }}>
      {/* roaming ghosts drifting across the whole page */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden md:block">
        <KiroGhost className="absolute top-[16%] h-14 w-14 text-kiro-purple/30" style={{ animation: "kiro-roam 24s linear infinite" }} />
        <KiroGhost className="absolute top-[46%] h-20 w-20 text-white/[0.07]" style={{ animation: "kiro-roam 34s linear infinite", animationDelay: "-8s" }} />
        <KiroGhost className="absolute top-[72%] h-12 w-12 text-kiro-purple/25" style={{ animation: "kiro-roam 28s linear infinite", animationDelay: "-16s" }} />
        <KiroGhost className="absolute top-[88%] h-16 w-16 text-kiro-purple-light/20" style={{ animation: "kiro-roam 40s linear infinite", animationDelay: "-22s" }} />
      </div>

      {/* ===== HERO ===== */}
      <section className="relative px-4 pt-32 pb-20 sm:px-6 sm:pt-36">
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(242,166,240,0.30), transparent 65%)" }} />
        <div aria-hidden className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(rgba(242,166,240,0.9) 1px, transparent 1px)", backgroundSize: "28px 28px", maskImage: "radial-gradient(ellipse 60% 55% at 50% 25%, black, transparent)" }} />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div aria-hidden className="absolute inset-0 -z-10 rounded-full bg-kiro-purple/25 blur-3xl" />
              <KiroMascot className="h-36 w-36 text-white sm:h-44 sm:w-44" />
            </div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-8 text-6xl font-black tracking-tight text-white sm:text-8xl"
          >
            {t("hero_title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 text-xl font-semibold text-kiro-purple-light sm:text-2xl"
          >
            {t("hero_tagline")}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-purple-100/70"
          >
            {t("hero_desc")}
          </motion.p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={KIRO_SITE} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-none bg-kiro-purple px-8 py-4 text-base font-bold text-surface-900 transition-all hover:bg-kiro-purple-light hover:shadow-[0_0_36px_rgba(242,166,240,0.55)]">
              {t("hero_cta_site")} <ArrowUpRight className="h-4 w-4" />
            </a>
            <a href="#booth"
              className="inline-flex items-center justify-center gap-2 rounded-none border border-kiro-purple/40 bg-kiro-purple/10 px-8 py-4 text-base font-semibold text-kiro-purple-light transition-colors hover:bg-kiro-purple/20">
              {t("hero_cta_booth")}
            </a>
          </div>
        </div>
      </section>

      {/* ===== WHAT IS KIRO ===== */}
      <section className="relative z-10 px-4 py-16 sm:px-6">
        <ScrollReveal>
          <div className="mx-auto max-w-3xl rounded-[28px] border border-kiro-purple/20 bg-white/[0.02] p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t("whatis_heading")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-purple-100/70 sm:text-lg">{t("whatis_body")}</p>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== CAPABILITIES ===== */}
      <section className="relative z-10 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">{t("features_heading")}</h2>
              <div className="mx-auto mt-4 h-[3px] w-[64px] rounded bg-kiro-purple" />
              <p className="mx-auto mt-4 max-w-2xl text-lg text-purple-100/70">{t("features_sub")}</p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={(i % 3) * 0.06}>
                <div className="group h-full overflow-hidden rounded-[22px] border border-kiro-purple/20 bg-white/[0.03] transition-all hover:border-kiro-purple/50">
                  {/* white media tile blends with the illustration's white background */}
                  <div className="relative aspect-[4/3] w-full bg-white">
                    <Image
                      src={`${basePath}${f.img}`}
                      alt={f.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                      className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-base font-bold text-white">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-purple-100/60">{f.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BOOTH ===== */}
      <section id="booth" className="relative z-10 scroll-mt-24 px-4 py-16 sm:px-6">
        <ScrollReveal>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-kiro-purple/30 bg-gradient-to-br from-kiro-purple/[0.16] to-[#0c0612] p-8 sm:p-12">
            <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-kiro-purple/20 blur-3xl" />
            <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row md:justify-between">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">{t("booth_heading")}</h2>
                <p className="mx-auto mt-3 max-w-md text-purple-100/70 md:mx-0">{t("booth_desc")}</p>
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row md:items-start">
                  <span className="inline-flex items-center gap-2 rounded-none border border-kiro-purple/30 bg-white/[0.04] px-4 py-2 text-sm text-white">
                    <CalendarDays className="h-4 w-4 text-kiro-purple-light" /> {t("booth_date")}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-none border border-kiro-purple/30 bg-white/[0.04] px-4 py-2 text-sm text-white">
                    <Clock className="h-4 w-4 text-kiro-purple-light" /> {t("booth_time")}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-none border border-kiro-purple/30 bg-white/[0.04] px-4 py-2 text-sm text-white">
                    <MapPin className="h-4 w-4 text-kiro-purple-light" /> {t("booth_place")}
                  </span>
                </div>
              </div>
              <KiroMascot className="h-28 w-28 shrink-0 text-kiro-purple-light sm:h-32 sm:w-32" />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== RESOURCES ===== */}
      <section className="relative z-10 px-4 pb-28 pt-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">{t("resources_heading")}</h2>
              <div className="mx-auto mt-4 h-[3px] w-[64px] rounded bg-kiro-purple" />
              <p className="mx-auto mt-4 max-w-2xl text-lg text-purple-100/70">{t("resources_sub")}</p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {resources.map((r, i) => {
              const Icon = r.icon;
              return (
                <ScrollReveal key={r.title} delay={i * 0.07}>
                  <a href={r.href} target="_blank" rel="noopener noreferrer"
                    className="group flex h-full flex-col rounded-[22px] border border-kiro-purple/20 bg-white/[0.03] p-7 transition-all hover:border-kiro-purple/50 hover:bg-kiro-purple/[0.08]">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-kiro-purple/15 ring-1 ring-kiro-purple/30">
                        <Icon className="h-6 w-6 text-kiro-purple-light" strokeWidth={2} />
                      </span>
                      <ArrowUpRight className="h-5 w-5 text-purple-100/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-kiro-purple-light" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-white">{r.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-purple-100/60">{r.desc}</p>
                    <span className="mt-4 text-sm font-semibold text-kiro-purple-light">{t("resources_cta")}</span>
                  </a>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
