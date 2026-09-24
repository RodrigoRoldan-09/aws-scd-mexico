import { getAgendaEvents } from "@/lib/data/agenda";
import { AgendaView } from "./agenda";

// Server Component: trae la agenda en el servidor (cacheada) y la pasa ya
// renderizada a la vista cliente. Sin fetch en el navegador, sin CLS.
export async function Agenda() {
  // Si la DB falla, la sección queda vacía en vez de tirar toda la página
  const events = await getAgendaEvents().catch(() => []);
  return <AgendaView events={events} />;
}
