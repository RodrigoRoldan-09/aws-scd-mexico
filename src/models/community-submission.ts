import mongoose, { Schema, type Document } from "mongoose";

/**
 * Registro y postulación de comunidades aliadas.
 */
export interface ICommunitySubmission extends Document {
  communityName: string;
  socialUrl: string;
  metrics: string;
  contribution: string;
  contactEmail: string;
  contactPhone: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
  notes?: string | null;
  metadata: {
    ip?: string;
    userAgent?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const communitySubmissionSchema = new Schema<ICommunitySubmission>(
  {
    communityName: { type: String, required: true, trim: true, index: true },
    socialUrl: { type: String, required: true, trim: true },
    metrics: { type: String, required: true, trim: true },
    contribution: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    contactPhone: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    submittedAt: { type: Date, default: Date.now },
    notes: { type: String, default: null },
    metadata: {
      ip: { type: String },
      userAgent: { type: String },
    },
  },
  { timestamps: true },
);

export const CommunitySubmission =
  mongoose.models.CommunitySubmission ||
  mongoose.model<ICommunitySubmission>("CommunitySubmission", communitySubmissionSchema);
