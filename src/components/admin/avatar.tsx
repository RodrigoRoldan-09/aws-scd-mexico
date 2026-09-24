"use client";

import { useState } from "react";
import Image from "next/image";
import { avatarUrl } from "@/lib/avatar";

/**
 * La carita de una persona en el panel.
 *
 * Es el mismo dibujo de DiceBear que llevan el pasaporte y la pantalla de
 * confirmación — y con la misma semilla, así que un asistente sale en el panel
 * con exactamente la misma cara que ve en su pasaporte. Ese es el punto: si
 * fueran dos dibujos distintos serían dos personas distintas para quien mira.
 *
 * La semilla la elige quien llama, porque cada lista tiene un dato estable
 * diferente: los asistentes usan su `qrCode` —que es el `shortId` del
 * pasaporte—, los voluntarios y speakers el correo.
 *
 * Si hay foto de verdad —los speakers la suben— manda la foto.
 *
 * Mientras la imagen carga, y si no carga, se ven las iniciales sobre un bloque
 * de color: la tabla no se queda con huecos si DiceBear no responde.
 */

/** Paleta de marca, con la tinta que contrasta encima. */
const TONOS = [
  { bg: "#422B78", ink: "#FFFFFF" },
  { bg: "#613BB8", ink: "#FFFFFF" },
  { bg: "#7B3FA6", ink: "#FFFFFF" },
  { bg: "#C143BC", ink: "#FFFFFF" },
  { bg: "#D85A30", ink: "#FFFFFF" },
  { bg: "#3DD6D0", ink: "#0E0E1A" },
] as const;

/** Hash estable: la misma persona cae siempre en el mismo tono. */
function tonoDe(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TONOS[h % TONOS.length];
}

function iniciales(name: string, email: string): string {
  const partes = name.trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (email.trim()[0] ?? "?").toUpperCase();
}

export function Avatar({
  seed,
  name = "",
  email = "",
  photo,
  size = 44,
  className = "",
}: {
  /**
   * Qué dibujo le toca. Debe ser estable para la persona: el `qrCode` de un
   * asistente, el correo de un voluntario. Si falta, se usa el correo.
   */
  seed?: string;
  name?: string;
  email?: string;
  /** URL de una foto real, si la hay. */
  photo?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const tono = tonoDe(seed || email || name || "?");
  const semilla = seed || email || name;

  const box = `inline-flex shrink-0 items-center justify-center overflow-hidden border-2 border-surface-100/20 ${className}`;

  if (photo) {
    return (
      <span className={box} style={{ width: size, height: size, background: "#1E1838" }}>
        <Image src={photo} alt="" width={size} height={size} className="h-full w-full object-cover" unoptimized />
      </span>
    );
  }

  return (
    <span
      className={box}
      style={{ width: size, height: size, background: tono.bg }}
      aria-hidden="true"
    >
      {semilla && !failed ? (
        // Plano y no `next/image`: son SVG y el dominio no está en
        // `remotePatterns` a propósito (ver src/lib/avatar.ts). Mientras carga
        // se ve el bloque de color, no un hueco.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl(semilla)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="font-mono font-bold leading-none"
          style={{ color: tono.ink, fontSize: Math.round(size * 0.38) }}
        >
          {iniciales(name, email)}
        </span>
      )}
    </span>
  );
}
