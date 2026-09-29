import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { DotHeading } from "@/components/ui/dot-heading";
import { CoverflowCarousel } from "@/components/ui/coverflow-carousel";
import { IconInstagram, IconLinkedin } from "@/components/ui/social-icons";
import { alliedSBGs } from "@/data/allied-sbgs";
import type { Community } from "@/types";

const SOCIALS = [
  { key: "linkedin", network: "LinkedIn", Icon: IconLinkedin },
  { key: "instagram", network: "Instagram", Icon: IconInstagram },
] as const;

/**
 * Tarjeta de SBG: caja dura con el logo a sangre. Dentro del carrusel se
 * enciende (borde de acento y sombra desplazada) sólo cuando está al centro.
 */
function SBGCard({
  sbg,
  socialLabel,
}: {
  sbg: Community;
  socialLabel: (network: string, name: string) => string;
}) {
  return (
    <article className="w-full overflow-hidden border-2 border-border-default bg-bg-surface transition-[border-color,box-shadow] duration-500 group-data-[active=true]/slide:border-hack-block group-data-[active=true]/slide:shadow-[5px_5px_0_0_var(--color-hack-dim)]">
      <div className="relative aspect-square w-full overflow-hidden border-b-2 border-border-default bg-bg-base">
        {sbg.logo && (
          <Image
            src={sbg.logo}
            alt={sbg.name}
            fill
            draggable={false}
            sizes="(max-width: 640px) 230px, 280px"
            className="object-cover"
          />
        )}
        {sbg.badge && (
          <span className="font-dot absolute right-2 top-2 border-2 border-hack-ink bg-hack-block px-1.5 py-0.5 text-sm leading-none text-hack-ink">
            {sbg.badge}
          </span>
        )}
      </div>

      <div className="px-4 pb-2 pt-3.5">
        <h3 className="m-0 font-display text-base font-bold leading-tight text-text-primary">
          {sbg.name}
        </h3>
        <p className="mt-1 min-h-[2lh] font-mono text-xs leading-snug text-accent">
          {sbg.category}
        </p>

        <div className="-ml-3 mt-1 flex items-center">
          {SOCIALS.map(({ key, network, Icon }) => {
            const href = sbg.social?.[key];
            if (!href) return null;
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
                aria-label={socialLabel(network, sbg.name)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-text-muted transition-colors hover:text-hack-block focus-visible:text-hack-block"
              >
                <Icon className="h-4 w-4" />
              </a>
            );
          })}
        </div>
      </div>
    </article>
  );
}

/**
 * "Comunidades Organizadoras": los AWS Student Builder Groups que co-organizan
 * el evento, en el mismo carrusel coverflow que el equipo organizador.
 */
export async function AlliedSBGs() {
  const t = await getTranslations("AlliedSBG");
  const socialLabel = (network: string, name: string) => t("social_label", { network, name });

  if (alliedSBGs.length === 0) return null;

  return (
    <section id="allied-sbgs" className="border-t border-border-default/40 px-6 py-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-8 md:mb-8">
          <ScrollReveal>
            <DotHeading as="div" variant="inverted" className="mb-4 text-xl sm:text-2xl md:text-3xl">
              {t("eyebrow")}
            </DotHeading>
            <h2
              className="m-0 max-w-[18ch] font-display font-bold leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(28px,4vw,48px)" }}
            >
              {t("title_pre")}
              <em className="not-italic text-hack-block">{t("title_em")}</em>
              {t("title_post")}
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <p className="m-0 max-w-[52ch] font-mono text-sm leading-relaxed text-text-secondary md:text-base">
              {t("description")}
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.15} from="scale">
          <CoverflowCarousel label={t("carousel_label")}>
            {alliedSBGs.map((sbg) => (
              <SBGCard key={sbg.id} sbg={sbg} socialLabel={socialLabel} />
            ))}
          </CoverflowCarousel>
        </ScrollReveal>
      </div>
    </section>
  );
}
