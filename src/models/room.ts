import mongoose, { Schema, type Document } from "mongoose";

export interface IRoom extends Document {
  name: string;
  capacity?: number;
  virtualLink?: string;
  track?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true },
    capacity: { type: Number },
    virtualLink: { type: String, default: "" },
    track: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Room =
  (mongoose.models.Room as mongoose.Model<IRoom>) ||
  mongoose.model<IRoom>("Room", roomSchema);
