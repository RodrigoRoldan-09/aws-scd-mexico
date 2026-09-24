"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "motion/react";
import { ShareButton } from "@/components/ui/share-modal";
import { PublicProfile, TRACK_COLORS, TRACK_LABEL } from "@/components/sections/speakers";
import { type Keynote } from "@/data/keynotes";
import { localePath, basePath } from "@/lib/utils";
import {
  MapPin, Globe, Mic2, Monitor, ArrowRight, ChevronDown, ChevronUp,
  Clock, ExternalLink, CalendarClock,
} from "lucide-react";
import {
  SESSION_LABEL, AG_SESSION_LABEL, LANG_LABEL, LEVEL_COLORS,
  type AgendaEventItem,
} from "./_shared";

// Componente de filtros
export function FilterSection({
  title, options, active, counts, onToggle,
}: {
  title: string;
  options: { value: string; label: string; color?: string }[];
  active: Set<string>;
  counts: Record<string, number>;
  onToggle: (v: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-glass-border pb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-2 font-mono text-xs font-semibold uppercase tracking-widest text-surface-400 hover:text-surface-200"
      >
        {title}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-1.5">
          {options.map(({ value, label, color }) => {
            const isActive = active.has(value);
            const count = counts[value] ?? 0;
            if (!count && !isActive) return null;
            return (
              <button
                key={value}
                onClick={() => onToggle(value)}
                className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-left transition-all ${
                  isActive
                    ? (color ?? "bg-[#C143BC]/10 border border-[#C143BC]/40 text-[#C143BC]")
                    : "hover:bg-[#1E1838]/60 text-surface-400 hover:text-surface-200"
                }`}
              >
                <span className="font-mono text-xs">{label}</span>
                <span className={`rounded-none px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                  isActive ? "bg-[#0E0E1A]/60 text-current" : "bg-[#1E1838] text-surface-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Tarjeta de keynote
export function KeynoteDirectoryCard({ kn }: { kn: Keynote }) {
  const locale = useLocale();
  const router = useRouter();
  const initials = `${kn.firstName[0] ?? ""}${kn.lastName[0] ?? ""}`.toUpperCase();
  const profileHref = kn.profileSlug ? localePath(locale, `/speakers/${kn.profileSlug}`) : null;

  return (
    <motion.article
      className={`group relative grid grid-cols-[0.85fr_1.15fr] overflow-hidden rounded-[16px] border border-[#2C2550] bg-[#1E1838] isolate transition-all duration-300 ${profileHref ? "hover:border-[#C143BC]/60 hover:shadow-[0_0_25px_rgba(193,67,188,0.15)] cursor-pointer" : ""}`}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={() => profileHref && router.push(profileHref)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_0%_0%,rgba(193,67,188,0.08),transparent_45%)] pointer-events-none z-0" />

      <div className="relative min-h-[220px] overflow-hidden bg-[#0E0E1A]">
        {kn.photo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${basePath}${kn.photo}`}
              alt={`${kn.firstName} ${kn.lastName}`}
              className="h-full w-full object-cover object-[50%_18%] transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0" style={{
              background: "linear-gradient(105deg, transparent 48%, #1E1838 98%), linear-gradient(0deg, rgba(0,0,0,0.35), transparent 40%)",
            }} />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2C2550] to-[#0E0E1A]">
            <span className="font-display font-bold text-[#8B84A0] select-none text-5xl">{initials}</span>
          </div>
        )}

        {kn.aws && (
          <div className="absolute top-3 left-3 z-[2] pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${basePath}/images/logos/aws-logo.svg`} alt="AWS" className="h-4 w-auto opacity-90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
          </div>
        )}
      </div>

      <div className="relative z-[2] flex flex-col justify-center gap-4 p-6">
        <span className="self-start font-mono font-bold tracking-[0.28em] uppercase text-[#C143BC] bg-[#C143BC]/10 border border-[#C143BC] rounded-[4px] text-[10px] px-2.5 py-0.5">
          Keynote
        </span>

        <div>
          <h3
            className="font-display font-bold leading-none tracking-tight text-[#E6E4DA] m-0"
            style={{ fontSize: "clamp(18px,2.2vw,26px)" }}
          >
            {kn.firstName}<br />{kn.lastName}
          </h3>
          {(kn.role || kn.company) && (
            <p className="text-sm font-mono text-surface-400 m-0 mt-2 flex flex-wrap items-center gap-1.5">
              {kn.role && <span>{kn.role}</span>}
              {kn.role && kn.company && <span className="text-[#C143BC]">·</span>}
              {kn.company && <span>{kn.company}</span>}
            </p>
          )}
        </div>

        {kn.talkType && (
          <div className="border-t border-[#2C2550] pt-3 flex flex-col gap-1">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#8B84A0]">{kn.talkType}</span>
            {kn.talkTitle && (
              <span className="font-mono italic text-surface-200 text-sm line-clamp-2">{kn.talkTitle}</span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
          {kn.linkedin && (
            <a
              href={kn.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 font-mono text-xs text-surface-400 hover:text-[#C143BC] transition-colors"
            >
              LinkedIn <ArrowRight className="h-3 w-3" />
            </a>
          )}
          {profileHref && (
            <Link
              href={profileHref}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 font-mono font-semibold text-xs text-[#C143BC] border border-[#C143BC]/40 bg-[#C143BC]/10 rounded-[6px] px-3 py-1 transition-all hover:bg-[#C143BC] hover:text-[#0E0E1A]"
            >
              Ver perfil <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}

// Badge "en vivo"
export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-none border border-yellow-400/50 bg-yellow-400/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-yellow-300">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-yellow-400" />
      </span>
      En vivo
    </span>
  );
}

// Tarjeta de speaker
export function DirectoryCard({ profile, locale, appUrl, isLive }: { profile: PublicProfile; locale: string; appUrl: string; isLive?: boolean }) {
  const initials = profile.name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
  const trackColor = TRACK_COLORS[profile.track] ?? TRACK_COLORS.general;
  const profileUrl = `${appUrl}/speakers/${profile.slug}`;
  const cardUrl = `${appUrl}/api/og/speaker/${profile.slug}`;

  return (
    <motion.div
      className={`group relative overflow-hidden rounded-[16px] border bg-[#1E1838] transition-all duration-300 ${
        isLive
          ? "border-yellow-400/60 shadow-[0_0_30px_rgba(250,204,21,0.18)] ring-1 ring-yellow-400/40"
          : "border-[#2C2550] hover:border-[#C143BC]/60 hover:shadow-[0_0_25px_rgba(193,67,188,0.15)]"
      }`}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {isLive && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />}
      <div className="flex flex-col sm:flex-row">
        {/* Photo */}
        <Link href={localePath(locale, `/speakers/${profile.slug}`)}>
          <div
            className="relative w-full shrink-0 overflow-hidden bg-[#0E0E1A] sm:w-36 md:w-44 lg:w-48"
            style={{ aspectRatio: "3/4" }}
          >
            {profile.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo}
                alt={profile.name}
                className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2C2550] to-[#0E0E1A]">
                <span className="font-display text-3xl font-bold text-[#C143BC]/50">{initials}</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#1E1838]/90 to-transparent" />
            {profile.companyLogo && (
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-start">
                <div className="rounded-[6px] border border-[#2C2550] bg-[#0E0E1A]/80 px-2 py-1 backdrop-blur-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.companyLogo}
                    alt="Company"
                    className="h-4 w-auto max-w-[72px] object-contain opacity-80"
                  />
                </div>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#1E1838] to-transparent sm:hidden" />
          </div>
        </Link>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={localePath(locale, `/speakers/${profile.slug}`)}>
                <h3 className="font-display text-base font-bold text-[#E6E4DA] leading-tight hover:text-[#C143BC] transition-colors line-clamp-1">
                  {profile.name}
                </h3>
              </Link>
              <p className="mt-0.5 font-mono text-sm font-semibold text-[#C143BC] truncate">
                {profile.tagline || profile.role}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {isLive && <LiveBadge />}
              {profile.track && (
                <span className={`rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-bold ${trackColor}`}>
                  {TRACK_LABEL[profile.track] ?? profile.track}
                </span>
              )}
              {profile.sessionType && SESSION_LABEL[profile.sessionType] && (
                <span className="flex items-center gap-1 rounded-[4px] border border-[#2C2550] bg-[#0E0E1A] px-2 py-0.5 font-mono text-[10px] text-surface-300">
                  {profile.sessionType === "online" ? <Monitor className="h-2.5 w-2.5" /> : <Mic2 className="h-2.5 w-2.5" />}
                  {SESSION_LABEL[profile.sessionType]}
                </span>
              )}
              {profile.audienceLevel && (
                <span className={`rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-semibold ${LEVEL_COLORS[profile.audienceLevel] ?? "border-[#2C2550] text-surface-400"}`}>
                  {profile.audienceLevel}
                </span>
              )}
            </div>
          </div>

          {profile.talkTitle && (
            <p className="font-mono text-base font-semibold text-[#E6E4DA] line-clamp-2 leading-snug">
              {profile.talkTitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-[#8B84A0]">
            {profile.countryCity && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" /> {profile.countryCity}
              </span>
            )}
            {profile.language && LANG_LABEL[profile.language] && (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3 shrink-0" /> {LANG_LABEL[profile.language]}
              </span>
            )}
          </div>

          {profile.room && (
            <div className={`flex items-center gap-2 rounded-[6px] border px-3 py-2 ${isLive ? "border-yellow-400/30 bg-yellow-400/5" : "border-[#C143BC]/30 bg-[#C143BC]/5"}`}>
              <MapPin className={`h-3.5 w-3.5 shrink-0 ${isLive ? "text-yellow-300" : "text-[#C143BC]"}`} />
              <span className={`font-mono text-sm font-bold ${isLive ? "text-yellow-300" : "text-[#C143BC]"}`}>{profile.room}</span>
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 border-t border-[#2C2550]">
            <ShareButton
              name={profile.name}
              talkTitle={profile.talkTitle}
              profileUrl={profileUrl}
              cardUrl={cardUrl}
              slug={profile.slug}
            />
            <Link
              href={localePath(locale, `/speakers/${profile.slug}`)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-[6px] border border-[#2C2550] bg-[#0E0E1A] px-3 py-1.5 font-mono text-xs font-semibold text-surface-300 transition-colors hover:border-[#C143BC]/40 hover:text-[#C143BC]"
            >
              Ver perfil <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Tarjeta de actividad (eventos sin speaker)
export function AgendaSessionCard({ event, startLabel, endLabel, isLive }: { event: AgendaEventItem; startLabel: string; endLabel: string; isLive?: boolean }) {
  const trackColor = TRACK_COLORS[event.track] ?? TRACK_COLORS.general;
  const sessionLabel = event.sessionType ? AG_SESSION_LABEL[event.sessionType] : undefined;
  return (
    <motion.div
      className={`group relative overflow-hidden rounded-[16px] border bg-[#1E1838] transition-all duration-300 ${
        isLive
          ? "border-yellow-400/60 shadow-[0_0_30px_rgba(250,204,21,0.18)] ring-1 ring-yellow-400/40"
          : "border-[#2C2550] hover:border-[#C143BC]/60 hover:shadow-[0_0_25px_rgba(193,67,188,0.15)]"
      }`}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {isLive && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />}
      <div className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#2C2550] bg-[#0E0E1A] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-surface-300">
              <CalendarClock className="h-3 w-3 text-[#C143BC]" /> Actividad
            </span>
            {event.track && (
              <span className={`rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-bold ${trackColor}`}>
                {TRACK_LABEL[event.track] ?? event.track}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {isLive && <LiveBadge />}
            {sessionLabel && (
              <span className="flex items-center gap-1 rounded-[4px] border border-[#2C2550] bg-[#0E0E1A] px-2 py-0.5 font-mono text-[10px] text-surface-300">
                {event.sessionType === "online" ? <Monitor className="h-2.5 w-2.5" /> : <Mic2 className="h-2.5 w-2.5" />}
                {sessionLabel}
              </span>
            )}
          </div>
        </div>

        <h3 className="font-display text-base font-bold text-[#E6E4DA] leading-snug">{event.title}</h3>
        {event.speaker && <p className="-mt-1 font-mono text-sm text-[#C143BC]">{event.speaker}</p>}

        {event.description && (
          <p className="font-mono text-xs leading-relaxed text-surface-400 line-clamp-2">{event.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 font-mono text-[12px] text-surface-400">
          <span className="flex items-center gap-1.5">
            <Clock className={`h-3.5 w-3.5 ${isLive ? "text-yellow-300" : "text-[#C143BC]"}`} />
            {startLabel} – {endLabel}
          </span>
          {event.room && (
            <span className="flex items-center gap-1.5">
              <MapPin className={`h-3.5 w-3.5 ${isLive ? "text-yellow-300" : "text-[#C143BC]"}`} /> {event.room}
            </span>
          )}
        </div>

        {event.cta && (
          <a
            href={event.cta}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-[6px] border border-[#C143BC]/40 bg-[#C143BC]/10 px-3 py-1.5 font-mono text-xs font-semibold text-[#C143BC] transition-colors hover:bg-[#C143BC] hover:text-[#0E0E1A]"
          >
            Más información <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}
