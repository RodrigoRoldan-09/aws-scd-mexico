import { Callout, EmailLayout, EventDetails, HardButton, Heading, Kicker, Paragraph, Steps, EVT } from "./_kit";

interface SpeakerUploadEmailProps {
  name?: string;
  uploadUrl: string;
}

export function SpeakerUploadEmail({ name, uploadUrl }: SpeakerUploadEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout preview={`Sube tus diapositivas antes del ${EVT.slidesDeadline}`} strip="SUBE TUS SLIDES ·">
      <Kicker>acción requerida</Kicker>
      <Heading>{firstName ? `${firstName}, faltan tus slides.` : "Faltan tus slides."}</Heading>

      <Paragraph>
        Para tenerlas cargadas en las salas y revisar que todo se vea bien,
        necesitamos tu presentación antes de la fecha límite.
      </Paragraph>

      <HardButton href={uploadUrl}>Subir mi presentación</HardButton>

      <Callout title="fecha límite">
        <strong>{EVT.slidesDeadline}.</strong> Después de esa fecha no alcanzamos a
        precargarlas y tendrías que llevarla en USB el día del evento.
      </Callout>

      <Kicker>cómo entregarla</Kicker>
      <Steps
        items={[
          "Formato PDF o PPTX. Si usas fuentes raras, mejor PDF.",
          "Proporción 16:9 — las salas proyectan en ese formato.",
          "Si tienes video embebido, avísanos: hay que probarlo antes.",
          "Nombra el archivo con tu nombre y el título de la charla.",
        ]}
      />

      <EventDetails />
    </EmailLayout>
  );
}

export default SpeakerUploadEmail;
