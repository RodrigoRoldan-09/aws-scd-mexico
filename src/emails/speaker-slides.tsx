import { EmailLayout, HardButton, Heading, Kicker, Paragraph } from "./_kit";

interface SpeakerSlidesEmailProps {
  name?: string;
  slideUrl: string;
}

export function SpeakerSlidesEmail({ name, slideUrl }: SpeakerSlidesEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout preview="Recibimos tus diapositivas" strip="SLIDES RECIBIDAS ·">
      <Kicker>confirmado</Kicker>
      <Heading>{firstName ? `Listo, ${firstName}.` : "Slides recibidas."}</Heading>

      <Paragraph>
        Tu presentación quedó guardada. La vamos a precargar en la sala que te
        toque, así que el día del evento solo tienes que llegar y presentar.
      </Paragraph>

      <HardButton href={slideUrl} variant="outline">
        Ver el archivo que subiste
      </HardButton>

      <Paragraph muted>
        ¿Necesitas cambiarla? Puedes volver a subirla hasta la fecha límite —
        siempre nos quedamos con la última versión.
      </Paragraph>
    </EmailLayout>
  );
}

export default SpeakerSlidesEmail;
