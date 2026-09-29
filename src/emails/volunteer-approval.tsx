import { Img, Link, Section } from "@react-email/components";
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

interface VolunteerApprovalEmailProps {
  name?: string;
}

const MAPS_URL = EVT.mapsUrl;
// Pasa por /api/email-map y no por Google directo para que la llave de Maps
// no quede escrita en el HTML del correo.
const MAPS_IMG = `${APP_URL}/api/email-map?w=520&h=200`;

export function VolunteerApprovalEmail({ name }: VolunteerApprovalEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout
      preview="Quedaste en el equipo de voluntarios del AWS Student Community Day México 2026"
      strip="ERES PARTE DEL EQUIPO ·"
    >
      <Kicker>postulación aprobada</Kicker>
      <Heading>{firstName ? `${firstName}, estás dentro.` : "Estás dentro."}</Heading>

      <Paragraph>
        Quedaste en el equipo de voluntarios del AWS Student Community Day México
        2026. Sin ustedes esto no pasa — gracias por meterle el hombro.
      </Paragraph>

      <Callout title="qué sigue">
        Te vamos a escribir con los turnos, el punto de encuentro y la jornada de
        montaje. Mantén este correo a mano.
      </Callout>

      <DetailBox
        rows={[
          { label: "Evento", value: EVT.dateLong },
          { label: "Llegada staff", value: "7:00 AM (CST)" },
          { label: "Montaje", value: EVT.setup },
          { label: "Lugar", value: EVT.venue },
          { label: "Dirección", value: EVT.address },
        ]}
      />

      <Divider />

      <Kicker>cómo llegar</Kicker>
      {process.env.GOOGLE_MAPS_KEY ? (
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
      ) : null}

      <HardButton href={MAPS_URL} variant="outline">
        Abrir en Google Maps
      </HardButton>

      <Divider />

      <HardButton href={APP_URL}>Ver el sitio</HardButton>

      <Paragraph muted>
        ¿Te surgió algo y ya no puedes? Respóndenos este correo cuanto antes para
        reorganizar los turnos.
      </Paragraph>
    </EmailLayout>
  );
}

export default VolunteerApprovalEmail;
