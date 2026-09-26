"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export interface TalaveraHaloProps {
  className?: string;
  size?: number;
}

/**
 * Medallón concéntrico de Talavera Poblana en versión Cyber-Neon.
 * Diseñado como halo geométrico detrás del logo/moneda o fondos de sección.
 * Incorpora la rueda radial de 16 almenas, 8 pétalos de flor poblana,
 * rombos concéntricos y marcas de circuito neo-brutalistas.
 */
export function TalaveraHalo({ className, size = 480 }: TalaveraHaloProps) {
  const reduced = useReducedMotion();

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-visible",
        className,
      )}
      aria-hidden="true"
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
        className="w-full h-full max-w-[540px] max-h-[540px] opacity-40 hover:opacity-70 transition-opacity duration-700"
      >
        {/* Aro exterior mayor con marcas cardinales */}
        <circle
          cx="200"
          cy="200"
          r="192"
          stroke="#C143BC"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity="0.6"
        />
        <circle
          cx="200"
          cy="200"
          r="182"
          stroke="#3DD6D0"
          strokeWidth="0.8"
          opacity="0.5"
        />

        {/* 16 Puntas perimetrales de festón de Talavera */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;
          return (
            <g key={i} transform={`rotate(${angle} 200 200)`}>
              <path
                d="M 194 10 L 200 2 L 206 10 Z"
                fill="#C143BC"
                opacity="0.8"
              />
              <circle cx="200" cy="18" r="2" fill="#3DD6D0" />
              <line
                x1="200"
                y1="22"
                x2="200"
                y2="36"
                stroke="#C143BC"
                strokeWidth="1"
                opacity="0.4"
              />
            </g>
          );
        })}

        {/* Cuadrado / Rombo doble de base cerámica (Talavera de cuatro esquinas) */}
        <rect
          x="75"
          y="75"
          width="250"
          height="250"
          stroke="#C143BC"
          strokeWidth="1.2"
          opacity="0.35"
        />
        <rect
          x="75"
          y="75"
          width="250"
          height="250"
          transform="rotate(45 200 200)"
          stroke="#3DD6D0"
          strokeWidth="1.2"
          opacity="0.3"
        />

        {/* Anillo intermedio con greca radial */}
        <circle
          cx="200"
          cy="200"
          r="132"
          stroke="#C143BC"
          strokeWidth="1.5"
          opacity="0.7"
        />
        <circle
          cx="200"
          cy="200"
          r="124"
          stroke="#F2A6F0"
          strokeWidth="0.75"
          strokeDasharray="2 3"
          opacity="0.6"
        />

        {/* Rosetón de 8 pétalos grandes estilo Talavera clásica */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;
          return (
            <g key={i} transform={`rotate(${angle} 200 200)`}>
              {/* Pétalo festoneado */}
              <path
                d="M 200 200 C 182 165 186 128 200 100 C 214 128 218 165 200 200 Z"
                fill="rgba(193, 67, 188, 0.05)"
                stroke="#C143BC"
                strokeWidth="1.3"
              />
              {/* Nervadura central de neón cyan */}
              <line
                x1="200"
                y1="130"
                x2="200"
                y2="185"
                stroke="#3DD6D0"
                strokeWidth="1.2"
                opacity="0.85"
              />
              {/* Gotas/puntos de pigmento azul cobalto */}
              <circle cx="200" cy="116" r="3" fill="#3DD6D0" />
              <circle cx="193" cy="138" r="1.5" fill="#F2A6F0" opacity="0.8" />
              <circle cx="207" cy="138" r="1.5" fill="#F2A6F0" opacity="0.8" />
            </g>
          );
        })}

        {/* Círculo central con corona solar de Talavera */}
        <circle
          cx="200"
          cy="200"
          r="54"
          stroke="#3DD6D0"
          strokeWidth="1.5"
          opacity="0.8"
        />
        <circle
          cx="200"
          cy="200"
          r="48"
          stroke="#C143BC"
          strokeWidth="1"
          strokeDasharray="4 2"
          opacity="0.7"
        />

        {/* Rayos concéntricos del núcleo */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;
          return (
            <line
              key={i}
              x1="200"
              y1="152"
              x2="200"
              y2="160"
              transform={`rotate(${angle} 200 200)`}
              stroke="#F2A6F0"
              strokeWidth="1"
              opacity="0.7"
            />
          );
        })}

        {/* Punto central */}
        <circle cx="200" cy="200" r="12" fill="rgba(14, 14, 26, 0.8)" stroke="#C143BC" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="4" fill="#3DD6D0" />
      </motion.svg>
    </div>
  );
}
