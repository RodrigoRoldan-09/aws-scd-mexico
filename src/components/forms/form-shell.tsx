"use client";

import { motion } from "motion/react";
import { DotHeading } from "@/components/ui/dot-heading";
import { EVENT } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Cáscara compartida para los formularios públicos (/registro, /voluntarios, /speakers).
 * Diseñada bajo la estética de hardware rack / sintetizador arcade:
 * líneas de fondo cuadriculadas, marquesina superior, manijas laterales,
 * marcos con brillo y deck inferior con controles táctiles.
 */
export function FormShell({
  title,
  lead,
  children,
  preview,
  aside,
  className,
}: {
  /** Va en el letrero dot-matrix. */
  title: string;
  /** Línea de contexto bajo el letrero. */
  lead?: string;
  children: React.ReactNode;
  /** Tarjeta que se pinta en vivo al lado del formulario (sólo en pantalla ancha). */
  preview?: React.ReactNode;
  /** Contenido opcional a la derecha del letrero (idioma, pasos…). */
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <main className="relative flex min-h-screen flex-col bg-[#0A0A12] text-[#E6E4DA] pt-24 overflow-x-hidden">
      {/* Líneas de fondo: Rejilla cuadriculada retro-electrónica */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(193,67,188,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(193,67,188,0.45) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className={cn("relative mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 z-10", className)}>
        {/* Cabecera del formulario */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-8 flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <DotHeading flicker className="text-[#E6E4DA]">
              {title}
            </DotHeading>
            {lead && (
              <p className="mt-4 max-w-[54ch] font-mono text-xs sm:text-sm leading-relaxed text-[#B4B2A9]">
                {"// "}
                {lead}
              </p>
            )}
          </div>
          {aside}
        </motion.div>

        <div
          className={cn(
            "grid gap-10 pb-20",
            preview ? "lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12" : "max-w-4xl mx-auto",
          )}
        >
          {/* Estructura de Chasis Arcade / Sintetizador */}
          <div className="relative">
            {/* Manija / Bracket lateral izquierdo (visible en sm en adelante para no desbordar en móvil) */}
            <div
              aria-hidden="true"
              className="hidden sm:block absolute -left-5 top-6 bottom-6 w-4 sm:-left-6 sm:w-5 rounded-[2px] border-l-2 border-r-2 border-[#C143BC] bg-[#852781] shadow-[0_0_16px_rgba(193,67,188,0.35)] z-20"
            />

            {/* Manija / Bracket lateral derecho (visible en sm en adelante para no desbordar en móvil) */}
            <div
              aria-hidden="true"
              className="hidden sm:block absolute -right-5 top-6 bottom-6 w-4 sm:-right-6 sm:w-5 rounded-[2px] border-l-2 border-r-2 border-[#C143BC] bg-[#852781] shadow-[0_0_16px_rgba(193,67,188,0.35)] z-20"
            />

            {/* Marquesina superior técnica - sin margen negativo abrupto en móvil para evitar que se encime */}
            <div className="relative z-30 mx-auto mb-1 sm:-mb-3.5 w-fit max-w-[94%] border-2 border-[#C143BC] bg-[#9A3097] px-3.5 py-1.5 sm:px-6 text-center shadow-[0_0_20px_rgba(193,67,188,0.4)]">
              <span className="arcade-pixel text-[11px] sm:text-sm font-bold text-[#E6E4DA] leading-snug block">
                {EVENT.name} · {EVENT.year} // {title}
              </span>
            </div>

            {/* RECUADRO EXTERIOR DEL CHASIS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.12, ease }}
              className="relative border-2 border-[#C143BC] bg-[#0E0E1A]/95 p-2.5 sm:p-6 shadow-[0_0_40px_rgba(193,67,188,0.25)]"
            >
              {/* PANTALLA INTERIOR */}
              <div className="relative border-2 border-[#C143BC]/70 bg-[#0B0B14] p-3 sm:p-7 shadow-[inset_0_0_25px_rgba(193,67,188,0.06)]">
                {/* Scanlines CRT */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, rgba(193,67,188,0.25) 0px, rgba(193,67,188,0.25) 1px, transparent 1px, transparent 3px)",
                  }}
                />

                <div className="relative z-10">{children}</div>
              </div>

              {/* DECK INFERIOR DE CONTROL (Sintetizador con faders y LEDs) */}
              <div className="mt-3.5 border-2 border-[#C143BC] bg-[#0B0B14] px-4 sm:px-6 py-3 sm:py-3.5 shadow-[0_0_20px_rgba(193,67,188,0.25)]">
                <div className="flex items-center justify-between sm:justify-center sm:gap-14">
                  {/* Etiqueta técnica */}
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#C143BC]/80 sm:hidden">
                    SYS · OK
                  </span>

                  {/* Faders verticales */}
                  <div className="flex items-center gap-8">
                    <div className="relative flex h-8 w-3 items-center justify-center">
                      <div className="h-full w-0.5 bg-[#C143BC]/40" />
                      <div className="absolute top-[40%] h-3 w-3 rounded-full border border-[#0E0E1A] bg-[#F2A6F0] shadow-[0_0_8px_#C143BC]" />
                    </div>
                    <div className="relative flex h-8 w-3 items-center justify-center">
                      <div className="h-full w-0.5 bg-[#C143BC]/40" />
                      <div className="absolute top-[60%] h-3 w-3 rounded-full border border-[#0E0E1A] bg-[#F2A6F0] shadow-[0_0_8px_#C143BC]" />
                    </div>
                  </div>

                  {/* Matriz de LEDs */}
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full bg-[#C143BC]/50 shadow-[0_0_5px_rgba(193,67,188,0.4)]"
                        style={{ animation: `pulse-subtle 2.4s ease-in-out ${i * 0.18}s infinite` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Preview lateral (cuando aplica) */}
          {preview && (
            <div className="hidden lg:block">
              <div className="sticky top-28">{preview}</div>
            </div>
          )}
        </div>
      </div>

      {/* Cinta al pie */}
      <div className="relative z-10 overflow-hidden border-t border-[#2C2550] bg-[#0E0E1A]" aria-hidden="true">
        <div
          className="flex w-max items-center"
          style={{ animation: "marquee 34s linear infinite" }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "dot-matrix whitespace-nowrap px-6 py-2.5 text-base leading-none sm:text-lg",
                i % 2 === 1 ? "bg-[#2C2550] text-[#E6E4DA]" : "text-[#73726C]",
              )}
            >
              {EVENT.city} · {EVENT.year} · {title}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}

/**
 * Cada campo entra con un desfase pequeño al montar.
 */
export function FieldReveal({
  index = 0,
  children,
}: {
  index?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5), ease }}
    >
      {children}
    </motion.div>
  );
}
