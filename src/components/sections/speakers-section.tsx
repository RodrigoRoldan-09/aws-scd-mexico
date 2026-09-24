import { getPublicSpeakers } from "@/lib/data/speakers";
import { SpeakersView } from "./speakers";

// Server Component: trae los speakers en el servidor (cacheado) y los pasa ya
// renderizados a la vista cliente.
export async function Speakers() {
  // Si la DB falla, la sección queda vacía en vez de tirar toda la página
  const profiles = await getPublicSpeakers().catch(() => []);
  return <SpeakersView profiles={profiles} />;
}
