import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { SpeakerProfile } from "@/models/speaker-profile";
import { AgendaEvent } from "@/models/agenda-event";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Link from "next/link";
import { Code2, Globe, ArrowLeft, Clock, MapPin } from "lucide-react";
import { ShareButton } from "@/components/ui/share-modal";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const TRACK_COLORS: Record<string, string> = {
  cloud: "text-[#C143BC] border-[#C143BC]/30 bg-[#C143BC]/10",
  devops: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  "ai-ml": "text-purple-400 border-purple-400/30 bg-purple-400/10",
  security: "text-red-400 border-red-400/30 bg-red-400/10",
  "soft-skills": "text-green-400 border-green-400/30 bg-green-400/10",
  general: "text-[#C143BC] border-[#C143BC]/30 bg-[#C143BC]/10",
};

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function XTwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.634zM17.083 20.25h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function SpeakerCard({
  photo, name, tagline, bio, social, initials,
}: {
  photo?: string; name: string; tagline?: string; bio?: string;
  social?: { linkedin?: string; twitter?: string; instagram?: string; github?: string; website?: string };
  initials: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 lg:items-start">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={name} className="h-56 w-56 rounded-2xl border-2 border-[#C143BC]/40 object-cover lg:h-60 lg:w-60" />
      ) : (
        <div className="flex h-56 w-56 items-center justify-center rounded-2xl border-2 border-[#C143BC]/40 bg-[#1E1838] lg:h-60 lg:w-60">
          <span className="font-mono text-5xl font-bold text-[#C143BC]">{initials}</span>
        </div>
      )}
      <div className="text-center lg:text-left">
        <p className="font-display text-xl font-bold text-[#E6E4DA]">{name}</p>
        {tagline && <p className="mt-0.5 font-mono text-sm text-[#E6E4DA]/60">{tagline}</p>}
      </div>
      {bio && <p className="font-mono text-sm leading-relaxed text-[#E6E4DA]/70 text-center lg:text-left">{bio}</p>}
      {(social?.linkedin || social?.twitter || social?.instagram || social?.github || social?.website) && (
        <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
          {social.linkedin && (
            <a href={toAbsoluteUrl(social.linkedin)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-[#2C2550] bg-[#1E1838] px-3 py-1.5 font-mono text-xs text-[#E6E4DA]/70 transition-colors hover:border-[#C143BC]/50 hover:text-[#C143BC]">
              <LinkedInIcon className="h-3.5 w-3.5" /> LinkedIn
            </a>
          )}
          {social.twitter && (
            <a href={toAbsoluteUrl(social.twitter)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-[#2C2550] bg-[#1E1838] px-3 py-1.5 font-mono text-xs text-[#E6E4DA]/70 transition-colors hover:border-[#C143BC]/50 hover:text-[#C143BC]">
              <XTwitterIcon className="h-3.5 w-3.5" /> X / Twitter
            </a>
          )}
          {social.instagram && (
            <a href={toAbsoluteUrl(social.instagram)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-[#2C2550] bg-[#1E1838] px-3 py-1.5 font-mono text-xs text-[#E6E4DA]/70 transition-colors hover:border-[#C143BC]/50 hover:text-[#C143BC]">
              <InstagramIcon className="h-3.5 w-3.5" /> Instagram
            </a>
          )}
          {social.github && (
            <a href={toAbsoluteUrl(social.github)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-[#2C2550] bg-[#1E1838] px-3 py-1.5 font-mono text-xs text-[#E6E4DA]/70 transition-colors hover:border-[#C143BC]/50 hover:text-[#C143BC]">
              <Code2 className="h-3.5 w-3.5" /> GitHub
            </a>
          )}
          {social.website && (
            <a href={toAbsoluteUrl(social.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-[#2C2550] bg-[#1E1838] px-3 py-1.5 font-mono text-xs text-[#E6E4DA]/70 transition-colors hover:border-[#C143BC]/50 hover:text-[#C143BC]">
              <Globe className="h-3.5 w-3.5" /> Web
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale, slug: "_placeholder" }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const profile = await SpeakerProfile.findOne({ slug, isPublic: true }).lean();
  if (!profile) return {};
  return {
    title: `${profile.name} — AWS Student Community Day`,
    description: profile.bio || profile.talkTitle,
    openGraph: {
      title: profile.name,
      description: profile.bio || profile.talkTitle,
      images: [`/api/og/speaker/${slug}`],
    },
    twitter: {
      card: "summary_large_image",
      title: profile.name,
      images: [`/api/og/speaker/${slug}`],
    },
  };
}

function toAbsoluteUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function formatSessionTime(iso: string | Date) {
  try {
    return new Date(iso).toLocaleTimeString("es-MX", {
      timeZone: "America/Mexico_City",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch { return ""; }
}

export default async function SpeakerProfilePage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  await connectDB();
  const profile = await SpeakerProfile.findOne({ slug, isPublic: true }).lean();
  if (!profile) notFound();

  let sessionEndTime: string | null = null;
  let sessionRoom: string | null = null;
  if (profile.sessionId) {
    const agendaEvent = await AgendaEvent.findById(profile.sessionId).select("endTime room").lean();
    sessionEndTime = agendaEvent?.endTime ?? null;
    sessionRoom = agendaEvent?.room ?? null;
  }

  const trackColor = TRACK_COLORS[profile.track] ?? TRACK_COLORS.general;
  const mainInitials = profile.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  const hasCoSpeakers = Array.isArray(profile.coSpeakers) && profile.coSpeakers.length > 0;
  const appUrl = SITE_URL;
  const profileUrl = `${appUrl}/speakers/${slug}`;
  const cardUrl = `${appUrl}/api/og/speaker/${slug}`;

  return (
    <main className="min-h-screen bg-[#0E0E1A] px-6 py-24">
      <div className="mx-auto max-w-5xl">
        {/* Back */}
        <Link
          href={locale === "en" ? "/en/directorio" : "/directorio"}
          className="mb-8 inline-flex items-center gap-2 font-mono text-sm text-[#E6E4DA]/60 transition-colors hover:text-[#E6E4DA]"
        >
          <ArrowLeft className="h-4 w-4" />
          Directorio de speakers
        </Link>

        <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
          {/* Left column — speaker(s) */}
          <aside className="flex flex-col gap-8">
            {/* Main speaker */}
            <SpeakerCard
              photo={profile.photo}
              name={profile.name}
              tagline={profile.tagline || profile.role}
              bio={profile.bio}
              social={profile.social}
              initials={mainInitials}
            />

            {/* Track badge */}
            <span className={`inline-flex self-center rounded-[4px] border px-3 py-1 font-mono text-xs font-semibold lg:self-start ${trackColor}`}>
              {profile.track.replace(/-/g, " ").toUpperCase()}
            </span>

            {/* Co-speakers */}
            {hasCoSpeakers && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#2C2550]" />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#E6E4DA]/60">
                    {profile.coSpeakers.length === 1 ? "Co-speaker" : "Co-speakers"}
                  </span>
                  <div className="h-px flex-1 bg-[#2C2550]" />
                </div>
                {profile.coSpeakers.map((cs, i) => {
                  const csInitials = `${cs.firstName} ${cs.lastName}`.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
                  return (
                    <SpeakerCard
                      key={i}
                      photo={cs.photo}
                      name={`${cs.firstName} ${cs.lastName}`}
                      bio={cs.bio}
                      social={cs.social}
                      initials={csInitials}
                    />
                  );
                })}
              </div>
            )}

            {/* Share card */}
            <ShareButton
              name={profile.name}
              talkTitle={profile.talkTitle}
              profileUrl={profileUrl}
              cardUrl={cardUrl}
              slug={slug}
            />
          </aside>

          {/* Right column */}
          <article className="flex flex-col gap-8">
            {/* Talk */}
            <section className="rounded-2xl border border-[#2C2550] bg-[#1E1838] p-6">
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#E6E4DA]/60">Charla</p>
              <h2 className="font-display text-2xl font-bold text-[#E6E4DA] leading-snug">
                {profile.talkTitle || "Próximamente"}
              </h2>
              {(profile.scheduledAt || sessionRoom) && (
                <div className="mt-3 flex flex-wrap gap-4">
                  {profile.scheduledAt && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-[#C143BC]">
                      <Clock className="h-4 w-4 shrink-0" />
                      {formatSessionTime(profile.scheduledAt)}
                      {sessionEndTime && <> – {sessionEndTime}</>}
                    </span>
                  )}
                  {sessionRoom && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-[#C143BC]">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {sessionRoom}
                    </span>
                  )}
                </div>
              )}
              {profile.talkAbstract && (
                <p className="mt-4 font-mono text-sm leading-relaxed text-[#E6E4DA]/70">
                  {profile.talkAbstract}
                </p>
              )}
            </section>

            {/* Card preview */}
            <section>
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#E6E4DA]/60">Tarjeta del evento</p>
              <div className="overflow-hidden rounded-2xl border border-[#2C2550]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cardUrl}
                  alt={`Tarjeta de ${profile.name}`}
                  className="w-full"
                />
              </div>
              <p className="mt-2 font-mono text-xs text-[#E6E4DA]/60">
                Haz click en &quot;Compartir tarjeta&quot; para obtener el texto listo para cada red social
              </p>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}
