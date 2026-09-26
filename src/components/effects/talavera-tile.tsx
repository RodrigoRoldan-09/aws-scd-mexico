"use client";

import { cn } from "@/lib/utils";

export interface TalaveraTileProps {
  className?: string;
  size?: number | string;
  variant?: "neon-pink" | "neon-cyan" | "neon-cobalt" | "hybrid" | "subtle";
  glow?: boolean;
}

/**
 * Mosaico / Azulejo de Talavera Poblana en versión Cyber-Neon Neo-Brutalista.
 * Combina la geometría radial tradicional (rosetón de 8 pétalos, esquineros
 * festoneados, rombo central y grecas) con el lenguaje visual digital del evento.
 */
export function TalaveraTile({
  className,
  size = 120,
  variant = "hybrid",
  glow = false,
}: TalaveraTileProps) {
  // Paletas neon inspiradas en Talavera tradicional:
  // - Azul cobalto tradicional -> Azul eléctrico / Cyan (#3DD6D0 / #378ADD)
  // - Rosa mexicano / fucsia SCD -> (#C143BC / #F2A6F0)
  // - Cerámica blanca vidriada -> Tinta clara (#E6E4DA)
  const colors = {
    "neon-pink": {
      strokeMain: "#C143BC",
      strokeSec: "#F2A6F0",
      strokeDetail: "rgba(242, 166, 240, 0.4)",
      fillAccent: "rgba(193, 67, 188, 0.12)",
    },
    "neon-cyan": {
      strokeMain: "#3DD6D0",
      strokeSec: "#378ADD",
      strokeDetail: "rgba(61, 214, 208, 0.4)",
      fillAccent: "rgba(61, 214, 208, 0.1)",
    },
    "neon-cobalt": {
      strokeMain: "#378ADD",
      strokeSec: "#3DD6D0",
      strokeDetail: "rgba(55, 138, 221, 0.4)",
      fillAccent: "rgba(55, 138, 221, 0.12)",
    },
    hybrid: {
      strokeMain: "#C143BC",
      strokeSec: "#3DD6D0",
      strokeDetail: "#D85A30",
      fillAccent: "rgba(193, 67, 188, 0.1)",
    },
    subtle: {
      strokeMain: "rgba(193, 67, 188, 0.35)",
      strokeSec: "rgba(61, 214, 208, 0.25)",
      strokeDetail: "rgba(230, 228, 218, 0.15)",
      fillAccent: "transparent",
    },
  }[variant];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "shrink-0 select-none transition-all duration-300",
        glow && "drop-shadow-[0_0_12px_rgba(193,67,188,0.4)]",
        className,
      )}
      aria-hidden="true"
    >
      {/* Marco perimetral del azulejo con marcas neo-brutalistas */}
      <rect
        x="3"
        y="3"
        width="114"
        height="114"
        stroke={colors.strokeMain}
        strokeWidth="2"
      />
      <rect
        x="9"
        y="9"
        width="102"
        height="102"
        stroke={colors.strokeSec}
        strokeWidth="1"
        strokeDasharray="4 2"
        opacity="0.8"
      />

      {/* Marcas de remache / registro de esquina */}
      <rect x="5" y="5" width="2" height="2" fill={colors.strokeSec} />
      <rect x="113" y="5" width="2" height="2" fill={colors.strokeSec} />
      <rect x="5" y="113" width="2" height="2" fill={colors.strokeSec} />
      <rect x="113" y="113" width="2" height="2" fill={colors.strokeSec} />

      {/* Esquineros tradicionales de Talavera (4 esquinas simétricas) */}
      {/* Esquina superior izquierda */}
      <path
        d="M 9 32 C 16 32 25 25 25 9 L 9 9 Z"
        fill={colors.fillAccent}
        stroke={colors.strokeMain}
        strokeWidth="1.2"
      />
      <path d="M 9 20 C 14 20 20 14 20 9" stroke={colors.strokeSec} strokeWidth="1" />
      <circle cx="15" cy="15" r="2" fill={colors.strokeDetail} />

      {/* Esquina superior derecha */}
      <path
        d="M 111 32 C 104 32 95 25 95 9 L 111 9 Z"
        fill={colors.fillAccent}
        stroke={colors.strokeMain}
        strokeWidth="1.2"
      />
      <path d="M 111 20 C 106 20 100 14 100 9" stroke={colors.strokeSec} strokeWidth="1" />
      <circle cx="105" cy="15" r="2" fill={colors.strokeDetail} />

      {/* Esquina inferior izquierda */}
      <path
        d="M 9 88 C 16 88 25 95 25 111 L 9 111 Z"
        fill={colors.fillAccent}
        stroke={colors.strokeMain}
        strokeWidth="1.2"
      />
      <path d="M 9 100 C 14 100 20 106 20 111" stroke={colors.strokeSec} strokeWidth="1" />
      <circle cx="15" cy="105" r="2" fill={colors.strokeDetail} />

      {/* Esquina inferior derecha */}
      <path
        d="M 111 88 C 104 88 95 95 95 111 L 111 111 Z"
        fill={colors.fillAccent}
        stroke={colors.strokeMain}
        strokeWidth="1.2"
      />
      <path d="M 111 100 C 106 100 100 106 100 111" stroke={colors.strokeSec} strokeWidth="1" />
      <circle cx="105" cy="105" r="2" fill={colors.strokeDetail} />

      {/* Rombo central característico de los azulejos de Puebla */}
      <polygon
        points="60,18 102,60 60,102 18,60"
        fill={colors.fillAccent}
        stroke={colors.strokeMain}
        strokeWidth="1.5"
      />
      <polygon
        points="60,26 94,60 60,94 26,60"
        fill="none"
        stroke={colors.strokeSec}
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.75"
      />

      {/* Ejes cardinales y diagonales estilo matriz de coordenadas */}
      <line x1="60" y1="12" x2="60" y2="108" stroke={colors.strokeSec} strokeWidth="0.8" opacity="0.45" />
      <line x1="12" y1="60" x2="108" y2="60" stroke={colors.strokeSec} strokeWidth="0.8" opacity="0.45" />

      {/* Pétalos cardinales del rosetón central */}
      {/* Pétalo Norte */}
      <path
        d="M 60 60 C 53 46 54 36 60 30 C 66 36 67 46 60 60 Z"
        fill={colors.fillAccent}
        stroke={colors.strokeMain}
        strokeWidth="1.2"
      />
      <line x1="60" y1="36" x2="60" y2="54" stroke={colors.strokeDetail} strokeWidth="1" />

      {/* Pétalo Sur */}
      <path
        d="M 60 60 C 53 74 54 84 60 90 C 66 84 67 74 60 60 Z"
        fill={colors.fillAccent}
        stroke={colors.strokeMain}
        strokeWidth="1.2"
      />
      <line x1="60" y1="66" x2="60" y2="84" stroke={colors.strokeDetail} strokeWidth="1" />

      {/* Pétalo Este */}
      <path
        d="M 60 60 C 74 53 84 54 90 60 C 84 66 74 67 60 60 Z"
        fill={colors.fillAccent}
        stroke={colors.strokeMain}
        strokeWidth="1.2"
      />
      <line x1="66" y1="60" x2="84" y2="60" stroke={colors.strokeDetail} strokeWidth="1" />

      {/* Pétalo Oeste */}
      <path
        d="M 60 60 C 46 53 36 54 30 60 C 36 66 46 67 60 60 Z"
        fill={colors.fillAccent}
        stroke={colors.strokeMain}
        strokeWidth="1.2"
      />
      <line x1="36" y1="60" x2="54" y2="60" stroke={colors.strokeDetail} strokeWidth="1" />

      {/* Pétalos diagonales más pequeños (simetría de 8 puntas) */}
      <path
        d="M 60 60 C 53 50 49 43 45 45 C 43 49 50 53 60 60 Z"
        fill={colors.fillAccent}
        stroke={colors.strokeSec}
        strokeWidth="1"
      />
      <path
        d="M 60 60 C 67 50 71 43 75 45 C 77 49 70 53 60 60 Z"
        fill={colors.fillAccent}
        stroke={colors.strokeSec}
        strokeWidth="1"
      />
      <path
        d="M 60 60 C 67 70 71 77 75 75 C 77 71 70 67 60 60 Z"
        fill={colors.fillAccent}
        stroke={colors.strokeSec}
        strokeWidth="1"
      />
      <path
        d="M 60 60 C 53 70 49 77 45 75 C 43 71 50 67 60 60 Z"
        fill={colors.fillAccent}
        stroke={colors.strokeSec}
        strokeWidth="1"
      />

      {/* Centro del rosetón: botón de Talavera en anillo concéntrico */}
      <circle cx="60" cy="60" r="7" fill="#0E0E1A" stroke={colors.strokeMain} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="4" fill={colors.strokeSec} />
      <circle cx="60" cy="60" r="1.5" fill="#0E0E1A" />
    </svg>
  );
}
