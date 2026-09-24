import { EmailLayout, HardButton, Heading, Kicker, Paragraph } from "./_kit";

interface SpeakerRejectionEmailProps {
  name?: string;
  registerUrl: string;
}

export function SpeakerRejectionEmail({ name, registerUrl }: SpeakerRejectionEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout
      preview="Sobre tu propuesta para el AWS Student Community Day México 2026"
      strip="GRACIAS POR POSTULAR ·"
    >
      <Kicker>sobre tu propuesta</Kicker>
      <Heading>{firstName ? `${firstName}, esta vez no.` : "Esta vez no."}</Heading>

      <Paragraph>
        Tu propuesta no quedó en la agenda de este año. Te lo decimos directo
        porque mereces una respuesta clara y no un silencio.
      </Paragraph>

      <Paragraph>
        Recibimos muchas más propuestas que espacios, y la curaduría fue anónima:
        el comité leyó título, nivel y abstract sin saber quién los escribió. Que
        no haya quedado no dice nada de ti como speaker.
      </Paragraph>

      <Paragraph>
        Nos encantaría verte igual el <strong>4 de noviembre</strong>. La entrada
        es gratuita y el cupo es limitado.
      </Paragraph>

      <HardButton href={registerUrl}>Registrarme como asistente</HardButton>

      <Paragraph muted>
        Y postula de nuevo en 2027 — nos gusta ver caras repetidas.
      </Paragraph>
    </EmailLayout>
  );
}

export default SpeakerRejectionEmail;
