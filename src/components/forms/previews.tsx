"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { avatarUrl } from "@/lib/avatar";
import { cleanWhitespace, toUpper } from "@/lib/normalize";

/**
 * Previews de lo que la persona se lleva al enviar cada formulario.
 *
 * Una por formulario, a propósito distintas: el asistente recibe un pasaporte,
 * quien postula a charla una tarjeta de speaker, y quien se ofrece de voluntario
 * una credencial de staff. Todas se pintan en vivo mientras se escribe.
 *
 * Ojo con los colores: estas tarjetas son islas oscuras dentro del bloque
 * de color, y `.form-block` remapea las clases `surface-*` a tinta negra. Por
 * eso acá se usan blancos explícitos: con `text-surface-50` el nombre salía
 * negro sobre negro y sólo se veía al seleccionarlo.
 *
 * El avatar sale de `@/lib/avatar`, el mismo que usa el pasaporte real. La
 * semilla acá es el correo (lo único estable que se conoce antes de
 * registrarse), así que es una muestra fiel del estilo, no necesariamente el
 * dibujo exacto que quedará asignado.
 */

/** Marco común: la tarjeta flota sobre el bloque morado con sombra dura. */
function Frame({
  kicker,
  children,
}: {
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <p className="dot-matrix mb-3 text-xs text-hack-ink/60">{kicker}</p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="border-2 border-hack-ink bg-surface-900 shadow-[8px_8px_0_0_rgba(10,10,15,0.35)]"
      >
        {children}
      </motion.div>
    </div>
  );
}

function initials(name: string) {
  return (
    cleanWhitespace(name)
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase() || "··"
  );
}

// ── Registro → pasaporte ─────────────────────────────────────────────────────

export function PassportPreview({
  firstName,
  lastName,
  email,
  extra,
}: {
  firstName: string;
  lastName: string;
  email: string;
  /** Línea secundaria: universidad, cargo, lo que traiga el formulario. */
  extra?: string;
}) {
  const t = useTranslations("Forms");
  const first = toUpper(cleanWhitespace(firstName)) || t("preview_first_ph");
  const last = toUpper(cleanWhitespace(lastName)) || t("preview_last_ph");

  return (
    <Frame kicker={t("preview_passport")}>
      {/* Cabecera con el logo, igual que el pasaporte real. */}
      <div className="flex items-center justify-between border-b-2 border-hack-block/25 px-4 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logos/aws-logo.svg" alt="AWS" className="h-5 w-auto" />
        <span className="dot-matrix text-[11px] text-white/45">24.10.2026</span>
      </div>

      <div className="flex justify-center pb-3 pt-6">
        <div
          className="h-[104px] w-[104px] rounded-full p-[3px]"
          style={{ background: "linear-gradient(135deg,#613BB8,#C143BC,#613BB8)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl(email || `${firstName}${lastName}`)}
            alt=""
            className="h-full w-full rounded-full"
          />
        </div>
      </div>

      <div className="px-5 pb-5 text-center">
        <p className="m-0 font-display text-3xl font-medium uppercase leading-[0.92] tracking-tighter text-white">
          {first}
        </p>
        <p className="m-0 font-display text-3xl font-medium uppercase leading-[0.92] tracking-tighter text-hack-block">
          {last}
        </p>

        {extra && (
          <p className="mt-3 font-mono text-[11px] text-white/55">{toUpper(extra)}</p>
        )}

        <div className="mt-4 flex justify-center">
          <span className="dot-matrix border border-hack-block/40 bg-hack-block/10 px-3 py-1 text-[10px] text-hack-block">
            asistente
          </span>
        </div>
      </div>

      {/* Sellos: lo que se va llenando durante el evento */}
      <div className="border-t-2 border-hack-block/25 px-5 py-4">
        <p className="dot-matrix mb-2.5 text-[10px] text-white/45">{t("preview_stamps")}</p>
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 flex-1 border border-dashed border-surface-600"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </Frame>
  );
}

// ── Speakers → tarjeta de speaker ────────────────────────────────────────────

export function SpeakerPreview({
  firstName,
  lastName,
  tagline,
  talkTitle,
  photo,
  level,
  sessionType,
  language,
}: {
  firstName: string;
  lastName: string;
  tagline: string;
  talkTitle: string;
  photo?: string;
  level?: string;
  sessionType?: string;
  language?: string;
}) {
  const t = useTranslations("Forms");
  const name = cleanWhitespace(`${firstName} ${lastName}`);
  const badges = [
    level && t("preview_level", { level }),
    sessionType === "in-person" ? t("preview_inperson") : null,
    language === "en" ? "English" : language === "es" ? "Español" : null,
  ].filter(Boolean) as string[];

  return (
    <Frame kicker={t("preview_speaker")}>
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b-2 border-hack-block/25 bg-surface-800">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover object-top grayscale" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="dot-matrix text-5xl text-hack-block/40">
              {initials(name)}
            </span>
          </div>
        )}
        <span className="dot-matrix absolute left-3 top-3 bg-hack-block px-2 py-1 text-[10px] leading-none text-hack-ink">
          speaker
        </span>
      </div>

      <div className="px-5 py-5">
        <p className="m-0 font-display text-2xl font-medium leading-tight tracking-tight text-white">
          {name || t("preview_name_ph")}
        </p>
        <p className="mt-1 font-mono text-xs leading-snug text-hack-block">
          {cleanWhitespace(tagline) || t("preview_role_ph")}
        </p>

        <div className="mt-4 border-t border-surface-700 pt-4">
          <p className="dot-matrix mb-1.5 text-[10px] text-white/45">{t("preview_talk_label")}</p>
          <p className="m-0 font-mono text-sm leading-snug text-white/90">
            {cleanWhitespace(talkTitle) || t("preview_talk_ph")}
          </p>
        </div>

        {badges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b}
                className="border border-hack-block/40 px-2.5 py-1 font-mono text-[10px] text-hack-block"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </Frame>
  );
}

// ── Voluntarios → credencial de staff ────────────────────────────────────────

export function VolunteerPreview({
  firstName,
  lastName,
  email,
  area,
  availability,
}: {
  firstName: string;
  lastName: string;
  email: string;
  /** Áreas en las que quiere apoyar, ya resueltas a texto. */
  area?: string;
  /** La jornada que eligió, ya resuelta a texto. */
  availability?: string;
}) {
  const t = useTranslations("Forms");
  const name = toUpper(cleanWhitespace(`${firstName} ${lastName}`)) || t("preview_first_ph");

  return (
    <Frame kicker={t("preview_volunteer")}>
      {/* Cinta del cordón */}
      <div className="flex items-center justify-center border-b-2 border-hack-block bg-hack-block py-1.5">
        <span className="dot-matrix text-[11px] leading-none text-hack-ink">
          staff · CDMX 2026
        </span>
      </div>

      <div className="flex items-center gap-4 px-5 py-6">
        <div className="h-[76px] w-[76px] shrink-0 border-2 border-hack-block/40 bg-surface-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl(email || `${firstName}${lastName}`)}
            alt=""
            className="h-full w-full"
          />
        </div>

        <div className="min-w-0">
          <p className="dot-matrix text-[10px] text-white/45">voluntario/a</p>
          <p className="m-0 mt-1 break-words font-display text-2xl font-medium uppercase leading-[0.95] tracking-tight text-white">
            {name}
          </p>
          {area && (
            <p className="mt-2 inline-block border border-hack-block/40 px-2 py-0.5 font-mono text-[10px] text-hack-block">
              {toUpper(area)}
            </p>
          )}
        </div>
      </div>

      {/* Pie tipo escarapela */}
      <div className="grid grid-cols-3 border-t-2 border-hack-block/25 text-center">
        {[
          ["acceso", "total"],
          ["jornada", availability ? availability.toLowerCase() : "—"],
          ["sede", "CDMX"],
        ].map(([k, v]) => (
          <div key={k} className="border-r border-surface-700 px-2 py-3 last:border-r-0">
            <p className="dot-matrix m-0 text-[9px] text-white/45">{k}</p>
            <p className="m-0 mt-1 font-mono text-[11px] text-white/80">{v}</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}
