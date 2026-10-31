import { Img, Link, Section, Text } from "@react-email/components";
import {
  APP_URL,
  BilingualSections,
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

const MAPS_URL = EVT.mapsUrl;
// Pasa por /api/email-map y no por Google directo para que la llave de Maps
// no quede escrita en el HTML del correo.
const MAPS_IMG = `${APP_URL}/api/email-map?w=520&h=220`;

/**
 * Confirmación presencial, bilingüe en un solo mensaje: español arriba e
 * inglés abajo. Logo, mapa y botones van una sola vez, después de ambos.
 */
export function RegistrationConfirmationEmail({ name }: RegistrationConfirmationEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  const es = (
    <>
      <Kicker>registro confirmado</Kicker>
      <Heading>{firstName ? `Listo, ${firstName}.` : "Tu lugar está reservado."}</Heading>

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

      <Paragraph muted>
        La agenda, los speakers y los talleres se publican en el sitio a medida que
        se confirman.
      </Paragraph>
    </>
  );

  const en = (
    <>
      <Kicker>registration confirmed</Kicker>
      <Heading>{firstName ? `You're in, ${firstName}.` : "Your spot is reserved."}</Heading>

      <Paragraph>
        Your spot at AWS Student Community Day México 2026 is reserved. Attached is
        a PDF with your pass and the QR code for check-in.
      </Paragraph>

      <Callout title="keep this">
        Show the QR code from the attached PDF at the entrance. If you lose it,
        this email works too — don&apos;t delete it.
      </Callout>

      <DetailBox
        rows={[
          { label: "Date", value: "Wednesday, November 4, 2026" },
          { label: "Time", value: `${EVT.time} — doors 7:30 AM` },
          { label: "Venue", value: EVT.venue },
          { label: "Address", value: EVT.address },
          { label: "Cost", value: "Free" },
        ]}
      />

      <Paragraph muted>
        The agenda, speakers and workshops are published on the site as they are
        confirmed.
      </Paragraph>
    </>
  );

  return (
    <EmailLayout
      preview="Tu lugar está reservado · Your spot is reserved — AWS Student Community Day México 2026"
      strip="REGISTRO CONFIRMADO ·"
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

      <Divider />

      <Kicker>cómo llegar · getting there</Kicker>
      <Section style={{ margin: "0 0 16px" }}>
        <Link href={MAPS_URL}>
          <Img
            src={MAPS_IMG}
            alt={`Mapa / Map — ${EVT.venue}`}
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
        Te recomendamos llegar en transporte público (Metro o Metrobús). · We
        recommend arriving by public transport (Metro or Metrobús).
      </Text>

      <HardButton href={MAPS_URL} variant="outline">
        Abrir en Google Maps · Open in Google Maps
      </HardButton>

      <Divider />

      <HardButton href={APP_URL}>Ver el sitio · Visit the site</HardButton>
    </EmailLayout>
  );
}

export default RegistrationConfirmationEmail;
