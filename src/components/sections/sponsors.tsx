"use client";

import { useLocale, useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { BlockSection } from "@/components/ui/block-section";
import { DotHeading } from "@/components/ui/dot-heading";
import { HardButton } from "@/components/ui/hard-button";
import { useEventConfig } from "@/components/providers/event-config-provider";
import { sponsors } from "@/data/sponsors";
import { basePath, localePath } from "@/lib/utils";

/**
 * Sponsors al estilo del sitio nuevo de Platanus: bloque a sangre, letrero
 * dot-matrix invertido y los logos sueltos en tinta sólida sobre el color.
 * Sin tarjetas, sin bordes, sin glows — el logo es el contenido.
 *
 * El tamaño lo da el tier: los principales mandan la fila de arriba.
 */
function LogoRow({
  items,
  size,
  delay,
}: {
  items: typeof sponsors;
  size: "lead" | "mid" | "small";
  delay: number;
}) {
  if (!items.length) return null;

  const h =
    size === "lead" ? "h-16 md:h-24" : size === "mid" ? "h-10 md:h-14" : "h-7 md:h-9";
  const gap = size === "lead" ? "gap-10 md:gap-16" : "gap-8 md:gap-12";

  return (
    <ScrollReveal delay={delay} from="scale">
      <div className={`flex flex-wrap items-center justify-center ${gap}`}>
        {items.map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center transition-transform duration-300 hover:-translate-y-1"
            aria-label={s.name}
          >
            {/* `brightness-0` fuerza el logo a tinta plana: sobre el bloque
                todos los sponsors se leen con el mismo peso, como en Platanus. */}
            <img
              src={`${basePath}${s.logo}`}
              alt={s.name}
              className={`${h} w-auto object-contain brightness-0 transition-opacity duration-300 group-hover:opacity-70`}
            />
          </a>
        ))}
      </div>
    </ScrollReveal>
  );
}

export function Sponsors() {
  const t = useTranslations("Sponsors");
  const locale = useLocale();
  const { showSponsorsCta } = useEventConfig();

  const lead = sponsors.filter((s) => s.tier === "diamond" || s.tier === "platinum");
  const mid = sponsors.filter((s) => s.tier === "gold");
  const small = sponsors.filter((s) => s.tier === "community");

  return (
    <BlockSection id="sponsors" tone="block">
      <div className="text-center">
        <ScrollReveal>
          <DotHeading tone="block" variant="inverted" flicker>
            {t("heading")}
          </DotHeading>
        </ScrollReveal>
      </div>

      <div className="mt-14 space-y-14">
        <LogoRow items={lead} size="lead" delay={0.05} />
        <LogoRow items={mid} size="mid" delay={0.12} />
        <LogoRow items={small} size="small" delay={0.18} />
      </div>

      {showSponsorsCta && (
        <ScrollReveal delay={0.25}>
          <div className="mt-16 text-center">
            <HardButton
              tone="block"
              href={localePath(locale, "/sponsors")}
            >
              {t("cta")}
            </HardButton>
          </div>
        </ScrollReveal>
      )}
    </BlockSection>
  );
}
