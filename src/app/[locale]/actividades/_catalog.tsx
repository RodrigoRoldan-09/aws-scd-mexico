"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Clock,
  Laptop,
  MapPin,
  Users,
  Sparkles,
  ArrowRight,
  Lock,
  Info,
  Search,
  Filter,
  Terminal,
  Trophy,
  ChevronDown,
} from "lucide-react";
import { DotHeading } from "@/components/ui/dot-heading";
import type { PublicActivityDTO } from "@/types/activities";
import type { ActivityType } from "@/models/activity";
import { EVENT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { activitiesCopyFor } from "./_copy";

const ease = [0.22, 1, 0.36, 1] as const;

export function ActivitiesCatalogClient({
  activities,
  locale,
  initialFilter,
}: {
  activities: PublicActivityDTO[];
  locale: string;
  initialFilter?: ActivityType | "all";
}) {
  const isEn = locale === "en";
  const t = activitiesCopyFor(locale);
  const [filter, setFilter] = useState<ActivityType | "all">(initialFilter ?? "all");

  const unifiedFormHref = isEn ? "/en/actividades/registro-actividades" : "/actividades/registro-actividades";
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string>("all");

  // Búsqueda y nivel aplican antes de contar por categoría, para que los contadores reflejen los resultados.
  const q = query.trim().toLowerCase();
  const base = activities.filter((a) => {
    if (level !== "all" && a.level !== level) return false;
    if (!q) return true;
    return [a.title, a.titleEn, a.speakerName, a.roomName, a.slug].some((v) =>
      (v ?? "").toLowerCase().includes(q),
    );
  });
  const filtered = base.filter((a) => filter === "all" || a.type === filter);
  const levels = Array.from(new Set(activities.map((a) => a.level).filter(Boolean))).sort();

  const typeLabel = (type: ActivityType) => {
    if (type === "workshop") return t.type_workshop;
    if (type === "hackathon") return t.type_hackathon;
    return t.type_activity;
  };

  return (
    <main className="relative flex min-h-screen flex-col bg-[#0A0A12] text-[#E6E4DA] pt-24 overflow-x-hidden">
      {/* Rejilla de fondo estilo hardware arcade */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(193,67,188,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(193,67,188,0.45) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 pb-24 z-10">
        {/* Cabecera */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-8 flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <DotHeading flicker className="text-[#E6E4DA]">
              {t.catalog_title}
            </DotHeading>
            <p className="mt-4 max-w-[62ch] font-mono text-xs sm:text-sm leading-relaxed text-[#B4B2A9]">
              {"// "}
              {t.catalog_lead}
            </p>
          </div>

        </motion.div>

        {/* Sección Informativa: Reglas de Inscripción por Actividad */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          aria-label="Reglas de registro por actividad"
          className="mb-8 rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-4 sm:p-5 shadow-[0_0_20px_rgba(193,67,188,0.08)]"
        >
          <div className="flex items-center gap-2 border-b border-[#2C2550] pb-2.5 font-mono text-xs font-bold text-[#F2A6F0]">
            <Info className="h-4 w-4 shrink-0 text-[#C143BC]" />
            <span>{t.rules_banner_title}</span>
          </div>

          <div className="mt-3.5 grid gap-3 sm:grid-cols-2 text-xs font-mono">
            <div className="rounded-[4px] border border-amber-500/30 bg-amber-950/20 p-3">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>{t.rules_banner_direct_title}</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-amber-100/90">
                {t.rules_banner_direct_desc}
              </p>
            </div>

            <div className="rounded-[4px] border border-emerald-500/30 bg-emerald-950/20 p-3">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{t.rules_banner_activity_title}</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-emerald-100/90">
                {t.rules_banner_activity_desc}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Filtros: categorías, búsqueda y nivel */}
        <div className="mb-8 flex flex-col gap-4 border-b border-[#2C2550] pb-6">
          <div className="flex flex-wrap items-center gap-2.5">
            {(
              [
                ["all", t.filter_all, null],
                ["workshop", t.filter_workshop, Terminal],
                ["hackathon", t.filter_hackathon, Trophy],
                ["activity", t.filter_activity, Sparkles],
              ] as const
            ).map(([key, label, Icon]) => {
              const active = filter === key;
              const count = key === "all" ? base.length : base.filter((a) => a.type === key).length;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs sm:text-sm font-bold transition-all",
                    active
                      ? "border-[#E6E4DA] bg-[#E6E4DA] text-[#0E0E1A]"
                      : "border-[#2C2550] bg-[#120E22]/90 text-[#B4B2A9] hover:border-[#C143BC]/60 hover:text-[#E6E4DA]",
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  <span>
                    {label} ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8EA0]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search_placeholder}
              aria-label={t.search_placeholder}
              className="w-full rounded-[10px] border border-[#2C2550] bg-[#0E0E1A] py-3 pl-11 pr-4 font-mono text-xs sm:text-sm text-[#E6E4DA] placeholder:text-[#73726C] outline-none transition-colors focus:border-[#C143BC]"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 shrink-0 text-[#8E8EA0]" />
            <div className="relative w-full sm:w-64">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                aria-label={t.level_all}
                className="w-full cursor-pointer appearance-none rounded-[10px] border border-[#2C2550] bg-[#0E0E1A] py-2.5 pl-4 pr-10 font-mono text-xs sm:text-sm text-[#E6E4DA] outline-none transition-colors focus:border-[#C143BC]"
              >
                <option value="all">{t.level_all}</option>
                {levels.map((lv) => (
                  <option key={lv} value={lv}>
                    {t.level_prefix} {lv}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8EA0]" />
            </div>
          </div>
        </div>

        {/* Banner del Formulario Unificado de Actividades */}
        {(filter === "all" || filter === "activity") && activities.some((a) => a.type === "activity") && (
          <Link
            href={unifiedFormHref}
            className="group mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[4px] border-2 border-[#C143BC] bg-[#C143BC]/12 p-4 sm:p-5 shadow-[0_0_24px_rgba(193,67,188,0.18)] transition-all hover:bg-[#C143BC]/20"
          >
            <div>
              <div className="flex items-center gap-2 font-mono text-sm font-bold text-[#F2A6F0]">
                <Sparkles className="h-4 w-4 text-[#C143BC]" />
                {t.unified_banner_title}
              </div>
              <p className="mt-1 font-mono text-xs text-[#B4B2A9]">{t.unified_banner_desc}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-[4px] border-2 border-[#C143BC] bg-[#C143BC] px-4 py-2.5 font-mono text-xs font-bold text-[#0E0E1A] transition-all group-hover:bg-[#D970D7]">
              {t.unified_banner_cta}
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        )}

        {/* Grid de tarjetas */}
        {filtered.length === 0 ? (
          <div className="rounded-[4px] border border-[#2C2550] bg-[#120E22]/80 p-10 text-center font-mono text-sm text-[#8E8EA0]">
            {t.empty_filter}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((act, idx) => {
              const title = isEn ? act.titleEn || act.title : act.title;
              const desc = isEn ? act.descriptionEn || act.description : act.description;
              const pct = Math.min(100, Math.round((act.registeredCount / act.maxCapacity) * 100));
              const isLowSpots = !act.isSoldOut && act.spotsLeft <= 5;
              const isActivity = act.type === "activity";
              const href = isActivity
                ? `${unifiedFormHref}?prefer=${act.slug}`
                : isEn
                  ? `/en/actividades/${act.slug}`
                  : `/actividades/${act.slug}`;
              const spotsLabel = isActivity ? t.activity_assign_spots : t.spots_available;

              return (
                <motion.article
                  key={act._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: idx * 0.06, ease }}
                  className={cn(
                    "relative flex flex-col justify-between rounded-[4px] border-2 p-5 sm:p-6 transition-all",
                    act.isSoldOut
                      ? "border-[#2C2550] bg-[#0E0E1A]/75 opacity-80"
                      : "border-[#C143BC]/70 bg-[#120E22]/95 shadow-[0_0_28px_rgba(193,67,188,0.14)] hover:border-[#C143BC]",
                  )}
                >
                  <div>
                    {/* Top badges */}
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-[2px] border border-[#C143BC] bg-[#9A3097]/30 px-2.5 py-0.5 arcade-pixel text-[11px] font-bold uppercase text-[#F2A6F0]">
                          {typeLabel(act.type)}
                        </span>
                        {act.level && (
                          <span className="rounded-[2px] border border-[#2C2550] bg-[#090812] px-2 py-0.5 font-mono text-[10px] text-[#B4B2A9]">
                            {t.level_prefix} {act.level}
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#F2A6F0]">
                        <Clock className="h-3.5 w-3.5 text-[#C143BC]" />
                        {act.startTime} – {act.endTime}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h2 className="m-0 font-mono text-base sm:text-lg font-bold leading-snug text-[#E6E4DA]">
                      {title}
                    </h2>
                    <p className="mt-2.5 font-mono text-xs leading-relaxed text-[#B4B2A9]">
                      {desc}
                    </p>

                    {/* Metadata chips */}
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono text-[#B4B2A9]">
                      {act.roomName && (
                        <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2C2550] bg-[#090812] px-2.5 py-1">
                          <MapPin className="h-3 w-3 text-[#C143BC]" />
                          {act.roomName}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2C2550] bg-[#090812] px-2.5 py-1">
                        <Users className="h-3 w-3 text-[#C143BC]" />
                        {act.formConfig.participationMode === "individual"
                          ? t.solo_badge
                          : t.team_badge(act.formConfig.maxTeamSize)}
                      </span>
                      {act.formConfig.requireLaptop && (
                        <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2C2550] bg-[#090812] px-2.5 py-1">
                          <Laptop className="h-3 w-3 text-[#C143BC]" />
                          {t.laptop_badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Barra de cupo y CTA */}
                  <div className="mt-6 border-t border-[#2C2550] pt-4">
                    <div className="mb-2 flex items-center justify-between font-mono text-xs">
                      <span
                        className={cn(
                          "font-bold",
                          act.isSoldOut
                            ? "text-[#E24B4A]"
                            : isLowSpots
                              ? "text-[#F59E0B]"
                              : "text-[#E6E4DA]",
                        )}
                      >
                        {act.isSoldOut
                          ? t.sold_out
                          : spotsLabel(act.spotsLeft, act.maxCapacity)}
                      </span>
                      {isLowSpots && (
                        <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#F59E0B]/20 border border-[#F59E0B]/60 px-2 py-0.5 text-[10px] font-bold text-[#FBBF24]">
                          <Sparkles className="h-3 w-3" />
                          {t.last_spots(act.spotsLeft)}
                        </span>
                      )}
                    </div>

                    {/* Barra de progreso */}
                    <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-[#090812] border border-[#2C2550]">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          act.isSoldOut
                            ? "bg-[#E24B4A]"
                            : isLowSpots
                              ? "bg-[#F59E0B]"
                              : "bg-[#C143BC]",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {act.isSoldOut ? (
                      <div className="flex w-full items-center justify-center gap-2 rounded-[4px] border border-[#2C2550] bg-[#090812] px-4 py-3 font-mono text-xs font-bold text-[#73726C]">
                        <Lock className="h-3.5 w-3.5" />
                        {t.cta_sold_out}
                      </div>
                    ) : (
                      <Link
                        href={href}
                        className="flex w-full items-center justify-center gap-2 rounded-[4px] border-2 border-[#C143BC] bg-[#C143BC] px-4 py-3 font-mono text-xs sm:text-sm font-bold text-[#0E0E1A] shadow-[0_0_20px_rgba(193,67,188,0.35)] transition-all hover:bg-[#D970D7]"
                      >
                        <span>{isActivity ? t.cta_select_in_form : t.cta_register}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      {/* Cinta inferior */}
      <div className="relative z-10 overflow-hidden border-t border-[#2C2550] bg-[#0E0E1A]" aria-hidden="true">
        <div className="flex w-max items-center" style={{ animation: "marquee 34s linear infinite" }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "dot-matrix whitespace-nowrap px-6 py-2.5 text-base leading-none sm:text-lg",
                i % 2 === 1 ? "bg-[#2C2550] text-[#E6E4DA]" : "text-[#73726C]",
              )}
            >
              {EVENT.city} · {EVENT.year} · {t.catalog_title}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
