import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { render } from "@react-email/components";
import { connectDB } from "@/lib/db";
import { Passport } from "@/models/passport";
import { SponsorPin } from "@/models/sponsor-pin";
import { Registration } from "@/models/registration";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { SpeakerProfile } from "@/models/speaker-profile";
import { User } from "@/models/user";
import { PassportEditToken } from "@/models/passport-edit-token";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { PassportEditConfirmEmail } from "@/emails/passport-edit-confirm";
import { maskEmail } from "@/lib/utils";
import { getIp, isBlocked, recordFail, clearFails } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/constants";

const FAIL_LIMIT = 5;
const FAIL_WINDOW = 15 * 60 * 1000;
const APP_URL = SITE_URL;

// Campos de redes editables + etiquetas legibles
const SOCIAL_KEYS = ["builderCenter", "linkedin", "instagram", "x", "github", "tiktok"] as const;
const FIELD_LABELS: Record<string, string> = {
  builderCenter: "Builder Center", linkedin: "LinkedIn", instagram: "Instagram",
  x: "X / Twitter", github: "GitHub", tiktok: "TikTok", photo: "Foto",
};
const sanitizeUser = (v: unknown) =>
  typeof v === "string" ? v.trim().replace(/^@+/, "").replace(/\s+/g, "").slice(0, 80) : "";

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// El correo del dueño vive en un modelo distinto según el rol del pasaporte.
// linkedRegistrationId guarda el id del registro fuente (Registration / VolunteerSubmission / SpeakerProfile / User).
async function resolveOwnerContact(role: string, linkedId?: string): Promise<{ email: string; name: string }> {
  if (!linkedId) return { email: "", name: "" };
  try {
    if (role === "attendee") {
      const reg = await Registration.findById(linkedId)
        .select("firstName lastName email")
        .lean();
      if (!reg) return { email: "", name: "" };
      return { email: reg.email, name: `${reg.firstName} ${reg.lastName}`.trim() };
    }
    if (role === "volunteer") {
      const vol = await VolunteerSubmission.findById(linkedId)
        .select("firstName lastName email")
        .lean();
      if (!vol) return { email: "", name: "" };
      return { email: vol.email, name: `${vol.firstName} ${vol.lastName}`.trim() };
    }
    if (role === "speaker") {
      const sp = await SpeakerProfile.findById(linkedId).select("name email").lean();
      return { email: sp?.email ?? "", name: sp?.name || "" };
    }
    if (role === "organizer") {
      const u = await User.findById(linkedId).select("email name").lean<{ email?: string; name?: string } | null>();
      return { email: (u?.email || "").trim(), name: u?.name || "" };
    }
  } catch { /* sin correo */ }
  return { email: "", name: "" };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  try {
    const { shortId } = await params;
    const pin = req.nextUrl.searchParams.get("pin");

    await connectDB();
    const passport = await Passport.findOne({ shortId });
    if (!passport) return Response.json({ error: "Pasaporte no encontrado" }, { status: 404 });

    // Lazy-generate viewPin
    if (!passport.viewPin) {
      passport.viewPin = generatePin();
      await passport.save();
    }

    const sponsors = await SponsorPin.find({ isActive: true })
      .select("_id sponsorName logoUrl")
      .lean();

    // Build public passport data (viewPin never sent to client)
    const { viewPin: _vp, ...passportData } = passport.toObject();
    // Normalize stats.clicks Map → plain object for JSON
    if (passportData.stats?.clicks instanceof Map) {
      passportData.stats.clicks = Object.fromEntries(passportData.stats.clicks);
    }
    const publicData = { passport: passportData, sponsors, isOwner: false };

    // If no pin provided, return public data immediately
    if (!pin) return Response.json(publicData);

    // PIN was provided — check rate limit before validating
    const ip = getIp(req);
    const failKey = `pin_fail:${ip}:${shortId}`;
    const { blocked, retryAfterMs } = isBlocked(failKey, FAIL_LIMIT);
    if (blocked) {
      const mins = Math.ceil(retryAfterMs / 60000);
      return Response.json(
        { ...publicData, isOwner: false, rateLimited: true, error: `Demasiados intentos. Intenta en ${mins} min.` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
      );
    }

    if (pin !== passport.viewPin) {
      const { blocked: nowBlocked, retryAfterMs: ms } = recordFail(failKey, FAIL_LIMIT, FAIL_WINDOW);
      return Response.json(
        {
          ...publicData,
          isOwner: false,
          pinError: nowBlocked ? "Cuenta bloqueada 15 minutos por demasiados intentos." : "PIN incorrecto.",
          rateLimited: nowBlocked,
          retryAfterMs: nowBlocked ? ms : undefined,
        },
        { status: 401 },
      );
    }

    clearFails(failKey);
    return Response.json({ ...publicData, isOwner: true });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  try {
    const { shortId } = await params;
    const body = await req.json();
    const { pin, photoUrl, social } = body;

    await connectDB();
    const passport = await Passport.findOne({ shortId }).select("viewPin photoUrl social linkedRegistrationId firstName role");
    if (!passport) return Response.json({ error: "No encontrado" }, { status: 404 });
    if (!pin || pin !== passport.viewPin) {
      return Response.json({ error: "PIN incorrecto" }, { status: 401 });
    }

    const current = (passport.social ?? {}) as Record<string, string>;
    const addSocial: Record<string, string> = {};   // adiciones (vacío→valor) → ahora
    const editSocial: Record<string, string> = {};   // ediciones/eliminaciones → pendientes
    const editList: { label: string; value: string }[] = [];

    if (social && typeof social === "object") {
      for (const key of SOCIAL_KEYS) {
        if (!(key in social)) continue;
        const next = sanitizeUser(social[key]);
        const cur = (current[key] ?? "").trim();
        if (next === cur) continue;
        if (cur === "" && next !== "") addSocial[key] = next;
        else { editSocial[key] = next; editList.push({ label: FIELD_LABELS[key], value: next || "(eliminar)" }); }
      }
    }

    let addPhoto: string | undefined;
    let editPhoto: string | undefined;
    if (typeof photoUrl === "string") {
      const next = photoUrl.trim();
      const cur = (passport.photoUrl ?? "").trim();
      if (next !== cur) {
        if (cur === "" && next !== "") addPhoto = next;
        else { editPhoto = next; editList.push({ label: "Foto", value: next ? "actualizada" : "(eliminar)" }); }
      }
    }

    const applied: string[] = [];

    // Aplicar adiciones de inmediato
    if (Object.keys(addSocial).length > 0 || addPhoto !== undefined) {
      passport.social = { ...current, ...addSocial };
      passport.markModified("social");
      if (addPhoto !== undefined) passport.photoUrl = addPhoto;
      await passport.save();
      applied.push(...Object.keys(addSocial).map((k) => FIELD_LABELS[k]));
      if (addPhoto !== undefined) applied.push("Foto");
    }

    const hasEdits = Object.keys(editSocial).length > 0 || editPhoto !== undefined;
    if (!hasEdits) return Response.json({ ok: true, applied, pending: [] });

    // Hay ediciones → requieren confirmación por correo. El correo del dueño
    // sale del modelo según el rol (registro, voluntario, speaker u organizador).
    const contact = await resolveOwnerContact(passport.role, passport.linkedRegistrationId);
    const email = contact.email;
    const name = passport.firstName || contact.name || "";

    // Caso borde: sin correo (no se puede verificar) → aplicar directo
    if (!email) {
      passport.social = { ...(passport.social ?? {}), ...editSocial };
      passport.markModified("social");
      if (editPhoto !== undefined) passport.photoUrl = editPhoto;
      await passport.save();
      // unverified: se aplicó sin confirmar porque no hay correo en el registro
      return Response.json({ ok: true, applied: [...applied, ...editList.map((e) => e.label)], pending: [], unverified: true });
    }

    // COALESCE + SUPERSEDE: arrastra los cambios aún sin confirmar de tokens
    // previos (los nuevos ganan), invalida los enlaces anteriores y emite uno
    // nuevo que confirma TODO lo pendiente de una sola vez.
    const prior = await PassportEditToken.find({ shortId, usedAt: null }).select("changes").lean<{ changes?: { social?: Record<string, string>; photoUrl?: string } }[]>();
    const mergedSocial: Record<string, string> = {};
    let mergedPhoto: string | undefined;
    for (const p of prior) {
      if (p.changes?.social) Object.assign(mergedSocial, p.changes.social);
      if (typeof p.changes?.photoUrl === "string") mergedPhoto = p.changes.photoUrl;
    }
    Object.assign(mergedSocial, editSocial);            // lo nuevo gana
    if (editPhoto !== undefined) mergedPhoto = editPhoto;

    await PassportEditToken.deleteMany({ shortId, usedAt: null }); // mata los enlaces viejos

    const changes: { social?: Record<string, string>; photoUrl?: string } = {};
    if (Object.keys(mergedSocial).length > 0) changes.social = mergedSocial;
    if (mergedPhoto !== undefined) changes.photoUrl = mergedPhoto;

    const token = nanoid(32);
    await PassportEditToken.create({ shortId, token, changes, expiresAt: new Date(Date.now() + 24 * 3600 * 1000) });

    // El correo lista TODO el conjunto pendiente (no solo lo de este guardado)
    const fullList: { label: string; value: string }[] = [
      ...SOCIAL_KEYS.filter((k) => k in mergedSocial).map((k) => ({ label: FIELD_LABELS[k], value: mergedSocial[k] || "(eliminar)" })),
      ...(mergedPhoto !== undefined ? [{ label: "Foto", value: mergedPhoto ? "actualizada" : "(eliminar)" }] : []),
    ];

    try {
      const html = await render(PassportEditConfirmEmail({ name, confirmUrl: `${APP_URL}/confirmar-cambios/${token}`, changes: fullList }));
      await sendEmail({ from: EMAIL_FROM, to: email, subject: "🔒 Confirma los cambios en tu pasaporte — AWS Student Community Day México 2026", html });
    } catch { /* el correo no es fatal */ }

    return Response.json({ ok: true, applied, pending: fullList.map((e) => e.label), maskedEmail: maskEmail(email) });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
