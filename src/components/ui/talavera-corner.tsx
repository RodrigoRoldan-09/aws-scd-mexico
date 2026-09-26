"use client";

import { cn } from "@/lib/utils";

export interface TalaveraCornerProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Esquinero tradicional de azulejo Talavera adaptado a trazo vectorial neon.
 * Se ubica en las esquinas de tarjetas, banners o bloques para dar el encuadre
 * cerámico mexicano característico.
 */
export function TalaveraCorner({
  position = "top-left",
  className,
  size = 28,
  color = "#C143BC",
}: TalaveraCornerProps) {
  const rotation = {
    "top-left": "rotate-0",
    "top-right": "rotate-90",
    "bottom-right": "rotate-180",
    "bottom-left": "-rotate-90",
  }[position];

  const posClasses = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
  }[position];

  return (
    <div
      className={cn("pointer-events-none absolute z-10 select-none", posClasses, rotation, className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Borde exterior del esquinero */}
        <path
          d="M 2 26 L 2 2 L 26 2"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="square"
        />

        {/* Festón / pétalo interior tradicional de azulejo */}
        <path
          d="M 2 18 C 10 18 18 10 18 2"
          stroke={color}
          strokeWidth="1.2"
          strokeDasharray="2 1.5"
          opacity="0.8"
        />

        {/* Pétalo de lóbulo relleno tenue */}
        <path
          d="M 2 12 C 7 12 12 7 12 2 L 2 2 Z"
          fill="rgba(193, 67, 188, 0.15)"
          stroke={color}
          strokeWidth="1"
        />

        {/* Remache o punto de talavera */}
        <circle cx="7" cy="7" r="1.5" fill="#3DD6D0" />
      </svg>
    </div>
  );
}

/**
 * Contenedor de 4 esquineros de Talavera para encuadrar cualquier tarjeta o bloque.
 */
export function TalaveraFrameCorners({
  size = 24,
  color = "#C143BC",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10", className)} aria-hidden="true">
      <TalaveraCorner position="top-left" size={size} color={color} />
      <TalaveraCorner position="top-right" size={size} color={color} />
      <TalaveraCorner position="bottom-left" size={size} color={color} />
      <TalaveraCorner position="bottom-right" size={size} color={color} />
    </div>
  );
}
