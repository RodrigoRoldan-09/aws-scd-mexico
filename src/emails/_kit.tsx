import * as React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Section,
  Text,
} from "@react-email/components";
import { EVENT, EVENT_OPS, SITE_HOST, SITE_URL } from "@/lib/constants";

/**
 * Kit de correo — estética del sitio adaptada a las reglas del email.
 *
 * Tres restricciones mandan acá y explican por qué esto no se parece al CSS
 * del sitio:
 *
 * 1. **No hay fuentes web fiables.** Outlook (motor Word) ignora `@font-face`,
 *    así que Oxanium y Handjet no llegarían. Se usa una pila monoespaciada
 *    universal — Courier New existe en todas partes — que además lee "técnico",
 *    que es justo el tono que buscamos.
 * 2. **No hay flexbox ni grid.** Todo es tabla. Los botones van con la técnica
 *    "bulletproof": una celda con fondo y padding, no un <a> estilizado.
 * 3. **No hay border-radius fiable en Outlook.** Da igual: el lenguaje del
 *    sitio ya es de caja dura, así que jugamos a favor.
 */

export const APP_URL = SITE_URL;

export const C = {
  ink: "#0E0E1A",
  paper: "#0E0E1A",
  block: "#C143BC",
  blockDeep: "#422B78",
  line: "#2C2550",
  text: "#E6E4DA",
  muted: "#B4B2A9",
  white: "#FFFFFF",
} as const;

/** Pila monoespaciada que existe en todos los clientes. */
export const MONO =
  "'Share Tech Mono', 'Courier New', Courier, monospace";
/** Para titulares: display con fallbacks reales en Outlook. */
export const DISPLAY =
  "'Pixelify Sans', 'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// ── Bloques ──────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  margin: 0,
  padding: "24px 0",
  backgroundColor: C.ink,
  fontFamily: MONO,
};

const container: React.CSSProperties = {
  width: "100%",
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: C.paper,
  border: `2px solid ${C.block}`,
};

/**
 * Cinta superior con el texto repetido, guiño a las marquesinas del sitio.
 * Estática: los correos no animan.
 */
function Strip({ text }: { text: string }) {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody>
        <tr>
          {[0, 1, 2].map((i) => (
            <td
              key={i}
              style={{
                backgroundColor: i % 2 === 1 ? C.block : "transparent",
                color: i % 2 === 1 ? C.ink : C.block,
                fontFamily: MONO,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textAlign: "center",
                padding: "8px 4px",
                whiteSpace: "nowrap",
              }}
            >
              {text}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

export function EmailLayout({
  preview,
  strip = `CDMX · ${EVENT.dateShort} · GRATIS`,
  children,
  lang = "es",
}: {
  /** Texto de vista previa en la bandeja (no se ve en el cuerpo). */
  preview?: string;
  strip?: string;
  children: React.ReactNode;
  lang?: string;
}) {
  return (
    <Html lang={lang} dir="ltr">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </Head>
      <Body style={body}>
        {preview && (
          <div
            style={{
              display: "none",
              overflow: "hidden",
              lineHeight: "1px",
              opacity: 0,
              maxHeight: 0,
              maxWidth: 0,
            }}
          >
            {preview}
          </div>
        )}

        <Container style={container}>
          <Section style={{ borderBottom: `2px solid ${C.block}` }}>
            <Img
              src={`${APP_URL}/images/emails/email-header.png`}
              alt="AWS Student Community Day México 2026"
              width="596"
              style={{ display: "block", width: "100%", maxWidth: "596px" }}
            />
          </Section>

          <Strip text={strip} />

          <Section style={{ padding: "32px 28px 8px" }}>{children}</Section>

          <Strip text={strip} />

          <Section>
            <Img
              src={`${APP_URL}/images/emails/email-footer.png`}
              alt=""
              width="596"
              style={{ display: "block", width: "100%", maxWidth: "596px" }}
            />
          </Section>

          <Section style={{ padding: "20px 28px 28px", textAlign: "center" }}>
            <Text
              style={{
                margin: "0 0 8px",
                fontFamily: MONO,
                fontSize: "11px",
                color: C.muted,
                letterSpacing: "0.06em",
              }}
            >
              {EVENT.venue.name.toUpperCase()} · CDMX · {EVENT.dateShort}
            </Text>
            <Text style={{ margin: 0, fontFamily: MONO, fontSize: "11px", color: C.muted }}>
              <Link href={APP_URL} style={{ color: C.block, textDecoration: "none" }}>
                {SITE_HOST}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Tipografía ───────────────────────────────────────────────────────────────

/** Etiqueta chica en mayúsculas, el equivalente al dot-matrix del sitio. */
export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 10px",
        fontFamily: MONO,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: C.block,
      }}
    >
      {children}
    </Text>
  );
}

export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 14px",
        fontFamily: DISPLAY,
        fontSize: "30px",
        lineHeight: "1.1",
        letterSpacing: "-0.02em",
        color: C.white,
      }}
    >
      {children}
    </Text>
  );
}

export function Paragraph({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Text
      style={{
        margin: "0 0 16px",
        fontFamily: MONO,
        fontSize: "14px",
        lineHeight: "1.7",
        color: muted ? C.muted : C.text,
      }}
    >
      {children}
    </Text>
  );
}

export function Divider() {
  return <Hr style={{ border: "none", borderTop: `1px solid ${C.line}`, margin: "24px 0" }} />;
}

// ── Botón "bulletproof" ──────────────────────────────────────────────────────

/**
 * Botón de caja dura. Va como tabla porque un <a> con padding se rompe en
 * Outlook; la celda con `bgcolor` sí se respeta en todos los clientes.
 */
export function HardButton({
  href,
  children,
  variant = "solid",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
}) {
  const solid = variant === "solid";
  return (
    <table cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: "8px 0 20px" }}>
      <tbody>
        <tr>
          <td
            bgcolor={solid ? C.block : undefined}
            style={{
              backgroundColor: solid ? C.block : "transparent",
              border: `2px solid ${C.block}`,
              padding: "14px 28px",
            }}
          >
            <Link
              href={href}
              style={{
                fontFamily: MONO,
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: solid ? C.ink : C.block,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {children}
            </Link>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// ── Caja de datos ────────────────────────────────────────────────────────────

export type Detail = { label: string; value: React.ReactNode };

/** Ficha de datos con hairlines, como las filas del sitio. */
export function DetailBox({ rows }: { rows: Detail[] }) {
  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{ border: `2px solid ${C.line}`, margin: "8px 0 20px" }}
    >
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.label}>
            <td
              style={{
                width: "38%",
                padding: "12px 14px",
                borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                fontFamily: MONO,
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: C.muted,
                verticalAlign: "top",
              }}
            >
              {r.label}
            </td>
            <td
              style={{
                padding: "12px 14px",
                borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                fontFamily: MONO,
                fontSize: "13px",
                lineHeight: "1.5",
                color: C.text,
              }}
            >
              {r.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Aviso destacado: caja con borde de acento. */
export function Callout({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{ border: `2px solid ${C.block}`, margin: "8px 0 20px" }}
    >
      <tbody>
        <tr>
          <td style={{ padding: "16px 18px" }}>
            {title && (
              <Text
                style={{
                  margin: "0 0 6px",
                  fontFamily: MONO,
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.block,
                }}
              >
                {title}
              </Text>
            )}
            <Text
              style={{
                margin: 0,
                fontFamily: MONO,
                fontSize: "13px",
                lineHeight: "1.65",
                color: C.text,
              }}
            >
              {children}
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// ── Piezas adicionales ───────────────────────────────────────────────────────

/** Constantes del evento para las plantillas. Salen de `EVENT` y `EVENT_OPS`. */
export const EVT = {
  venue: EVENT.venue.name,
  address: EVENT.venue.address,
  mapsUrl: EVENT.venue.mapsUrl,
  dateLong: EVENT.dateLabel,
  dateShort: EVENT.dateShort,
  time: EVENT.timeLabel,
  weekday: EVENT_OPS.weekday,
  confirmDeadline: EVENT_OPS.confirmDeadline,
  slidesDeadline: EVENT_OPS.slidesDeadline,
  setup: EVENT_OPS.setup,
  badgePickup: EVENT_OPS.badgePickup,
  volunteerMeeting: EVENT_OPS.volunteerMeeting,
} as const;

/** Lista numerada en dot-matrix: pasos, requisitos, tips. */
export function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: "4px 0 20px" }}>
      <tbody>
        {items.map((item, i) => (
          <tr key={i}>
            <td
              style={{
                width: "34px",
                padding: "10px 0",
                verticalAlign: "top",
                fontFamily: MONO,
                fontSize: "12px",
                fontWeight: 700,
                color: C.block,
                borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </td>
            <td
              style={{
                padding: "10px 0",
                borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                fontFamily: MONO,
                fontSize: "13px",
                lineHeight: "1.65",
                color: C.text,
              }}
            >
              {item}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Cifra grande con etiqueta — el eco de los contadores del sitio. */
export function BigStat({ value, label }: { value: string; label: string }) {
  return (
    <table cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: "4px 0 20px" }}>
      <tbody>
        <tr>
          <td style={{ border: `2px solid ${C.block}`, padding: "14px 22px", textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: DISPLAY,
                fontSize: "40px",
                lineHeight: "1",
                color: C.block,
              }}
            >
              {value}
            </Text>
            <Text
              style={{
                margin: "6px 0 0",
                fontFamily: MONO,
                fontSize: "10px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.muted,
              }}
            >
              {label}
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** Bloque de imagen con marco, para QR, mapas y GIFs de cuenta regresiva. */
export function Framed({
  src,
  alt = "",
  href,
  caption,
  width = 520,
}: {
  src: string;
  alt?: string;
  href?: string;
  caption?: string;
  width?: number;
}) {
  const img = (
    <Img
      src={src}
      alt={alt}
      width={String(width)}
      style={{
        display: "block",
        width: "100%",
        maxWidth: `${width}px`,
        border: `2px solid ${C.line}`,
      }}
    />
  );
  return (
    <Section style={{ margin: "0 0 16px" }}>
      {href ? <Link href={href}>{img}</Link> : img}
      {caption && (
        <Text
          style={{
            margin: "8px 0 0",
            fontFamily: MONO,
            fontSize: "11px",
            color: C.muted,
            textAlign: "center",
          }}
        >
          {caption}
        </Text>
      )}
    </Section>
  );
}

/** Ficha estándar del evento — la usan casi todas las plantillas. */
export function EventDetails({ extra }: { extra?: Detail[] }) {
  return (
    <DetailBox
      rows={[
        { label: "Fecha", value: EVT.dateLong },
        { label: "Hora", value: EVT.time },
        { label: "Lugar", value: EVT.venue },
        { label: "Dirección", value: EVT.address },
        ...(extra ?? []),
      ]}
    />
  );
}
