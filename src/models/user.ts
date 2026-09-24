import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string | null;
  role: "admin" | "organizer" | "volunteer" | "badges";
  // Badges (SponsorPin ids) que este usuario puede dar al escanear. Admin da todos.
  allowedBadges: string[];
  currentSessionId: string | null;
  lastLoginAt: Date | null;
  sentCampaigns: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, default: null },
    role: { type: String, enum: ["admin", "organizer", "volunteer", "badges"], required: true },
    allowedBadges: { type: [String], default: [] },
    currentSessionId: { type: String, default: null },
    lastLoginAt: { type: Date, default: null },
    sentCampaigns: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const User = mongoose.models.User as mongoose.Model<IUser> || mongoose.model<IUser>("User", userSchema);
