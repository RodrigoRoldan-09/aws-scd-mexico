import mongoose, { Schema, type Document } from "mongoose";

/**
 * Postulación de voluntariado.
 *
 * Se guardan **códigos** —`morning`,
 * `vegan`—; la etiqueta se resuelve al mostrar contra `@/data/volunteer-form`,
 * así cambiar un texto no toca las postulaciones ya guardadas.
 *
 * El voluntariado es presencial por definición: quien recibe en la puerta o
 * arma una sala está en la sede. Por eso acá el documento sí es obligatorio,
 * a diferencia del registro de asistentes.
 */

export interface IVolunteerSubmission extends Document {
  // ── Identidad ──
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: string;
  /** Ya normalizado: sin puntos, en mayúsculas, con dígito verificador. */
  documentNumber: string;

  // ── Procedencia ──
  role: string;
  roleOther: string | null;
  entityType: string;
  entityName: string | null;
  /** Nombre del Student Builder Group, `none` o el que escribió la persona. */
  sbg: string;

  // ── Voluntariado ──
  availability: string;
  /** Varias: el equipo rota entre áreas durante el día. */
  interestAreas: string[];
  previousExperience: string;
  motivation: string;

  // ── Logística ──
  shirtSize: string;
  dietary: string;
  /** Sólo si `dietary === "other"`. */
  dietaryOther: string | null;
  emergencyName: string;
  emergencyPhone: string;

  /** Con fecha: es lo que hay que poder demostrar si alguien lo pregunta. */
  consent: {
    codeOfConduct: Date | null;
    privacy: Date | null;
  };

  // ── Operación ──
  submittedAt: Date;
  approved: boolean;
  approvedAt: Date | null;
  approvedBy: string | null;
  sentVolunteerCampaigns: string[];
  /** Override del nombre impreso en el certificado. */
  certName: string;
  certSentAt: Date | null;
  metadata: {
    ip?: string;
    userAgent?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const volunteerSubmissionSchema = new Schema<IVolunteerSubmission>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: "" },
    // Sin `required` a propósito: el formulario público sí los exige —lo hace
    // `parseVolunteerInput`—, pero una ficha movida desde registros llega sin
    // ellos, y bloquear ese movimiento dejaría al staff sin poder corregir a
    // alguien que se equivocó de formulario.
    documentType: { type: String, default: "" },
    documentNumber: { type: String, default: "", index: true },

    role: { type: String, required: true, index: true },
    roleOther: { type: String, default: null },
    entityType: { type: String, required: true },
    entityName: { type: String, default: null, index: true },
    sbg: { type: String, default: "none", index: true },

    availability: { type: String, default: "", index: true },
    interestAreas: { type: [String], default: [], index: true },
    previousExperience: { type: String, default: "none" },
    motivation: { type: String, default: "" },

    shirtSize: { type: String, default: "" },
    dietary: { type: String, default: "none", index: true },
    dietaryOther: { type: String, default: null },
    emergencyName: { type: String, default: "" },
    emergencyPhone: { type: String, default: "" },

    consent: {
      codeOfConduct: { type: Date, default: null },
      privacy: { type: Date, default: null },
    },

    submittedAt: { type: Date, default: Date.now, index: true },
    approved: { type: Boolean, default: false, index: true },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: null },
    sentVolunteerCampaigns: { type: [String], default: [] },
    certName: { type: String, default: "" },
    certSentAt: { type: Date, default: null },
    metadata: {
      ip: String,
      userAgent: String,
    },
  },
  { timestamps: true },
);

/** Búsqueda del panel: nombre y documento, que es lo que se teclea. */
volunteerSubmissionSchema.index({ firstName: "text", lastName: "text", documentNumber: "text" });

export const VolunteerSubmission =
  (mongoose.models.VolunteerSubmission as mongoose.Model<IVolunteerSubmission>) ||
  mongoose.model<IVolunteerSubmission>("VolunteerSubmission", volunteerSubmissionSchema);
