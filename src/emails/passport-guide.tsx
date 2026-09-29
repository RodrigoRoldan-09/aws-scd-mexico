import { APP_URL, Callout, EmailLayout, HardButton, Heading, Kicker, Paragraph, Steps } from "./_kit";

interface PassportGuideEmailProps {
  name?: string;
  passportUrl?: string;
}

export function PassportGuideEmail({ name, passportUrl }: PassportGuideEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";
  const url = passportUrl || `${APP_URL}/pasaporte`;

  return (
    <EmailLayout preview="Cómo sacarle todo el jugo a tu pasaporte" strip="GUÍA DEL PASAPORTE ·">
      <Kicker>guía rápida</Kicker>
      <Heading>{firstName ? `${firstName}, así se usa.` : "Así se usa tu pasaporte."}</Heading>

      <Paragraph>
        Tres minutos completando tu perfil valen más que cualquier tarjeta de
        presentación. Esto es lo que conviene hacer antes del evento.
      </Paragraph>

      <HardButton href={url}>Abrir mi pasaporte</HardButton>

      <Kicker>antes del evento</Kicker>
      <Steps
        items={[
          "Agrega tu LinkedIn y GitHub: son los que más se consultan después.",
          "Pon tu cargo o carrera — ayuda a que te ubiquen en el networking.",
          "Revisa que tu nombre esté bien escrito: así sale en tu gafete.",
        ]}
      />

      <Kicker>durante el evento</Kicker>
      <Steps
        items={[
          "Muestra tu QR en cada stand para que te sellen.",
          "Los sellos completos entran al sorteo del cierre.",
          "Comparte tu pasaporte con quien conozcas: es tu perfil público.",
        ]}
      />

      <Callout title="ojo">
        Tu pasaporte es público: solo pon ahí lo que quieras que cualquiera vea.
        Puedes editarlo cuando quieras.
      </Callout>
    </EmailLayout>
  );
}

export default PassportGuideEmail;
