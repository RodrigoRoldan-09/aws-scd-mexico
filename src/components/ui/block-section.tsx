import { cn } from "@/lib/utils";

export type Tone = "block" | "ink";

/**
 * Sección a sangre con uno de los dos tonos que alternan en todo el landing:
 *
 * - `block` → fondo del acento, tinta oscura.
 * - `ink`   → fondo oscuro, tinta clara.
 *
 * El fondo sangra de borde a borde; el contenido se centra en `max-w`.
 */
export function BlockSection({
  id,
  tone = "ink",
  className,
  innerClassName,
  children,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "w-full",
        tone === "block"
          ? "bg-hack-block text-hack-ink"
          : "bg-surface-900 text-surface-100",
        className,
      )}
    >
      <div className={cn("mx-auto max-w-[1180px] px-6 py-20 md:py-28", innerClassName)}>
        {children}
      </div>
    </section>
  );
}

/** Clases de texto secundario según el tono, para no repetir el ternario. */
export function muted(tone: Tone) {
  return tone === "block" ? "text-hack-ink/70" : "text-surface-400";
}

/** Color de borde/hairline según el tono. */
export function hairline(tone: Tone) {
  return tone === "block" ? "border-hack-ink/25" : "border-surface-700";
}
