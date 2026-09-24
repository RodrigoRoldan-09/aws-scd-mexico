"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Poliedro de alambre girando, para acompañar secciones sin imagen propia.
 * Mismo motor que `WireCdmx`: vértices 3D, rotación en dos ejes y proyección en
 * perspectiva, con las aristas lejanas atenuadas.
 *
 * `shape` elige la figura: `icosa` (agenda / FAQ) o `cube` (rejilla de datos).
 */
type V3 = [number, number, number];
type Edge = [number, number];

function icosahedron(): { verts: V3[]; edges: Edge[] } {
  const p = (1 + Math.sqrt(5)) / 2;
  const raw: V3[] = [
    [-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0],
    [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p],
    [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1],
  ];
  const n = Math.hypot(1, p);
  const verts = raw.map(([x, y, z]) => [x / n, y / n, z / n] as V3);

  // Dos vértices son adyacentes si su distancia es la arista mínima.
  const edges: Edge[] = [];
  let min = Infinity;
  for (let i = 0; i < verts.length; i++)
    for (let j = i + 1; j < verts.length; j++) {
      const d = Math.hypot(
        verts[i][0] - verts[j][0],
        verts[i][1] - verts[j][1],
        verts[i][2] - verts[j][2],
      );
      if (d < min) min = d;
    }
  for (let i = 0; i < verts.length; i++)
    for (let j = i + 1; j < verts.length; j++) {
      const d = Math.hypot(
        verts[i][0] - verts[j][0],
        verts[i][1] - verts[j][1],
        verts[i][2] - verts[j][2],
      );
      if (Math.abs(d - min) < 0.01) edges.push([i, j]);
    }
  return { verts, edges };
}

function cube(): { verts: V3[]; edges: Edge[] } {
  const verts: V3[] = [];
  const edges: Edge[] = [];
  // Tres cubos concéntricos: da profundidad sin más geometría.
  [0.45, 0.72, 1].forEach((s, layer) => {
    const base = verts.length;
    for (const sx of [-1, 1])
      for (const sy of [-1, 1])
        for (const sz of [-1, 1]) verts.push([sx * s, sy * s, sz * s]);
    const idx = (a: number, b: number, c: number) =>
      base + ((a > 0 ? 4 : 0) + (b > 0 ? 2 : 0) + (c > 0 ? 1 : 0));
    for (const a of [-1, 1])
      for (const b of [-1, 1]) {
        edges.push([idx(a, b, -1), idx(a, b, 1)]);
        edges.push([idx(a, -1, b), idx(a, 1, b)]);
        edges.push([idx(-1, a, b), idx(1, a, b)]);
      }
    void layer;
  });
  return { verts, edges };
}

export function WireSolid({
  shape = "icosa",
  className,
}: {
  shape?: "icosa" | "cube";
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { verts, edges } = shape === "cube" ? cube() : icosahedron();
    let raf = 0;
    let ay = 0.4;
    let ax = 0.3;

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

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) {
        raf = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h) * 0.33;
      const cosY = Math.cos(ay), sinY = Math.sin(ay);
      const cosX = Math.cos(ax), sinX = Math.sin(ax);

      const proj = verts.map(([x, y, z]) => {
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const f = 4 / (4.2 + z2);
        return { x: cx + x1 * f * scale, y: cy - y2 * f * scale, z: z2 };
      });

      for (const [a, b] of edges) {
        const pa = proj[a], pb = proj[b];
        const depth = (pa.z + pb.z) / 2;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.strokeStyle = `rgba(${ACCENT},${0.18 + (1 - depth) * 0.35})`;
        ctx.lineWidth = depth < 0 ? 1.4 : 0.8;
        ctx.stroke();
      }

      // Vértices como puntos, sólo los de la cara frontal
      for (const p of proj) {
        if (p.z > 0.2) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ACCENT},0.85)`;
        ctx.fill();
      }

      if (!reduced) {
        ay += 0.0034;
        ax += 0.0013;
      }
      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [shape, reduced]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
