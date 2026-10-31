import {
  APP_URL,
  BilingualSections,
  Callout,
  DetailBox,
  EmailLayout,
  Framed,
  HardButton,
  Heading,
  Kicker,
  Paragraph,
  type Detail,
} from "./_kit";

export interface ActivityRegistrationConfirmationEmailProps {
  name?: string;
  activityTitleEs: string;
  activityTitleEn: string;
  dateLong: string;
  timeRange: string;
  room?: string;
  typeLabelEs: string;
  typeLabelEn: string;
  qrCode: string;
  /** Presente sólo en el correo de los integrantes que inscribió un líder. */
  leaderName?: string;
  teamName?: string;
}

/**
 * Confirmación de inscripción a una actividad v2 (hackathon, build day,
 * revisión de CV, etc.). Bilingüe; el QR del pase va una vez.
 *
 * Cuando un líder inscribe a su equipo, cada integrante recibe este mismo
 * correo con la frase de contexto; el del líder la omite.
 */
export function ActivityRegistrationConfirmationEmail({
  name,
  activityTitleEs,
  activityTitleEn,
  dateLong,
  timeRange,
  room,
  typeLabelEs,
  typeLabelEn,
  qrCode,
  leaderName,
  teamName,
}: ActivityRegistrationConfirmationEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";
  const titleEn = activityTitleEn || activityTitleEs;
  const team = (teamName || "").trim();

  const rowsEs: Detail[] = [
    { label: "Actividad", value: activityTitleEs },
    { label: "Tipo", value: typeLabelEs },
    { label: "Fecha", value: dateLong },
    { label: "Horario", value: timeRange },
    ...(room ? [{ label: "Salón", value: room }] : []),
  ];
  const rowsEn: Detail[] = [
    { label: "Activity", value: titleEn },
    { label: "Type", value: typeLabelEn || typeLabelEs },
    { label: "Date", value: dateLong },
    { label: "Time", value: timeRange },
    ...(room ? [{ label: "Room", value: room }] : []),
  ];

  const es = (
    <>
      <Kicker>inscripción confirmada</Kicker>
      <Heading>{firstName ? `Listo, ${firstName}.` : "Tu lugar está reservado."}</Heading>

      {leaderName ? (
        <Paragraph>
          {leaderName} te inscribió como integrante del equipo{" "}
          {team ? `«${team}»` : "tu equipo"} en <strong>{activityTitleEs}</strong>.
        </Paragraph>
      ) : (
        <Paragraph>
          Quedaste inscrito en <strong>{activityTitleEs}</strong>. El cupo es limitado y
          ya tienes el tuyo.
        </Paragraph>
      )}

      <DetailBox rows={rowsEs} />

      <Callout title="tu pase">
        Presenta el código QR de este correo al llegar a la actividad. Llega unos
        minutos antes: si no te presentas, el lugar puede liberarse.
      </Callout>
    </>
  );

  const en = (
    <>
      <Kicker>registration confirmed</Kicker>
      <Heading>{firstName ? `You're in, ${firstName}.` : "Your spot is reserved."}</Heading>

      {leaderName ? (
        <Paragraph>
          {leaderName} registered you as a member of{" "}
          {team ? `team "${team}"` : "your team"} for <strong>{titleEn}</strong>.
        </Paragraph>
      ) : (
        <Paragraph>
          You&apos;re registered for <strong>{titleEn}</strong>. Spots are limited and
          you&apos;ve got yours.
        </Paragraph>
      )}

      <DetailBox rows={rowsEn} />

      <Callout title="your pass">
        Show the QR code in this email when you arrive at the activity. Arrive a few
        minutes early: if you don&apos;t show up, your spot may be released.
      </Callout>
    </>
  );

  return (
    <EmailLayout
      preview={`Inscripción confirmada: ${activityTitleEs} · Registration confirmed: ${titleEn}`}
      strip="INSCRIPCIÓN CONFIRMADA ·"
    >
      <BilingualSections es={es} en={en} />

      <Kicker>tu pase · your pass</Kicker>
      <Framed
        src={`${APP_URL}/api/pass-qr/${qrCode}`}
        alt="Código QR del pase / Pass QR code"
        width={220}
        caption="Muestra este código al llegar · Show this code when you arrive"
      />

      <HardButton href={`${APP_URL}/actividades`}>
        Ver actividades · View activities
      </HardButton>
    </EmailLayout>
  );
}

export default ActivityRegistrationConfirmationEmail;
