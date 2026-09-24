import { Callout, DetailBox, EmailLayout, HardButton, Heading, Kicker, Paragraph, EVT } from "./_kit";

interface VolunteerMeetingTodayEmailProps {
  name?: string;
}

const WHATSAPP_URL = "https://chat.whatsapp.com/Ibb54WSXNVm4U0m07NapP1";

export function VolunteerMeetingTodayEmail({ name }: VolunteerMeetingTodayEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout preview="La reunión de voluntarios es hoy a las 6 PM" strip="ES HOY ·">
      <Kicker>recordatorio</Kicker>
      <Heading>{firstName ? `${firstName}, es hoy.` : "La reunión es hoy."}</Heading>

      <Paragraph>
        Hoy a las 6:00 PM nos juntamos para repartir turnos y repasar cómo
        funciona el día del evento.
      </Paragraph>

      <DetailBox
        rows={[
          { label: "Hoy", value: EVT.volunteerMeeting },
          { label: "Dónde", value: "En línea — el enlace va por el grupo" },
          { label: "Duración", value: "45 minutos" },
        ]}
      />

      <HardButton href={WHATSAPP_URL}>Abrir el grupo de WhatsApp</HardButton>

      <Callout title="si no puedes">
        Avísanos por el grupo. Te mandamos el resumen y tu turno asignado por
        escrito.
      </Callout>
    </EmailLayout>
  );
}

export default VolunteerMeetingTodayEmail;
