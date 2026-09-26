import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SOCIAL, EXTERNAL_LINKS } from "@/lib/constants";
import { localePath } from "@/lib/utils";

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconLinkedin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function SbgLogoLockup({ locale }: { locale: string }) {
  return (
    <a href={`${localePath(locale)}#home`} className="group inline-flex items-center gap-2.5">
      <Image
        src="/images/logos/logo-sbg-cdmx.png"
        alt="AWS Student Builder Group IPN CDMX"
        width={32}
        height={32}
        className="h-8 w-8 object-contain rounded-[6px]"
      />
      <div className="flex flex-col text-left">
        <span className="font-display text-[11px] font-bold leading-tight text-[#E6E4DA]">
          AWS Student Builder Group
        </span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-[#C143BC] leading-tight">
          IPN CDMX
        </span>
      </div>
    </a>
  );
}

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Footer" });

  const scdLinks = [
    { label: t("about"), href: `${localePath(locale)}#about` },
    { label: t("agenda"), href: `${localePath(locale)}#agenda` },
    { label: t("speakers"), href: localePath(locale, "/directorio") },
    { label: locale === "en" ? "Communities" : "Comunidades", href: localePath(locale, "/comunidades") },
  ];

  const sbgLinks = [
    { label: "Workshops", href: `${localePath(locale)}#tracks` },
    { label: "Blog", href: `${localePath(locale)}#blog` },
    { label: "Aula", href: `${localePath(locale)}#aula` },
    { label: "Proyectos", href: `${localePath(locale)}#proyectos` },
    { label: t("community"), href: `${localePath(locale)}#about` },
  ];

  const resourcesLinks = [
    { label: "AWS Free Tier", href: EXTERNAL_LINKS.awsFreeTier },
    { label: "Skill Builder", href: EXTERNAL_LINKS.awsSkillBuilder },
    { label: "Certification", href: EXTERNAL_LINKS.awsCertification },
    { label: "Docs", href: EXTERNAL_LINKS.awsDocs },
  ];

  return (
    <footer className="border-t border-[#2C2550] bg-[#0E0E1A] text-[#E6E4DA]">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Columna 1: Ancha (5 cols en lg) */}
          <div className="flex flex-col lg:col-span-5">
            <SbgLogoLockup locale={locale} />
            <p className="mt-4 max-w-sm font-mono text-xs leading-relaxed text-[#B4B2A9]">
              {t("brand_tagline_desc")}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIAL.instagram && (
                <a
                  href={SOCIAL.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-[6px] border border-[#2C2550] bg-[#1E1838] text-[#B4B2A9] transition-all hover:border-[#613BB8] hover:text-[#C143BC]"
                  aria-label="Instagram"
                >
                  <IconInstagram className="h-4 w-4" />
                </a>
              )}
              {SOCIAL.linkedin && (
                <a
                  href={SOCIAL.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-[6px] border border-[#2C2550] bg-[#1E1838] text-[#B4B2A9] transition-all hover:border-[#613BB8] hover:text-[#C143BC]"
                  aria-label="LinkedIn"
                >
                  <IconLinkedin className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Columna 2: SCD (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#E6E4DA]">
              SCD
            </h3>
            <ul className="mt-4 space-y-2.5 font-mono text-xs">
              {scdLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-[#B4B2A9] transition-colors hover:text-[#C143BC]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: SBG (3 cols) */}
          <div className="lg:col-span-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#E6E4DA]">
              SBG
            </h3>
            <ul className="mt-4 space-y-2.5 font-mono text-xs">
              {sbgLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-[#B4B2A9] transition-colors hover:text-[#C143BC]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4: RECURSOS (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#E6E4DA]">
              RECURSOS
            </h3>
            <ul className="mt-4 space-y-2.5 font-mono text-xs">
              {resourcesLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B4B2A9] transition-colors hover:text-[#C143BC]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Franja inferior: Legales centrados */}
      <div className="border-t border-[#2C2550] bg-[#0E0E1A] py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex items-center gap-4 font-mono text-xs text-[#B4B2A9]">
            <a
              href={localePath(locale, "/codigo-conducta")}
              className="transition-colors hover:text-[#E6E4DA]"
            >
              {t("code_of_conduct")}
            </a>
            <span className="text-[#2C2550]" aria-hidden="true">·</span>
            <a
              href={localePath(locale, "/privacidad")}
              className="transition-colors hover:text-[#E6E4DA]"
            >
              {t("privacy_policy")}
            </a>
          </div>
          <p className="font-mono text-[11px] text-[#73726C]">
            {t("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
