import mongoose, { Schema, type Document } from "mongoose";

// Cambios pendientes de un pasaporte que requieren confirmación por correo.
// Un solo uso (usedAt) y expira a las 24h (TTL index sobre expiresAt).
export interface IPassportEditToken extends Document {
  shortId: string;
  token: string;
  // Campos que se aplicarán al confirmar (solo ediciones/eliminaciones).
  changes: {
    social?: Record<string, string>;
    photoUrl?: string;
  };
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

const schema = new Schema<IPassportEditToken>(
  {
    shortId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    changes: {
      social: { type: Object, default: undefined },
      photoUrl: { type: String, default: undefined },
    },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } },
);

export const PassportEditToken =
  mongoose.models.PassportEditToken as mongoose.Model<IPassportEditToken> ||
  mongoose.model<IPassportEditToken>("PassportEditToken", schema);
