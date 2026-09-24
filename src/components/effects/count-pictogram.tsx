"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/components/ui/block-section";

type Glyph = "person" | "clock" | "cloud" | "star";

/** Cada tipo de figura tiene su propio gesto en bucle. */
const GESTURE: Record<Glyph, string> = {
  person: "glyph-bob",
  clock: "glyph-tick",
  cloud: "glyph-drift",
  star: "glyph-twinkle",
};

function Person({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="5" r="4.6" />
      <path d="M12 11c-4.4 0-7.4 2.6-7.4 6.2 0 2.2 1 3.6 2.6 4.2L6 31h4l1.2-7h1.6L14 31h4l-1.2-9.6c1.6-.6 2.6-2 2.6-4.2 0-3.6-3-6.2-7.4-6.2z" />
    </svg>
  );
}

/** Cada reloj marca una hora distinta: la fila entera cuenta el tiempo. */
function Clock({ index, className }: { index: number; className?: string }) {
  const angle = (index * 360) / 12;
  const rad = ((angle - 90) * Math.PI) / 180;
  const hx = 16 + Math.cos(rad) * 6.5;
  const hy = 16 + Math.sin(rad) * 6.5;
  const mrad = ((index * 150 - 90) * Math.PI) / 180;
  const mx = 16 + Math.cos(mrad) * 9;
  const my = 16 + Math.sin(mrad) * 9;

  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <line x1="16" y1="16" x2={hx} y2={hy} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="16" x2={mx} y2={my} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M23 20H11a8 8 0 1 1 7.7-10.3H21a5.2 5.2 0 1 1 0 10.3z" strokeLinejoin="round" />
    </svg>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <polygon points="12,1 15,9 23,9 16.5,14 19,22 12,17.5 5,22 7.5,14 1,9 9,9" />
    </svg>
  );
}

/**
 * Cifra que cuenta desde 0 hasta el valor al entrar en viewport. Conserva el
 * sufijo del texto original ("800+" → cuenta a 800 y repone el "+").
 */
function useCountUp(value: string, active: boolean) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!active) return;
    const m = value.match(/^(\d+)(.*)$/);
    if (!m) return;
    const target = Number(m[1]);
    const suffix = m[2];
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(`${Math.round(v)}${suffix}`),
    });
    return () => controls.stop();
  }, [value, active]);
  return shown;
}

/**
 * Fila de pictogramas + cifra en dot-matrix. Es el recurso más literal de
 * Platanus: en vez de escribir "120 hackers", dibuja los hackers y deja que la
 * cantidad se lea de un vistazo.
 */
export function CountPictogram({
  glyph,
  count,
  label,
  tone = "ink",
  className,
}: {
  glyph: Glyph;
  /** Cuántos pictogramas dibujar (no tiene que ser la cifra literal). */
  count: number;
  /** Texto en dot-matrix a la derecha, p. ej. "800+ ASISTENTES". */
  label: string;
  tone?: Tone;
  className?: string;
}) {
  const ink = tone === "block" ? "text-hack-ink" : "text-hack-block";
  const items = Array.from({ length: count }, (_, i) => i);

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  // El label llega como "800+ Asistentes": se separa la cifra para contarla.
  const [num, ...rest] = label.split(" ");
  const counted = useCountUp(num, inView);

  return (
    <div
      ref={ref}
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-3", ink, className)}
    >
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {items.map((i) => {
          const size = "h-7 w-auto sm:h-9 md:h-11";
          const glyphEl =
            glyph === "person" ? <Person className={size} />
            : glyph === "clock" ? <Clock index={i} className={size} />
            : glyph === "cloud" ? <Cloud className={size} />
            : <Star className={size} />;
          return (
            <span
              key={i}
              // Se encienden de a uno de izquierda a derecha…
              className="inline-block transition-opacity duration-500"
              style={{ opacity: inView ? 1 : 0, transitionDelay: `${i * 70}ms` }}
            >
              {/* …y una vez dentro cada figura queda en su propio bucle, con el
                  retardo desfasado para que la fila ondule. */}
              <span
                className={inView ? GESTURE[glyph] : undefined}
                style={{ display: "inline-block", animationDelay: `${i * 160}ms` }}
              >
                {glyphEl}
              </span>
            </span>
          );
        })}
      </div>
      <span className="dot-matrix text-2xl leading-none tabular-nums sm:text-3xl md:text-4xl">
        {counted} {rest.join(" ")}
      </span>
    </div>
  );
}
