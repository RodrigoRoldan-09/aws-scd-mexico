/**
 * Estado de recepción de los formularios públicos.
 *
 * Ya no guarda preguntas: los tres formularios son estáticos y sus campos
 * están en el código, porque de ellos dependen el check-in, la escarapela, el
 * pasaporte, los certificados y los filtros del panel. Lo único que queda acá
 * es si aceptan respuestas y cuántas.
 *
 * El de speakers NO está en la lista a propósito: su apertura la manda
 * CFP_DEADLINE en src/data/cfp.ts, no un documento de esta colección.
 */
export const FORM_TYPES = ["attendee", "volunteer"] as const;
export type FormType = (typeof FORM_TYPES)[number];

/** `Array.includes` no estrecha el tipo: hace falta un guard explícito. */
export function isFormType(value: string): value is FormType {
  return (FORM_TYPES as readonly string[]).includes(value);
}

import mongoose, { Schema, type Document } from "mongoose";

export interface IForm extends Document {
  formType: FormType;
  isPublished: boolean;
  isOpen: boolean;
  maxSubmissions: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const formSchema = new Schema<IForm>(
  {
    formType: { type: String, enum: [...FORM_TYPES], required: true, unique: true },
    isPublished: { type: Boolean, default: false },
    isOpen: { type: Boolean, default: false },
    maxSubmissions: { type: Number, default: null },
  },
  { timestamps: true },
);

export const Form = mongoose.models.Form as mongoose.Model<IForm> || mongoose.model<IForm>("Form", formSchema);
