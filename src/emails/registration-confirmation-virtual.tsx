import { Img, Section } from "@react-email/components";
import {
  APP_URL,
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

export interface RegistrationConfirmationVirtualEmailProps {
  name?: string;
}

/**
 * Confirmación para la modalidad virtual. Va aparte del correo presencial
 * porque nada de eso aplica (QR, dirección, cómo llegar) y no lleva PDF: sólo
 * dice cuándo empieza y que el enlace llega el día del evento.
 */
export function RegistrationConfirmationVirtualEmail({
  name,
}: RegistrationConfirmationVirtualEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout
      preview="Estás dentro del Track Online del AWS Student Community Day México 2026"
      strip="TRACK ONLINE ·"
    >
      <Kicker>registro confirmado</Kicker>
      <Heading>
        {firstName ? `Listo, ${firstName}.` : "Tu lugar está reservado."}
      </Heading>

      <Section style={{ textAlign: "center", margin: "20px 0 24px" }}>
        <Img
          src={`${APP_URL}/images/logo_SCD-01.png`}
          alt="AWS Student Community Day México 2026 - Logo Oficial"
          width="160"
          style={{
            margin: "0 auto",
            display: "block",
            maxWidth: "160px",
            border: `2px solid ${C.block}`,
            borderRadius: "16px",
            backgroundColor: "#090812",
            padding: "8px",
          }}
        />
      </Section>

      <Paragraph>
        Quedaste registrado en el <strong>Track Online</strong> del AWS Student
        Community Day México 2026. No tienes que llevar nada ni llegar a ningún
        lado: se sigue en vivo desde donde estés.
      </Paragraph>

      <Callout title="el enlace te llega el mismo día">
        La mañana del {EVT.weekday} 4 de noviembre te enviamos a este correo el enlace
        de la transmisión. No hace falta que hagas nada hasta entonces —
        guárdalo y espera ese mensaje.
      </Callout>

      <DetailBox
        rows={[
          { label: "Fecha", value: EVT.dateLong },
          { label: "Hora", value: "9:00 AM, hora de la Ciudad de México (CST)" },
          { label: "Modalidad", value: "Track Online — en vivo" },
          { label: "Costo", value: "Gratuito" },
        ]}
      />

      <Paragraph muted>
        Si te conectas desde fuera de México, revisa la diferencia horaria con
        la Ciudad de México para no llegar tarde a la apertura.
      </Paragraph>

      <Divider />

      <Kicker>mientras tanto</Kicker>
      <Paragraph>
        La agenda, los speakers y los talleres se publican en el sitio a medida
        que se confirman. El Track Online tiene su propia programación.
      </Paragraph>

      <HardButton href={APP_URL}>Ver el sitio</HardButton>
    </EmailLayout>
  );
}

export default RegistrationConfirmationVirtualEmail;
