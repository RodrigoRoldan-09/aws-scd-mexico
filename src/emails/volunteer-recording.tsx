import { EmailLayout, HardButton, Heading, Kicker, Paragraph, EVT } from "./_kit";

interface VolunteerRecordingEmailProps {
  name?: string;
  recordingUrl: string;
}

export function VolunteerRecordingEmail({ name, recordingUrl }: VolunteerRecordingEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout preview="Grabación de la reunión de voluntarios" strip="GRABACIÓN ·">
      <Kicker>te la perdiste, acá está</Kicker>
      <Heading>{firstName ? `${firstName}, acá va la grabación.` : "Acá va la grabación."}</Heading>

      <Paragraph>
        Quedó grabada la reunión donde repartimos turnos y explicamos cómo
        funciona el día del evento. Dura 45 minutos.
      </Paragraph>

      <HardButton href={recordingUrl}>Ver la grabación</HardButton>

      <Paragraph muted>
        Si después de verla te queda alguna duda, pregúntala en el grupo — mejor
        resolverla ahora que el {EVT.weekday} a las 7 AM.
      </Paragraph>
    </EmailLayout>
  );
}

export default VolunteerRecordingEmail;
