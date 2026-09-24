import { getTranslations } from "next-intl/server";
import { Heart } from "lucide-react";
import { SOCIAL, EXTERNAL_LINKS } from "@/lib/constants";
import { studentBuilderGroups } from "@/data/student-builder-groups";
import { basePath, localePath } from "@/lib/utils";

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

function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FooterLogo({ locale }: { locale: string }) {
  return (
    <a href={`${localePath(locale)}#home`} className="inline-flex items-center gap-3">
      <img
        src={`${basePath}/images/logos/aws-logo.svg`}
        alt="AWS"
        className="h-9 w-auto shrink-0 brightness-0"
      />
      <div className="leading-tight">
        <p className="font-mono text-xs font-semibold tracking-wide text-hack-ink">Student</p>
        <p className="font-mono text-xs font-semibold tracking-wide text-hack-ink">Community Day</p>
        <p className="font-mono text-[10px] tracking-widest text-hack-ink">México 2026</p>
      </div>
    </a>
  );
}

const eventLinks = [
  { key: "about",     href: "#about",       page: false },
  { key: "agenda",    href: "#agenda",      page: false },
  { key: "speakers",  href: "/directorio",  page: true  },
  { key: "kiro",      href: "/kiro",         page: true  },
  { key: "venue",     href: "#venue",       page: false },
  { key: "faq",       href: "#faq",        page: false },
] as const;

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Footer" });

  return (
    <footer className="bg-hack-block text-hack-ink">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="shrink-0 lg:w-64">
            <FooterLogo locale={locale} />
            <p className="mt-4 text-sm leading-relaxed text-hack-ink/70">{t("brand_tagline_desc")}</p>
            <div className="mt-5 flex gap-4">
              {SOCIAL.instagram && (
                <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="text-hack-ink/60 transition-colors hover:text-hack-ink" aria-label="Instagram">
                  <IconInstagram className="h-5 w-5" />
                </a>
              )}
              {SOCIAL.twitter && (
                <a href={SOCIAL.twitter} target="_blank" rel="noopener noreferrer" className="text-hack-ink/60 transition-colors hover:text-hack-ink" aria-label="X (Twitter)">
                  <IconX className="h-5 w-5" />
                </a>
              )}
              {SOCIAL.linkedin && (
                <a href={SOCIAL.linkedin} target="_blank" rel="noopener noreferrer" className="text-hack-ink/60 transition-colors hover:text-hack-ink" aria-label="LinkedIn">
                  <IconLinkedin className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div className="hidden lg:block w-px self-stretch bg-hack-ink/20" />

          <div className="grid flex-1 grid-cols-2 gap-10 sm:grid-cols-4">
            <div>
              <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-hack-ink">{t("the_event")}</h3>
              <ul className="mt-4 space-y-2.5">
                {eventLinks.map(({ key, href, page }) => (
                  <li key={key}>
                    <a
                      href={page ? localePath(locale, href) : `${localePath(locale)}${href}`}
                      className="text-sm text-hack-ink/70 transition-colors hover:text-hack-ink"
                    >
                      {t(key)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-hack-ink">{t("community")}</h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a href={EXTERNAL_LINKS.awsCloudClubs} target="_blank" rel="noopener noreferrer" className="text-sm text-hack-ink/70 transition-colors hover:text-hack-ink">
                    {t("aws_cloud_clubs")}
                  </a>
                </li>
                <li>
                  <a href={localePath(locale, "/codigo-conducta")} className="text-sm text-hack-ink/70 transition-colors hover:text-hack-ink">
                    {t("code_of_conduct")}
                  </a>
                </li>
                <li>
                  <a href={localePath(locale, "/privacidad")} className="text-sm text-hack-ink/70 transition-colors hover:text-hack-ink">
                    {t("privacy_policy")}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-hack-ink">{t("resources")}</h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a href={EXTERNAL_LINKS.awsFreeTier} target="_blank" rel="noopener noreferrer" className="text-sm text-hack-ink/70 transition-colors hover:text-hack-ink">
                    {t("aws_free_tier")}
                  </a>
                </li>
                <li>
                  <a href={EXTERNAL_LINKS.awsSkillBuilder} target="_blank" rel="noopener noreferrer" className="text-sm text-hack-ink/70 transition-colors hover:text-hack-ink">
                    {t("aws_skill_builder")}
                  </a>
                </li>
                <li>
                  <a href={EXTERNAL_LINKS.awsCertification} target="_blank" rel="noopener noreferrer" className="text-sm text-hack-ink/70 transition-colors hover:text-hack-ink">
                    {t("aws_certification")}
                  </a>
                </li>
                <li>
                  <a href={EXTERNAL_LINKS.awsDocs} target="_blank" rel="noopener noreferrer" className="text-sm text-hack-ink/70 transition-colors hover:text-hack-ink">
                    {t("aws_docs")}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-hack-ink">{t("cloud_clubs")}</h3>
              <ul className="mt-4 space-y-2.5">
                {studentBuilderGroups.map((club) => (
                  <li key={club.name}>
                    {club.meetupUrl ? (
                      <a href={club.meetupUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-hack-ink/70 transition-colors hover:text-hack-ink">
                        {club.name}
                      </a>
                    ) : (
                      <span className="text-sm text-hack-ink/70 transition-colors hover:text-hack-ink">{club.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-hack-ink/20">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-6 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-hack-ink/70">
            {t("made_with")}{" "}
            <Heart className="inline h-4 w-4 fill-hack-ink text-hack-ink" />{" "}
            {t("made_by")}{" "}
            <a
              href="https://builder.aws.com/community/@sebitas"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium font-semibold text-hack-ink transition-colors hover:underline"
            >
              {t("made_by_name")}
            </a>
          </p>
          <p className="text-xs text-hack-ink/60">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
