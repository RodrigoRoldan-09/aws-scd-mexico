import { cn } from "@/lib/utils";
import type { Tone } from "./block-section";

/**
 * Cinta a sangre con un texto que se repite y se desplaza en loop. Cada dos
 * repeticiones la caja se invierte (fondo sólido del color contrario), que es
 * el truco para que la cinta lata en vez de sólo correr.
 *
 * El loop cierra porque se pintan dos tandas idénticas y la animación recorre
 * exactamente el 50% del ancho.
 */
export function MarqueeStrip({
  text,
  tone = "ink",
  repeat = 6,
  duration = 28,
  reverse = false,
  alternate = true,
  className,
}: {
  text: string;
  /** Repeticiones por tanda. Se pintan dos tandas para cerrar el loop. */
  repeat?: number;
  tone?: Tone;
  /** Segundos que tarda una vuelta completa. */
  duration?: number;
  reverse?: boolean;
  /** Invierte una de cada dos cajas. */
  alternate?: boolean;
  className?: string;
}) {
  const items = Array.from({ length: repeat * 2 }, (_, i) => i);

  return (
    <div
      className={cn(
        "w-full overflow-hidden border-y",
        tone === "block"
          ? "border-hack-ink/20 bg-hack-block text-hack-ink"
          : "border-surface-700 bg-surface-900 text-hack-block",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className="flex w-max shrink-0 items-center"
        style={{
          animation: `${reverse ? "marquee-reverse" : "marquee"} ${duration}s linear infinite`,
        }}
      >
        {items.map((i) => {
          const inverted = alternate && i % 2 === 1;
          return (
            <span
              key={i}
              className={cn(
                "dot-matrix whitespace-nowrap px-6 py-3 text-xl leading-none sm:text-2xl md:text-3xl",
                inverted &&
                  (tone === "block"
                    ? "bg-hack-ink text-hack-block"
                    : "bg-hack-block text-hack-ink"),
              )}
            >
              {text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
