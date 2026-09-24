import { APP_URL, EmailLayout, HardButton, Heading, Kicker, Paragraph } from "./_kit";

interface ResilienceMessageEmailProps {
  name?: string;
}

export function ResilienceMessageEmail({ name }: ResilienceMessageEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";

  return (
    <EmailLayout preview="Un mensaje del equipo organizador" strip="GRACIAS ·">
      <Kicker>del equipo</Kicker>
      <Heading>{firstName ? `Gracias, ${firstName}.` : "Gracias."}</Heading>

      <Paragraph>
        Organizar un evento así es una seguidilla de imprevistos que nadie ve. Lo
        que sí se ve es la sala llena y la gente aprendiendo — y eso pasó gracias
        a que ustedes estuvieron ahí.
      </Paragraph>

      <Paragraph>
        No todo salió como lo planeamos, y eso también se aprende. Nos llevamos
        la lista de qué mejorar y las ganas de hacerlo otra vez.
      </Paragraph>

      <HardButton href={`${APP_URL}/directorio`} variant="outline">
        Ver a la comunidad
      </HardButton>

      <Paragraph muted>
        Nos vemos en la próxima.
      </Paragraph>
    </EmailLayout>
  );
}

export default ResilienceMessageEmail;
