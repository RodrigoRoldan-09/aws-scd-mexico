import mongoose, { Schema, type Document } from "mongoose";

export interface IFAQButton {
  labelEs: string;
  labelEn: string;
  url: string;
}

export interface IFAQ extends Document {
  questionEs: string;
  answerEs: string;
  questionEn: string;
  answerEn: string;
  order: number;
  isActive: boolean;
  buttons: IFAQButton[];
  createdAt: Date;
  updatedAt: Date;
}

const faqButtonSchema = new Schema<IFAQButton>(
  {
    labelEs: { type: String, required: true },
    labelEn: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const faqSchema = new Schema<IFAQ>(
  {
    questionEs: { type: String, required: true },
    answerEs: { type: String, required: true },
    questionEn: { type: String, required: true },
    answerEn: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    buttons: { type: [faqButtonSchema], default: [] },
  },
  { timestamps: true },
);

export const FAQ =
  (mongoose.models.FAQ as mongoose.Model<IFAQ>) ||
  mongoose.model<IFAQ>("FAQ", faqSchema);
