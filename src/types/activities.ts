import type {
  ActivityLevel,
  ActivityType,
  ICustomField,
  IActivityFormConfig,
} from "@/models/activity";
import type { IActivityApplication } from "@/models/activity-application";
import type { ITeamMember } from "@/models/activity-registration";

/**
 * Contratos compartidos entre el frontend de actividades y las rutas
 * `/api/activities/*`. Solo tipos (más un valor por defecto): es seguro
 * importarlos desde Client Components.
 */

export type { ActivityLevel, ActivityType, ICustomField, IActivityFormConfig };
export type ActivityApplicationStatus = IActivityApplication["status"];
export type { ITeamMember };

export interface PublicActivityDTO {
  _id: string;
  slug: string;
  type: ActivityType;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  roomName: string;
  speakerName: string;
  level: ActivityLevel;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  isPublished: boolean;
  isOpen: boolean;
  maxCapacity: number;
  registeredCount: number;
  spotsLeft: number;
  isSoldOut: boolean;
  formConfig: IActivityFormConfig;
  order: number;
}

/** Workshop/hackatón inscrito, tal como lo devuelve `POST /api/activities/lookup-attendee`. */
export interface EnrolledActivitySummary {
  activityId: string;
  slug: string;
  title: string;
  titleEn: string;
  type: ActivityType;
  startTime: string;
  endTime: string;
  spotsConsumed: number;
}

export interface AttendeeActivityApplicationSummary {
  applicationId: string;
  status: ActivityApplicationStatus;
  priorities: {
    priority: number;
    activityId: string;
    activitySlug: string;
    activityTitle: string;
    startTime: string;
    endTime: string;
  }[];
  assignedActivity: {
    activityId: string;
    slug: string;
    title: string;
    titleEn: string;
    startTime: string;
    endTime: string;
    roomName: string;
  } | null;
}

export interface AttendeeLookupResult {
  existsInGeneralRegistration: boolean;
  generalRegistrationOpen: boolean;
  firstName?: string;
  lastName?: string;
  qrCode?: string;
  enrolledActivities: EnrolledActivitySummary[];
  activityApplication: AttendeeActivityApplicationSummary | null;
}

/** Configuración global del Formulario Unificado (`type: "activity"`). */
export interface UnifiedActivityFormConfig {
  isOpen: boolean;
  maxPriorities: number;
  requireLaptop: boolean;
  prerequisitesList: string[];
  prerequisitesListEn: string[];
  globalCustomFields: ICustomField[];
}

export const DEFAULT_UNIFIED_FORM_CONFIG: UnifiedActivityFormConfig = {
  isOpen: true,
  maxPriorities: 3,
  requireLaptop: false,
  prerequisitesList: [],
  prerequisitesListEn: [],
  globalCustomFields: [],
};

export interface GeneralProfilePayload {
  firstName: string;
  lastName: string;
  role: string;
  roleOther?: string;
  entityType: string;
  entityName?: string;
  fromCommunity: string; // "yes" | "no" | "true" | "false"
  communityName?: string;
  documentType?: string;
  documentNumber?: string;
  acceptCoc: boolean;
  acceptPrivacy: boolean;
}

export interface RegisterActivityPayload {
  captchaToken?: string;
  email: string;
  generalProfile?: GeneralProfilePayload;
  logistics: {
    bringsLaptop: boolean;
    acceptedPrerequisites: boolean;
  };
  team?: {
    isTeam: boolean;
    teamName?: string;
    roleInTeam?: string;
    members: ITeamMember[];
  } | null;
  customAnswers: Record<string, string | boolean>;
}

/** Respuesta de `POST /api/activities/[slug]/register` (201). */
export interface RegisterActivityResponse {
  ok: true;
  registration: {
    id: string;
    activitySlug: string;
    activityTitle: string;
    qrCode: string;
    firstName: string;
    lastName: string;
    email: string;
    status: "registered";
    spotsConsumed: number;
    createdGeneralRegistration: boolean;
  };
}

export interface ApplyActivitiesPayload {
  captchaToken?: string;
  email: string;
  generalProfile?: GeneralProfilePayload;
  /** Slugs ordenados por prioridad (índice 0 = 1ª opción) */
  prioritySlugs: string[];
  logistics: {
    bringsLaptop: boolean;
    acceptedPrerequisites: boolean;
  };
  globalCustomAnswers: Record<string, string | boolean>;
  activityCustomAnswers: Record<string, Record<string, string | boolean>>;
}

/** Respuesta de `POST /api/activities/apply` (201). */
export interface ApplyActivitiesResponse {
  ok: true;
  application: {
    id: string;
    status: ActivityApplicationStatus;
    qrCode: string;
    firstName: string;
    lastName: string;
    email: string;
    createdGeneralRegistration: boolean;
    priorities: {
      priority: number;
      slug: string;
      title: string;
      startTime: string;
      endTime: string;
    }[];
  };
}

/** Fila normalizada para la tabla de asignación del panel Admin. */
export interface ActivityApplicationAdminRow {
  id: string;
  qrCode: string;
  firstName: string;
  lastName: string;
  email: string;
  status: ActivityApplicationStatus;
  createdAt: string;
  enrolledWorkshopsAndHackathons: {
    slug: string;
    title: string;
    type: ActivityType;
    startTime: string;
    endTime: string;
  }[];
  priorities: {
    priority: number;
    activityId: string;
    slug: string;
    title: string;
    startTime: string;
    endTime: string;
    maxCapacity: number;
    spotsLeft: number;
    isSoldOut: boolean;
    hasScheduleConflictWithEnrolled: boolean;
    conflictingTitle?: string;
  }[];
  assignedActivityId: string | null;
  assignedActivitySlug: string | null;
  assignedActivityTitle: string | null;
  assignedPriorityRank: number | null;
  assignedAt: string | null;
  assignedBy: string | null;
  adminNotes: string;
  logistics: { bringsLaptop: boolean; acceptedPrerequisites: boolean };
  globalCustomAnswers: Record<string, string | boolean>;
  activityCustomAnswers: Record<string, Record<string, string | boolean>>;
}

/** Inscrito (workshop/hackatón) o postulación asignada, vista en el modal de inscritos. */
export interface ActivityRegistrationAdminRecord {
  id: string;
  qrCode: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  spotsConsumed: number;
  team?: {
    isTeam: boolean;
    teamName: string | null;
    roleInTeam: string | null;
    members: ITeamMember[];
  } | null;
  customAnswers: Record<string, string | boolean>;
  createdAt: string;
}
