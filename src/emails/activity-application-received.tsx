import {
  BilingualSections,
  Callout,
  EmailLayout,
  Heading,
  Kicker,
  Paragraph,
  Steps,
} from "./_kit";

export interface ActivityApplicationPriority {
  rank: number;
  title: string;
  timeRange: string;
}

export interface ActivityApplicationReceivedEmailProps {
  name?: string;
  priorities: ActivityApplicationPriority[];
}

/**
 * Acuse de la postulación del formulario unificado. No reserva lugar ni lleva
 * QR: un admin asigna UNA actividad después y eso llega en otro correo.
 * El título de cada actividad se repite igual en la sección en inglés.
 */
export function ActivityApplicationReceivedEmail({
  name,
  priorities,
}: ActivityApplicationReceivedEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";
  const ordered = [...priorities].sort((a, b) => a.rank - b.rank);
  const items = ordered.map((p) => `${p.title} — ${p.timeRange}`);

  const es = (
    <>
      <Kicker>postulación recibida</Kicker>
      <Heading>{firstName ? `Gracias, ${firstName}.` : "Recibimos tu postulación."}</Heading>

      <Paragraph>
        Recibimos tu postulación. Te asignaremos tu actividad. Estas son tus
        prioridades, en el orden que elegiste:
      </Paragraph>

      {items.length > 0 && <Steps items={items} />}

      <Callout title="importante">
        Esto todavía no reserva tu lugar. Un administrador te asignará UNA sola
        actividad según tus prioridades y el cupo disponible, y te llegará otro
        correo con tu pase QR.
      </Callout>
    </>
  );

  const en = (
    <>
      <Kicker>application received</Kicker>
      <Heading>{firstName ? `Thanks, ${firstName}.` : "We received your application."}</Heading>

      <Paragraph>
        We received your application. We&apos;ll assign your activity. These are your
        priorities, in the order you chose:
      </Paragraph>

      {items.length > 0 && <Steps items={items} />}

      <Callout title="important">
        This does not reserve your spot yet. An admin will assign you ONE activity
        based on your priorities and available capacity, and you&apos;ll receive
        another email with your QR pass.
      </Callout>
    </>
  );

  return (
    <EmailLayout
      preview="Recibimos tu postulación · We received your application"
      strip="POSTULACIÓN RECIBIDA ·"
    >
      <BilingualSections es={es} en={en} />
    </EmailLayout>
  );
}

export default ActivityApplicationReceivedEmail;
