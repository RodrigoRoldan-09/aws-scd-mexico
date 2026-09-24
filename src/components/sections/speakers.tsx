"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { SectionHeading } from "@/components/ui/section-heading";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { localePath } from "@/lib/utils";
import { ArrowRight, Mic2, Users, Globe } from "lucide-react";
import { useEventConfig } from "@/components/providers/event-config-provider";

export interface CoSpeaker {
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
  tagline?: string;
  company?: string;
  companyLogo?: string;
  bio?: string;
  photo?: string;
  countryCity?: string;
  social?: { linkedin?: string; twitter?: string; instagram?: string; github?: string; website?: string; facebook?: string; blog?: string };
}

export interface PublicProfile {
  _id: string;
  name: string;
  role: string;
  tagline?: string;
  photo: string;
  companyLogo?: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    github?: string;
    website?: string;
    blog?: string;
    facebook?: string;
  };
  track: string;
  slug: string;
  sessionType?: string;
  countryCity?: string;
  talkTitle?: string;
  language?: string;
  audienceLevel?: string;
  room?: string | null;
  scheduledAt?: string | null;
  coSpeakers?: CoSpeaker[];
}

export const TRACK_COLORS: Record<string, string> = {
  cloud:         "text-[#C143BC] border-[#C143BC]/40 bg-[#C143BC]/10",
  devops:        "text-sky-400 border-sky-400/40 bg-sky-400/10",
  "ai-ml":       "text-purple-400 border-purple-400/40 bg-purple-400/10",
  security:      "text-red-400 border-red-400/40 bg-red-400/10",
  data:          "text-cyan-400 border-cyan-400/40 bg-cyan-400/10",
  serverless:    "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  "soft-skills": "text-green-400 border-green-400/40 bg-green-400/10",
  general:       "text-rose-400 border-rose-400/40 bg-rose-400/10",
};

export const TRACK_LABEL: Record<string, string> = {
  cloud: "Cloud", devops: "DevOps", "ai-ml": "AI/ML",
  security: "Security", data: "Data", serverless: "Serverless",
  "soft-skills": "Soft Skills", general: "General",
};

// ── Social icon SVGs ──────────────────────────────────────────────────────────

function IconLinkedin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconTwitterX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconGithub({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const btnClass =
  "flex h-8 w-8 items-center justify-center rounded-full border border-[#2C2550] bg-[#1E1838] text-surface-400 transition-all hover:border-[#C143BC]/40 hover:text-[#C143BC] hover:shadow-[0_0_12px_rgba(193,67,188,0.25)]";

// ── Speaker card — organizer style ───────────────────────────────────────────

export function SpeakerCard({ profile, locale }: { profile: PublicProfile; locale: string }) {
  const href = localePath(locale, `/speakers/${profile.slug}`);
  const initials = profile.name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();

  return (
    <motion.div
      className="group relative flex h-full w-full flex-col"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Glow */}
      <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-b from-[#C143BC]/15 via-[#613BB8]/10 to-transparent opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />

      {/* Card — flex-col so info section fills remaining height */}
      <div className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[#2C2550] bg-[#1E1838] transition-all duration-300 group-hover:border-[#C143BC]/60 group-hover:shadow-[0_0_30px_rgba(193,67,188,0.18)]">

        {/* Photo — fixed by aspect ratio, never grows */}
        <Link href={href} className="mx-6 mt-6 block shrink-0">
          <div className="relative aspect-square overflow-hidden rounded-full border border-[#2C2550]">
            {profile.photo ? (
              <Image
                src={profile.photo}
                alt={profile.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2C2550] to-[#0E0E1A]">
                <span className="font-display text-4xl font-bold text-[#C143BC]/50">{initials}</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1E1838] to-transparent" />
          </div>
        </Link>

        {/* Info — grows to fill card height, pins social to bottom */}
        <div className="relative flex flex-1 flex-col px-5 pb-5 pt-3 text-center">
          {/* Name + tagline */}
          <Link href={href} className="block shrink-0">
            <h3 className="font-display text-base font-bold leading-tight text-[#E6E4DA] md:text-lg">{profile.name}</h3>
            <p className="mt-1 font-mono text-xs font-semibold text-[#C143BC] line-clamp-2 leading-snug md:text-sm">
              {profile.tagline || profile.role}
            </p>
          </Link>

          {/* Company logo OR track badge — always same height */}
          <Link href={href} className="mt-3 flex shrink-0 min-h-[56px] items-center justify-center">
            {profile.companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.companyLogo}
                alt="Company"
                className="max-h-[48px] w-auto max-w-[140px] object-contain opacity-60 transition-opacity duration-300 group-hover:opacity-100"
              />
            ) : profile.track ? (
              <span className={`inline-flex rounded-[4px] border px-3 py-1 font-mono text-xs font-semibold ${TRACK_COLORS[profile.track] ?? TRACK_COLORS.general}`}>
                {TRACK_LABEL[profile.track] ?? profile.track}
              </span>
            ) : (
              <div className="h-8 w-20 rounded-[4px] border border-[#2C2550] bg-[#0E0E1A]" />
            )}
          </Link>

          {/* Social links — pinned to bottom, always same height */}
          <div className="mt-auto flex min-h-[32px] justify-center gap-2 pt-3">
            {profile.social?.linkedin && (
              <a href={profile.social.linkedin} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="LinkedIn">
                <IconLinkedin className="h-3.5 w-3.5" />
              </a>
            )}
            {profile.social?.twitter && (
              <a href={profile.social.twitter} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="Twitter / X">
                <IconTwitterX className="h-3.5 w-3.5" />
              </a>
            )}
            {profile.social?.github && (
              <a href={profile.social.github} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="GitHub">
                <IconGithub className="h-3.5 w-3.5" />
              </a>
            )}
            {profile.social?.website && (
              <a href={profile.social.website} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="Sitio web">
                <Globe className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Synthesize a PublicProfile from a co-speaker + its primary session data ──

export function coSpeakerAsProfile(co: CoSpeaker, primary: PublicProfile): PublicProfile {
  return {
    _id: `${primary._id}-co-${co.firstName}`,
    name: `${co.firstName} ${co.lastName}`.trim(),
    role: co.role ?? "",
    tagline: co.tagline ?? "",
    photo: co.photo ?? "",
    companyLogo: co.companyLogo ?? "",
    social: co.social ?? {},
    track: primary.track,
    slug: primary.slug,
    sessionType: primary.sessionType,
    countryCity: co.countryCity ?? "",
    talkTitle: primary.talkTitle,
    language: primary.language,
    audienceLevel: primary.audienceLevel,
    room: primary.room,
    scheduledAt: primary.scheduledAt,
    coSpeakers: [],
  };
}

// ── Home section ──────────────────────────────────────────────────────────────

export function SpeakersView({ profiles }: { profiles: PublicProfile[] }) {
  const t = useTranslations("Speakers");
  const locale = useLocale();
  const { showSpeakerCta } = useEventConfig();

  return (
    <section id="speakers" className="py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <SectionHeading title={t("heading")} subtitle={t("subheading")} />
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <div className="mt-6 flex justify-center">
            <Link
              href={localePath(locale, "/directorio")}
              className="inline-flex items-center gap-2 rounded-[6px] border border-[#C143BC]/40 bg-[#C143BC]/10 px-6 py-3 font-mono text-sm font-semibold text-[#C143BC] transition-all hover:bg-[#C143BC] hover:text-[#0E0E1A]"
            >
              <Users className="h-4 w-4" />
              Ir al directorio de Speakers
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>

        {profiles.length === 0 && (
          <ScrollReveal>
            <div className="py-16 text-center">
              <p className="font-mono text-xl text-surface-300">{t("coming_soon")}</p>
              <p className="mt-2 font-mono text-sm text-surface-500">{t("coming_soon_desc")}</p>
            </div>
          </ScrollReveal>
        )}

        {/* Speakers grid — primaries + co-speakers all at same size */}
        {profiles.length > 0 && (
          <ScrollReveal>
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {profiles.flatMap((p) => [
                p,
                ...(p.coSpeakers ?? []).map((co) => coSpeakerAsProfile(co, p)),
              ]).map((profile, i) => (
                <motion.div key={profile._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <SpeakerCard profile={profile} locale={locale} />
                </motion.div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {(
          <ScrollReveal delay={0.1}>
            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href={localePath(locale, "/directorio")}
                className="inline-flex items-center gap-2 rounded-[6px] bg-[#613BB8] px-8 py-3.5 font-mono text-sm font-bold text-[#E6E4DA] transition-all hover:bg-[#422B78] hover:shadow-[0_0_20px_rgba(97,59,184,0.4)] active:scale-[0.98]"
              >
                <Users className="h-4 w-4" />
                {profiles.length > 0 ? `Ver los ${profiles.length} speakers` : "Ver directorio completo"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {showSpeakerCta && (
                <Link
                  href={localePath(locale, "/speakers")}
                  className="inline-flex items-center gap-2 rounded-[6px] border border-[#C143BC]/40 bg-[#C143BC]/10 px-6 py-3 font-mono text-sm font-semibold text-[#C143BC] transition-all hover:bg-[#C143BC] hover:text-[#0E0E1A]"
                >
                  <Mic2 className="h-4 w-4" /> {t("apply_speaker")}
                </Link>
              )}
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
