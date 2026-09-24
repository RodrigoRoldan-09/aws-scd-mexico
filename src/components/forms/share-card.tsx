"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EVENT } from "@/lib/constants";
import { cleanWhitespace, toUpper } from "@/lib/normalize";

/**
 * Tarjeta cuadrada para redes, dibujada en canvas y descargable.
 *
 * Se dibuja acá y no se pide al servidor por una razón práctica: el nombre ya
 * está en el navegador, así que generar la imagen en el cliente evita un viaje
 * de ida y vuelta y que el nombre viaje a ninguna parte.
 *
 * 1080×1080 es el lado seguro para Instagram, WhatsApp y LinkedIn a la vez.
 */

const SIZE = 1080;

const C = {
  ink: "#0A0A0F",
  block: "#F2A6F0",
  deep: "#C143BC",
  white: "#FFFFFF",
};

export type ShareKind = "attendee" | "speaker";

/**
 * Textos del canvas, traducidos por quien llama.
 *
 * No se leen acá con `useTranslations` a propósito: el dibujo es una función
 * pura que recibe lo que tiene que pintar, y así se puede probar sin montar el
 * proveedor de idioma.
 */
export type ShareLabels = {
  kicker: string;
  headline: string;
  date: string;
  footer: string;
};

/**
 * Lee la familia tipográfica real desde el DOM.
 *
 * Las fuentes entran por `next/font`, que genera nombres con hash: escribirlos
 * a mano en `ctx.font` no funcionaría. Se toma la que el navegador ya resolvió
 * para un elemento de la página.
 */
function familyOf(varName: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const probe = document.createElement("span");
  probe.style.fontFamily = `var(${varName})`;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).fontFamily;
  probe.remove();
  return resolved && resolved !== "var(" + varName + ")" ? resolved : fallback;
}

/** Baja el tamaño hasta que el texto quepa en `maxWidth`, con un piso mínimo. */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  family: string,
  weight: string,
  from: number,
  min: number,
): number {
  let size = from;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/** Parte un texto en líneas que quepan en `maxWidth`. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function draw(canvas: HTMLCanvasElement, name: string, labels: ShareLabels) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const display = familyOf("--font-oxanium", "system-ui, sans-serif");
  const mono = familyOf("--font-jetbrains", "monospace");
  const dot = familyOf("--font-handjet", mono);

  canvas.width = SIZE;
  canvas.height = SIZE;

  // Fondo
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Rejilla tenue: da textura sin competir con el texto.
  ctx.strokeStyle = "rgba(242,166,240,0.07)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= SIZE; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SIZE); ctx.stroke();
  }
  for (let y = 0; y <= SIZE; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SIZE, y); ctx.stroke();
  }

  // Marco duro
  ctx.strokeStyle = C.block;
  ctx.lineWidth = 6;
  ctx.strokeRect(48, 48, SIZE - 96, SIZE - 96);

  // Cinta superior invertida
  ctx.fillStyle = C.block;
  ctx.fillRect(48, 48, SIZE - 96, 96);
  ctx.fillStyle = C.ink;
  ctx.font = `40px ${dot}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("AWS STUDENT COMMUNITY DAY · MÉXICO 2026", 84, 98);

  // Kicker
  ctx.textAlign = "left";
  ctx.fillStyle = C.deep;
  ctx.font = `600 34px ${mono}`;
  ctx.fillText(labels.kicker, 84, 248);

  // Titular, encogido si hace falta para no salirse del marco.
  const anchoUtil = SIZE - 168;
  ctx.fillStyle = C.white;
  fitFont(ctx, labels.headline, anchoUtil, display, "500", 150, 84);
  ctx.fillText(labels.headline, 84, 372);

  // Nombre
  const clean = toUpper(cleanWhitespace(name));
  if (clean) {
    ctx.fillStyle = C.block;
    // El nombre también: hay apellidos que no caben ni partidos en dos líneas.
    fitFont(ctx, clean, anchoUtil, display, "500", 76, 48);
    const lines = wrap(ctx, clean, anchoUtil).slice(0, 2);
    lines.forEach((l, i) => ctx.fillText(l, 84, 486 + i * 84));
  }

  // Separador
  ctx.strokeStyle = "rgba(242,166,240,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(84, 700);
  ctx.lineTo(SIZE - 84, 700);
  ctx.stroke();

  // Datos del evento
  ctx.fillStyle = C.white;
  ctx.font = `700 44px ${mono}`;
  ctx.fillText(labels.date, 84, 768);

  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = `32px ${mono}`;
  ctx.fillText(EVENT.venue.name.toUpperCase(), 84, 826);
  ctx.fillText("CIUDAD DE MÉXICO · MÉXICO", 84, 872);

  // Cinta inferior
  ctx.fillStyle = C.block;
  ctx.fillRect(48, SIZE - 144, SIZE - 96, 96);
  ctx.fillStyle = C.ink;
  ctx.font = `40px ${dot}`;
  ctx.textAlign = "center";
  ctx.fillText(labels.footer, SIZE / 2, SIZE - 96);
}

/**
 * Devuelve el `<canvas>` ya dibujado y la función para descargarlo.
 *
 * Es un hook y no un componente porque entrega dos cosas: el elemento a pintar
 * y la acción de descarga, que el botón vive fuera de la tarjeta.
 */
export function useShareCard({
  kind,
  name,
  labels,
  className,
}: {
  kind: ShareKind;
  name: string;
  labels: ShareLabels;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  // Se desarma el objeto en valores sueltos: `labels` se construye nuevo en
  // cada render de quien llama, asi que como dependencia del efecto haria que
  // el canvas se redibujara en bucle.
  const { kicker, headline, date, footer } = labels;

  useEffect(() => {
    let cancelled = false;
    // Se espera a que las fuentes estén cargadas: si se dibuja antes, el canvas
    // usa la de reserva y el resultado no se parece al sitio.
    const run = async () => {
      try {
        await document.fonts.ready;
      } catch {
        /* si falla, se dibuja igual con lo que haya */
      }
      if (cancelled || !ref.current) return;
      draw(ref.current, name, { kicker, headline, date, footer });
      setReady(true);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [name, kicker, headline, date, footer]);

  const download = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scd-mexico-2026-${kind}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Se libera en el siguiente tick: revocar de inmediato cancela la
      // descarga en algunos navegadores.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }, [kind]);

  return {
    canvas: (
      <canvas
        ref={ref}
        className={className}
        style={{ width: "100%", height: "auto", display: "block" }}
        aria-label={`Tarjeta para compartir del ${EVENT.name} México 2026`}
      />
    ),
    download,
    ready,
  };
}
