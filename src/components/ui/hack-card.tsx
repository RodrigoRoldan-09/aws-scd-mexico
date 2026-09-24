"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Tarjeta con parallax-tilt al mouse (estética hack): degradado oscuro,
 * borde tenue que se enciende en el acento y ligero brillo al pasar el cursor.
 * En táctil / reduced-motion no rota: solo el hover de color.
 */
export function HackCard({
  children,
  className,
  max = 9,
}: {
  children: React.ReactNode;
  className?: string;
  /** Ángulo máximo de inclinación en grados. */
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * max * 2, y: px * max * 2 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
      style={{ transformStyle: "preserve-3d", perspective: 900 }}
      className={cn(
        "group relative h-full rounded-[12px] border border-[#2C2550] bg-gradient-to-br from-[#1E1838] to-[#0E0E1A] p-5 sm:p-6",
        "transition-all duration-300 hover:border-[#C143BC]",
        "hover:shadow-[0_0_24px_rgba(193,67,188,0.25)]",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
