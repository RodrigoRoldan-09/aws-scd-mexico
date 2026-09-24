import { BigStat, Callout, EmailLayout, HardButton, Heading, Kicker, Paragraph, Steps } from "./_kit";

interface CertChallengeEmailProps {
  name?: string;
}

const SKILL_BUILDER = "https://skillbuilder.aws/";
const CERTIFICATION = "https://aws.amazon.com/certification/";

export function CertChallengeEmail({ name }: CertChallengeEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout preview="El reto: tu primera certificación AWS" strip="RETO DE CERTIFICACIÓN ·">
      <Kicker>el reto</Kicker>
      <Heading>{firstName ? `${firstName}, ahora la certificación.` : "Ahora la certificación."}</Heading>

      <Paragraph>
        Viniste al evento, viste lo que se puede hacer con la nube. El siguiente
        paso natural es certificarte — y el primero, Cloud Practitioner, es más
        alcanzable de lo que parece.
      </Paragraph>

      <BigStat value="90 días" label="es un plazo realista" />

      <Kicker>por dónde empezar</Kicker>
      <Steps
        items={[
          "Crea tu cuenta en AWS Skill Builder — el curso base es gratuito.",
          "Dedícale 4 o 5 horas por semana; no necesitas más.",
          "Haz los exámenes de práctica hasta pasar el 80% consistentemente.",
          "Agenda el examen: tener fecha es lo que hace que suceda.",
        ]}
      />

      <HardButton href={SKILL_BUILDER}>Empezar en Skill Builder</HardButton>
      <HardButton href={CERTIFICATION} variant="outline">
        Ver las certificaciones
      </HardButton>

      <Callout title="no vas solo">
        Cuéntanos por redes que estás en el reto. Los Student Builder Groups
        arman grupos de estudio y resuelven dudas entre todos.
      </Callout>
    </EmailLayout>
  );
}

export default CertChallengeEmail;
