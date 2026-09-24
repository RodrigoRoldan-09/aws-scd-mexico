import { Img, Section } from "@react-email/components";
import {
  C,
  Callout,
  DetailBox,
  Divider,
  EmailLayout,
  HardButton,
  Heading,
  Kicker,
  Paragraph,
  EVT,
} from "./_kit";

export interface ConfirmAttendanceEmailProps {
  name?: string;
  confirmUrl: string;
  countdownGifUrl?: string;
}

export function ConfirmAttendanceEmail({
  name,
  confirmUrl,
  countdownGifUrl,
}: ConfirmAttendanceEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout
      preview={`Confirma tu asistencia antes del ${EVT.confirmDeadline}`}
      strip="CONFIRMA TU CUPO ·"
    >
      <Kicker>acción requerida</Kicker>
      <Heading>
        {firstName ? `${firstName}, confirma tu cupo.` : "Confirma tu cupo."}
      </Heading>

      <Paragraph>
        Estamos a pocos días. Para no dejar sillas vacías necesitamos que
        confirmes que vas a venir — toma un clic.
      </Paragraph>

      <HardButton href={confirmUrl}>Sí, voy a asistir</HardButton>

      <Callout title="ojo con la fecha">
        Este enlace es único para ti y vence el <strong>{EVT.confirmDeadline}</strong>.
        Sin confirmar, tu cupo pasa a alguien de la lista
        de espera.
      </Callout>

      {countdownGifUrl && (
        <Section style={{ margin: "0 0 20px" }}>
          <Img
            src={countdownGifUrl}
            alt="Cuenta regresiva"
            width="520"
            style={{
              display: "block",
              width: "100%",
              maxWidth: "520px",
              border: `2px solid ${C.line}`,
            }}
          />
        </Section>
      )}

      <Divider />

      <DetailBox
        rows={[
          { label: "Fecha", value: EVT.dateLong },
          { label: "Hora", value: `${EVT.time} — puertas 7:30 AM` },
          { label: "Lugar", value: EVT.venue },
          { label: "Dirección", value: EVT.address },
        ]}
      />

      <Paragraph muted>
        ¿Ya no puedes venir? También ayuda que nos avises respondiendo este
        correo — así liberamos tu lugar a tiempo.
      </Paragraph>
    </EmailLayout>
  );
}

export default ConfirmAttendanceEmail;
