import { Schema, model, models, Document } from "mongoose";

export const DEFAULT_TIPS = [
  "💧 Trae tu botella de agua",
  "💵 Lleva efectivo o tarjeta — hay restaurantes cerca",
  "🕗 Registro abre a las 8:00 AM — llega puntual",
  "📱 Ten tu código QR listo desde que llegas",
  "📷 Carga bien tu teléfono — vas a querer documentar todo",
  "👕 Ropa cómoda — es un día largo y muy emocionante",
];

export interface IEventConfig extends Document {
  trackVirtualUrl: string;
  photosUrl: string;
  recordingsUrl: string;
  notify2027Url: string;
  showSponsorsCta: boolean;
  showSpeakerCta: boolean;
  tips: string[];
  slideTemplateUrl: string;
  speakerUploadUrl: string;
  volunteerRecordingUrl: string;
  recordingVirtualUrl: string;
  recordingHybridUrl: string;
}

const schema = new Schema<IEventConfig>(
  {
    trackVirtualUrl:  { type: String,   default: "" },
    photosUrl:        { type: String,   default: "" },
    recordingsUrl:    { type: String,   default: "" },
    notify2027Url:    { type: String,   default: "" },
    showSponsorsCta:  { type: Boolean,  default: true },
    showSpeakerCta:   { type: Boolean,  default: true },
    tips:             { type: [String], default: DEFAULT_TIPS },
    slideTemplateUrl: { type: String,   default: "" },
    speakerUploadUrl: { type: String,   default: "" },
    volunteerRecordingUrl: { type: String, default: "" },
    recordingVirtualUrl: { type: String, default: "" },
    recordingHybridUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

export const EventConfig = models.EventConfig || model<IEventConfig>("EventConfig", schema);
