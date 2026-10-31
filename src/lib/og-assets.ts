import fs from "fs";
import path from "path";
import sharp from "sharp";

const EVENT_LOGO_PATH = "public/images/logos/logo-sbg-cdmx.png";

/**
 * Logo del evento para las tarjetas OG como data URL. El PNG original pesa ~1.8 MB,
 * así que se reduce antes de incrustarlo. Si falla, devuelve "" y la tarjeta se
 * renderiza sin logo en vez de responder 500.
 */
export async function loadEventLogoDataUrl(): Promise<string> {
  try {
    const buf = fs.readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), EVENT_LOGO_PATH));
    const small = await sharp(buf)
      .resize(480, 480, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    return `data:image/png;base64,${small.toString("base64")}`;
  } catch {
    return "";
  }
}
