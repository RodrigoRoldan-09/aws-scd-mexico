import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IActivityPriorityItem {
  priority: number;
  activityId: Types.ObjectId;
  activitySlug: string;
  activityTitle: string;
  startTime: string;
  endTime: string;
}

export interface IActivityApplication extends Document {
  _id: Types.ObjectId;
  registrationId: Types.ObjectId;
  qrCode: string;
  createdGeneralRegistration: boolean;
  firstName: string;
  lastName: string;
  email: string;
  priorities: IActivityPriorityItem[];
  status: "pending" | "assigned" | "cancelled";
  assignedActivityId: Types.ObjectId | null;
  assignedActivitySlug: string | null;
  assignedPriorityRank: number | null;
  assignedAt: Date | null;
  assignedBy: string | null;
  adminNotes: string;
  logistics: {
    bringsLaptop: boolean;
    acceptedPrerequisites: boolean;
  };
  globalCustomAnswers: Record<string, unknown>;
  activityCustomAnswers: Record<string, Record<string, unknown>>;
  attended: boolean;
  attendedAt: Date | null;
  attendedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const priorityItemSchema = new Schema<IActivityPriorityItem>(
  {
    priority: { type: Number, required: true },
    activityId: { type: Schema.Types.ObjectId, ref: "Activity", required: true },
    activitySlug: { type: String, required: true, trim: true },
    activityTitle: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const activityApplicationSchema = new Schema<IActivityApplication>(
  {
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
      index: true,
    },
    qrCode: { type: String, required: true, trim: true },
    createdGeneralRegistration: { type: Boolean, default: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    priorities: { type: [priorityItemSchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "assigned", "cancelled"],
      default: "pending",
      index: true,
    },
    assignedActivityId: {
      type: Schema.Types.ObjectId,
      ref: "Activity",
      default: null,
      index: true,
    },
    assignedActivitySlug: { type: String, default: null, trim: true },
    assignedPriorityRank: { type: Number, default: null },
    assignedAt: { type: Date, default: null },
    assignedBy: { type: String, default: null, trim: true },
    adminNotes: { type: String, default: "", trim: true },
    logistics: {
      bringsLaptop: { type: Boolean, default: false },
      acceptedPrerequisites: { type: Boolean, default: false },
    },
    globalCustomAnswers: { type: Schema.Types.Mixed, default: () => ({}) },
    activityCustomAnswers: { type: Schema.Types.Mixed, default: () => ({}) },
    attended: { type: Boolean, default: false },
    attendedAt: { type: Date, default: null },
    attendedBy: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "activityapplications",
  },
);

activityApplicationSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "assigned"] } },
  },
);
activityApplicationSchema.index({ assignedActivityId: 1, status: 1 });
activityApplicationSchema.index({ status: 1, createdAt: -1 });

export const ActivityApplication =
  (mongoose.models.ActivityApplication as mongoose.Model<IActivityApplication>) ||
  mongoose.model<IActivityApplication>("ActivityApplication", activityApplicationSchema);
