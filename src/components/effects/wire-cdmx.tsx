"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Objeto 3D de alambre girando: el Ángel de la Independencia con el
 * Iztaccíhuatl y el Popocatépetl detrás, como se ven desde la ciudad.
 *
 * Motor propio en canvas 2D: vértices en 3D, rotación en Y y X, proyección en
 * perspectiva y trazo con opacidad según profundidad. Pesa ~5 KB frente a los
 * ~600 KB de three.js para el mismo resultado.
 */

type V3 = [number, number, number];
type Edge = [number, number];

const GROUND = -2.4;
const RIDGE_Z = -2.2;

function buildModel(): { verts: V3[]; edges: Edge[]; beacon: number } {
  const verts: V3[] = [];
  const edges: Edge[] = [];

  const add = (v: V3) => verts.push(v) - 1;

  /** Anillo de `n` lados; con n = 4 y fase 45° es una planta cuadrada. */
  const ring = (y: number, r: number, n: number, phase = 0, cx = 0, cz = 0) => {
    const start = verts.length;
    for (let i = 0; i < n; i++) {
      const a = phase + (i / n) * Math.PI * 2;
      add([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]);
    }
    for (let i = 0; i < n; i++) edges.push([start + i, start + ((i + 1) % n)]);
    return start;
  };

  /** Anillos apilados unidos por aristas verticales. */
  const stack = (levels: Array<[number, number]>, n: number, phase = 0) => {
    const starts = levels.map(([y, r]) => ring(y, r, n, phase));
    for (let l = 0; l < starts.length - 1; l++) {
      for (let i = 0; i < n; i++) edges.push([starts[l] + i, starts[l + 1] + i]);
    }
    return starts;
  };

  /** Círculo de frente a la cámara (plano XY). */
  const circle = (cx: number, cy: number, cz: number, r: number, n: number) => {
    const start = verts.length;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      add([cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz]);
    }
    for (let i = 0; i < n; i++) edges.push([start + i, start + ((i + 1) % n)]);
  };

  const line = (points: V3[]) => {
    const ids = points.map(add);
    for (let i = 0; i < ids.length - 1; i++) edges.push([ids[i], ids[i + 1]]);
    return ids;
  };

  const SQ = Math.PI / 4;
  // Radio de un cuadrado de semilado `w`.
  const sq = (w: number) => w * Math.SQRT2;

  // ── Escalinata y pedestal ──
  stack([[GROUND, sq(0.95)], [-2.2, sq(0.95)]], 4, SQ);
  stack([[-2.2, sq(0.78)], [-2.0, sq(0.78)]], 4, SQ);
  stack([[-2.0, sq(0.55)], [-1.35, sq(0.55)], [-1.3, sq(0.62)], [-1.2, sq(0.62)]], 4, SQ);

  // Esculturas de las cuatro esquinas del pedestal.
  for (const [x, z] of [[-0.68, -0.68], [0.68, -0.68], [0.68, 0.68], [-0.68, 0.68]]) {
    line([[x, -2.0, z], [x, -1.72, z]]);
  }

  // ── Columna con sus anillos ──
  stack(
    [[-1.2, 0.24], [-0.65, 0.23], [-0.6, 0.25], [-0.55, 0.23], [0.1, 0.21], [0.15, 0.23], [0.2, 0.21], [1.1, 0.19]],
    8,
  );

  // ── Capitel y base de la estatua ──
  stack([[1.1, 0.19], [1.3, 0.3]], 8);
  stack([[1.3, sq(0.3)], [1.38, sq(0.3)]], 4, SQ);
  stack([[1.38, 0.12], [1.52, 0.12]], 8);

  // ── La Victoria alada ──
  // Túnica: pies, cadera, cintura, hombros, cuello.
  const body: Array<[number, number]> = [[0.05, 1.52], [0.1, 1.78], [0.07, 1.95], [0.11, 2.08], [0.03, 2.13]];
  for (const s of [1, -1]) line(body.map(([x, y]): V3 => [s * x, y, 0]));
  line([[-0.11, 2.08, 0], [0.11, 2.08, 0]]);
  circle(0, 2.19, 0, 0.055, 8);

  // Alas abiertas hacia atrás, con plumas.
  for (const s of [1, -1]) {
    const root: V3 = [s * 0.05, 2.06, -0.05];
    const tip: V3 = [s * 0.46, 2.42, -0.22];
    const trail: V3[] = [[s * 0.4, 2.0, -0.2], [s * 0.26, 1.84, -0.13], [s * 0.06, 1.9, -0.05]];
    line([root, tip, ...trail]);
    for (const p of trail.slice(0, 2)) line([root, p]);
  }

  // Brazo derecho en alto con la corona de laurel; el izquierdo con la cadena rota.
  line([[0.11, 2.08, 0], [0.18, 2.24, 0.02], [0.16, 2.38, 0.02]]);
  circle(0.16, 2.45, 0.02, 0.07, 10);
  const beacon = add([0.16, 2.45, 0.02]);
  line([[-0.11, 2.08, 0], [-0.22, 1.94, 0.04], [-0.26, 1.82, 0.05], [-0.23, 1.76, 0.05], [-0.28, 1.7, 0.05]]);

  // ── Volcanes ──
  // Iztaccíhuatl, la "mujer dormida": cabeza, pecho, rodillas y pies.
  // Popocatépetl: cono con cráter. Entre ambos, el Paso de Cortés.
  const ridge = [
    -3.4, -2.1, -3.0, -1.6, -2.7, -1.15, -2.5, -1.25, -2.2, -1.1, -1.9, -0.85,
    -1.6, -0.95, -1.3, -1.05, -1.0, -0.95, -0.7, -1.15, -0.4, -1.2, -0.1, -1.6,
    0.3, -1.85, 0.9, -1.4, 1.5, -0.7, 1.95, -0.15, 2.15, -0.22, 2.35, -0.15,
    2.8, -0.75, 3.2, -1.35, 3.5, -1.7,
  ];
  const ridgeIds = line(
    Array.from({ length: ridge.length / 2 }, (_, i): V3 => [ridge[i * 2], ridge[i * 2 + 1], RIDGE_Z]),
  );
  // Faldas: cada punto baja a la base y da la trama de la ladera.
  ridgeIds.forEach((id, i) => {
    const base = add([ridge[i * 2], GROUND, RIDGE_Z]);
    edges.push([id, base]);
  });

  // Fumarola del Popocatépetl.
  circle(2.12, 0.02, RIDGE_Z, 0.09, 8);
  circle(2.02, 0.26, RIDGE_Z, 0.13, 10);
  circle(2.12, 0.56, RIDGE_Z, 0.17, 12);

  // ── Rejilla de suelo ──
  const G = 4;
  for (let i = -G; i <= G; i++) line([[i * 0.9, GROUND, -2.2], [i * 0.9, GROUND, 2.2]]);
  for (let j = -2; j <= 2; j++) line([[-G * 0.9, GROUND, j * 1.1], [G * 0.9, GROUND, j * 1.1]]);

  return { verts, edges, beacon };
}

export function WireCdmx({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { verts, edges, beacon } = buildModel();
    let raf = 0;
    let angle = 0.6;
    // El puntero inclina la escena; sin puntero se queda en la inclinación base.
    let targetPitch = 0.12;
    let pitch = 0.12;

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetPitch = 0.12 + ny * 0.4;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const ACCENT = "193,67,188";
    const BEACON = "193,67,188";

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) {
        raf = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, w, h);

      pitch += (targetPitch - pitch) * 0.05;

      const cx = w / 2;
      const cy = h * 0.56;
      const scale = Math.min(w, h) * 0.29;
      const camZ = 7.5;
      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const cosP = Math.cos(pitch), sinP = Math.sin(pitch);

      const proj = verts.map(([x, y, z]) => {
        const x1 = x * cosA - z * sinA;
        const z1 = x * sinA + z * cosA;
        const y2 = y * cosP - z1 * sinP;
        const z2 = y * sinP + z1 * cosP;
        const d = camZ + z2;
        const f = 6 / Math.max(d, 0.1);
        return { x: cx + x1 * f * scale, y: cy - y2 * f * scale, depth: z2 };
      });

      // Las aristas lejanas se pintan primero para que las cercanas manden.
      const order = edges
        .map((e, i) => ({ i, d: (proj[e[0]].depth + proj[e[1]].depth) / 2 }))
        .sort((a, b) => a.d - b.d);

      for (const { i } of order) {
        const [a, b] = edges[i];
        const pa = proj[a], pb = proj[b];
        const depth = (pa.depth + pb.depth) / 2;
        // Cuanto más lejos, más tenue: eso es lo que da la sensación de espacio.
        const alpha = 0.16 + Math.max(0, (depth + 2.6) / 5.2) * 0.7;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.strokeStyle = `rgba(${ACCENT},${Math.min(alpha, 0.9)})`;
        ctx.lineWidth = depth > 0 ? 1.3 : 0.8;
        ctx.stroke();
      }

      // Destello en la corona de laurel.
      const tip = proj[beacon];
      const t = reduced ? 0.5 : (Date.now() % 1400) / 1400;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 2 + t * 9, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${BEACON},${(1 - t) * 0.8})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();

      if (!reduced) angle += 0.0022;
      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Ángel de la Independencia con el Iztaccíhuatl y el Popocatépetl en alambre 3D"
    />
  );
}
