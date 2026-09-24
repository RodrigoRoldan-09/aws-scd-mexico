import { Registration } from "@/models/registration";
import { SpeakerProfile } from "@/models/speaker-profile";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { User } from "@/models/user";
import { SurveyRecipient } from "@/models/survey-recipient";

export type RecipientSource = "registration" | "speaker" | "volunteer" | "user";

export interface BroadRecipient {
  email: string;
  name: string;
  // Solo los registros tienen QR / pase; speakers, voluntarios e internos no.
  qrCode?: string;
  source: RecipientSource;
  id: string;
}

// Campañas que van a la audiencia amplia (registros + speakers + voluntarios +
// usuarios internos), sin duplicados por correo. El día del evento y los de
// confirmación van solo a registros.
export const BROAD_CAMPAIGN_TYPES = new Set<string>([
  "reminder_15d",
  "reminder_5d",
  "reminder_1d",
  "keynote_daniel",
  "keynote_alejandra",
  "passport_guide",
  "gallery_recordings",
  "cert_challenge",
]);

// Registros + speakers aceptados + voluntarios aprobados + usuarios internos que
// aún no han recibido `type`, sin duplicados por correo (gana el registro, que
// conserva su QR; luego speaker, voluntario y usuario interno).
// Cuando `options.skipSentFilter` es true se omite el filtro sentCampaigns (re-enviable).
export async function gatherBroadRecipients(
  type: string,
  extraRegFilter?: Record<string, unknown>,
  options?: { skipSentFilter?: boolean },
): Promise<BroadRecipient[]> {
  const skip = options?.skipSentFilter === true;
  const sentFilter = (field: string) => skip ? {} : { [field]: { $nin: [type] } };

  const [regs, speakers, vols, internalUsers] = await Promise.all([
    Registration.find({ ...sentFilter("sentCampaigns"), ...(extraRegFilter ?? {}) }).lean(),
    SpeakerProfile.find({ status: "accepted", ...sentFilter("sentSpeakerCampaigns") }).lean(),
    VolunteerSubmission.find({ approved: true, ...sentFilter("sentVolunteerCampaigns") }).lean(),
    // Usuarios internos: solo admin y organizer (no las cuentas de voluntario).
    User.find({ role: { $in: ["admin", "organizer"] }, ...sentFilter("sentCampaigns") }).lean(),
  ]);

  const seen = new Set<string>();
  const out: BroadRecipient[] = [];

  for (const reg of regs) {
    const email = reg.email;
    if (!email) continue;
    const key = email.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      email,
      name: `${reg.firstName} ${reg.lastName}`.trim(),
      qrCode: reg.qrCode,
      source: "registration",
      id: String(reg._id),
    });
  }
  for (const s of speakers) {
    const email = s.email;
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ email, name: s.name, source: "speaker", id: String(s._id) });
  }
  for (const v of vols) {
    const email = v.email;
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      email,
      name: `${v.firstName} ${v.lastName}`.trim(),
      source: "volunteer",
      id: String(v._id),
    });
  }
  for (const u of internalUsers) {
    const email = (u.email as string | undefined)?.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ email, name: (u.name as string) || "", source: "user", id: String(u._id) });
  }
  return out;
}

// Destinatarios solo de registros, según una consulta (día del evento, confirmar, etc.).
export async function gatherRegistrationRecipients(
  query: Record<string, unknown>,
): Promise<BroadRecipient[]> {
  const regs = await Registration.find(query).lean();
  const out: BroadRecipient[] = [];
  for (const reg of regs) {
    const email = reg.email;
    if (!email) continue;
    out.push({ email, name: `${reg.firstName} ${reg.lastName}`.trim(), qrCode: reg.qrCode, source: "registration", id: String(reg._id) });
  }
  return out;
}

// Única fuente de verdad de quién recibe cada campaña (la usan envío, preview y conteos).
// El recordatorio de 5 días se parte: los confirmados (+ speakers/voluntarios/internos)
// reciben el normal; los registrados sin confirmar reciben la versión reducida + CTA.
export async function gatherRecipientsForType(type: string): Promise<BroadRecipient[]> {
  if (type === "reminder_5d") {
    return gatherBroadRecipients(type, { "confirmation.confirmed": true });
  }
  if (type === "reminder_5d_unconfirmed") {
    return gatherRegistrationRecipients({
      "confirmation.confirmed": { $ne: true },
      sentCampaigns: { $nin: [type] },
    });
  }
  if (BROAD_CAMPAIGN_TYPES.has(type)) {
    return gatherBroadRecipients(type);
  }
  if (type === "confirm_reminder") {
    return gatherRegistrationRecipients({
      "confirmation.confirmed": { $ne: true },
      sentCampaigns: { $nin: [type] },
    });
  }
  // Último llamado: SIN dedup por sentCampaigns → se puede enviar varias veces
  // (hoy y mañana) a quien siga sin confirmar.
  if (type === "confirm_final") {
    return gatherRegistrationRecipients({ "confirmation.confirmed": { $ne: true } });
  }
  // Recogida anticipada de escarapela: solo a quienes YA confirmaron asistencia.
  if (type === "badge_pickup") {
    return gatherRegistrationRecipients({
      "confirmation.confirmed": true,
      sentCampaigns: { $nin: [type] },
    });
  }
  // Mensaje de resiliencia en vivo: va a TODOS sin filtro de sentCampaigns (re-enviable).
  if (type === "resilience_message") {
    return gatherBroadRecipients(type, undefined, { skipSentFilter: true });
  }
  // Encuesta post-evento: TODOS, re-enviable, pero excluyendo a quienes ya dieron clic.
  if (type === "post_survey") {
    const recipients = await gatherBroadRecipients(type, undefined, { skipSentFilter: true });
    const clicked = await SurveyRecipient.find({ clickedAt: { $ne: null } }).select("source sourceId").lean<{ source: string; sourceId: string }[]>();
    const clickedSet = new Set(clicked.map((c) => `${c.source}:${c.sourceId}`));
    return recipients.filter((r) => !clickedSet.has(`${r.source}:${r.id}`));
  }
  return gatherRegistrationRecipients({ sentCampaigns: { $nin: [type] } });
}
