import mongoose, { Schema, type Document } from "mongoose";

export interface IAgendaEvent extends Document {
  title: string;
  speaker: string;
  speakerSlug: string;
  speakerId?: mongoose.Types.ObjectId;
  description: string;
  startTime: string;
  endTime: string;
  room: string;
  roomId?: mongoose.Types.ObjectId;
  track: string;
  order: number;
  sessionType: "presencial" | "online" | "hibrida";
  level: "" | "100" | "200" | "300" | "400";
  language: "es" | "en" | "bilingual";
  cta: string;
  // Imágenes opcionales (keynote / evento libre): miniatura en la agenda y card del detalle
  imageUrl: string;
  cardImageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const agendaEventSchema = new Schema<IAgendaEvent>(
  {
    title: { type: String, required: true },
    speaker: { type: String, default: "" },
    speakerSlug: { type: String, default: "" },
    description: { type: String, default: "" },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", default: null },
    speakerId: { type: Schema.Types.ObjectId, ref: "SpeakerProfile", default: null },
    track: { type: String, default: "general" },
    order: { type: Number, default: 0 },
    sessionType: { type: String, enum: ["presencial", "online", "hibrida"], default: "presencial" },
    level: { type: String, enum: ["", "100", "200", "300", "400"], default: "" },
    language: { type: String, enum: ["es", "en", "bilingual"], default: "es" },
    cta: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    cardImageUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

export const AgendaEvent =
  (mongoose.models.AgendaEvent as mongoose.Model<IAgendaEvent>) ||
  mongoose.model<IAgendaEvent>("AgendaEvent", agendaEventSchema);
