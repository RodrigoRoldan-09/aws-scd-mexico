import mongoose, { Schema, type Document } from "mongoose";

export interface ILog extends Document {
  userId: string;
  userName: string;
  userRole: "admin" | "organizer" | "volunteer" | "attendee" | "badges";
  action: string;
  target: string;
  targetId: string | null;
  details: string | null;
  createdAt: Date;
}

const logSchema = new Schema<ILog>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userRole: { type: String, enum: ["admin", "organizer", "volunteer", "attendee", "badges"], required: true },
    action: { type: String, required: true, index: true },
    target: { type: String, required: true },
    targetId: { type: String, default: null },
    details: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

logSchema.index({ createdAt: -1 });

export const Log = mongoose.models.Log as mongoose.Model<ILog> || mongoose.model<ILog>("Log", logSchema);
