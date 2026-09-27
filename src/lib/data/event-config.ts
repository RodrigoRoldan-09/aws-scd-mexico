import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { CFP_DEADLINE } from "@/data/cfp";
import { connectDB } from "@/lib/db";
import { EventConfig } from "@/models/event-config";
import { Form } from "@/models/form";

// Tag para invalidar la caché cuando el admin edita la config
export const EVENT_CONFIG_TAG = "event-config";

// Solo los campos públicos (los que consume el sitio). Los campos de staff
// (tips, slideTemplateUrl, etc.) nunca salen por aquí.
//
// Va en dos piezas a propósito: lo que sale de la base se cachea cinco minutos,
// y `cfpOpen` no puede cachearse porque es una comparación contra el reloj —
// guardarla dejaría la convocatoria «abierta» hasta cinco minutos después de su
// cierre—. La compone el layout en cada petición.
export type EventConfigDB = {
  trackVirtualUrl: string;
  photosUrl: string;
  recordingsUrl: string;
  notify2027Url: string;
  showSponsorsCta: boolean;
  showSpeakerCta: boolean;
  /**
   * Si los formularios están recibiendo respuestas.
   *
   * Viven en la colección `Form` y hasta ahora sólo los leía cada formulario en
   * su propia página, así que la portada ofrecía «Regístrate ahora» aunque el
   * registro estuviera cerrado: te llevaba a una pantalla que decía que no.
   *
   * El de speakers no está acá: su apertura la manda `CFP_DEADLINE`, que es una
   * fecha del código y se comprueba en el navegador.
   */
  attendeeOpen: boolean;
  volunteerOpen: boolean;
};

export type PublicEventConfig = EventConfigDB & {
  /** Si la convocatoria de speakers sigue abierta. La manda `CFP_DEADLINE`. */
  cfpOpen: boolean;
};

// Config segura por defecto: se usa cuando no hay documento y como respaldo
// si la DB falla, para que el sitio no caiga (degradación elegante).
export const EMPTY_PUBLIC_CONFIG: EventConfigDB = {
  trackVirtualUrl: "",
  photosUrl: "",
  recordingsUrl: "",
  notify2027Url: "",
  showSponsorsCta: true,
  showSpeakerCta: true,
  // Cerrados por defecto: si la base no responde es mejor no ofrecer una puerta
  // que puede estar cerrada. El botón de registro sale igual, pero apagado.
  attendeeOpen: false,
  volunteerOpen: false,
};

// Lee la config pública desde la DB, cacheada. Se invalida con
// revalidateTag(EVENT_CONFIG_TAG) cuando el admin guarda cambios.
export const getPublicEventConfig = unstable_cache(
  async (): Promise<EventConfigDB> => {
    await connectDB();
    const [c, attendee, volunteer] = await Promise.all([
      EventConfig.findOne().lean<Record<string, unknown>>(),
      Form.findOne({ formType: "attendee" }).select("isOpen").lean<{ isOpen?: boolean }>(),
      Form.findOne({ formType: "volunteer" }).select("isOpen").lean<{ isOpen?: boolean }>(),
    ]);
    const formularios = {
      attendeeOpen: false,
      volunteerOpen: !!volunteer?.isOpen,
    };
    if (!c) return { ...EMPTY_PUBLIC_CONFIG, ...formularios };
    return {
      ...formularios,
      trackVirtualUrl: (c.trackVirtualUrl as string) || "",
      photosUrl: (c.photosUrl as string) || "",
      recordingsUrl: (c.recordingsUrl as string) || "",
      notify2027Url: (c.notify2027Url as string) || "",
      showSponsorsCta: typeof c.showSponsorsCta === "boolean" ? c.showSponsorsCta : true,
      showSpeakerCta: typeof c.showSpeakerCta === "boolean" ? c.showSpeakerCta : true,
    };
  },
  ["public-event-config"],
  { tags: [EVENT_CONFIG_TAG], revalidate: 300 },
);

/**
 * Si la convocatoria de speakers sigue abierta.
 *
 * No sale de la base: la manda `CFP_DEADLINE`, una fecha del código con su
 * offset horario explícito. Va aparte de la lectura cacheada a propósito —
 * cachear una comparación contra el reloj dejaría la convocatoria «abierta»
 * hasta cinco minutos después de cerrar.
 *
 * `connection()` es la forma que da Next para decir «de acá en adelante, en
 * cada petición»: se lee el reloj, así que esto no puede pre-renderizarse.
 */
export async function isCfpOpen(): Promise<boolean> {
  await connection();
  return Date.now() <= new Date(CFP_DEADLINE).getTime();
}
