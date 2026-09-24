"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { avatarUrl } from "@/lib/avatar";
import { organizers } from "@/data/organizers";
import type { Organizer } from "@/types";

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

function IconCloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
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

/**
 * Tarjeta de persona: rectángulo duro con borde en el acento, foto en blanco y
 * negro que recupera el color al pasar el cursor, y nombre / rol en mono.
 */
export function OrganizerCard({ org }: { org: Organizer; accent?: "orange" | "purple" }) {
  return (
    <div className="group w-full max-w-[260px] border border-[#2C2550] bg-[#1E1838] rounded-[16px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#C143BC]/70 hover:shadow-[0_0_25px_rgba(193,67,188,0.25)]">
      {/* Foto — o la carita del pasaporte mientras no la haya */}
      <div className="relative aspect-square w-full overflow-hidden border-b border-[#2C2550]">
        {org.photo ? (
          <Image
            src={org.photo}
            alt={org.name}
            fill
            sizes="(max-width: 640px) 90vw, 260px"
            className="object-cover object-top grayscale transition-all duration-500 group-hover:scale-[1.04] group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#0E0E1A] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl(org.id)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </div>
        )}
        {org.country && (
          <span className="absolute right-2 top-2 rounded-[4px] bg-[#C143BC] px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-[#0E0E1A]">
            {org.country}
          </span>
        )}
      </div>

      <div className="px-4 py-3.5">
        <p className="m-0 font-display text-base font-bold leading-tight text-[#E6E4DA]">
          {org.name}
        </p>
        <p className="mt-1 font-mono text-xs leading-snug text-[#C143BC]">
          {org.role}
        </p>

        <div className="mt-3 flex items-center gap-2.5">
          {org.social.github && (
            <a href={org.social.github} target="_blank" rel="noopener noreferrer"
              className="text-[#8B84A0] transition-colors hover:text-[#C143BC]" aria-label={`GitHub de ${org.name}`}>
              <IconGithub className="h-4 w-4" />
            </a>
          )}
          {org.social.linkedin && (
            <a href={org.social.linkedin} target="_blank" rel="noopener noreferrer"
              className="text-[#8B84A0] transition-colors hover:text-[#C143BC]" aria-label={`LinkedIn de ${org.name}`}>
              <IconLinkedin className="h-4 w-4" />
            </a>
          )}
          {org.social.awsBuilder && (
            <a href={org.social.awsBuilder} target="_blank" rel="noopener noreferrer"
              className="text-[#8B84A0] transition-colors hover:text-[#C143BC]" aria-label={`AWS Builder Center de ${org.name}`}>
              <IconCloud className="h-4 w-4" />
            </a>
          )}
          {org.social.instagram && (
            <a href={org.social.instagram} target="_blank" rel="noopener noreferrer"
              className="text-[#8B84A0] transition-colors hover:text-[#C143BC]" aria-label={`Instagram de ${org.name}`}>
              <IconInstagram className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function Organizers() {
  const t = useTranslations("Organizers");
  // Se respeta el orden de `src/data/organizers.ts` tal cual: la lista es
  // curada, no aleatoria.
  return (
    <section id="organizers" className="py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-5 flex items-center justify-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2C2550] bg-[#1E1838] px-4 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
              <Image
                src="/images/logos/logo-sbg-cdmx.png"
                alt="AWS Student Builder Group IPN CDMX"
                width={20}
                height={20}
                className="h-5 w-5 rounded-full object-contain"
              />
              <span className="font-mono text-xs font-semibold text-[#E6E4DA]">
                AWS Student Builder Group <span className="text-[#C143BC]">IPN CDMX</span>
              </span>
            </div>
          </div>
          <SectionHeading title={t("heading")} subtitle={t("subheading")} />
        </ScrollReveal>

        <ScrollReveal delay={0.1} from="scale">
          <div className="flex flex-wrap justify-center gap-4">
            {organizers.map((org) => (
              <OrganizerCard key={org.id} org={org} />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
