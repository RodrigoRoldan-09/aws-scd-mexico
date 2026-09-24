"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { WireSolid } from "@/components/effects/wire-solid";
import { EVENT } from "@/lib/constants";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Pantalla 404 de marca, reutilizada por el not-found de [locale] y el raíz.
 *
 * Sigue el lenguaje del sitio: cintas dot-matrix, "404" gigante en Oxanium y
 * botones de caja dura.
 */
export function NotFoundScreen() {
  const strip = `404 · ${EVENT.name} ${EVENT.year} ·`;

  return (
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-surface-900">
      {/* Cinta superior */}
      <div className="absolute inset-x-0 top-20 overflow-hidden border-y-2 border-hack-block/25" aria-hidden="true">
        <div className="flex w-max items-center" style={{ animation: "marquee 30s linear infinite" }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className={`dot-matrix whitespace-nowrap px-6 py-2 text-base leading-none sm:text-lg ${
                i % 2 === 1 ? "bg-hack-block text-hack-ink" : "text-hack-block"
              }`}
            >
              {strip}
            </span>
          ))}
        </div>
      </div>

      {/* Cinta inferior, en sentido contrario */}
      <div className="absolute inset-x-0 bottom-16 overflow-hidden border-y-2 border-hack-block/25" aria-hidden="true">
        <div className="flex w-max items-center" style={{ animation: "marquee-reverse 36s linear infinite" }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className={`dot-matrix whitespace-nowrap px-6 py-2 text-base leading-none sm:text-lg ${
                i % 2 === 0 ? "bg-hack-block text-hack-ink" : "text-hack-block"
              }`}
            >
              {strip}
            </span>
          ))}
        </div>
      </div>

      {/* Sólido girando de fondo */}
      <WireSolid
        shape="icosa"
        className="pointer-events-none absolute right-[-8%] top-1/2 hidden h-[560px] w-[560px] -translate-y-1/2 opacity-25 lg:block"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="dot-matrix text-lg text-hack-block md:text-xl"
        >
          error 404
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease }}
          className="mt-2 font-display text-[22vw] font-medium leading-[0.8] tracking-tighter text-surface-50 sm:text-[18vw] lg:text-[13vw]"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease }}
          className="mt-6 max-w-[46ch] font-mono text-base leading-relaxed text-surface-300"
        >
          Esta página no existe — pero el evento sí.{" "}
          <span className="text-hack-block">
            {EVENT.city}, 4 de noviembre de 2026. Entrada gratuita.
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.32, ease }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Link
            href="/"
            className="inline-flex items-center bg-hack-block px-8 py-4 text-surface-900 shadow-[5px_5px_0_0_var(--color-hack-dim)] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--color-hack-dim)] active:translate-x-0 active:translate-y-0 active:shadow-none"
          >
            <span className="dot-matrix text-lg leading-none">volver al inicio</span>
          </Link>
          <Link
            href="/registro"
            className="inline-flex items-center border-2 border-hack-block px-8 py-4 text-hack-block transition-colors duration-200 hover:bg-hack-block hover:text-hack-ink"
          >
            <span className="dot-matrix text-lg leading-none">regístrate gratis</span>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
