"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * Motor para los modelos 3D horneados del sitio.
 *
 * Mismo método que el globo y la figura de la sección "Dónde": proyección a mano en
 * canvas 2D, caras ordenadas por profundidad y sombreadas según hacia dónde
 * miran. Nada de three.js — son un par de miles de triángulos y no hace falta
 * un motor entero ni el cargador de glTF para un objeto decorativo.
 *
 * La geometría llega horneada (ver `@/data/plane-model`)
 * como dos listas planas de enteros: coordenadas en milésimas e índices de cada
 * triángulo. Eso pesa una fracción del `.glb` original y no cuesta una petición
 * al abrir la página.
 */

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Dirección de la luz, normalizada una sola vez. */
const LUZ = (() => {
  const l = [-0.35, 0.78, 0.52];
  const n = Math.hypot(l[0], l[1], l[2]);
  return [l[0] / n, l[1] / n, l[2] / n] as const;
})();

export type LowPolyProps = {
  /** Coordenadas en milésimas: x, y, z por vértice. */
  pos: number[];
  /** Índices de los triángulos, de tres en tres. */
  tri: number[];
  /** Ancho en píxeles; el alto sale de `ratio`. */
  size?: number;
  ratio?: number;
  /** Cuánto ocupa el modelo dentro del lienzo. */
  fill?: number;
  /** Velocidad del giro continuo, en radianes por cuadro. */
  spin?: number;
  /**
   * Si el ratón de arriba abajo controla el cabeceo.
   *
   * El alabeo va atado en sentido contrario: eso es lo que hace que el giro se
   * lea como un viraje y no como un objeto dando vueltas sobre un eje.
   */
  follow?: boolean;
  /** Color base del sólido. */
  color?: { r: number; g: number; b: number };
  className?: string;
};

export function LowPoly({
  pos,
  tri,
  size = 420,
  ratio = 0.62,
  fill = 0.4,
  spin = 0.0055,
  follow = true,
  color = { r: 0x2b, g: 0x2b, b: 0x36 },
  className,
}: LowPolyProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const W = size;
    const H = Math.round(size * ratio);
    // En pantalla táctil se baja la resolución del lienzo antes que el número
    // de caras: se nota mucho menos que perder geometría.
    const tactil = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, tactil ? 1.5 : 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const n = pos.length / 3;
    const vx = new Float32Array(n);
    const vy = new Float32Array(n);
    const vz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      vx[i] = pos[i * 3] / 1000;
      vy[i] = pos[i * 3 + 1] / 1000;
      vz[i] = pos[i * 3 + 2] / 1000;
    }

    // Espacio reutilizado entre cuadros: sin esto se asignarían varios arrays
    // de miles de elementos sesenta veces por segundo.
    const rx = new Float32Array(n);
    const ry = new Float32Array(n);
    const rz = new Float32Array(n);
    const px = new Float32Array(n);
    const py = new Float32Array(n);

    const caras = tri.length / 3;
    const prof = new Float32Array(caras);
    const luzDe = new Float32Array(caras);
    const visibles = new Uint16Array(caras);

    const escala = size * fill;
    const CAM = 4.6;

    let yaw = 0.7;
    let pitch = 0.14;
    let roll = -0.12;
    let objetivo = 0;
    let t = 0;

    const dibujar = () => {
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const cr = Math.cos(roll), sr = Math.sin(roll);

      for (let i = 0; i < n; i++) {
        const x0 = vx[i], y0 = vy[i], z0 = vz[i];
        const y1 = y0 * cr - z0 * sr;
        const z1 = y0 * sr + z0 * cr;
        const x2 = x0 * cp - y1 * sp;
        const y2 = x0 * sp + y1 * cp;
        const x3 = x2 * cy + z1 * sy;
        const z3 = -x2 * sy + z1 * cy;
        rx[i] = x3; ry[i] = y2; rz[i] = z3;
        const f = (escala * CAM) / (CAM - z3);
        px[i] = x3 * f + W / 2;
        py[i] = -y2 * f + H / 2;
      }

      // Sólo las caras que miran a cámara.
      //
      // Se descartan por el signo del área en pantalla, que es más barato que
      // la normal en 3D y ahorra la mitad del trabajo: lo de atrás queda tapado
      // igual, así que dibujarlo era pintar dos veces cada píxel.
      let vis = 0;
      for (let f = 0; f < caras; f++) {
        const a = tri[f * 3], b = tri[f * 3 + 1], c = tri[f * 3 + 2];
        const area =
          (px[b] - px[a]) * (py[c] - py[a]) - (px[c] - px[a]) * (py[b] - py[a]);
        if (area <= 0) continue;

        const ux = rx[b] - rx[a], uy = ry[b] - ry[a], uz = rz[b] - rz[a];
        const wx = rx[c] - rx[a], wy = ry[c] - ry[a], wz = rz[c] - rz[a];
        const nx = uy * wz - uz * wy;
        const ny = uz * wx - ux * wz;
        const nz = ux * wy - uy * wx;
        const len = Math.hypot(nx, ny, nz) || 1;
        luzDe[f] = Math.abs((nx * LUZ[0] + ny * LUZ[1] + nz * LUZ[2]) / len);
        prof[f] = (rz[a] + rz[b] + rz[c]) / 3;
        visibles[vis++] = f;
      }

      // Pintor: lo de más atrás primero.
      const orden = Array.from(visibles.subarray(0, vis)).sort((i, j) => prof[i] - prof[j]);

      ctx.clearRect(0, 0, W, H);
      for (const f of orden) {
        const a = tri[f * 3], b = tri[f * 3 + 1], c = tri[f * 3 + 2];
        const k = 0.26 + 0.9 * luzDe[f];
        ctx.fillStyle = `rgb(${Math.min(255, color.r * k) | 0},${Math.min(255, color.g * k) | 0},${Math.min(255, color.b * k) | 0})`;
        ctx.beginPath();
        ctx.moveTo(px[a], py[a]);
        ctx.lineTo(px[b], py[b]);
        ctx.lineTo(px[c], py[c]);
        ctx.closePath();
        ctx.fill();
      }
    };

    if (reduced) {
      dibujar();
      return;
    }

    const onMove = (e: PointerEvent) => {
      objetivo = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (follow) window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    const tick = () => {
      t += 0.016;
      yaw += spin;
      if (follow) {
        pitch = lerp(pitch, 0.08 + objetivo * 0.34, 0.06);
        roll = lerp(roll, -objetivo * 0.4 + Math.sin(t * 0.45) * 0.1, 0.05);
      } else {
        pitch = lerp(pitch, 0.12 + Math.sin(t * 0.4) * 0.06, 0.05);
      }
      dibujar();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (follow) window.removeEventListener("pointermove", onMove);
    };
  }, [pos, tri, size, ratio, fill, spin, follow, color, reduced]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn("select-none", className)}
      style={{ width: size, height: Math.round(size * ratio) }}
    />
  );
}
