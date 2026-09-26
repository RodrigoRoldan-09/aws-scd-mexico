import mongoose, { Schema, type Document } from "mongoose";

/**
 * Registro de una persona asistente. Cada dato es un campo tipado para poder
 * indexar y filtrar en la base.
 *
 * Se guardan **códigos**, no etiquetas: `in-person`, `student_ip`. La etiqueta
 * se resuelve al mostrar, contra el catálogo de `@/data/attendee-form`. Así,
 * cambiar el texto de una opción no deja los registros viejos con el texto
 * antiguo.
 */

export type Attendance = "in-person" | "online";

export interface IRegistration extends Document {
  // ── Identidad ──
  firstName: string;
  lastName: string;
  /** En minúsculas y sin espacios; es la clave para detectar duplicados. */
  email: string;

  // ── Modalidad ──
  attendance: Attendance;

  // ── Documento — sólo presencial ──
  /** Código del tipo, del catálogo del país (RUN, CC, DNI, CURP…). */
  documentType: string | null;
  /** Ya normalizado: sin puntos, en mayúsculas, con dígito verificador. */
  documentNumber: string | null;

  // ── Perfil ──
  /** Código del rol; `other` cuando la persona escribió el suyo. */
  role: string;
  /** Texto libre, sólo si `role === "other"`. */
  roleOther: string | null;
  entityType: string;
  entityName: string | null;
  /** Si la persona asiste representando o formando parte de alguna comunidad técnica. */
  fromCommunity: boolean;
  communityName: string | null;

  /**
   * Consentimientos, con la fecha en que se dieron.
   *
   * La fecha no es un adorno: la política de privacidad se apoya en el
   * consentimiento como base de licitud, y lo que hay que poder demostrar es
   * cuándo se otorgó.
   */
  consent: {
    codeOfConduct: Date | null;
    privacy: Date | null;
  };

  // ── Operación del evento ──
  qrCode: string;
  checkedIn: boolean;
  checkedInAt: Date | null;
  checkedInBy: string | null;
  /** Alta manual desde el panel, no por el formulario público. */
  isManual: boolean;

  emailStatus: "pending" | "sent" | "failed" | "skipped";
  emailError: string | null;
  emailSentAt: Date | null;
  resendId: string | null;
  sentCampaigns: string[];

  confirmation: {
    confirmed: boolean;
    confirmedAt: Date | null;
    badgeFirstName: string;
    badgeLastName: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<IRegistration>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },

    attendance: {
      type: String,
      enum: ["in-person", "online"],
      required: true,
      index: true,
    },

    documentType: { type: String, default: null },
    // Índice disperso: quien asiste en línea no tiene documento, y sin
    // `sparse` todos esos nulos ocuparían entrada en el índice.
    documentNumber: { type: String, default: null, index: { sparse: true } },

    role: { type: String, required: true, index: true },
    roleOther: { type: String, default: null },
    entityType: { type: String, required: true },
    entityName: { type: String, default: null, index: true },
    fromCommunity: { type: Boolean, default: false, index: true },
    communityName: { type: String, default: null, trim: true },

    consent: {
      codeOfConduct: { type: Date, default: null },
      privacy: { type: Date, default: null },
    },

    qrCode: { type: String, required: true, unique: true },
    checkedIn: { type: Boolean, default: false, index: true },
    checkedInAt: { type: Date, default: null },
    checkedInBy: { type: String, default: null },
    isManual: { type: Boolean, default: false },

    emailStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "skipped"],
      default: "pending",
      index: true,
    },
    emailError: { type: String, default: null },
    emailSentAt: { type: Date, default: null },
    resendId: { type: String, default: null },
    sentCampaigns: { type: [String], default: [] },

    confirmation: {
      confirmed: { type: Boolean, default: false },
      confirmedAt: { type: Date, default: null },
      badgeFirstName: { type: String, default: "" },
      badgeLastName: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

/**
 * Índice de texto para la búsqueda del check-in.
 *
 * Cubre lo que de verdad se teclea en la puerta: nombre y documento.
 */
registrationSchema.index({ firstName: "text", lastName: "text", documentNumber: "text" });

export const Registration =
  (mongoose.models.Registration as mongoose.Model<IRegistration>) ||
  mongoose.model<IRegistration>("Registration", registrationSchema);
