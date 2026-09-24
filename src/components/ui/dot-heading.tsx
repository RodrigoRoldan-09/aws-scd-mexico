"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";
import type { Tone } from "./block-section";

/**
 * Reparte el texto en <span> por letra y le da a cada uno un retardo creciente,
 * para que la onda de color lo recorra de izquierda a derecha en vez de
 * encender todo el titular a la vez.
 */
function Wave({ text, invert }: { text: string; invert: boolean }) {
  const letters = [...text];
  return (
    <>
      {letters.map((ch, i) => (
        <span
          key={i}
          className={invert ? "wave-letter-invert" : "wave-letter"}
          style={{ animationDelay: `${i * 0.045}s` }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </>
  );
}

/**
 * Titular en dot-matrix. Dos variantes, las mismas que usa Platanus:
 *
 * - `plain`    → letras sueltas sobre el fondo de la sección.
 * - `inverted` → caja sólida en el color contrario, tipo letrero de LED
 *   ("EPIC PRIZES", "SPONSORED BY THE BIG ONES"), con parpadeo de tubo.
 *
 * En ambas la tinta viaja letra a letra (`color-wave`), que es lo que hace que
 * los letreros de ellos se sientan encendidos y no impresos.
 */
export function DotHeading({
  children,
  tone = "ink",
  variant = "plain",
  wave = true,
  flicker = false,
  reveal = true,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  tone?: Tone;
  variant?: "plain" | "inverted";
  /** Desactiva la onda cuando el titular es largo o va sobre contenido denso. */
  wave?: boolean;
  /** Parpadeo de tubo. Va sólo en los letreros clave: con 15 encendidos a la
   *  vez el ojo no descansa y el navegador recalcula estilos de más. */
  flicker?: boolean;
  /**
   * Si la caja invertida se revela al entrar en pantalla.
   *
   * En `false` se pinta entera desde el principio. Va así en los títulos del
   * panel: están siempre arriba del todo, así que no hay nada que revelar, y
   * atarlos a un observador sólo añade una forma de que no aparezcan —si el
   * observador no dispara, `animate` se queda sin valor y el recorte inicial
   * (`inset(0 100% 0 0)`) no se deshace nunca: el título ocupa su sitio pero no
   * se ve.
   */
  reveal?: boolean;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "div" | "span";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  // La onda sólo se puede aplicar si el contenido es texto plano.
  const text = typeof children === "string" ? children : null;
  const inverted = variant === "inverted";
  const animated = wave && text;

  const body = animated ? (
    <Wave text={text} invert={tone === "block" ? !inverted : inverted} />
  ) : (
    children
  );

  if (inverted) {
    const caja = (
        <Tag
          className={cn(
            "dot-matrix inline-block px-5 py-2.5 text-2xl leading-none sm:text-3xl md:text-4xl",
            flicker && "animate-flicker",
            tone === "block"
              ? "bg-hack-ink text-hack-block"
              : "bg-hack-block text-hack-ink",
            className,
          )}
        >
          {body}
        </Tag>
    );

    // Sin barrido la caja se pinta entera y no depende de nada más.
    if (!reveal) return <div className="inline-block">{caja}</div>;

    // Con barrido: se revela de izquierda a derecha en vez de aparecer, para
    // que se encienda como un letrero que arranca y no como un texto que llega.
    return (
      <motion.div
        ref={ref}
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={inView ? { clipPath: "inset(0 0% 0 0)" } : undefined}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="inline-block"
      >
        {caja}
      </motion.div>
    );
  }

  return (
    <Tag
      className={cn(
        "dot-matrix text-3xl leading-none sm:text-4xl md:text-5xl",
        tone === "block" ? "text-hack-ink" : "text-hack-block",
        className,
      )}
    >
      {body}
    </Tag>
  );
}
