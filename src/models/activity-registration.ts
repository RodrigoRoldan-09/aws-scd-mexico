import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ITeamMember {
  firstName: string;
  lastName: string;
  email: string;
  roleInTeam?: string;
}

export interface IActivityRegistration extends Document {
  _id: Types.ObjectId;
  activityId: Types.ObjectId;
  activitySlug: string;
  activityType: "workshop" | "hackathon";
  registrationId: Types.ObjectId;
  qrCode: string;
  createdGeneralRegistration: boolean;
  firstName: string;
  lastName: string;
  email: string;
  status: "registered" | "cancelled";
  spotsConsumed: number;
  logistics: {
    bringsLaptop: boolean;
    acceptedPrerequisites: boolean;
  };
  team: {
    isTeam: boolean;
    teamName: string;
    roleInTeam: string;
    members: ITeamMember[];
  };
  customAnswers: Record<string, unknown>;
  attended: boolean;
  attendedAt: Date | null;
  attendedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const teamMemberSchema = new Schema<ITeamMember>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    roleInTeam: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const activityRegistrationSchema = new Schema<IActivityRegistration>(
  {
    activityId: {
      type: Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
      index: true,
    },
    activitySlug: { type: String, required: true, trim: true },
    activityType: {
      type: String,
      enum: ["workshop", "hackathon"],
      required: true,
      index: true,
    },
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
    status: {
      type: String,
      enum: ["registered", "cancelled"],
      default: "registered",
    },
    spotsConsumed: { type: Number, default: 1, min: 1 },
    logistics: {
      bringsLaptop: { type: Boolean, default: false },
      acceptedPrerequisites: { type: Boolean, default: false },
    },
    team: {
      isTeam: { type: Boolean, default: false },
      teamName: { type: String, default: "", trim: true },
      roleInTeam: { type: String, default: "", trim: true },
      members: { type: [teamMemberSchema], default: [] },
    },
    customAnswers: { type: Schema.Types.Mixed, default: () => ({}) },
    attended: { type: Boolean, default: false },
    attendedAt: { type: Date, default: null },
    attendedBy: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "activityregistrations",
  },
);

activityRegistrationSchema.index(
  { activityId: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: "registered" } },
);
activityRegistrationSchema.index({ email: 1, status: 1 });
activityRegistrationSchema.index({ "team.members.email": 1, status: 1 });
activityRegistrationSchema.index({ activityId: 1, status: 1, createdAt: -1 });

export const ActivityRegistration =
  (mongoose.models.ActivityRegistration as mongoose.Model<IActivityRegistration>) ||
  mongoose.model<IActivityRegistration>("ActivityRegistration", activityRegistrationSchema);
