import { Text } from "@react-email/components";
import {
  APP_URL, C, DetailBox, EmailLayout, EVT, Framed, HardButton, Heading, Kicker, MONO, Paragraph,
} from "./_kit";

interface KeynoteAnnouncementEmailProps {
  recipientName?: string;
  firstName: string;
  lastName: string;
  role?: string;
  company?: string;
  talkType?: string;
  talkTitle?: string;
  photoAbsoluteUrl?: string;
  linkedinUrl?: string;
}

export function KeynoteAnnouncementEmail({
  recipientName,
  firstName,
  lastName,
  role,
  company,
  talkType,
  talkTitle,
  photoAbsoluteUrl,
  linkedinUrl,
}: KeynoteAnnouncementEmailProps) {
  const to = recipientName ? recipientName.split(" ")[0] : "";
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <EmailLayout
      preview={`Keynote confirmado: ${fullName}`}
      strip="KEYNOTE CONFIRMADO ·"
    >
      <Kicker>keynote confirmado</Kicker>
      <Heading>{to ? `${to}, mira quién viene.` : "Mira quién viene."}</Heading>

      <Paragraph>
        Se suma a la agenda del AWS Student Community Day México 2026:
      </Paragraph>

      {photoAbsoluteUrl && (
        <Framed src={photoAbsoluteUrl} alt={fullName} width={220} />
      )}

      <Text
        style={{
          margin: "0 0 4px",
          fontFamily: MONO,
          fontSize: "24px",
          fontWeight: 700,
          lineHeight: "1.2",
          color: C.white,
        }}
      >
        {fullName}
      </Text>
      {(role || company) && (
        <Text style={{ margin: "0 0 18px", fontFamily: MONO, fontSize: "13px", color: C.block }}>
          {[role, company].filter(Boolean).join(" · ")}
        </Text>
      )}

      {talkTitle && (
        <DetailBox
          rows={[
            ...(talkType ? [{ label: "Tipo", value: talkType }] : []),
            { label: "Charla", value: talkTitle },
          ]}
        />
      )}

      <DetailBox
        rows={[
          { label: "Fecha", value: EVT.dateLong },
          { label: "Lugar", value: EVT.venue },
        ]}
      />

      <HardButton href={`${APP_URL}/directorio`}>Ver la agenda completa</HardButton>
      {linkedinUrl && (
        <HardButton href={linkedinUrl} variant="outline">
          Perfil de LinkedIn
        </HardButton>
      )}
    </EmailLayout>
  );
}

export default KeynoteAnnouncementEmail;
