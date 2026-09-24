import mongoose, { Schema, type Document } from "mongoose";

export interface IPasswordToken extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
}

const passwordTokenSchema = new Schema<IPasswordToken>({
  userId: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  usedAt: { type: Date, default: null },
});

export const PasswordToken = mongoose.models.PasswordToken as mongoose.Model<IPasswordToken> || mongoose.model<IPasswordToken>("PasswordToken", passwordTokenSchema);
