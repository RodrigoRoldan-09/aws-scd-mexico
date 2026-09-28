import { Img, Link, Section, Text } from "@react-email/components";
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
  MONO,
  Paragraph,
  EVT,
} from "./_kit";

interface RegistrationConfirmationEmailProps {
  name?: string;
}

const MAPS_URL = "https://maps.app.goo.gl/8rMHzYicz3nDtj1w6";
// Pasa por /api/email-map y no por Google directo para que la llave de Maps
// no quede escrita en el HTML del correo.
const MAPS_IMG = `${APP_URL}/api/email-map?w=520&h=220`;

export function RegistrationConfirmationEmail({ name }: RegistrationConfirmationEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout
      preview="Tu lugar está reservado para el AWS Student Community Day México 2026"
      strip="REGISTRO CONFIRMADO ·"
    >
      <Kicker>registro confirmado</Kicker>
      <Heading>{firstName ? `Listo, ${firstName}.` : "Tu lugar está reservado."}</Heading>

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
        Tu cupo en el AWS Student Community Day México 2026 quedó reservado. Adjunto
        va un PDF con tu entrada y el código QR para el check-in.
      </Paragraph>

      <Callout title="guarda esto">
        Presenta el QR del PDF adjunto en la entrada. Si lo pierdes, este mismo
        correo te sirve — no lo borres.
      </Callout>

      <DetailBox
        rows={[
          { label: "Fecha", value: EVT.dateLong },
          { label: "Hora", value: `${EVT.time} — puertas 7:30 AM` },
          { label: "Lugar", value: EVT.venue },
          { label: "Dirección", value: EVT.address },
          { label: "Costo", value: "Gratuito" },
        ]}
      />

      <Divider />

      <Kicker>cómo llegar</Kicker>
      <Section style={{ margin: "0 0 16px" }}>
        <Link href={MAPS_URL}>
          <Img
            src={MAPS_IMG}
            alt={`Mapa — ${EVT.venue}`}
            width="520"
            style={{
              display: "block",
              width: "100%",
              maxWidth: "520px",
              border: `2px solid ${C.line}`,
            }}
          />
        </Link>
      </Section>

      <Text
        style={{
          margin: "0 0 16px",
          fontFamily: MONO,
          fontSize: "12px",
          lineHeight: "1.6",
          color: C.muted,
        }}
      >
        {/* POR CONFIRMAR: cómo llegar a la sede en transporte público. */}
        Te recomendamos llegar en transporte público (Metro o Metrobús).
      </Text>

      <HardButton href={MAPS_URL} variant="outline">
        Abrir en Google Maps
      </HardButton>

      <Divider />

      <Kicker>mientras tanto</Kicker>
      <Paragraph>
        La agenda, los speakers y los talleres se publican en el sitio a medida que
        se confirman.
      </Paragraph>

      <HardButton href={APP_URL}>Ver el sitio</HardButton>
    </EmailLayout>
  );
}

export default RegistrationConfirmationEmail;
