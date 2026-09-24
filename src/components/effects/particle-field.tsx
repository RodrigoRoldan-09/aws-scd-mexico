"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const SYMBOLS = ["{", "}", "=>", "//", "</>", "const", "aws", "λ"];

interface Particle {
  x: number; y: number; symbol: string; size: number;
  speed: number; opacity: number; rotation: number; rotationSpeed: number;
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.innerWidth < 768) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      size: 10 + Math.random() * 6, speed: 0.2 + Math.random() * 0.3,
      opacity: 0.08 + Math.random() * 0.15, rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.005,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
        ctx.font = `${p.size}px "JetBrains Mono", monospace`;
        ctx.fillStyle = `rgba(107,107,128,${p.opacity})`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(p.symbol, 0, 0); ctx.restore();
      }
    };

    if (reducedMotion) { draw(); return () => window.removeEventListener("resize", resize); }

    let animId: number; let visible = true;
    const onVis = () => { visible = document.visibilityState === "visible"; };
    document.addEventListener("visibilitychange", onVis);

    const loop = () => {
      if (visible) {
        for (const p of particles) { p.y -= p.speed; p.rotation += p.rotationSpeed; if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; } }
        draw();
      }
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis); };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none w-full h-full" aria-hidden="true" />;
}
