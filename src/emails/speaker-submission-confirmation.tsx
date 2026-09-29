import { Text } from "@react-email/components";
import {
  APP_URL,
  C,
  Callout,
  DetailBox,
  Divider,
  EmailLayout,
  HardButton,
  Heading,
  Kicker,
  MONO,
  Paragraph,
  Steps,
  EVT,
} from "./_kit";

export interface SpeakerSubmissionConfirmationEmailProps {
  firstName: string;
  talkTitle: string;
  talkAbstract: string;
  sessionType: string;
  audienceLevel: string;
  language: string;
  countryCity: string;
  tagline: string;
  requirements?: string;
  coSpeakerNames?: string[];
  /** Enlace público del perfil, una vez aprobado. */
  slug?: string;
}

/** Etiquetas legibles: en la base se guardan los valores en clave. */
const SESSION_TYPE: Record<string, string> = {
  online: "Online — sesión virtual",
  "in-person": "Presencial — en la sede",
};

const LEVEL: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  expert: "Experto",
};

const LANGUAGE: Record<string, string> = {
  es: "Español",
  en: "English",
};

/**
 * Acuse de recibo del Call for Speakers, con copia de lo enviado.
 *
 * Incluye lo enviado porque el formulario no se puede editar después: si algo
 * quedó mal, esta copia es la única forma de que la persona lo note y escriba
 * a tiempo.
 */
export function SpeakerSubmissionConfirmationEmail({
  firstName,
  talkTitle,
  talkAbstract,
  sessionType,
  audienceLevel,
  language,
  countryCity,
  tagline,
  requirements,
  coSpeakerNames = [],
}: SpeakerSubmissionConfirmationEmailProps) {
  return (
    <EmailLayout
      preview={`Recibimos tu propuesta: ${talkTitle}`}
      strip="PROPUESTA RECIBIDA ·"
    >
      <Kicker>propuesta recibida</Kicker>
      <Heading>
        {firstName ? `Gracias, ${firstName}.` : "Recibimos tu propuesta."}
      </Heading>

      <Paragraph>
        Tu propuesta para el AWS Student Community Day México 2026 quedó
        registrada. Abajo va una copia de lo que enviaste, para que la tengas.
      </Paragraph>

      <Callout title="qué pasa ahora">
        El comité revisa cada propuesta de forma anónima: durante la evaluación
        no se ve quién la envió. Te escribimos por correo con la respuesta,
        salga como salga.
      </Callout>

      <Steps
        items={[
          "El CFP cierra el 14 de octubre a las 23:59 (hora de la Ciudad de México).",
          "Curaduría y evaluación, del 15 al 20 de octubre.",
          "Publicación de seleccionados, 21 de octubre.",
          `Si quedas, la entrega de diapositivas es el ${EVT.slidesDeadline}.`,
        ]}
      />

      <Divider />

      <Kicker>copia de tu propuesta</Kicker>

      <Text
        style={{
          margin: "0 0 6px",
          fontFamily: MONO,
          fontSize: "11px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: C.blockDeep,
        }}
      >
        Título
      </Text>
      <Text
        style={{
          margin: "0 0 18px",
          fontFamily: MONO,
          fontSize: "15px",
          fontWeight: 700,
          lineHeight: "1.5",
          color: C.block,
        }}
      >
        {talkTitle}
      </Text>

      <Text
        style={{
          margin: "0 0 6px",
          fontFamily: MONO,
          fontSize: "11px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: C.blockDeep,
        }}
      >
        Descripción
      </Text>
      <Text
        style={{
          margin: "0 0 20px",
          fontFamily: MONO,
          fontSize: "13px",
          lineHeight: "1.7",
          color: C.muted,
          whiteSpace: "pre-wrap",
        }}
      >
        {talkAbstract}
      </Text>

      <DetailBox
        rows={[
          { label: "Modalidad", value: SESSION_TYPE[sessionType] ?? sessionType },
          { label: "Nivel", value: LEVEL[audienceLevel] ?? audienceLevel },
          { label: "Idioma", value: LANGUAGE[language] ?? language },
          { label: "Ciudad", value: countryCity },
          { label: "Tu rol", value: tagline },
          ...(coSpeakerNames.length > 0
            ? [{ label: "Co-speakers", value: coSpeakerNames.join(", ") }]
            : []),
          ...(requirements
            ? [{ label: "Requerimientos", value: requirements }]
            : []),
        ]}
      />

      <Paragraph muted>
        La propuesta no se puede editar desde el sitio. Si viste algo mal en
        esta copia, respóndenos este correo antes del cierre y lo corregimos.
      </Paragraph>

      <Divider />

      <HardButton href={APP_URL}>Ver el sitio</HardButton>
    </EmailLayout>
  );
}

export default SpeakerSubmissionConfirmationEmail;
