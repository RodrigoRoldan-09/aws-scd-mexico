"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  /** Desde dónde entra. `up` por defecto. */
  from?: "up" | "left" | "right" | "scale";
  /** Distancia del recorrido en px. Más alto = movimiento más notorio. */
  distance?: number;
}

const OFFSETS = {
  up: (d: number) => ({ y: d, x: 0, scale: 1 }),
  left: (d: number) => ({ y: 0, x: -d, scale: 1 }),
  right: (d: number) => ({ y: 0, x: d, scale: 1 }),
  scale: () => ({ y: 24, x: 0, scale: 0.94 }),
};

export function ScrollReveal({
  children,
  delay = 0,
  className,
  from = "up",
  distance = 44,
}: ScrollRevealProps) {
  const off = OFFSETS[from](distance);
  return (
    <motion.div
      initial={{ opacity: 0, ...off }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      // Misma curva y duración que el `landingFadeIn` de Platanus: sale rápido
      // y frena largo, por eso su scroll se siente pesado en el buen sentido.
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
