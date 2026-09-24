import mongoose, { Schema, type Document } from "mongoose";

export type CampaignType =
  | "reminder_15d"
  | "reminder_5d"
  | "reminder_5d_unconfirmed"
  | "reminder_1d"
  | "keynote_daniel"
  | "keynote_alejandra"
  | "day_of"
  | "speaker_slides"
  | "speaker_upload"
  | "volunteer_meeting"
  | "volunteer_meeting_today"
  | "volunteer_setup"
  | "confirm_attendance"
  | "confirm_reminder"
  | "confirm_final"
  | "speaker_rejection"
  | "volunteer_recording"
  | "badge_pickup"
  | "passport_guide"
  | "resilience_message"
  | "post_survey"
  | "gallery_recordings"
  | "cert_challenge";

export const CAMPAIGN_LABELS: Record<CampaignType, string> = {
  reminder_15d: "Recordatorio — 15 días antes",
  reminder_5d: "Recordatorio — 5 días antes (confirmados + invitados)",
  reminder_5d_unconfirmed: "Recordatorio 5 días — registrados sin confirmar",
  reminder_1d: "Recordatorio — 1 día antes",
  keynote_daniel: "Anuncio: Daniel Saldarriaga",
  keynote_alejandra: "Anuncio: Alejandra Bricio",
  day_of: "Día del Evento — Pasaporte digital",
  speaker_slides: "Plantilla de presentación — Speakers",
  speaker_upload: "Subir presentación — Speakers",
  volunteer_meeting: "Reunión obligatoria — Voluntarios",
  volunteer_meeting_today: "Recordatorio HOY — Reunión voluntarios",
  volunteer_setup: "Jornada de montaje — Voluntarios",
  confirm_attendance: "Confirmar asistencia — Asistentes",
  confirm_reminder: "Recordatorio: confirma tu asistencia",
  confirm_final: "Último llamado: confirma tu asistencia (re-enviable)",
  speaker_rejection: "Actualización postulación — Speakers no seleccionados",
  volunteer_recording: "Grabación de la reunión — Voluntarios",
  badge_pickup: "Recogida anticipada de escarapela — Confirmados",
  passport_guide: "Guía del pasaporte digital — Todos",
  resilience_message: "Gracias por tu resiliencia — Todos (re-enviable)",
  post_survey: "Encuesta post-evento — Todos (re-enviable a no-clic)",
  gallery_recordings: "Galería + grabaciones — Todos",
  cert_challenge: "Reto de certificación AI Practitioner — Todos",
};

export interface ICampaign extends Document {
  type: CampaignType;
  status: "sending" | "done" | "error";
  sentCount: number;
  failedCount: number;
  triggeredBy: string;
  createdAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    type: { type: String, required: true },
    status: { type: String, enum: ["sending", "done", "error"], default: "sending" },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    triggeredBy: { type: String, required: true },
  },
  { timestamps: true },
);

export const Campaign =
  mongoose.models.Campaign as mongoose.Model<ICampaign> ||
  mongoose.model<ICampaign>("Campaign", campaignSchema);
