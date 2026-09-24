import { Callout, DetailBox, EmailLayout, EVT, HardButton, Heading, Kicker, Paragraph, Steps } from "./_kit";

export interface VolunteerSetupEmailProps {
  name?: string;
}

const WHATSAPP_URL = "https://chat.whatsapp.com/Ibb54WSXNVm4U0m07NapP1";

// POR CONFIRMAR. Martes 3 nov 2026 · 3–6 PM CDMX (UTC-6) = 21:00–00:00 UTC
const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=Montaje+AWS+Student+Community+Day+M%C3%A9xico+2026+(Voluntarios)" +
  "&dates=20261103T210000Z/20261104T000000Z" +
  "&location=" + encodeURIComponent(`${EVT.venue}, ${EVT.address}`) +
  "&details=" + encodeURIComponent("Jornada de montaje y alistamiento del evento.");

export function VolunteerSetupEmail({ name }: VolunteerSetupEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout preview="Montaje el martes 3 — te esperamos" strip="MONTAJE ·">
      <Kicker>día de montaje</Kicker>
      <Heading>{firstName ? `${firstName}, armamos esto juntos.` : "Armamos esto juntos."}</Heading>

      <Paragraph>
        El día antes del evento dejamos todo listo: señalética, salas, escarapelas
        y kits. Con varias manos sale en un par de horas.
      </Paragraph>

      <DetailBox
        rows={[
          { label: "Cuándo", value: EVT.setup },
          { label: "Dónde", value: EVT.venue },
          { label: "Dirección", value: EVT.address },
          { label: "Duración", value: "Unas 3 horas" },
        ]}
      />

      <HardButton href={CALENDAR_URL}>Agendar el montaje</HardButton>
      <HardButton href={EVT.mapsUrl} variant="outline">
        Cómo llegar
      </HardButton>

      <Kicker>qué haremos</Kicker>
      <Steps
        items={[
          "Señalizar salas y rutas de circulación.",
          "Ordenar escarapelas y kits por orden alfabético.",
          "Probar proyectores y sonido de cada sala.",
          "Repasar los turnos del día siguiente.",
        ]}
      />

      <Callout title="al día siguiente">
        El {EVT.weekday} te esperamos a las <strong>7:00 AM</strong>, una hora antes de
        abrir puertas. La puntualidad del staff es lo que hace que todo arranque
        a tiempo.
      </Callout>

      <HardButton href={WHATSAPP_URL} variant="outline">
        Grupo de WhatsApp
      </HardButton>
    </EmailLayout>
  );
}

export default VolunteerSetupEmail;
