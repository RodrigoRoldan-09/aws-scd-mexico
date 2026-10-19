import mongoose, { Schema, type Document, type Types } from "mongoose";

export type ActivityType = "workshop" | "hackathon" | "activity";
export type ActivityLevel = "" | "100" | "200" | "300" | "400";
export type ParticipationMode = "individual" | "team" | "both";
export type CapacityMode = "per_person" | "per_team";
export type CustomFieldType = "text" | "textarea" | "select" | "checkbox" | "url";

export interface ICustomFieldOption {
  value: string;
  label: string;
  labelEn?: string;
}

export interface ICustomField {
  key: string;
  label: string;
  labelEn?: string;
  type: CustomFieldType;
  required: boolean;
  placeholder?: string;
  placeholderEn?: string;
  options?: ICustomFieldOption[];
}

export interface IActivityFormConfig {
  requireLaptop: boolean;
  prerequisitesList: string[];
  prerequisitesListEn: string[];
  participationMode: ParticipationMode;
  minTeamSize: number;
  maxTeamSize: number;
  capacityMode: CapacityMode;
  customFields: ICustomField[];
}

export interface IActivity extends Document {
  _id: Types.ObjectId;
  slug: string;
  type: ActivityType;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  agendaEventId: Types.ObjectId | null;
  roomId: Types.ObjectId | null;
  roomName: string;
  speakerName: string;
  level: ActivityLevel;
  startTime: string; // "HH:mm" 24h
  endTime: string;   // "HH:mm" 24h
  isPublished: boolean;
  isOpen: boolean;
  maxCapacity: number;
  registeredCount: number;
  formConfig: IActivityFormConfig;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const customFieldOptionSchema = new Schema<ICustomFieldOption>(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    labelEn: { type: String, default: "" },
  },
  { _id: false },
);

const customFieldSchema = new Schema<ICustomField>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    labelEn: { type: String, default: "", trim: true },
    type: {
      type: String,
      enum: ["text", "textarea", "select", "checkbox", "url"],
      required: true,
      default: "text",
    },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: "" },
    placeholderEn: { type: String, default: "" },
    options: { type: [customFieldOptionSchema], default: [] },
  },
  { _id: false },
);

const formConfigSchema = new Schema<IActivityFormConfig>(
  {
    requireLaptop: { type: Boolean, default: false },
    prerequisitesList: { type: [String], default: [] },
    prerequisitesListEn: { type: [String], default: [] },
    participationMode: {
      type: String,
      enum: ["individual", "team", "both"],
      default: "individual",
    },
    minTeamSize: { type: Number, default: 1, min: 1 },
    maxTeamSize: { type: Number, default: 3, min: 1 },
    capacityMode: {
      type: String,
      enum: ["per_person", "per_team"],
      default: "per_person",
    },
    customFields: { type: [customFieldSchema], default: [] },
  },
  { _id: false },
);

const activitySchema = new Schema<IActivity>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["workshop", "hackathon", "activity"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    titleEn: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    descriptionEn: { type: String, default: "", trim: true },
    agendaEventId: { type: Schema.Types.ObjectId, ref: "AgendaEvent", default: null },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", default: null },
    roomName: { type: String, default: "", trim: true },
    speakerName: { type: String, default: "", trim: true },
    level: {
      type: String,
      enum: ["", "100", "200", "300", "400"],
      default: "",
    },
    startTime: { type: String, required: true, trim: true }, // "HH:mm"
    endTime: { type: String, required: true, trim: true },   // "HH:mm"
    isPublished: { type: Boolean, default: false, index: true },
    isOpen: { type: Boolean, default: true, index: true },
    maxCapacity: { type: Number, required: true, min: 1 },
    registeredCount: { type: Number, default: 0, min: 0 },
    formConfig: { type: formConfigSchema, default: () => ({}) },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: "activities",
  },
);

activitySchema.index({ isPublished: 1, type: 1, order: 1 });
activitySchema.index({ _id: 1, isOpen: 1, registeredCount: 1 });

export const Activity =
  (mongoose.models.Activity as mongoose.Model<IActivity>) ||
  mongoose.model<IActivity>("Activity", activitySchema);
