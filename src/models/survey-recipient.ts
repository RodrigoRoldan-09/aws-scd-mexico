import mongoose, { Schema, type Document } from "mongoose";

// Un destinatario de la encuesta post-evento. Su token va en el enlace del correo;
// al hacer clic se marca clickedAt (proxy de "abrió la encuesta").
export interface ISurveyRecipient extends Document {
  token: string;
  source: string;     // registration | speaker | volunteer | user
  sourceId: string;   // id del documento fuente
  name: string;
  roleLabel: string;  // Registrado / Voluntario / Speaker / Organizador
  email: string;
  sentCount: number;
  lastSentAt: Date | null;
  clickedAt: Date | null;
  clickCount: number;
  createdAt: Date;
}

const schema = new Schema<ISurveyRecipient>(
  {
    token: { type: String, required: true, unique: true },
    source: { type: String, required: true },
    sourceId: { type: String, required: true, index: true },
    name: { type: String, default: "" },
    roleLabel: { type: String, default: "" },
    email: { type: String, default: "" },
    sentCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: null },
    clickedAt: { type: Date, default: null },
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } },
);

// Un destinatario por fuente (evita duplicados entre reenvíos)
schema.index({ source: 1, sourceId: 1 }, { unique: true });

export const SurveyRecipient =
  mongoose.models.SurveyRecipient as mongoose.Model<ISurveyRecipient> ||
  mongoose.model<ISurveyRecipient>("SurveyRecipient", schema);
