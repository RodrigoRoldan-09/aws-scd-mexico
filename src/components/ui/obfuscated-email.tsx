"use client";

import { useHydrated } from "@/hooks/use-hydrated";
import { SITE_HOST } from "@/lib/constants";

/**
 * Correo de contacto que no viaja escrito en el HTML.
 *
 * El usuario de cada buzón vive en ROT13 —ni en claro en el código ni en el
 * paquete que se descarga— y el `mailto:` sólo existe después de hidratar. Lo
 * que se sirve, y lo que ve quien tenga JavaScript apagado, es la dirección
 * deletreada: legible para una persona, sin `@` ni `mailto:` que recoger.
 *
 * Es un obstáculo, no una garantía: un rastreador que ejecute JavaScript la va
 * a ver igual. Lo que frena es la mayoría, que sólo busca `mailto:` y patrones
 * `algo@algo.algo` en el HTML.
 */

/** ROT13 es su propia inversa: la misma función codifica y descodifica. */
function rot13(value: string): string {
  return value.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

/**
 * Usuario de cada buzón en ROT13; el dominio es el del sitio (SITE_HOST).
 * Se nombran por su uso: `<ObfuscatedEmail box="contacto" />`.
 * POR CONFIRMAR: que estos buzones existan en el dominio de México.
 */
const BUZONES = {
  /** contacto@<dominio> — el general. */
  contacto: "pbagnpgb",
  /** privacidad@<dominio> — el de la política de privacidad. */
  privacidad: "cevinpvqnq",
  /** sponsors@<dominio> — el de patrocinios. */
  sponsors: "fcbafbef",
} as const;

export type Buzon = keyof typeof BUZONES;

function addressOf(box: Buzon): string {
  return `${rot13(BUZONES[box])}@${SITE_HOST}`;
}

/**
 * El `mailto:` de un buzón, para cuando hace falta el enlace y no el texto.
 *
 * La dirección se arma al llamar, así que en el código —y en el paquete que se
 * descarga— sigue estando sólo la versión codificada.
 */
export function mailtoOf(box: Buzon, subject?: string): string {
  const address = addressOf(box);
  return subject ? `mailto:${address}?subject=${encodeURIComponent(subject)}` : `mailto:${address}`;
}

export function ObfuscatedEmail({
  box = "contacto",
  className,
  subject,
}: {
  box?: Buzon;
  className?: string;
  /** Asunto sugerido al abrir el cliente de correo. */
  subject?: string;
}) {
  const hydrated = useHydrated();
  const address = addressOf(box);

  // Antes de hidratar —y sin JavaScript— se deletrea. El servidor y la primera
  // pintura del navegador coinciden en esto, así que no hay salto de
  // hidratación: React cambia al enlace en el render siguiente.
  if (!hydrated) {
    const [user, domain] = address.split("@");
    return (
      <span className={className}>
        {user} arroba {domain.split(".").join(" punto ")}
      </span>
    );
  }

  return (
    <a className={className} href={mailtoOf(box, subject)}>
      {address}
    </a>
  );
}
