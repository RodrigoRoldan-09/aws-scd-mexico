import type {
  ActivityApplicationAdminRow,
  ActivityRegistrationAdminRecord,
  ActivityType,
  ICustomField,
  PublicActivityDTO,
} from "@/types/activities";

/**
 * Normalizadores puros (sin dependencias de servidor) entre los documentos que
 * devuelven las rutas `/api/activities/*` y los DTOs que consume la UI.
 */

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const iso = (v: unknown): string => (v ? new Date(v as string).toISOString() : "");

/** Mensaje legible de un cuerpo de error de la API (`message` > `error`). */
export function apiErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const d = data as { message?: unknown; error?: unknown };
    if (typeof d.message === "string" && d.message) return d.message;
    if (typeof d.error === "string" && d.error) return d.error;
  }
  return fallback;
}

export function toPublicActivityDTO(raw: Raw): PublicActivityDTO {
  const maxCapacity = num(raw.maxCapacity);
  const registeredCount = num(raw.registeredCount);
  const spotsLeft = Math.max(0, maxCapacity - registeredCount);
  const fc: Raw = raw.formConfig ?? {};
  return {
    _id: str(raw._id),
    slug: str(raw.slug),
    type: (raw.type as ActivityType) ?? "workshop",
    title: str(raw.title),
    titleEn: str(raw.titleEn),
    description: str(raw.description),
    descriptionEn: str(raw.descriptionEn),
    roomName: str(raw.roomName),
    speakerName: str(raw.speakerName),
    level: (raw.level ?? "") as PublicActivityDTO["level"],
    startTime: str(raw.startTime),
    endTime: str(raw.endTime),
    isPublished: raw.isPublished !== false,
    isOpen: raw.isOpen !== false,
    maxCapacity,
    registeredCount,
    spotsLeft,
    isSoldOut: registeredCount >= maxCapacity,
    order: num(raw.order),
    formConfig: {
      requireLaptop: !!fc.requireLaptop,
      prerequisitesList: Array.isArray(fc.prerequisitesList) ? fc.prerequisitesList : [],
      prerequisitesListEn: Array.isArray(fc.prerequisitesListEn) ? fc.prerequisitesListEn : [],
      participationMode: fc.participationMode ?? "individual",
      minTeamSize: num(fc.minTeamSize) || 1,
      maxTeamSize: num(fc.maxTeamSize) || 3,
      capacityMode: fc.capacityMode ?? "per_person",
      customFields: Array.isArray(fc.customFields) ? (fc.customFields as ICustomField[]) : [],
    },
  };
}

export function toAdminApplicationRow(raw: Raw): ActivityApplicationAdminRow {
  const priorities: Raw[] = Array.isArray(raw.priorities) ? raw.priorities : [];
  const enrolled: Raw[] = Array.isArray(raw.enrolledWorkshops) ? raw.enrolledWorkshops : [];
  return {
    id: str(raw._id ?? raw.id),
    qrCode: str(raw.qrCode),
    firstName: str(raw.firstName),
    lastName: str(raw.lastName),
    email: str(raw.email),
    status: raw.status ?? "pending",
    createdAt: iso(raw.createdAt),
    enrolledWorkshopsAndHackathons: enrolled.map((w) => ({
      slug: str(w.slug),
      title: str(w.activityTitle ?? w.title),
      type: w.type as ActivityType,
      startTime: str(w.startTime),
      endTime: str(w.endTime),
    })),
    priorities: priorities.map((p) => ({
      priority: num(p.priority),
      activityId: str(p.activityId),
      slug: str(p.activitySlug),
      title: str(p.activityTitle),
      startTime: str(p.startTime),
      endTime: str(p.endTime),
      maxCapacity: num(p.maxCapacity),
      spotsLeft: num(p.spotsLeft),
      isSoldOut: !!p.isSoldOut,
      hasScheduleConflictWithEnrolled: !!p.hasScheduleConflict,
      conflictingTitle: p.conflictingItem?.title ? str(p.conflictingItem.title) : undefined,
    })),
    assignedActivityId: raw.assignedActivityId ? str(raw.assignedActivityId) : null,
    assignedActivitySlug: raw.assignedActivitySlug ? str(raw.assignedActivitySlug) : null,
    assignedActivityTitle: raw.assignedActivity?.title ? str(raw.assignedActivity.title) : null,
    assignedPriorityRank: typeof raw.assignedPriorityRank === "number" ? raw.assignedPriorityRank : null,
    assignedAt: raw.assignedAt ? iso(raw.assignedAt) : null,
    assignedBy: raw.assignedBy ? str(raw.assignedBy) : null,
    adminNotes: str(raw.adminNotes),
    logistics: {
      bringsLaptop: !!raw.logistics?.bringsLaptop,
      acceptedPrerequisites: !!raw.logistics?.acceptedPrerequisites,
    },
    globalCustomAnswers: raw.globalCustomAnswers ?? {},
    activityCustomAnswers: raw.activityCustomAnswers ?? {},
  };
}

/** Registro directo (workshop/hackatón) o postulación asignada (activity). */
export function toAdminRegistrationRecord(raw: Raw): ActivityRegistrationAdminRecord {
  const team: Raw | undefined = raw.team;
  return {
    id: str(raw._id ?? raw.id),
    qrCode: str(raw.qrCode),
    firstName: str(raw.firstName),
    lastName: str(raw.lastName),
    email: str(raw.email),
    // Postulaciones asignadas (type: activity) no traen `registered`: se muestran como confirmadas.
    status: raw.status === "cancelled" ? "cancelled" : "registered",
    spotsConsumed: num(raw.spotsConsumed) || 1,
    team: team
      ? {
          isTeam: !!team.isTeam,
          teamName: team.teamName ? str(team.teamName) : null,
          roleInTeam: team.roleInTeam ? str(team.roleInTeam) : null,
          members: Array.isArray(team.members) ? team.members : [],
        }
      : null,
    customAnswers: raw.customAnswers ?? raw.globalCustomAnswers ?? {},
    createdAt: iso(raw.createdAt),
  };
}
