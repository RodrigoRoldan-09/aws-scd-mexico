"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, type PanInfo } from "motion/react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/** Cuántas tarjetas se ven a cada lado de la central. */
const RANGE = 2;

/** Pose de cada distancia al centro. La central manda: más grande y encendida. */
// `x` va en % del ancho de la ranura. Con estas escalas, 112% deja entre la
// central y la lateral un hueco de ~12% del ancho de tarjeta.
const POSES = [
  { x: 0, scale: 1.15, opacity: 1, brightness: 1 },
  { x: 112, scale: 0.85, opacity: 0.6, brightness: 0.5 },
  { x: 200, scale: 0.7, opacity: 0.3, brightness: 0.35 },
];
const HIDDEN = { x: 260, scale: 0.6, opacity: 0, brightness: 0.35 };

/** Umbrales del swipe: distancia en px o velocidad en px/s. */
const SWIPE_DISTANCE = 40;
const SWIPE_VELOCITY = 300;

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Distancia circular (con signo) de la ranura `slot` a la posición `pos`. */
function ringOffset(slot: number, pos: number, ring: number) {
  const half = Math.floor(ring / 2);
  return mod(slot - pos + half, ring) - half;
}

interface CoverflowCarouselProps {
  /** Una tarjeta por hijo. Cada hijo necesita `key`. */
  children: React.ReactNode;
  /** Nombre accesible del carrusel (región). */
  label: string;
  /** Milisegundos entre avances automáticos. */
  interval?: number;
  /** Ancho de cada ranura. La central se escala por encima de esto. */
  slotClassName?: string;
  className?: string;
}

/**
 * Carrusel coverflow: la tarjeta central crece y queda encendida, las
 * laterales se encogen y se apagan. Avanza solo, se detiene con hover, foco,
 * fuera de pantalla o con movimiento reducido, y acepta flechas, indicadores,
 * teclado y swipe.
 *
 * El carrusel es infinito: cuando hay pocas tarjetas se repiten en un anillo
 * lo bastante largo para que el salto de un extremo al otro ocurra siempre en
 * una ranura invisible. Las copias van `inert`, así que ni el lector de
 * pantalla ni el tabulador las ven.
 */
export function CoverflowCarousel({
  children,
  label,
  interval = 3800,
  slotClassName = "w-[200px] xs:w-[220px] sm:w-[240px]",
  className,
}: CoverflowCarouselProps) {
  const t = useTranslations("Carousel");
  const slides = Children.toArray(children);
  const count = slides.length;

  // Ranuras mínimas: las visibles, más el salto más largo posible (indicador
  // o clic en una lateral) a cada lado, más un margen oculto.
  const maxJump = Math.max(RANGE, Math.floor(count / 2));
  const minRing = 2 * RANGE + 2 + 2 * maxJump;
  const copies = count > 0 ? Math.ceil(minRing / count) : 0;
  const ring = count * copies;

  // `position` crece sin límite; `prev` permite detectar qué ranuras dan la
  // vuelta al anillo para moverlas sin animación.
  const [{ position, prev }, setNav] = useState({ position: 0, prev: 0 });
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const regionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(regionRef, { amount: 0.35 });
  const reduced = useReducedMotion();
  const dragged = useRef(false);

  const active = count > 0 ? mod(position, count) : 0;
  const autoplay = playing && !reduced && !hovered && !focused && inView && count > 1;

  const step = useCallback((delta: number) => {
    setNav((s) => ({ position: s.position + delta, prev: s.position }));
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setNav((s) => {
        let delta = index - mod(s.position, count);
        if (delta > count / 2) delta -= count;
        if (delta < -count / 2) delta += count;
        return delta === 0 ? s : { position: s.position + delta, prev: s.position };
      });
    },
    [count],
  );

  // Cada cambio de posición reinicia la cuenta: tras navegar a mano la
  // siguiente tarjeta espera el intervalo completo.
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setTimeout(() => step(1), interval);
    return () => window.clearTimeout(id);
  }, [autoplay, position, interval, step]);

  const onPanStart = () => {
    dragged.current = true;
  };

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) step(1);
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) step(-1);
  };

  // Un arrastre no debe terminar abriendo el enlace que quedó bajo el dedo.
  const onClickCapture = (e: React.MouseEvent) => {
    if (!dragged.current) return;
    dragged.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  };

  if (count === 0) return null;

  const counter = (n: number) => String(n).padStart(2, "0");
  const control =
    "inline-flex min-h-11 min-w-11 items-center justify-center border-2 border-hack-block bg-hack-ink text-hack-block shadow-[4px_4px_0_0_var(--color-hack-dim)] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-hack-dim)] active:translate-x-0 active:translate-y-0 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hack-paper";

  return (
    <div
      ref={regionRef}
      role="region"
      aria-roledescription={t("roledescription")}
      aria-label={label}
      className={cn("w-full", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
    >
      {/* Escenario: todas las ranuras comparten la misma celda de la grilla,
          así la altura la marca la tarjeta más alta sin medir nada. */}
      <motion.div
        aria-live={autoplay ? "off" : "polite"}
        onPanStart={onPanStart}
        onPanEnd={onPanEnd}
        onPointerDown={() => {
          dragged.current = false;
        }}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        className="grid touch-pan-y select-none place-items-center overflow-x-clip py-10 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] sm:py-12"
      >
        {Array.from({ length: ring }, (_, slot) => {
          const item = slot % count;
          const offset = ringOffset(slot, position, ring);
          const before = ringOffset(slot, prev, ring);
          const wrapped = offset - before !== prev - position;
          const distance = Math.abs(offset);
          const pose = POSES[distance] ?? HIDDEN;
          const isActive = offset === 0;
          const visible = distance <= RANGE;
          const sign = offset < 0 ? -1 : 1;

          return (
            <motion.div
              key={slot}
              role="group"
              aria-roledescription={t("slide_roledescription")}
              aria-label={t("slide_label", { current: item + 1, total: count })}
              aria-hidden={!isActive}
              data-active={isActive}
              initial={false}
              animate={{
                x: `${sign * pose.x}%`,
                scale: pose.scale,
                opacity: pose.opacity,
                filter: `brightness(${pose.brightness})`,
              }}
              transition={
                wrapped || reduced
                  ? { duration: 0 }
                  : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
              }
              style={{ zIndex: 10 - distance }}
              onClick={!isActive && visible ? () => step(offset) : undefined}
              className={cn(
                "group/slide col-start-1 row-start-1 flex justify-center",
                slotClassName,
                !visible && "pointer-events-none",
                !isActive && visible && "cursor-pointer",
              )}
            >
              {/* `inert` va adentro: en la ranura misma bloquearía el clic que
                  trae la tarjeta lateral al centro. */}
              <div inert={!isActive} className="flex w-full justify-center">
                {slides[item]}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {count > 1 && (
        <div className="mt-2 flex items-center justify-center gap-3 sm:gap-4">
          <button type="button" onClick={() => step(-1)} aria-label={t("prev")} className={control}>
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Indicadores: desde `sm`. En móvil no caben con su área táctil
              completa, ahí queda el contador. */}
          <div className="hidden items-center sm:flex">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={t("go_to", { current: i + 1, total: count })}
                aria-current={i === active ? "true" : undefined}
                className="group/dot inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-hack-paper"
              >
                <span
                  className={cn(
                    "block h-2.5 border-2 border-hack-block transition-all duration-300",
                    i === active ? "w-7 bg-hack-block" : "w-2.5 bg-transparent group-hover/dot:bg-hack-block/50",
                  )}
                />
              </button>
            ))}
          </div>

          <span className="font-dot min-w-[4.5ch] text-center text-lg tabular-nums text-hack-paper sm:hidden" aria-hidden="true">
            {counter(active + 1)}/{counter(count)}
          </span>

          {!reduced && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? t("pause") : t("play")}
              aria-pressed={!playing}
              className={control}
            >
              {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            </button>
          )}

          <button type="button" onClick={() => step(1)} aria-label={t("next")} className={control}>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
