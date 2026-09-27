"use client";

import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { Users, Globe } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { HardButton } from "@/components/ui/hard-button";
import { communities } from "@/data/communities";
import { localePath } from "@/lib/utils";
import type { Community } from "@/types";

function IconLinkedin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconMeetup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.34 8.78c-.02-.15-.05-.3-.09-.45a4.2 4.2 0 0 0-.8-1.5 4.3 4.3 0 0 0-1.42-1.07 4.7 4.7 0 0 0-1.95-.44c-.7 0-1.37.16-1.98.47a5.2 5.2 0 0 0-1.54 1.34 5.3 5.3 0 0 0-1.55-1.34 4.7 4.7 0 0 0-1.98-.47 4.7 4.7 0 0 0-1.95.44 4.3 4.3 0 0 0-1.42 1.07 4.2 4.2 0 0 0-.8 1.5c-.04.15-.07.3-.09.45a5.5 5.5 0 0 0 0 1.54c.06.33.16.65.3.95.14.3.32.58.54.83l5.05 5.73a1.27 1.27 0 0 0 1.9 0l5.05-5.73c.22-.25.4-.53.54-.83.14-.3.24-.62.3-.95a5.5 5.5 0 0 0 0-1.54z" />
    </svg>
  );
}

export function CommunityCard({ comm }: { comm: Community }) {
  return (
    <div className="group flex w-full max-w-[260px] flex-col justify-between overflow-hidden rounded-[16px] border border-[#2C2550] bg-[#1E1838] transition-all duration-300 hover:-translate-y-1 hover:border-[#C143BC]/70 hover:shadow-[0_0_25px_rgba(193,67,188,0.25)]">
      <div>
        {/* Logo / visual de la comunidad */}
        <div className="relative aspect-square w-full overflow-hidden border-b border-[#2C2550] bg-[#0E0E1A] p-6 flex items-center justify-center">
          {comm.logo ? (
            <Image
              src={comm.logo}
              alt={comm.name}
              fill
              sizes="(max-width: 640px) 90vw, 260px"
              className="object-contain p-6 grayscale transition-all duration-500 group-hover:scale-[1.06] group-hover:grayscale-0"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Users className="h-16 w-16 text-[#8B84A0] transition-colors group-hover:text-[#F2A6F0]" />
            </div>
          )}
          {comm.badge && (
            <span className="absolute right-2 top-2 rounded-[4px] bg-[#C143BC] px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-[#0E0E1A]">
              {comm.badge}
            </span>
          )}
        </div>

        {/* Datos de la comunidad */}
        <div className="px-4 py-3.5">
          <p className="m-0 font-display text-base font-bold leading-tight text-[#E6E4DA] transition-colors group-hover:text-[#FFFFFF]">
            {comm.name}
          </p>
          <p className="mt-1 font-mono text-xs leading-snug text-[#C143BC]">
            {comm.category}
          </p>
          {comm.description && (
            <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-[#B4B2A9]">
              {comm.description}
            </p>
          )}
        </div>
      </div>

      {/* Redes y enlaces */}
      <div className="border-t border-[#2C2550]/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          {comm.url && (
            <a
              href={comm.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8B84A0] transition-colors hover:text-[#C143BC]"
              aria-label={`Sitio web de ${comm.name}`}
            >
              <Globe className="h-4 w-4" />
            </a>
          )}
          {comm.social?.meetup && (
            <a
              href={comm.social.meetup}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8B84A0] transition-colors hover:text-[#C143BC]"
              aria-label={`Meetup de ${comm.name}`}
            >
              <IconMeetup className="h-4 w-4" />
            </a>
          )}
          {comm.social?.linkedin && (
            <a
              href={comm.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8B84A0] transition-colors hover:text-[#C143BC]"
              aria-label={`LinkedIn de ${comm.name}`}
            >
              <IconLinkedin className="h-4 w-4" />
            </a>
          )}
          {comm.social?.instagram && (
            <a
              href={comm.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8B84A0] transition-colors hover:text-[#C143BC]"
              aria-label={`Instagram de ${comm.name}`}
            >
              <IconInstagram className="h-4 w-4" />
            </a>
          )}
          {comm.social?.github && (
            <a
              href={comm.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8B84A0] transition-colors hover:text-[#C143BC]"
              aria-label={`GitHub de ${comm.name}`}
            >
              <IconGithub className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyCommunityCard({
  badge,
  title,
  category,
  desc,
}: {
  badge: string;
  title: string;
  category: string;
  desc: string;
}) {
  return (
    <div className="group flex w-full max-w-[260px] flex-col justify-between overflow-hidden rounded-[16px] border border-dashed border-[#2C2550] bg-[#1E1838]/40 transition-all duration-300 hover:border-[#C143BC]/60 hover:bg-[#1E1838]/70">
      <div>
        {/* Placeholder visual */}
        <div className="relative aspect-square w-full overflow-hidden border-b border-dashed border-[#2C2550] bg-[#0E0E1A]/60 p-6 flex flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-[#2C2550] bg-[#120E22] transition-colors group-hover:border-[#C143BC]/40">
            <Users className="h-8 w-8 text-[#5D5677] transition-colors group-hover:text-[#F2A6F0]" />
          </div>
          <span className="absolute right-2 top-2 rounded-[4px] border border-[#C143BC]/40 bg-[#C143BC]/10 px-2 py-0.5 font-mono text-[10px] font-bold leading-none text-[#F2A6F0]">
            {badge}
          </span>
        </div>

        {/* Datos del placeholder */}
        <div className="px-4 py-4 text-center">
          <p className="m-0 font-display text-base font-bold leading-tight text-[#8B84A0] transition-colors group-hover:text-[#E6E4DA]">
            {title}
          </p>
          <p className="mt-1 font-mono text-xs leading-snug text-[#C143BC]/80">
            {category}
          </p>
          <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-[#73726C]">
            {desc}
          </p>
        </div>
      </div>

      {/* Pie del placeholder */}
      <div className="border-t border-dashed border-[#2C2550]/60 px-4 py-3 text-center">
        <span className="font-mono text-[10px] tracking-widest text-[#5D5677]">
          -- · --
        </span>
      </div>
    </div>
  );
}

export function Communities() {
  const t = useTranslations("Communities");
  const locale = useLocale();

  return (
    <section id="communities" className="py-24 px-6 border-t border-[#2C2550]/40">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-5 flex items-center justify-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2C2550] bg-[#1E1838] px-4 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
              <Users className="h-4 w-4 text-[#C143BC]" />
              <span className="font-mono text-xs font-semibold text-[#E6E4DA]">
                AWS Community <span className="text-[#C143BC]">Ecosystem</span>
              </span>
            </div>
          </div>
          <SectionHeading title={t("heading")} subtitle={t("subheading")} />
        </ScrollReveal>

        <ScrollReveal delay={0.1} from="scale">
          <div className="flex flex-wrap justify-center gap-4">
            {communities.length > 0 ? (
              communities.map((comm) => (
                <CommunityCard key={comm.id} comm={comm} />
              ))
            ) : (
              [0, 1, 2, 3].map((idx) => (
                <EmptyCommunityCard
                  key={idx}
                  badge={t("empty_badge")}
                  title={t("empty_title")}
                  category={t("empty_category")}
                  desc={t("empty_desc")}
                />
              ))
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="mt-14 flex justify-center">
            <HardButton
              href={localePath(locale, "/comunidades")}
              tone="ink"
              sub={t("cta_sub")}
            >
              {t("cta")}
            </HardButton>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
