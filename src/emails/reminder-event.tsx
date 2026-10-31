import * as React from "react";
import {
  BilingualSections,
  C,
  Callout,
  EmailLayout,
  EventDetails,
  EVT,
  Framed,
  HardButton,
  Heading,
  Kicker,
  Paragraph,
  SponsorLogos,
  Steps,
} from "./_kit";

export interface ReminderEventEmailProps {
  name?: string;
  qrUrl?: string;
  qrImageUrl?: string;
  /** Días que faltan para el evento (0 = hoy). */
  daysLeft: number;
  tips?: string[];
}

// 4 nov 2026, 9:00–18:00 CDMX (UTC-6) = 15:00–00:00 UTC
const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=AWS+Student+Community+Day+M%C3%A9xico+2026" +
  "&dates=20261104T150000Z/20261105T000000Z" +
  "&location=" + encodeURIComponent(`${EVT.venue}, ${EVT.address}`) +
  "&details=%C2%A1Tu+registro+est%C3%A1+confirmado%21";

const DEFAULT_TIPS = [
  "Trae tu botella de agua — hay puntos de recarga.",
  "Lleva efectivo o tarjeta: hay locales de comida cerca.",
  "Carga el celular; el QR de entrada lo necesitas al llegar.",
  "Ropa cómoda: son diez horas y se camina entre salas.",
];

const DEFAULT_TIPS_EN = [
  "Bring your water bottle — there are refill stations.",
  "Bring cash or a card: there are food places nearby.",
  "Charge your phone; you'll need the entry QR when you arrive.",
  "Wear comfortable clothes: it's ten hours and you'll walk between rooms.",
];

/**
 * Titular según los días que faltan. Escala: hoy, mañana, días sueltos,
 * "poco más de una semana", y de dos semanas en adelante.
 */
export function reminderHeadline(daysLeft: number): { es: string; en: string } {
  const d = Math.max(0, Math.round(daysLeft));
  if (d === 0) return { es: "¡Es hoy!", en: "It's today!" };
  if (d === 1) return { es: "Es mañana.", en: "It's tomorrow." };
  if (d >= 7 && d <= 13) {
    return {
      es: `Falta poco más de una semana — ${d} días.`,
      en: `A little over a week to go — ${d} days.`,
    };
  }
  // 2..6 y 14+.
  return { es: `Faltan ${d} días.`, en: `${d} days to go.` };
}

export function ReminderEventEmail({
  name,
  qrImageUrl,
  daysLeft,
  tips,
}: ReminderEventEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";
  const customTips = tips?.length ? tips : null;
  const headline = reminderHeadline(daysLeft);
  const soon = daysLeft <= 1;
  const doorsCallout = daysLeft >= 2 && daysLeft <= 6;

  const strip =
    daysLeft <= 0
      ? "ES HOY · IT'S TODAY ·"
      : `FALTAN ${daysLeft} ${daysLeft === 1 ? "DÍA" : "DÍAS"} ·`;

  const es = (
    <>
      <Kicker>cuenta regresiva</Kicker>
      <Heading>
        {firstName ? `${firstName}, ${headline.es.toLowerCase()}` : headline.es}
      </Heading>

      <Paragraph>
        {soon
          ? "Nos vemos muy pronto. Acá va todo lo que necesitas para llegar sin apuros."
          : "Vamos preparando todo. Guarda estos datos y agenda el evento para que no se te pase."}
      </Paragraph>

      {doorsCallout && (
        <Callout title="apertura de puertas 7:30 AM · acceso rápido con QR">
          ¡El hype está al máximo! Las puertas y mesas de registro abren desde las 7:30 AM.
          Llega temprano con tu código QR listo en el celular para realizar tu check-in ágil,
          recibir tu kit de bienvenida y asegurar los mejores lugares para la ceremonia de apertura.
        </Callout>
      )}

      {soon && (
        <Callout title="llega temprano · puertas abren 7:30 AM">
          Abrimos puertas y registro desde las 7:30 AM para arrancar a las 9:00 AM en punto.
          El check-in con mucha gente toma su rato — venir temprano con tu código QR a la mano
          te ahorra la fila y asegura tu lugar.
        </Callout>
      )}

    </>
  );

  const en = (
    <>
      <Kicker>countdown</Kicker>
      <Heading>
        {firstName
          ? `${firstName}, ${headline.en.charAt(0).toLowerCase()}${headline.en.slice(1)}`
          : headline.en}
      </Heading>

      <Paragraph>
        {soon
          ? "See you very soon. Here's everything you need to get there without a rush."
          : "Let's get ready. Save these details and add the event to your calendar so you don't miss it."}
      </Paragraph>

      {doorsCallout && (
        <Callout title="doors open 7:30 AM · fast QR check-in">
          The hype is at its peak! Doors and registration desks open at 7:30 AM. Arrive
          early with your QR code ready on your phone for a quick check-in, pick up your
          welcome kit and get the best seats for the opening ceremony.
        </Callout>
      )}

      {soon && (
        <Callout title="arrive early · doors open 7:30 AM">
          Doors and registration open at 7:30 AM so we can start at 9:00 AM sharp.
          Check-in with a big crowd takes a while — arriving early with your QR code at
          hand saves you the line and secures your spot.
        </Callout>
      )}
    </>
  );

  // Los tips van una sola vez. Los personalizados llegan tal cual; los por
  // defecto llevan español e inglés en cada renglón.
  const tipItems: React.ReactNode[] =
    customTips ??
    DEFAULT_TIPS.map((t, i) => (
      <React.Fragment key={i}>
        {t}
        <br />
        <span style={{ color: C.muted }}>{DEFAULT_TIPS_EN[i]}</span>
      </React.Fragment>
    ));

  return (
    <EmailLayout
      preview={`${headline.es} ${headline.en} AWS Student Community Day México 2026`}
      strip={strip}
    >
      <BilingualSections es={es} en={en} />

      {qrImageUrl && (
        <>
          <Kicker>tu entrada · your pass</Kicker>
          <Framed
            src={qrImageUrl}
            alt="Código QR de entrada / Entry QR code"
            width={220}
            caption="Muestra este código en la puerta · Show this code at the door"
          />
        </>
      )}

      <EventDetails />

      <HardButton href={CALENDAR_URL}>Agregar al calendario · Add to calendar</HardButton>
      <HardButton href={EVT.mapsUrl} variant="outline">
        Cómo llegar · Directions
      </HardButton>

      <Kicker>para que te vaya bien · tips for the day</Kicker>
      <Steps items={tipItems} />

      <SponsorLogos />
    </EmailLayout>
  );
}

export default ReminderEventEmail;
