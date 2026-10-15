import { SpeakersScreen } from "../_screen";

/**
 * Formulario directo para registro de workshops.
 * Mismo diseño y flujo del Call for Speakers pero preconfigurado para Workshop.
 */
export default function WorkshopRegisterPage() {
  return <SpeakersScreen formOnly initialFormat="workshop" />;
}
