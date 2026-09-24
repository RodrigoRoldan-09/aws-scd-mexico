import { cn } from "@/lib/utils";
import { DotHeading } from "@/components/ui/dot-heading";
import type { Tone } from "@/components/ui/block-section";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  /** Tono de la sección que la contiene. */
  tone?: Tone;
  /** Alinea a la izquierda en vez de centrar. */
  align?: "center" | "left";
}

/**
 * Encabezado de sección: caja sólida en dot-matrix, como los letreros de LED
 * del sitio de Platanus ("SPONSORED BY THE BIG ONES").
 */
export function SectionHeading({
  title,
  subtitle,
  className,
  tone = "ink",
  align = "center",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={cn("mb-14", centered ? "text-center" : "text-left", className)}>
      <DotHeading tone={tone} variant="inverted">
        {title}
      </DotHeading>

      {subtitle && (
        <p
          className={cn(
            "mt-6 max-w-2xl font-mono text-base leading-relaxed",
            centered && "mx-auto",
            tone === "block" ? "text-hack-ink/70" : "text-surface-300",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
