"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface TerminalHeadingProps {
  /** Comando que se "escribe", sin el prompt. Ej: `vim about.txt` */
  command: string;
  /** Prompt a la izquierda. `$` por defecto. */
  prompt?: string;
  /** Velocidad de tecleo en ms por carácter. */
  speed?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "div";
}

/**
 * Titular tipo terminal: `$ vim about.txt` tecleado carácter a carácter
 * la primera vez que entra en viewport, con cursor parpadeante al final.
 * Con `prefers-reduced-motion` se pinta completo de una.
 */
export function TerminalHeading({
  command,
  prompt = "$",
  speed = 38,
  className,
  as: Tag = "h2",
}: TerminalHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [started, setStarted] = useState(false);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (reduced) {
      setTyped(command);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(command.slice(0, i));
      if (i >= command.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [started, command, speed, reduced]);

  const done = typed.length >= command.length;

  return (
    <div ref={ref}>
      <Tag
        className={cn(
          "font-display tracking-tight text-surface-50",
          className,
        )}
      >
        {/* El comando completo va en el DOM para SEO y lectores de pantalla;
            lo visible se dibuja encima mientras se teclea. */}
        <span className="sr-only">{`${prompt} ${command}`}</span>
        <span aria-hidden="true">
          <span className="text-hack-primary">{prompt} </span>
          {typed}
          <span
            className={cn(
              "ml-0.5 inline-block h-[0.85em] w-[0.5ch] translate-y-[0.08em] bg-hack-primary align-baseline",
              done && "[animation:caret-blink_1.05s_step-end_infinite]",
            )}
          />
        </span>
      </Tag>
    </div>
  );
}
