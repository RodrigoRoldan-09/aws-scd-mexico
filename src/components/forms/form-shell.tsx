"use client";

import { motion } from "motion/react";
import { DotHeading } from "@/components/ui/dot-heading";
import { EVENT } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Cáscara compartida por los formularios públicos (/registro, /voluntarios,
 * /speakers): bloque de color a sangre, tinta oscura y la hoja del formulario
 * como una caja dura.
 *
 * La clase `.form-block` reviste los campos y botones de adentro (ver
 * globals.css), así que las primitivas del admin siguen intactas.
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
    <main className="flex min-h-screen flex-col bg-[#0E0E1A] text-[#E6E4DA] pt-28">
      <div className={cn("mx-auto w-full max-w-6xl flex-1 px-5", className)}>
        {/* Cabecera */}
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
              <p className="mt-4 max-w-[48ch] font-mono text-sm leading-relaxed text-[#B4B2A9]">
                {lead}
              </p>
            )}
          </div>
          {aside}
        </motion.div>

        <div
          className={cn(
            "grid gap-10 pb-20",
            preview ? "lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12" : "max-w-3xl",
          )}
        >
          {/* Hoja del formulario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease }}
            className="relative rounded-[12px] p-5 sm:p-8"
            style={{
              background:
                "linear-gradient(135deg, rgba(216,90,48,0.22) 0%, rgba(66,43,120,0.55) 38%, rgba(123,63,166,0.40) 68%, rgba(97,59,184,0.38) 100%)",
              border: "1px solid",
              borderImage:
                "linear-gradient(135deg, rgba(216,90,48,0.60) 0%, rgba(123,63,166,0.60) 50%, rgba(97,59,184,0.65) 100%) 1",
              boxShadow:
                "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(216,90,48,0.16), inset 0 1px 0 rgba(216,90,48,0.14), 0 0 24px rgba(97,59,184,0.20)",
            }}
          >
            {/* Línea decorativa naranja→morado en la parte superior de la tarjeta */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[2px] rounded-t-[12px]"
              style={{
                background:
                  "linear-gradient(90deg, #D85A30 0%, #7B3FA6 50%, #613BB8 100%)",
                opacity: 0.85,
              }}
            />
            {children}
          </motion.div>

          {/* Preview: acompaña el scroll mientras se llena */}
          {preview && (
            <div className="hidden lg:block">
              <div className="sticky top-28">{preview}</div>
            </div>
          )}
        </div>
      </div>

      {/* Cinta al pie: cierra la sección en vez de estrangular el navbar */}
      <div className="overflow-hidden border-t border-[#2C2550] bg-[#0E0E1A]" aria-hidden="true">
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
 * Cada campo entra con un desfase pequeño al montar: el formulario se arma a la
 * vista en vez de aparecer de golpe, y se lee el orden de lo que hay que llenar.
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
