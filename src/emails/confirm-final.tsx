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

export interface ConfirmFinalEmailProps {
  name?: string;
  confirmUrl: string;
  qrUrl?: string;
  countdownGifUrl?: string;
}

export function ConfirmFinalEmail({
  name,
  confirmUrl,
  countdownGifUrl,
}: ConfirmFinalEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout
      preview="Última oportunidad para confirmar tu cupo"
      strip="ÚLTIMO AVISO ·"
    >
      <Kicker>último aviso</Kicker>
      <Heading>
        {firstName ? `${firstName}, es ahora o nunca.` : "Es ahora o nunca."}
      </Heading>

      <Paragraph>
        El AWS Student Community Day México 2026 es <strong>este {EVT.weekday}</strong> y
        tu cupo sigue sin confirmar. Si no confirmas, se lo damos a alguien de la
        lista de espera.
      </Paragraph>

      <HardButton href={confirmUrl}>Confirmar ahora</HardButton>

      <Callout title={`cierra el ${EVT.weekday} a las 6:00 am`}>
        Después de esa hora el sistema cierra y ya no podemos reservarte silla.
      </Callout>

      {countdownGifUrl && <Framed src={countdownGifUrl} alt="Cuenta regresiva" />}

      <EventDetails />

      <Paragraph muted>
        Si definitivamente no puedes, respóndenos — con eso basta y nos ayudas a
        organizar mejor.
      </Paragraph>
    </EmailLayout>
  );
}

export default ConfirmFinalEmail;
