"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { LAND } from "@/data/land";

/**
 * Globo girando con los continentes dibujados de verdad.
 *
 * Los contornos salen de `src/data/land.ts` (Natural Earth 110m). Se proyecta a
 * mano en canvas 2D en vez de cargar three.js: cada punto lat/long se rota
 * sobre el eje Y y se proyecta en ortográfica. Lo que cae en la cara oculta se
 * descarta.
 */

type Point = { lat: number; lon: number };

const DEG = Math.PI / 180;
const TILT = 20 * DEG;

/** Rota (lat,lon) por `spin`, inclina el eje y proyecta. `z > 0` = cara visible. */
function project(lat: number, lon: number, spin: number, r: number, tilt = TILT) {
  const la = lat * DEG;
  const lo = lon * DEG + spin;
  const cl = Math.cos(la);
  const x = cl * Math.sin(lo);
  const y = Math.sin(la);
  const z = cl * Math.cos(lo);
  const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
  const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
  return { x: x * r, y: -y2 * r, z: z2 };
}

export function WireGlobe({
  marker = { lat: 19.43, lon: -99.13 }, // Ciudad de México
  label,
  className,
}: {
  marker?: Point;
  label?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Con `tilt` igual a la latitud el marcador queda al centro; los 12° de
    // más lo bajan un poco para que se vea Norteamérica completa encima.
    const baseTilt = (marker.lat + 12) * DEG;

    let raf = 0;
    // No gira solo: sólo se mueve al arrastrarlo, y al soltar vuelve al marcador.
    const home = -marker.lon * DEG;
    let spin = home;
    let spinTarget = home;
    let tiltExtra = 0;
    let tiltTarget = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      spinTarget += (e.clientX - lastX) * 0.006;
      tiltTarget = Math.max(-0.6, Math.min(0.6, tiltTarget + (e.clientY - lastY) * 0.004));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      canvas.releasePointerCapture?.(e.pointerId);
      canvas.style.cursor = "grab";
      // Vuelve al encuadre inicial por el camino más corto.
      const turns = Math.round((spinTarget - home) / (Math.PI * 2));
      spinTarget = home + turns * Math.PI * 2;
      tiltTarget = 0;
    };
    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = canvas.clientWidth;
      if (!size) return;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const ACCENT = "193,67,188";
    const MARK = "193,67,188";

    const draw = () => {
      const size = canvas.clientWidth;
      if (!size) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.44;
      ctx.clearRect(0, 0, size, size);

      // Disco de fondo: separa la esfera del negro
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT},0.05)`;
      ctx.fill();

      ctx.lineWidth = 0.6;
      ctx.strokeStyle = `rgba(${ACCENT},0.14)`;
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let pen = false;
        for (let lat = -90; lat <= 90; lat += 5) {
          const p = project(lat, lon, spin, r, baseTilt + tiltExtra);
          if (p.z < 0) { pen = false; continue; }
          if (!pen) { ctx.moveTo(cx + p.x, cy + p.y); pen = true; }
          else ctx.lineTo(cx + p.x, cy + p.y);
        }
        ctx.stroke();
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let pen = false;
        for (let lon = -180; lon <= 180; lon += 5) {
          const p = project(lat, lon, spin, r, baseTilt + tiltExtra);
          if (p.z < 0) { pen = false; continue; }
          if (!pen) { ctx.moveTo(cx + p.x, cy + p.y); pen = true; }
          else ctx.lineTo(cx + p.x, cy + p.y);
        }
        ctx.stroke();
      }

      ctx.lineWidth = 1.4;
      ctx.lineJoin = "round";
      for (const arc of LAND) {
        ctx.beginPath();
        let pen = false;
        for (let i = 0; i < arc.length; i += 2) {
          const p = project(arc[i + 1], arc[i], spin, r, baseTilt + tiltExtra);
          if (p.z < 0) { pen = false; continue; }
          if (!pen) { ctx.moveTo(cx + p.x, cy + p.y); pen = true; }
          else ctx.lineTo(cx + p.x, cy + p.y);
        }
        ctx.strokeStyle = `rgba(${ACCENT},0.75)`;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${ACCENT},0.4)`;
      ctx.stroke();

      const m = project(marker.lat, marker.lon, spin, r, baseTilt + tiltExtra);
      if (m.z > -0.02) {
        const mx = cx + m.x;
        const my = cy + m.y;
        const t = reduced ? 0.5 : (Date.now() % 1800) / 1800;

        // Halo alrededor del marcador, recortado a la esfera.
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        const halo = ctx.createRadialGradient(mx, my, 0, mx, my, r * 0.55);
        halo.addColorStop(0, `rgba(${ACCENT},0.42)`);
        halo.addColorStop(0.45, `rgba(${ACCENT},0.14)`);
        halo.addColorStop(1, `rgba(${ACCENT},0)`);
        ctx.fillStyle = halo;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(mx, my, 5 + t * 22, 0, Math.PI * 2);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(${MARK},${(1 - t) * 0.8})`;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(mx - 14, my); ctx.lineTo(mx - 6, my);
        ctx.moveTo(mx + 6, my);  ctx.lineTo(mx + 14, my);
        ctx.moveTo(mx, my - 14); ctx.lineTo(mx, my - 6);
        ctx.moveTo(mx, my + 6);  ctx.lineTo(mx, my + 14);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = `rgba(${MARK},0.9)`;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();

        if (label) {
          ctx.beginPath();
          ctx.moveTo(mx + 10, my - 10);
          ctx.lineTo(mx + 32, my - 32);
          ctx.lineTo(mx + 96, my - 32);
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(${ACCENT},0.6)`;
          ctx.stroke();

          ctx.font = "700 12px ui-monospace, SFMono-Regular, monospace";
          ctx.fillStyle = "#FFFFFF";
          ctx.textBaseline = "bottom";
          ctx.fillText(label.toUpperCase(), mx + 34, my - 36);
        }
      }

      spin += (spinTarget - spin) * (dragging ? 0.35 : 0.06);
      tiltExtra += (tiltTarget - tiltExtra) * (dragging ? 0.35 : 0.06);
      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [marker.lat, marker.lon, label, reduced]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label={label ? `Globo terráqueo señalando ${label}` : "Globo terráqueo"}
    />
  );
}
