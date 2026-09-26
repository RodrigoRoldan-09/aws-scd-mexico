"use client";

import { cn } from "@/lib/utils";

export interface TalaveraGrecaProps {
  className?: string;
  variant?: "pink" | "cyan" | "cobalt" | "hybrid";
  height?: number;
  animated?: boolean;
}

/**
 * Greca perimetral de Talavera Poblana en estética neon neo-brutalista.
 * Patrón geométrico continuo (rombo escalonado, festón de pétalos y almenas)
 * para divisiones de sección, remates superiores e inferiores.
 */
export function TalaveraGreca({
  className,
  variant = "hybrid",
  height = 24,
  animated = false,
}: TalaveraGrecaProps) {
  const colors = {
    pink: {
      primary: "#C143BC",
      secondary: "#F2A6F0",
      accent: "#7B3FA6",
    },
    cyan: {
      primary: "#3DD6D0",
      secondary: "#378ADD",
      accent: "#2A1F5E",
    },
    cobalt: {
      primary: "#378ADD",
      secondary: "#3DD6D0",
      accent: "#422B78",
    },
    hybrid: {
      primary: "#C143BC",
      secondary: "#3DD6D0",
      accent: "#D85A30",
    },
  }[variant];

  // Identificador único para el patrón SVG
  const patternId = `talavera-greca-pattern-${variant}`;

  return (
    <div
      className={cn("w-full overflow-hidden select-none border-y border-[#2C2550]/80 bg-[#0E0E1A]/90", className)}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    >
      <svg
        className={cn(
          "w-full h-full",
          animated && "animate-marquee"
        )}
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={patternId}
            width="48"
            height={height}
            patternUnits="userSpaceOnUse"
          >
            {/* Fondo de patrón con guía tenue */}
            <rect width="48" height={height} fill="transparent" />

            {/* Greca escalonada / almena superior */}
            <path
              d={`M 0 0 L 12 0 L 12 4 L 24 4 L 24 0 L 36 0 L 36 4 L 48 4`}
              stroke={colors.primary}
              strokeWidth="1.2"
              fill="none"
            />

            {/* Rombo central característico de Talavera con flor interior */}
            <path
              d={`M 12 ${height / 2} L 24 5 L 36 ${height / 2} L 24 ${height - 5} Z`}
              stroke={colors.secondary}
              strokeWidth="1.2"
              fill="rgba(193, 67, 188, 0.08)"
            />

            {/* Punto central del rombo */}
            <circle
              cx="24"
              cy={height / 2}
              r="2"
              fill={colors.accent}
            />

            {/* Conectores laterales entre azulejos */}
            <path
              d={`M 0 ${height / 2} L 6 ${height / 2 - 4} L 12 ${height / 2} L 6 ${height / 2 + 4} Z`}
              stroke={colors.primary}
              strokeWidth="1"
              fill="none"
            />
            <path
              d={`M 36 ${height / 2} L 42 ${height / 2 - 4} L 48 ${height / 2} L 42 ${height / 2 + 4} Z`}
              stroke={colors.primary}
              strokeWidth="1"
              fill="none"
            />

            {/* Greca escalonada / almena inferior */}
            <path
              d={`M 0 ${height} L 12 ${height} L 12 ${height - 4} L 24 ${height - 4} L 24 ${height} L 36 ${height} L 36 ${height - 4} L 48 ${height - 4}`}
              stroke={colors.primary}
              strokeWidth="1.2"
              fill="none"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
