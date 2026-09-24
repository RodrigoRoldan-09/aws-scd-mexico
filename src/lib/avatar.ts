/**
 * Caritas de DiceBear (estilo `notionists-neutral`).
 *
 * Es el mismo dibujo que llevan el pasaporte y la pantalla de confirmación, así
 * que vive acá una sola vez: la paleta pastel y la versión del estilo tienen que
 * coincidir en todas las pantallas o la misma persona saldría con dos caras
 * distintas según dónde se la mire.
 *
 * La semilla la elige quien llama, porque cada pantalla conoce un dato estable
 * diferente: el pasaporte usa su `shortId`, la confirmación el token, los
 * formularios el correo y las tarjetas del equipo el `id` del organizador.
 *
 * Ojo: el dominio no está en `images.remotePatterns` de `next.config.ts` a
 * propósito. Son SVG, y optimizarlos con `next/image` exigiría además
 * `dangerouslyAllowSVG`, así que se pintan con `<img>` plano.
 */
const PALETTE = "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf";

export function avatarUrl(seed: string) {
  const s = encodeURIComponent(seed || "scd-mexico");
  return `https://api.dicebear.com/8.x/notionists-neutral/svg?seed=${s}&backgroundColor=${PALETTE}`;
}
