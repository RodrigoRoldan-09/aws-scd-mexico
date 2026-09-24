import { BigStat, EmailLayout, HardButton, Heading, Kicker, Paragraph } from "./_kit";

interface PostSurveyEmailProps {
  name?: string;
  /** Enlace propio con token: registra el clic y redirige a la encuesta de AWS. */
  surveyUrl: string;
}

export function PostSurveyEmail({ name, surveyUrl }: PostSurveyEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout preview="Cuéntanos cómo te fue — 3 minutos" strip="TU OPINIÓN ·">
      <Kicker>3 minutos</Kicker>
      <Heading>{firstName ? `${firstName}, ¿cómo te fue?` : "¿Cómo te fue?"}</Heading>

      <Paragraph>
        La encuesta es de AWS y decide cosas concretas: si el evento vuelve el
        próximo año, con qué presupuesto y en qué formato. No es un trámite.
      </Paragraph>

      <BigStat value="3 min" label="es lo que toma" />

      <HardButton href={surveyUrl}>Responder la encuesta</HardButton>

      <Paragraph muted>
        Si ya la respondiste, gracias — puedes ignorar este correo.
      </Paragraph>
    </EmailLayout>
  );
}

export default PostSurveyEmail;
