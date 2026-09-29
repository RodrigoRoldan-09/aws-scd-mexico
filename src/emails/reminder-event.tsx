import {
  Callout,
  EmailLayout,
  EventDetails,
  EVT,
  Framed,
  HardButton,
  Heading,
  Kicker,
  Paragraph,
  Steps,
} from "./_kit";

export interface ReminderEventEmailProps {
  name?: string;
  qrUrl?: string;
  qrImageUrl?: string;
  daysLeft: 15 | 5 | 1;
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

export function ReminderEventEmail({
  name,
  qrImageUrl,
  daysLeft,
  tips,
}: ReminderEventEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";
  const list = tips?.length ? tips : DEFAULT_TIPS;

  const headline =
    daysLeft === 1
      ? "Es mañana."
      : daysLeft === 5
        ? "Faltan 5 días."
        : "Faltan 15 días.";

  return (
    <EmailLayout
      preview={`${headline} AWS Student Community Day México 2026`}
      strip={`FALTAN ${daysLeft} ${daysLeft === 1 ? "DÍA" : "DÍAS"} ·`}
    >
      <Kicker>cuenta regresiva</Kicker>
      <Heading>{firstName ? `${firstName}, ${headline.toLowerCase()}` : headline}</Heading>

      <Paragraph>
        {daysLeft === 1
          ? "Nos vemos mañana temprano. Acá va todo lo que necesitas para llegar sin apuros."
          : "Vamos preparando todo. Guarda estos datos y agenda el evento para que no se te pase."}
      </Paragraph>

      {qrImageUrl && (
        <>
          <Kicker>tu entrada</Kicker>
          <Framed
            src={qrImageUrl}
            alt="Código QR de entrada"
            width={220}
            caption="Muestra este código en la puerta"
          />
        </>
      )}

      <EventDetails />

      <HardButton href={CALENDAR_URL}>Agregar al calendario</HardButton>
      <HardButton href={EVT.mapsUrl} variant="outline">
        Cómo llegar
      </HardButton>

      {daysLeft === 1 && (
        <Callout title="llega temprano">
          Abrimos puertas y arrancamos a las 9:00 AM en punto. El check-in con mucha gente
          toma su rato — venir con margen te ahorra la fila.
        </Callout>
      )}

      <Kicker>para que te vaya bien</Kicker>
      <Steps items={list} />
    </EmailLayout>
  );
}

export default ReminderEventEmail;
