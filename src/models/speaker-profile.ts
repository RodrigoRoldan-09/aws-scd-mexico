import mongoose, { Schema, type Document } from "mongoose";

export const PROFILE_STATUSES = [
  "submitted", "reviewing", "accepted", "rejected", "waitlisted", "scheduled",
] as const;
export type ProfileStatus = (typeof PROFILE_STATUSES)[number];

/** Guard para validar el `status` que llega por query string o por el cuerpo. */
export function isProfileStatus(value: string): value is ProfileStatus {
  return (PROFILE_STATUSES as readonly string[]).includes(value);
}

export type SpeakerType = "local" | "international";

export interface ISpeakerProfile extends Document {
  // Core identity
  name: string;
  slug: string;
  /** Nombre y correo de contacto. */
  firstName: string;
  lastName: string;
  email: string;
  // Speaker info
  role: string;
  tagline: string;
  company: string;
  companyLogo: string;
  bio: string;
  photo: string;
  countryCity: string;
  phone: string;
  firstTimeSpeaker: boolean;
  // Social
  social: {
    /** Usuario o enlace del AWS Builder Center. */
    builderCenter?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
    instagram?: string;
    facebook?: string;
    blog?: string;
    website?: string;
  };
  // Talk / session info
  talkTitle: string;
  talkAbstract: string;
  sessionType: string;
  /** Sólo para sesiones online: cuándo puede grabar. Texto libre. */
  preRecordingDate: string;
  audienceLevel: string;
  language: string;
  requirements: string;
  track: string;
  // Co-speakers
  coSpeakers: {
    firstName: string; lastName: string; email: string;
    role: string; tagline: string; company: string; companyLogo: string;
    bio: string; photo: string; countryCity: string;
    social: { linkedin?: string; twitter?: string; instagram?: string; github?: string; website?: string; facebook?: string; blog?: string };
  }[];
  // ── Trámite ──
  /** Cuándo se postuló. Postulación y perfil son un solo documento por persona. */
  submittedAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  sentSpeakerCampaigns: string[];
  metadata: {
    ip?: string;
    userAgent?: string;
  };

  // Admin / status
  status: ProfileStatus;
  speakerType: SpeakerType | null;
  isPublic: boolean;
  sortOrder: number;
  scheduledAt?: Date | null;
  // Canvas editor overrides
  talkTitleCard?: string;
  roleCard?: string;
  cardContentX?: number;
  cardContentY?: number;
  cardNameOffset?: number;
  cardTitleSize?: number | null;
  cardNameSize?: number;
  cardApproved: boolean;
  cardImageUrl?: string;
  // References
  sessionId?: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const speakerProfileSchema = new Schema<ISpeakerProfile>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true, trim: true, index: true },
    // Speaker info
    role: { type: String, default: "" },
    tagline: { type: String, default: "" },
    company: { type: String, default: "" },
    companyLogo: { type: String, default: "" },
    bio: { type: String, default: "" },
    photo: { type: String, default: "" },
    countryCity: { type: String, default: "" },
    phone: { type: String, default: "" },
    firstTimeSpeaker: { type: Boolean, default: false },
    // Social
    social: {
      builderCenter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      github: { type: String, default: "" },
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      blog: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    // Talk / session info
    talkTitle: { type: String, default: "" },
    talkAbstract: { type: String, default: "" },
    sessionType: { type: String, default: "talk" },
    preRecordingDate: { type: String, default: "" },
    audienceLevel: { type: String, default: "100" },
    language: { type: String, default: "es" },
    requirements: { type: String, default: "" },
    track: { type: String, default: "general" },
    coSpeakers: {
      type: [{
        firstName:   { type: String, default: "" },
        lastName:    { type: String, default: "" },
        email:       { type: String, default: "" },
        role:        { type: String, default: "" },
        tagline:     { type: String, default: "" },
        company:     { type: String, default: "" },
        companyLogo: { type: String, default: "" },
        bio:         { type: String, default: "" },
        photo:       { type: String, default: "" },
        countryCity: { type: String, default: "" },
        social: {
          linkedin:  { type: String, default: "" },
          twitter:   { type: String, default: "" },
          instagram: { type: String, default: "" },
          github:    { type: String, default: "" },
          website:   { type: String, default: "" },
          facebook:  { type: String, default: "" },
          blog:      { type: String, default: "" },
        },
      }],
      default: [],
    },
    // Trámite
    submittedAt: { type: Date, default: Date.now, index: true },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: null },
    sentSpeakerCampaigns: { type: [String], default: [] },
    metadata: {
      ip: String,
      userAgent: String,
    },
    // Admin / status
    status: {
      type: String,
      enum: [...PROFILE_STATUSES],
      default: "submitted",
      index: true,
    },
    speakerType: { type: String, enum: ["local", "international"], default: null },
    isPublic: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0, index: true },
    scheduledAt: { type: Date, default: null },
    // Canvas editor overrides
    talkTitleCard: { type: String, default: "" },
    roleCard: { type: String, default: "" },
    cardContentX: { type: Number, default: 530 },
    cardContentY: { type: Number, default: 180 },
    cardNameOffset: { type: Number, default: 532 },
    cardTitleSize: { type: Number, default: null },
    cardNameSize: { type: Number, default: 40 },
    cardApproved: { type: Boolean, default: false },
    cardImageUrl: { type: String, default: "" },
    // References
    sessionId: { type: Schema.Types.ObjectId, ref: "AgendaEvent", default: null },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", default: null },
  },
  { timestamps: true },
);

export const SpeakerProfile =
  (mongoose.models.SpeakerProfile as mongoose.Model<ISpeakerProfile>) ||
  mongoose.model<ISpeakerProfile>("SpeakerProfile", speakerProfileSchema);
