import { APP_URL, EmailLayout, Framed, HardButton, Heading, Kicker, Paragraph, Steps } from "./_kit";

interface PassportLaunchEmailProps {
  name?: string;
  qrUrl: string;
}

export function PassportLaunchEmail({ name, qrUrl }: PassportLaunchEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout
      preview="Tu pasaporte digital ya está listo"
      strip="PASAPORTE DIGITAL ·"
    >
      <Kicker>novedad</Kicker>
      <Heading>{firstName ? `${firstName}, tu pasaporte está listo.` : "Tu pasaporte está listo."}</Heading>

      <Paragraph>
        Este año estrenamos pasaporte digital: tu perfil del evento, con tus redes
        y un mapa de sellos que vas llenando al visitar cada stand.
      </Paragraph>

      <Framed src={qrUrl} alt="Tu código QR" width={220} caption="Tu QR personal" />

      <HardButton href={`${APP_URL}/pasaporte`}>Abrir mi pasaporte</HardButton>

      <Kicker>cómo funciona</Kicker>
      <Steps
        items={[
          "Abre tu pasaporte y completa tus redes — así te encuentran después del evento.",
          "En cada stand muestran tu QR y te sellan.",
          "Junta sellos: los completos entran al sorteo del cierre.",
          "Al final te queda tu perfil público con todo lo que hiciste.",
        ]}
      />

      <Paragraph muted>
        Es la forma de conectar, explorar y llevarte un recuerdo único de este día.
      </Paragraph>
    </EmailLayout>
  );
}

export default PassportLaunchEmail;
