import mongoose, { Schema, type Document } from "mongoose";

export interface ISetting extends Document {
  key: string;
  value: string;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    key:   { type: String, required: true, unique: true, index: true },
    value: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Setting =
  (mongoose.models.Setting as mongoose.Model<ISetting>) ||
  mongoose.model<ISetting>("Setting", settingSchema);
