import mongoose, { Schema, type Document } from "mongoose";

// Preset de impresión de escarapelas. Las medidas van en mm (universal).
export interface IPrintConfig extends Document {
  name: string;
  widthMm: number;
  heightMm: number;
  marginMm: number;
  qrPct: number;       // ancho del QR como % del ancho de la etiqueta
  fontScale: number;   // multiplicador del tamaño de fuente
  perLabel: number;    // 1 = una escarapela por etiqueta; 2 = dos (arriba/abajo) para cortar
  rotate: number;      // giro del contenido en grados: 0, 90, 180, 270
  layout: string;      // side (nombre+QR lado a lado) | stacked (nombre arriba, QR abajo)
  alignName: string;     // left | center | right
  alignJobTitle: string; // left | center | right
  alignCompany: string;  // left | center | right
  alignRole: string;     // left | center | right
  showQr: boolean;
  showRole: boolean;
  showCompany: boolean;
  showJobTitle: boolean;
  isDefault: boolean;
  createdAt: Date;
}

const schema = new Schema<IPrintConfig>(
  {
    name: { type: String, required: true, trim: true },
    widthMm: { type: Number, required: true },
    heightMm: { type: Number, required: true },
    marginMm: { type: Number, default: 2 },
    qrPct: { type: Number, default: 32 },
    fontScale: { type: Number, default: 1 },
    perLabel: { type: Number, default: 1, enum: [1, 2] },
    rotate: { type: Number, default: 0, enum: [0, 90, 180, 270] },
    layout: { type: String, default: "side", enum: ["side", "stacked"] },
    alignName: { type: String, default: "left", enum: ["left", "center", "right"] },
    alignJobTitle: { type: String, default: "left", enum: ["left", "center", "right"] },
    alignCompany: { type: String, default: "left", enum: ["left", "center", "right"] },
    alignRole: { type: String, default: "left", enum: ["left", "center", "right"] },
    showQr: { type: Boolean, default: true },
    showRole: { type: Boolean, default: true },
    showCompany: { type: Boolean, default: true },
    showJobTitle: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } },
);

export const PrintConfig =
  mongoose.models.PrintConfig as mongoose.Model<IPrintConfig> ||
  mongoose.model<IPrintConfig>("PrintConfig", schema);
