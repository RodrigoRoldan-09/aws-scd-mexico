import {
  Callout,
  EmailLayout,
  EventDetails,
  Framed,
  HardButton,
  Heading,
  Kicker,
  Paragraph,
  EVT,
} from "./_kit";

export interface ConfirmReminderEmailProps {
  name?: string;
  confirmUrl: string;
  qrUrl?: string;
  countdownGifUrl?: string;
}

export function ConfirmReminderEmail({
  name,
  confirmUrl,
  countdownGifUrl,
}: ConfirmReminderEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout
      preview="Aún no confirmas tu asistencia — te queda poco tiempo"
      strip="RECORDATORIO ·"
    >
      <Kicker>segundo aviso</Kicker>
      <Heading>
        {firstName ? `${firstName}, todavía te esperamos.` : "Todavía te esperamos."}
      </Heading>

      <Paragraph>
        Te escribimos hace unos días para confirmar tu cupo y aún no tenemos tu
        respuesta. Un clic y quedas dentro.
      </Paragraph>

      <HardButton href={confirmUrl}>Confirmar mi asistencia</HardButton>

      <Callout title="tienes hasta">
        <strong>{EVT.confirmDeadline}.</strong> Después de esa hora los
        cupos sin confirmar pasan a la lista de espera.
      </Callout>

      {countdownGifUrl && <Framed src={countdownGifUrl} alt="Cuenta regresiva" />}

      <EventDetails />

      <Paragraph muted>
        Si ya no puedes venir, respóndenos este correo. Liberar tu lugar a tiempo
        le sirve a alguien más.
      </Paragraph>
    </EmailLayout>
  );
}

export default ConfirmReminderEmail;
