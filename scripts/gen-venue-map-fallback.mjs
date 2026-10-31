/**
 * Genera la imagen de mapa de respaldo para los correos:
 * public/images/emails/venue-map-fallback.png (640x280).
 *
 * /api/email-map la sirve cuando no hay GOOGLE_MAPS_KEY o Google falla, así el
 * correo siempre lleva un "mapa". Es determinista (SVG -> PNG con sharp) y el
 * PNG resultante va commiteado.
 *
 * Para regenerarla (desde la raíz del repo):
 *   source ~/.nvm/nvm.sh && node scripts/gen-venue-map-fallback.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/images/emails/venue-map-fallback.png");

const W = 640;
const H = 280;
const BG = "#0E0E1A";
const PURPLE = "#C143BC";
const LINE = "#2C2550";
const ROAD = "#1E1838";
const TEXT = "#E6E4DA";
const MONO = "'Courier New', Courier, monospace";

// Retícula de "calles" de fondo para que se lea como mapa.
const grid = [];
for (let x = 40; x < W; x += 80) {
  grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${LINE}" stroke-width="1"/>`);
}
for (let y = 35; y < H; y += 70) {
  grid.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${LINE}" stroke-width="1"/>`);
}

// Pin centrado (punta en cx, tipY).
const cx = W / 2;
const tipY = 150;
const pin = `
  <ellipse cx="${cx}" cy="${tipY + 2}" rx="14" ry="4" fill="${PURPLE}" opacity="0.35"/>
  <path d="M ${cx} ${tipY}
           C ${cx - 8} ${tipY - 18}, ${cx - 22} ${tipY - 30}, ${cx - 22} ${tipY - 48}
           A 22 22 0 1 1 ${cx + 22} ${tipY - 48}
           C ${cx + 22} ${tipY - 30}, ${cx + 8} ${tipY - 18}, ${cx} ${tipY} Z"
        fill="${PURPLE}"/>
  <circle cx="${cx}" cy="${tipY - 48}" r="8" fill="${BG}"/>`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  ${grid.join("\n  ")}
  <path d="M 0 210 Q 200 170 330 190 T ${W} 150" stroke="${ROAD}" stroke-width="14" fill="none"/>
  <path d="M 120 0 L 250 ${H}" stroke="${ROAD}" stroke-width="10" fill="none"/>
  <rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="none" stroke="${PURPLE}" stroke-width="2"/>
  ${pin}
  <text x="${cx}" y="200" text-anchor="middle" font-family="${MONO}" font-size="17" font-weight="700" fill="${TEXT}">Centro Histórico y Cultural Juan de Dios Bátiz · IPN</text>
  <text x="${cx}" y="228" text-anchor="middle" font-family="${MONO}" font-size="15" fill="${TEXT}" letter-spacing="2">Ciudad de México · 04.11.2026</text>
</svg>`;

await mkdir(dirname(OUT), { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(OUT);
const meta = await sharp(OUT).metadata();
console.log(`wrote ${OUT} (${meta.width}x${meta.height} ${meta.format})`);
