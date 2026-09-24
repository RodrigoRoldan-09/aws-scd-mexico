"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/components/ui/block-section";

export type CodeSegment = { text: string; accent?: boolean };
/** Un párrafo = lista de segmentos; los `accent` se pintan en morado y en bold. */
export type CodeParagraph = CodeSegment[];

type Line = { number: number; segments: CodeSegment[] };

/**
 * Bloque de texto renderizado como si estuviera abierto en un editor: canaleta
 * con números de línea y wrap calculado a mano contra el ancho real del
 * contenedor (por eso la numeración coincide con lo que se ve, no con párrafos).
 */
export function CodeLines({
  paragraphs,
  tone = "ink",
  className,
}: {
  paragraphs: CodeParagraph[];
  tone?: Tone;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const layout = () => {
      const width = el.offsetWidth;
      if (!width) return;

      const cs = getComputedStyle(el);
      const probe = document.createElement("span");
      // Igual que en el code-typer: el shorthand `font` no es fiable.
      probe.style.fontFamily = cs.fontFamily;
      probe.style.fontSize = cs.fontSize;
      probe.style.fontWeight = cs.fontWeight;
      probe.style.letterSpacing = cs.letterSpacing;
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.whiteSpace = "pre";
      document.body.appendChild(probe);

      const fits = (text: string) => {
        probe.textContent = text;
        return probe.offsetWidth <= width;
      };

      const out: Line[] = [];
      let n = 1;

      paragraphs.forEach((paragraph, pIndex) => {
        const words = paragraph.flatMap((seg) =>
          seg.text.split(/\s+/).filter(Boolean).map((word) => ({ word, accent: seg.accent })),
        );

        let plain = "";
        let segments: CodeSegment[] = [];

        const push = () => {
          if (segments.length) out.push({ number: n++, segments });
          plain = "";
          segments = [];
        };

        for (const { word, accent } of words) {
          const candidate = plain ? `${plain} ${word}` : word;
          if (plain && !fits(candidate)) push();
          plain = plain ? `${plain} ${word}` : word;
          const last = segments[segments.length - 1];
          if (last && !!last.accent === !!accent) last.text += ` ${word}`;
          else segments.push({ text: segments.length ? ` ${word}` : word, accent });
        }
        push();

        // Línea en blanco entre párrafos, numerada — igual que en un archivo real.
        if (pIndex < paragraphs.length - 1) out.push({ number: n++, segments: [] });
      });

      document.body.removeChild(probe);
      setLines(out);
    };

    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(el);
    return () => observer.disconnect();
  }, [paragraphs]);

  return (
    <div className={cn("font-mono text-sm leading-relaxed md:text-base", className)}>
      <div className="flex">
        {/* Canaleta de números */}
        <div
          className={cn(
            "mr-4 shrink-0 select-none text-right",
            tone === "block" ? "text-hack-ink/35" : "text-surface-600",
          )}
          aria-hidden="true"
        >
          {lines.map((line) => (
            <div key={line.number} className="tabular-nums">
              {line.number}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {/* Medidor invisible: da el ancho real para calcular el wrap */}
          <div ref={ref} className="h-0 overflow-hidden" aria-hidden="true" />
          {lines.map((line) => (
            <div key={line.number} className="whitespace-pre-wrap break-words">
              {line.segments.length === 0 ? (
                "\u00A0"
              ) : (
                line.segments.map((seg, i) => (
                  <span
                    key={i}
                    className={cn(
                      seg.accent
                        ? tone === "block"
                          ? "font-bold text-hack-deep"
                          : "font-bold text-hack-block"
                        : tone === "block"
                          ? "text-hack-ink/80"
                          : "text-surface-300",
                    )}
                  >
                    {seg.text}
                  </span>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
