import mongoose, { Schema, type Document } from "mongoose";

export interface ISession extends Document {
  userId: string;
  sessionId: string;
  expiresAt: Date;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

export const Session = mongoose.models.Session as mongoose.Model<ISession> || mongoose.model<ISession>("Session", sessionSchema);
