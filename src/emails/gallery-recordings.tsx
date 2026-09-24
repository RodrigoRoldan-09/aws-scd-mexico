import { EmailLayout, HardButton, Heading, Kicker, Paragraph } from "./_kit";

interface GalleryRecordingsEmailProps {
  name?: string;
  galleryUrl?: string;
  virtualRecordingUrl?: string;
  hybridRecordingUrl?: string;
}

export function GalleryRecordingsEmail({
  name,
  galleryUrl,
  virtualRecordingUrl,
  hybridRecordingUrl,
}: GalleryRecordingsEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout preview="Ya están las fotos y las grabaciones" strip="FOTOS Y GRABACIONES ·">
      <Kicker>ya están arriba</Kicker>
      <Heading>{firstName ? `${firstName}, revívelo.` : "Revívelo."}</Heading>

      <Paragraph>
        Subimos las fotos del día y las grabaciones de las charlas. Descarga lo
        que quieras y compártelo — para eso está.
      </Paragraph>

      {galleryUrl && <HardButton href={galleryUrl}>Ver la galería de fotos</HardButton>}
      {hybridRecordingUrl && (
        <HardButton href={hybridRecordingUrl} variant="outline">
          Grabaciones — sala principal
        </HardButton>
      )}
      {virtualRecordingUrl && (
        <HardButton href={virtualRecordingUrl} variant="outline">
          Grabaciones — Track Online
        </HardButton>
      )}

      <Paragraph muted>
        ¿Saliste en una foto y prefieres que la bajemos? Respóndenos y la
        quitamos, sin preguntas.
      </Paragraph>
    </EmailLayout>
  );
}

export default GalleryRecordingsEmail;
