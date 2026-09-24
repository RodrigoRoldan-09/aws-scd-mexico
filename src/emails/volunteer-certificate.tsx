import { EmailLayout, HardButton, Heading, Kicker, Paragraph, APP_URL } from "./_kit";

interface VolunteerCertificateEmailProps {
  name?: string;
}

export function VolunteerCertificateEmail({ name }: VolunteerCertificateEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout preview="Tu certificado de voluntariado está adjunto" strip="TU CERTIFICADO ·">
      <Kicker>gracias</Kicker>
      <Heading>{firstName ? `${firstName}, lo lograste.` : "Lo lograste."}</Heading>

      <Paragraph>
        Adjunto va tu certificado de voluntariado del AWS Student Community Day
        México 2026. Es tuyo: súbelo a LinkedIn, ponlo en tu CV, enséñaselo a
        quien quieras.
      </Paragraph>

      <Paragraph>
        Un evento así se ve fácil desde afuera justamente porque alguien lo
        sostuvo desde adentro. Ese alguien fuiste tú.
      </Paragraph>

      <HardButton href={`${APP_URL}/directorio`} variant="outline">
        Ver quién más estuvo
      </HardButton>

      <Paragraph muted>
        Si tu nombre está mal escrito en el certificado, respóndenos y lo
        reemitimos el mismo día.
      </Paragraph>
    </EmailLayout>
  );
}

export default VolunteerCertificateEmail;
