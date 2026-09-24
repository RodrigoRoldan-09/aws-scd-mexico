import mongoose, { Schema, Document } from "mongoose";

export interface ISponsorPin extends Document {
  sponsorName: string;
  logoUrl?: string;
  pin: string;
  isActive: boolean;
  totalStamps: number;
  createdAt: Date;
}

const SponsorPinSchema = new Schema<ISponsorPin>(
  {
    sponsorName: { type: String, required: true },
    logoUrl: { type: String },
    pin: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    totalStamps: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } },
);

export const SponsorPin =
  mongoose.models.SponsorPin || mongoose.model<ISponsorPin>("SponsorPin", SponsorPinSchema);
