import { Callout, DetailBox, EmailLayout, HardButton, Heading, Kicker, Paragraph } from "./_kit";

interface PassportEditConfirmEmailProps {
  name?: string;
  confirmUrl: string;
  changes: { label: string; value: string }[];
}

export function PassportEditConfirmEmail({
  name,
  confirmUrl,
  changes,
}: PassportEditConfirmEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout
      preview="Confirma los cambios en tu pasaporte"
      strip="CONFIRMA LOS CAMBIOS ·"
    >
      <Kicker>verificación</Kicker>
      <Heading>{firstName ? `${firstName}, confirma estos cambios.` : "Confirma estos cambios."}</Heading>

      <Paragraph>
        Alguien pidió actualizar tu pasaporte con los datos de abajo. Si fuiste
        tú, confirma; si no reconoces esto, ignora el correo y no pasa nada.
      </Paragraph>

      <DetailBox rows={changes.map((c) => ({ label: c.label, value: c.value }))} />

      <HardButton href={confirmUrl}>Sí, aplicar los cambios</HardButton>

      <Callout title="seguridad">
        Este enlace es de un solo uso y caduca pronto. Sin confirmar, tu
        pasaporte se queda exactamente como está.
      </Callout>
    </EmailLayout>
  );
}

export default PassportEditConfirmEmail;
