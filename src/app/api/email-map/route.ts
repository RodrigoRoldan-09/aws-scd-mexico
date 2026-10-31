import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { EVENT } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * Mapa del venue para los correos.
 *
 * Existe para que `GOOGLE_MAPS_KEY` no salga de acá. Si una plantilla armara la
 * URL de Google directamente, la llave viajaría escrita en el HTML del correo y
 * la vería cualquiera que abra el código fuente del mensaje — y en un correo no
 * se puede restringir por referrer, así que sería una llave suelta con cargo a
 * la cuenta. Las plantillas apuntan a esta ruta y la llave se queda en el
 * servidor.
 *
 * Los parámetros que se aceptan están acotados a propósito: sin eso, cualquiera
 * podría pedirle mapas arbitrarios a nuestra cuenta (un proxy abierto se
 * factura igual). Sólo se puede mover el tamaño, dentro de un rango.
 */

/** Centro por defecto: el venue, con las coordenadas ya verificadas. */
const { lat, lng } = EVENT.venue.coordinates;
const DEFAULT_CENTER = `${lat},${lng}`;

/**
 * Estilo de marca, en un solo sitio. Los colores son los mismos de `C` en
 * `_kit.tsx` para que el mapa no se note pegado sobre el correo.
 */
const STYLE = [
  "feature:all|element:geometry|color:0x0E0E1A",
  "feature:all|element:labels.text.fill|color:0xB4B2A9",
  "feature:all|element:labels.text.stroke|color:0x0E0E1A",
  "feature:road|element:geometry|color:0x1E1838",
  "feature:poi|element:labels|visibility:off",
];

/** Encaja `n` en [min,max]; si no es un número devuelve `fallback`. */
function clamp(raw: string | null, fallback: number, min: number, max: number) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

const CACHE = "public, max-age=604800, immutable";

/**
 * Respaldo cuando no hay llave o Google falla: el PNG commiteado
 * (scripts/gen-venue-map-fallback.mjs). Se lee una vez y queda en memoria. Si
 * el archivo faltara, un PNG liso del color de fondo — esta ruta nunca falla.
 */
let fallbackPng: Buffer | null = null;

async function getFallbackPng(): Promise<Buffer> {
  if (fallbackPng) return fallbackPng;
  try {
    fallbackPng = await readFile(
      join(process.cwd(), "public", "images", "emails", "venue-map-fallback.png"),
    );
  } catch {
    fallbackPng = await sharp({
      create: { width: 640, height: 280, channels: 3, background: "#0E0E1A" },
    })
      .png()
      .toBuffer();
  }
  return fallbackPng;
}

async function fallbackResponse() {
  try {
    const png = await getFallbackPng();
    return new NextResponse(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": CACHE },
    });
  } catch {
    // Último recurso: PNG 1x1 transparente embebido.
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    );
    return new NextResponse(new Uint8Array(pixel), {
      headers: { "Content-Type": "image/png", "Cache-Control": CACHE },
    });
  }
}

export async function GET(request: Request) {
  const key = process.env.GOOGLE_MAPS_KEY;
  // Sin llave el correo lleva el mapa de respaldo.
  if (!key) return fallbackResponse();

  const params = new URL(request.url).searchParams;

  // scale=2 duplica los píxeles reales, así que el techo de Google (640) se
  // aplica sobre estas medidas, no sobre las finales.
  const w = clamp(params.get("w"), 520, 200, 640);
  const h = clamp(params.get("h"), 220, 100, 400);

  // `q` permite otra sede (p. ej. la del montaje) sin tocar el código. Va
  // limitado en largo; el resto de la petición no es negociable.
  const q = params.get("q")?.slice(0, 160);
  const center = q ? encodeURIComponent(q) : DEFAULT_CENTER;

  const url =
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${center}` +
    `&zoom=15` +
    `&size=${w}x${h}` +
    `&scale=2` +
    `&maptype=roadmap` +
    `&markers=${encodeURIComponent(`color:0xC143BC|${q || DEFAULT_CENTER}`)}` +
    STYLE.map((s) => `&style=${encodeURIComponent(s)}`).join("") +
    `&key=${key}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return fallbackResponse();

    return new NextResponse(await res.arrayBuffer(), {
      headers: {
        "Content-Type": "image/png",
        // El mapa de un evento con fecha fija no cambia. Que Gmail y compañía lo
        // cacheen es lo que evita una llamada a Google por cada apertura.
        "Cache-Control": CACHE,
      },
    });
  } catch {
    return fallbackResponse();
  }
}
