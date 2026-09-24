import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/db";
import { EventConfig, DEFAULT_TIPS } from "@/models/event-config";
import { EVENT_CONFIG_TAG } from "@/lib/data/event-config";
import { requireAuth } from "@/lib/auth";
import { createLog } from "@/lib/log";

export async function GET() {
  await connectDB();
  const config = await EventConfig.findOne().lean() as Record<string, string> | null;

  // tips and slideTemplateUrl are admin-only — never expose them to public/unauthenticated requests
  let isStaff = false;
  try {
    await requireAuth(["admin", "organizer"]);
    isStaff = true;
  } catch {
    isStaff = false;
  }

  return NextResponse.json({
    trackVirtualUrl:  config?.trackVirtualUrl ?? "",
    photosUrl:        config?.photosUrl ?? "",
    recordingsUrl:    config?.recordingsUrl ?? "",
    notify2027Url:    config?.notify2027Url ?? "",
    showSponsorsCta:  config?.showSponsorsCta ?? true,
    showSpeakerCta:   config?.showSpeakerCta ?? true,
    ...(isStaff ? {
      tips:             (config?.tips as string[] | undefined)?.length ? config?.tips : DEFAULT_TIPS,
      slideTemplateUrl: config?.slideTemplateUrl ?? "",
      speakerUploadUrl: config?.speakerUploadUrl ?? "",
      volunteerRecordingUrl: config?.volunteerRecordingUrl ?? "",
      recordingVirtualUrl: config?.recordingVirtualUrl ?? "",
      recordingHybridUrl: config?.recordingHybridUrl ?? "",
    } : {}),
  });
}

export async function PATCH(req: Request) {
  let actor: Awaited<ReturnType<typeof requireAuth>>;
  try {
    actor = await requireAuth(["admin"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  const stringFields = ["trackVirtualUrl", "photosUrl", "recordingsUrl", "notify2027Url", "slideTemplateUrl", "speakerUploadUrl", "volunteerRecordingUrl", "recordingVirtualUrl", "recordingHybridUrl"];
  for (const f of stringFields) {
    if (f in body) updates[f] = typeof body[f] === "string" ? (body[f] as string).trim() : "";
  }
  if ("showSponsorsCta" in body && typeof body.showSponsorsCta === "boolean") updates.showSponsorsCta = body.showSponsorsCta;
  if ("showSpeakerCta" in body && typeof body.showSpeakerCta === "boolean") updates.showSpeakerCta = body.showSpeakerCta;
  if ("tips" in body && Array.isArray(body.tips)) {
    updates.tips = (body.tips as unknown[]).filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter(Boolean);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  await connectDB();
  await EventConfig.findOneAndUpdate({}, { $set: updates }, { upsert: true });
  revalidateTag(EVENT_CONFIG_TAG, { expire: 0 });

  await createLog({
    userId: String(actor._id), userName: actor.name, userRole: actor.role,
    action: "EVENT_CONFIG_UPDATED",
    target: "Configuración del evento",
    details: Object.keys(updates).join(", "),
  });

  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  let actor: Awaited<ReturnType<typeof requireAuth>>;
  try {
    actor = await requireAuth(["admin"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const pick = (k: string) => (typeof body[k] === "string" ? body[k].trim() : "");
  const pickBool = (k: string, fallback: boolean) => (typeof body[k] === "boolean" ? body[k] : fallback);
  const pickStrArr = (k: string, fallback: string[]) => {
    const v = body[k];
    return Array.isArray(v) && v.every((s: unknown) => typeof s === "string")
      ? v.map((s: string) => s.trim()).filter(Boolean)
      : fallback;
  };

  await connectDB();
  const config = await EventConfig.findOneAndUpdate(
    {},
    {
      trackVirtualUrl:  pick("trackVirtualUrl"),
      photosUrl:        pick("photosUrl"),
      recordingsUrl:    pick("recordingsUrl"),
      notify2027Url:    pick("notify2027Url"),
      showSponsorsCta:  pickBool("showSponsorsCta", true),
      showSpeakerCta:   pickBool("showSpeakerCta", true),
      tips:             pickStrArr("tips", DEFAULT_TIPS),
      slideTemplateUrl: pick("slideTemplateUrl"),
      speakerUploadUrl: pick("speakerUploadUrl"),
      volunteerRecordingUrl: pick("volunteerRecordingUrl"),
    },
    { upsert: true, returnDocument: "after" },
  );
  revalidateTag(EVENT_CONFIG_TAG, { expire: 0 });

  await createLog({
    userId: String(actor._id), userName: actor.name, userRole: actor.role,
    action: "EVENT_CONFIG_UPDATED",
    target: "Configuración del evento",
    details: "Formulario de configuración",
  });

  return NextResponse.json({
    trackVirtualUrl:  config.trackVirtualUrl,
    photosUrl:        config.photosUrl,
    recordingsUrl:    config.recordingsUrl,
    notify2027Url:    config.notify2027Url,
    showSponsorsCta:  config.showSponsorsCta,
    showSpeakerCta:   config.showSpeakerCta,
    tips:             config.tips?.length ? config.tips : DEFAULT_TIPS,
    slideTemplateUrl: config.slideTemplateUrl ?? "",
  });
}
