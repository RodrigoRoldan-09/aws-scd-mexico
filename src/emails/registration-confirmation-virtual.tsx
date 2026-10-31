import { Img, Section } from "@react-email/components";
import {
  APP_URL,
  BilingualSections,
  C,
  Callout,
  DetailBox,
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
 *
 * Bilingüe en un solo mensaje: español arriba, inglés abajo; logo y botón una vez.
 */
export function RegistrationConfirmationVirtualEmail({
  name,
}: RegistrationConfirmationVirtualEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  const es = (
    <>
      <Kicker>registro confirmado</Kicker>
      <Heading>
        {firstName ? `Listo, ${firstName}.` : "Tu lugar está reservado."}
      </Heading>

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

      <Kicker>mientras tanto</Kicker>
      <Paragraph>
        La agenda, los speakers y los talleres se publican en el sitio a medida
        que se confirman. El Track Online tiene su propia programación.
      </Paragraph>
    </>
  );

  const en = (
    <>
      <Kicker>registration confirmed</Kicker>
      <Heading>
        {firstName ? `You're in, ${firstName}.` : "Your spot is reserved."}
      </Heading>

      <Paragraph>
        You&apos;re registered for the <strong>Online Track</strong> of AWS Student
        Community Day México 2026. Nothing to bring and nowhere to go: you can
        follow it live from wherever you are.
      </Paragraph>

      <Callout title="the link arrives on the day">
        On the morning of Wednesday, November 4 we&apos;ll send the livestream link
        to this email address. You don&apos;t need to do anything until then —
        keep this email and watch for that message.
      </Callout>

      <DetailBox
        rows={[
          { label: "Date", value: "Wednesday, November 4, 2026" },
          { label: "Time", value: "9:00 AM, Mexico City time (CST)" },
          { label: "Format", value: "Online Track — live" },
          { label: "Cost", value: "Free" },
        ]}
      />

      <Paragraph muted>
        If you&apos;re joining from outside Mexico, check the time difference with
        Mexico City so you don&apos;t miss the opening.
      </Paragraph>

      <Kicker>in the meantime</Kicker>
      <Paragraph>
        The agenda, speakers and workshops are published on the site as they are
        confirmed. The Online Track has its own schedule.
      </Paragraph>
    </>
  );

  return (
    <EmailLayout
      preview="Estás dentro del Track Online · You're in the Online Track — AWS Student Community Day México 2026"
      strip="TRACK ONLINE ·"
    >
      <BilingualSections es={es} en={en} />

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

      <HardButton href={APP_URL}>Ver el sitio · Visit the site</HardButton>
    </EmailLayout>
  );
}

export default RegistrationConfirmationVirtualEmail;
