import type { MoveKind } from "@/components/admin/move-dialog";

/** Cifras de todas las listas, tal como las devuelve la consola. */
export interface ConsoleSummary {
  attendees: number;
  inPerson: number;
  online: number;
  checkedIn: number;
  confirmed: number;
  volunteers: number;
  volunteersApproved: number;
  speakers: number;
  speakersAccepted: number;
  passports: number;
  users: number;
}

export type PersonKind = "attendee" | "volunteer" | "speaker";

/** Una persona encontrada, con la lista en la que está. */
export interface PersonHit {
  kind: PersonKind;
  id: string;
  name: string;
  email: string;
  /** Una línea de contexto: modalidad, si está aprobado, el estado… */
  detail: string;
  /** Con qué se dibuja su carita: el `qrCode` de un asistente, el correo del resto. */
  seed: string;
  /** Foto real, si la subió. */
  photo?: string;
}

/** Qué movimientos ofrece cada lista. */
export function movesFor(hit: PersonHit): MoveKind[] {
  if (hit.kind === "attendee") {
    const online = hit.detail.startsWith("Online");
    return [online ? "attendance_in_person" : "attendance_online", "registration_to_volunteer"];
  }
  if (hit.kind === "volunteer") return ["volunteer_to_registration"];
  return ["speaker_to_registration"];
}

export const KIND_LABEL: Record<PersonKind, string> = {
  attendee: "Asistente",
  volunteer: "Voluntario",
  speaker: "Speaker",
};
