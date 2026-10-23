import { Img, Section, Text } from "@react-email/components";
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

export interface ActivityAssignmentEmailProps {
  name?: string;
  qrCode?: string;
  activityTitle: string;
  startTime?: string;
  endTime?: string;
  roomName?: string;
  priorityRank?: number | null;
  requiresLaptop?: boolean;
  prerequisitesList?: string[];
}

export function ActivityAssignmentEmail({
  name,
  qrCode,
  activityTitle,
  startTime,
  endTime,
  roomName,
  priorityRank,
  requiresLaptop,
  prerequisitesList = [],
}: ActivityAssignmentEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";
  const passportUrl = qrCode ? `${APP_URL}/p/${qrCode}` : APP_URL;
  const qrImgUrl = qrCode ? `${APP_URL}/api/pass-qr/${qrCode}` : "";

  const priorityLabel =
    typeof priorityRank === "number" && priorityRank > 0
      ? `Prioridad #${priorityRank} de tu solicitud`
      : "Asignación directa por el comité";

  const scheduleLabel =
    startTime && endTime ? `${startTime} – ${endTime} hrs` : "Horario por confirmar en agenda";

  const rows = [
    { label: "Actividad", value: activityTitle },
    { label: "Selección", value: priorityLabel },
    { label: "Horario", value: scheduleLabel },
    { label: "Salón", value: roomName || "Por asignar en la sede" },
    { label: "Sede", value: EVT.venue },
    { label: "Fecha", value: EVT.dateLong },
    { label: "Costo", value: "Incluido con tu registro general (gratuito)" },
  ];

  return (
    <EmailLayout
      preview={`Quedaste seleccionado en: ${activityTitle}`}
      strip="ACTIVIDAD CONFIRMADA ·"
    >
      <Kicker>actividad confirmada</Kicker>
      <Heading>{firstName ? `Todo listo, ${firstName}.` : "Tu lugar está confirmado."}</Heading>

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
        Revisamos las postulaciones para las actividades con cupo limitado del{" "}
        <strong>AWS Student Community Day México 2026</strong> y fuiste seleccionado(a) para
        participar en:
      </Paragraph>

      <Section
        style={{
          backgroundColor: "#161b22",
          border: `2px solid ${C.block}`,
          borderRadius: "8px",
          padding: "16px 20px",
          margin: "16px 0 24px",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: "0 0 6px",
            fontSize: "12px",
            fontFamily: MONO,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          {priorityLabel}
        </Text>
        <Text
          style={{
            margin: "0",
            fontSize: "20px",
            fontWeight: "bold",
            color: "#FFFFFF",
            lineHeight: "1.3",
          }}
        >
          {activityTitle}
        </Text>
      </Section>

      <DetailBox rows={rows} />

      <Divider />

      <Callout title="información importante de soporte">
        El equipo organizador y de soporte técnico podría ponerse en contacto contigo a través de
        este mismo correo antes del evento para solicitar información adicional (como tu{" "}
        <strong>CV actualizado en formato PDF</strong>, tu perfil de GitHub o validar requerimientos
        específicos de acceso a laboratorios). Por favor mantente atento(a) a tu bandeja de entrada.
      </Callout>

      <Kicker>requisitos para participar</Kicker>
      <Paragraph>Para aprovechar la actividad, toma en cuenta lo siguiente:</Paragraph>

      <Section
        style={{
          backgroundColor: "#0f172a",
          border: `1px solid ${C.line}`,
          borderRadius: "6px",
          padding: "12px 16px",
          margin: "0 0 20px",
        }}
      >
        <Text style={{ margin: "0 0 8px", fontSize: "13px", color: "#E2E8F0" }}>
          <strong>Laptop:</strong>{" "}
          {requiresLaptop
            ? "Es indispensable que lleves tu propia laptop con cargador."
            : "No es obligatorio llevar laptop, pero se recomienda para tomar notas."}
        </Text>
        <Text style={{ margin: "0 0 8px", fontSize: "13px", color: "#E2E8F0" }}>
          <strong>Cuenta AWS:</strong> Te recomendamos tener una cuenta activa de AWS Free Tier.
        </Text>
        {prerequisitesList.length > 0 && (
          <Text style={{ margin: "0", fontSize: "13px", color: "#E2E8F0" }}>
            <strong>Prerrequisitos:</strong> {prerequisitesList.join(", ")}.
          </Text>
        )}
      </Section>

      <Divider />

      <Kicker>acceso y check-in</Kicker>
      <Paragraph>
        Tu entrada a la actividad está asociada a tu pase general del evento. Presenta tu código QR
        en la puerta de la sala asignada antes de que comience la sesión:
      </Paragraph>

      {qrImgUrl ? (
        <Section style={{ textAlign: "center", margin: "20px 0" }}>
          <Img
            src={qrImgUrl}
            alt="Código QR de acceso"
            width="180"
            height="180"
            style={{
              margin: "0 auto",
              display: "block",
              border: `2px solid ${C.line}`,
              borderRadius: "12px",
              backgroundColor: "#FFFFFF",
              padding: "10px",
            }}
          />
          <Text
            style={{
              margin: "8px 0 0",
              fontFamily: MONO,
              fontSize: "12px",
              color: C.muted,
            }}
          >
            Pase ID: {qrCode}
          </Text>
        </Section>
      ) : null}

      <HardButton href={passportUrl} variant="outline">
        Ver mi pasaporte digital y gafete
      </HardButton>

      <Divider />

      <Callout title="política de puntualidad">
        Las actividades inician puntualmente. Te sugerimos llegar a la sala asignada con{" "}
        <strong>10 minutos de anticipación</strong>. Si no te presentas 5 minutos después del
        inicio, tu lugar podrá ser reasignado a personas en lista de espera en piso.
      </Callout>

      <HardButton href={APP_URL}>Ir al sitio del evento</HardButton>
    </EmailLayout>
  );
}

export default ActivityAssignmentEmail;
