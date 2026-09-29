import { Callout, EmailLayout, DetailBox, EVT, HardButton, Heading, Kicker, Paragraph } from "./_kit";

interface BadgePickupEmailProps {
  name?: string;
}

export function BadgePickupEmail({ name }: BadgePickupEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout
      preview="Recoge tu gafete hoy y mañana entras directo"
      strip="RETIRO DE ESCARAPELA ·"
    >
      <Kicker>opcional, pero conviene</Kicker>
      <Heading>{firstName ? `${firstName}, sáltate la fila.` : "Sáltate la fila."}</Heading>

      <Paragraph>
        Hoy puedes pasar a recoger tu gafete con anticipación. Si lo haces,
        mañana entras directo sin pasar por registro.
      </Paragraph>

      <DetailBox
        rows={[
          { label: "Cuándo", value: EVT.badgePickup },
          { label: "Dónde", value: EVT.venue },
          { label: "Dirección", value: EVT.address },
          { label: "Qué llevar", value: "Tu QR de registro y una identificación oficial" },
        ]}
      />

      <HardButton href={EVT.mapsUrl}>Cómo llegar</HardButton>

      <Callout title="si no puedes hoy">
        No pasa nada — te esperamos mañana a las 9:00 AM y te lo entregamos en la
        entrada. Solo llega con margen.
      </Callout>

      <Paragraph muted>
        Mañana arrancamos a las 9:00 AM en punto.
      </Paragraph>
    </EmailLayout>
  );
}

export default BadgePickupEmail;
