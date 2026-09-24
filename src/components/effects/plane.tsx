"use client";

import { POS, TRI } from "@/data/plane-model";
import { LowPoly } from "./low-poly";

/**
 * El avión de la pantalla de confirmación.
 *
 * Gira solo y el ratón de arriba abajo lo hace cabecear. El render lo pone
 * `LowPoly`.
 */
export function Plane({ size = 420, className }: { size?: number; className?: string }) {
  return <LowPoly pos={POS} tri={TRI} size={size} className={className} />;
}
