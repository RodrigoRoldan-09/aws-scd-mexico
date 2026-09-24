import { NextResponse } from "next/server";
import sharp from "sharp";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { EVENT } from "@/lib/constants";

export const runtime = "nodejs";

// Fecha del evento — se lee de `EVENT` para no mantener dos copias.
const EVENT_DATE = new Date(EVENT.date);

const W = 560;
const H = 128;
const FRAMES = 60; // one per second

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function buildSVG(d: number, h: number, m: number, s: number): Buffer {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${W}" height="${H}" fill="#0C0D10"/>

  <!-- Unit boxes -->
  <rect x="10"  y="10" width="120" height="108" fill="#161820" rx="8"/>
  <rect x="150" y="10" width="120" height="108" fill="#161820" rx="8"/>
  <rect x="290" y="10" width="120" height="108" fill="#161820" rx="8"/>
  <rect x="430" y="10" width="120" height="108" fill="#161820" rx="8"/>

  <!-- Colon dots -->
  <circle cx="140" cy="48" r="5.5" fill="#F2A6F0"/>
  <circle cx="140" cy="80" r="5.5" fill="#F2A6F0"/>
  <circle cx="280" cy="48" r="5.5" fill="#F2A6F0"/>
  <circle cx="280" cy="80" r="5.5" fill="#F2A6F0"/>
  <circle cx="420" cy="48" r="5.5" fill="#F2A6F0"/>
  <circle cx="420" cy="80" r="5.5" fill="#F2A6F0"/>

  <!-- Numbers -->
  <text x="70"  y="70" text-anchor="middle" font-family="DejaVu Sans Mono,Courier New,Courier,monospace" font-size="42" font-weight="900" fill="#F9FAFB">${pad2(d)}</text>
  <text x="210" y="70" text-anchor="middle" font-family="DejaVu Sans Mono,Courier New,Courier,monospace" font-size="42" font-weight="900" fill="#F9FAFB">${pad2(h)}</text>
  <text x="350" y="70" text-anchor="middle" font-family="DejaVu Sans Mono,Courier New,Courier,monospace" font-size="42" font-weight="900" fill="#F9FAFB">${pad2(m)}</text>
  <text x="490" y="70" text-anchor="middle" font-family="DejaVu Sans Mono,Courier New,Courier,monospace" font-size="42" font-weight="900" fill="#F9FAFB">${pad2(s)}</text>

  <!-- Labels -->
  <text x="70"  y="105" text-anchor="middle" font-family="DejaVu Sans,Arial,Helvetica,sans-serif" font-size="9" font-weight="700" fill="#F2A6F0">DIAS</text>
  <text x="210" y="105" text-anchor="middle" font-family="DejaVu Sans,Arial,Helvetica,sans-serif" font-size="9" font-weight="700" fill="#F2A6F0">HORAS</text>
  <text x="350" y="105" text-anchor="middle" font-family="DejaVu Sans,Arial,Helvetica,sans-serif" font-size="9" font-weight="700" fill="#F2A6F0">MINUTOS</text>
  <text x="490" y="105" text-anchor="middle" font-family="DejaVu Sans,Arial,Helvetica,sans-serif" font-size="9" font-weight="700" fill="#F2A6F0">SEGUNDOS</text>
</svg>`;
  return Buffer.from(svg, "utf8");
}

async function svgToRGBA(svgBuffer: Buffer): Promise<Uint8Array> {
  const { data } = await sharp(svgBuffer)
    .flatten({ background: "#0C0D10" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

function addSeconds(
  d: number, h: number, m: number, s: number, delta: number
): [number, number, number, number] {
  let ts = s - delta;
  let tm = m, th = h, td = d;
  while (ts < 0) { ts += 60; tm--; }
  while (tm < 0) { tm += 60; th--; }
  while (th < 0) { th += 24; td--; }
  return [Math.max(0, td), Math.max(0, th), Math.max(0, tm), Math.max(0, ts)];
}

export async function GET() {
  const now = new Date();
  const diff = Math.max(0, EVENT_DATE.getTime() - now.getTime());

  const baseDays    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const baseHours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const baseMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const baseSeconds = Math.floor((diff % (1000 * 60)) / 1000);

  // Generate all 60 frames in parallel
  const pixelArrays = await Promise.all(
    Array.from({ length: FRAMES }, (_, i) => {
      const [d, h, m, s] = addSeconds(baseDays, baseHours, baseMinutes, baseSeconds, i);
      return svgToRGBA(buildSVG(d, h, m, s));
    })
  );

  // Derive a single palette from the first frame (colors are consistent across frames)
  const palette = quantize(pixelArrays[0], 256);

  // Encode animated GIF
  const gif = GIFEncoder();
  for (const pixels of pixelArrays) {
    const index = applyPalette(pixels, palette);
    gif.writeFrame(index, W, H, {
      palette,
      delay: 1000, // milliseconds — gifenc divides by 10 internally → 100 centiseconds = 1 second
      repeat: 0,  // loop forever
    });
  }
  gif.finish();

  return new NextResponse(Buffer.from(gif.bytes()), {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
    },
  });
}
