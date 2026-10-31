import {
  APP_URL,
  BilingualSections,
  Callout,
  DetailBox,
  EmailLayout,
  EVT,
  Framed,
  HardButton,
  Heading,
  Kicker,
  Paragraph,
  Steps,
  type Detail,
} from "./_kit";

export interface ActivityAssignmentEmailProps {
  name?: string;
  activityTitleEs: string;
  activityTitleEn: string;
  timeRange: string;
  room?: string;
  qrCode: string;
  /** Prioridad de la solicitud que se asignó (1, 2, 3…) o null si fue asignación directa. */
  priorityRank?: number | null;
  requiresLaptop?: boolean;
  prerequisitesList?: string[];
  prerequisitesListEn?: string[];
}

/**
 * Aviso de que un admin asignó la actividad a una postulación del formulario
 * unificado. Bilingüe; el QR del pase va una vez.
 *
 * Une la versión del equipo (prioridad, requisitos, soporte y puntualidad)
 * con la base bilingüe, para que se mande un solo correo por asignación.
 */
export function ActivityAssignmentEmail({
  name,
  activityTitleEs,
  activityTitleEn,
  timeRange,
  room,
  qrCode,
  priorityRank,
  requiresLaptop,
  prerequisitesList = [],
  prerequisitesListEn = [],
}: ActivityAssignmentEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";
  const titleEn = activityTitleEn || activityTitleEs;
  const hasRank = typeof priorityRank === "number" && priorityRank > 0;

  const rowsEs: Detail[] = [
    { label: "Actividad", value: activityTitleEs },
    { label: "Selección", value: hasRank ? `Prioridad #${priorityRank} de tu solicitud` : "Asignación directa del comité" },
    { label: "Horario", value: timeRange },
    { label: "Salón", value: room || "Por asignar en la sede" },
    { label: "Fecha", value: EVT.dateLong },
    { label: "Sede", value: EVT.venue },
  ];
  const rowsEn: Detail[] = [
    { label: "Activity", value: titleEn },
    { label: "Selection", value: hasRank ? `Priority #${priorityRank} of your application` : "Direct assignment by the committee" },
    { label: "Time", value: timeRange },
    { label: "Room", value: room || "To be assigned at the venue" },
    { label: "Date", value: "Wednesday, November 4, 2026" },
    { label: "Venue", value: EVT.venue },
  ];

  const reqsEs = [
    requiresLaptop
      ? "Es indispensable que lleves tu propia laptop con cargador."
      : "No es obligatorio llevar laptop.",
    ...prerequisitesList,
  ];
  const reqsEn = [
    requiresLaptop
      ? "You must bring your own laptop and charger."
      : "A laptop is not required.",
    ...(prerequisitesListEn.length ? prerequisitesListEn : prerequisitesList),
  ];

  const es = (
    <>
      <Kicker>actividad asignada</Kicker>
      <Heading>{firstName ? `${firstName}, ya tienes lugar.` : "Ya tienes lugar."}</Heading>

      <Paragraph>
        Revisamos las postulaciones para las actividades con cupo limitado y fuiste
        seleccionado(a) para <strong>{activityTitleEs}</strong>.
      </Paragraph>

      <DetailBox rows={rowsEs} />

      <Kicker>requisitos para participar</Kicker>
      <Steps items={reqsEs} />

      <Callout title="puntualidad">
        Las actividades inician puntualmente. Llega a tu salón con 10 minutos de anticipación
        y presenta el QR de este correo: si no te presentas 5 minutos después del inicio, tu
        lugar puede reasignarse a la lista de espera.
      </Callout>

      <Paragraph>
        El equipo organizador podría escribirte a este mismo correo antes del evento para
        pedirte información adicional (por ejemplo, tu CV en PDF o tu perfil de GitHub).
      </Paragraph>
    </>
  );

  const en = (
    <>
      <Kicker>activity assigned</Kicker>
      <Heading>{firstName ? `${firstName}, you've got a spot.` : "You've got a spot."}</Heading>

      <Paragraph>
        We reviewed the applications for the limited-capacity activities and you were
        selected for <strong>{titleEn}</strong>.
      </Paragraph>

      <DetailBox rows={rowsEn} />

      <Kicker>requirements</Kicker>
      <Steps items={reqsEn} />

      <Callout title="be on time">
        Activities start on time. Arrive at your room 10 minutes early and show the QR code in
        this email: if you don&apos;t show up within 5 minutes of the start, your spot may be
        given to the waiting list.
      </Callout>

      <Paragraph>
        The organizing team may reach out to this email before the event to ask for extra
        information (for example, your CV in PDF or your GitHub profile).
      </Paragraph>
    </>
  );

  return (
    <EmailLayout
      preview={`Tu actividad fue asignada: ${activityTitleEs} · Your activity has been assigned: ${titleEn}`}
      strip="ACTIVIDAD ASIGNADA ·"
    >
      <BilingualSections es={es} en={en} />

      <Kicker>tu pase · your pass</Kicker>
      <Framed
        src={`${APP_URL}/api/pass-qr/${qrCode}`}
        alt="Código QR del pase / Pass QR code"
        width={220}
        caption="Muestra este código al llegar · Show this code when you arrive"
      />

      <HardButton href={APP_URL}>Ir al sitio del evento · Event website</HardButton>
    </EmailLayout>
  );
}

export default ActivityAssignmentEmail;
