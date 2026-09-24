import {
  Callout, DetailBox, Divider, EmailLayout, EVT, HardButton, Heading, Kicker, Paragraph, Steps,
} from "./_kit";

export interface SpeakerApprovalEmailProps {
  name?: string;
  speakerType?: "local" | "international";
  presentationMode?: "in-person" | "online";
  profileUrl?: string;
  cardUrl?: string;
}

const WHATSAPP_GROUP = "https://chat.whatsapp.com/G4uQBCAkXj3I1iFLijWXvV?s=cl&p=i&ilr=0";
const WHATSAPP_ONLINE_GROUP = "https://chat.whatsapp.com/CmHESTqkxim2SAFaCAhybY?s=cl&p=i&ilr=0";

export function SpeakerApprovalEmail({
  name,
  speakerType = "local",
  presentationMode = "in-person",
  profileUrl,
  cardUrl,
}: SpeakerApprovalEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";
  const online = presentationMode === "online";
  const group = online ? WHATSAPP_ONLINE_GROUP : WHATSAPP_GROUP;

  return (
    <EmailLayout
      preview="Tu propuesta fue seleccionada para el AWS Student Community Day México 2026"
      strip="PROPUESTA ACEPTADA ·"
    >
      <Kicker>quedaste seleccionado/a</Kicker>
      <Heading>{firstName ? `${firstName}, tu charla entra.` : "Tu charla entra."}</Heading>

      <Paragraph>
        Recibimos muchísimas propuestas y la tuya quedó. Vas a estar en el
        escenario del AWS Student Community Day México 2026 — felicitaciones, y
        gracias por postular.
      </Paragraph>

      <DetailBox
        rows={[
          { label: "Fecha", value: EVT.dateLong },
          { label: "Modalidad", value: online ? "Track Online (en vivo)" : "Presencial" },
          ...(online ? [] : [{ label: "Lugar", value: EVT.venue }]),
          ...(online ? [] : [{ label: "Dirección", value: EVT.address }]),
          { label: "Slides", value: `Fecha límite: ${EVT.slidesDeadline}` },
        ]}
      />

      {profileUrl && <HardButton href={profileUrl}>Ver mi perfil público</HardButton>}
      {cardUrl && (
        <HardButton href={cardUrl} variant="outline">
          Descargar mi tarjeta
        </HardButton>
      )}

      <Divider />

      <Kicker>lo que sigue</Kicker>
      <Steps
        items={[
          "Únete al grupo de WhatsApp: ahí coordinamos horarios y detalles.",
          `Sube tus diapositivas antes del ${EVT.slidesDeadline}.`,
          "Revisa tu perfil público y avísanos si algo está mal escrito.",
          online
            ? "Te enviaremos el enlace de la transmisión y haremos una prueba técnica antes."
            : "Llega 45 minutos antes de tu bloque para probar sonido y proyección.",
        ]}
      />

      <HardButton href={group}>Entrar al grupo de WhatsApp</HardButton>

      {speakerType === "international" && (
        <Callout title="vienes de fuera de México">
          Te mandamos aparte la guía de viaje: aeropuerto (MEX), traslados y
          recomendaciones de alojamiento cerca de la sede.
        </Callout>
      )}

      <Paragraph muted>
        Si te surge cualquier cosa, responde este correo — te leemos.
      </Paragraph>
    </EmailLayout>
  );
}

export default SpeakerApprovalEmail;
