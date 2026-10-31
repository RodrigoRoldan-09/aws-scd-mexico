import {
  APP_URL,
  BilingualSections,
  Callout,
  DetailBox,
  EmailLayout,
  Framed,
  Heading,
  Kicker,
  Paragraph,
  type Detail,
} from "./_kit";

export interface ActivityAssignmentEmailProps {
  name?: string;
  activityTitleEs: string;
  activityTitleEn: string;
  timeRange: string;
  room?: string;
  qrCode: string;
}

/**
 * Aviso de que un admin asignó la actividad a una postulación del formulario
 * unificado. Bilingüe; el QR del pase va una vez.
 */
export function ActivityAssignmentEmail({
  name,
  activityTitleEs,
  activityTitleEn,
  timeRange,
  room,
  qrCode,
}: ActivityAssignmentEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";
  const titleEn = activityTitleEn || activityTitleEs;

  const rowsEs: Detail[] = [
    { label: "Actividad", value: activityTitleEs },
    { label: "Horario", value: timeRange },
    ...(room ? [{ label: "Salón", value: room }] : []),
  ];
  const rowsEn: Detail[] = [
    { label: "Activity", value: titleEn },
    { label: "Time", value: timeRange },
    ...(room ? [{ label: "Room", value: room }] : []),
  ];

  const es = (
    <>
      <Kicker>actividad asignada</Kicker>
      <Heading>{firstName ? `${firstName}, ya tienes lugar.` : "Ya tienes lugar."}</Heading>

      <Paragraph>
        Revisamos tu postulación y te asignamos a <strong>{activityTitleEs}</strong>.
      </Paragraph>

      <DetailBox rows={rowsEs} />

      <Callout title="tu pase">
        Presenta el código QR de este correo al llegar. Llega unos minutos antes:
        si no te presentas, el lugar puede liberarse.
      </Callout>
    </>
  );

  const en = (
    <>
      <Kicker>activity assigned</Kicker>
      <Heading>{firstName ? `${firstName}, you've got a spot.` : "You've got a spot."}</Heading>

      <Paragraph>
        We reviewed your application and assigned you to <strong>{titleEn}</strong>.
      </Paragraph>

      <DetailBox rows={rowsEn} />

      <Callout title="your pass">
        Show the QR code in this email when you arrive. Arrive a few minutes early:
        if you don&apos;t show up, your spot may be released.
      </Callout>
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
    </EmailLayout>
  );
}

export default ActivityAssignmentEmail;
