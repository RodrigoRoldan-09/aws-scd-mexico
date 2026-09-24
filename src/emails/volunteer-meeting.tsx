import { DetailBox, EmailLayout, HardButton, Heading, Kicker, Paragraph, Steps, EVT } from "./_kit";

interface VolunteerMeetingEmailProps {
  name?: string;
}

const WHATSAPP_URL = "https://chat.whatsapp.com/Ibb54WSXNVm4U0m07NapP1";

export function VolunteerMeetingEmail({ name }: VolunteerMeetingEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout preview={`Reunión de voluntarios — ${EVT.volunteerMeeting}`} strip="REUNIÓN DE EQUIPO ·">
      <Kicker>nos juntamos</Kicker>
      <Heading>{firstName ? `${firstName}, reunión de equipo.` : "Reunión de equipo."}</Heading>

      <Paragraph>
        Antes del evento nos vemos para repartir turnos, resolver dudas y
        conocernos las caras. Es corta y es la única antes del día.
      </Paragraph>

      <DetailBox
        rows={[
          { label: "Cuándo", value: EVT.volunteerMeeting },
          { label: "Dónde", value: "En línea — te enviamos el enlace ese día" },
          { label: "Duración", value: "45 minutos" },
        ]}
      />

      <Kicker>qué veremos</Kicker>
      <Steps
        items={[
          "Reparto de turnos y áreas por persona.",
          "Cómo funciona el check-in y el escáner de QR.",
          "Qué hacer si algo se sale del guion.",
          "Preguntas — trae las tuyas.",
        ]}
      />

      <HardButton href={WHATSAPP_URL}>Grupo de WhatsApp</HardButton>

      <Paragraph muted>
        Si no puedes conectarte, avísanos por el grupo y te pasamos el resumen.
      </Paragraph>
    </EmailLayout>
  );
}

export default VolunteerMeetingEmail;
