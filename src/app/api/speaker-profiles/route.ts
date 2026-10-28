import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SpeakerProfile } from "@/models/speaker-profile";
import { getPublicSpeakers } from "@/lib/data/speakers";
import { revalidatePublic, SPEAKERS_TAG, AGENDA_TAG } from "@/lib/data/revalidate";
import { createLog } from "@/lib/log";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 2;
  while (await SpeakerProfile.exists({ slug })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

// Public: list published profiles (misma lógica cacheada que usa el home)
export async function GET() {
  try {
    const profiles = await getPublicSpeakers();
    return Response.json({ profiles });
  } catch (err) {
    console.error("[speaker-profiles GET]", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// Admin: create profile
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();

    const body = await request.json();
    const {
      name, role, tagline, company, companyLogo, bio, photo, social,
      talkTitle, talkAbstract, format, track, sessionId, isPublic,
      email, countryCity, accepted, slug: rawSlug,
    } = body;

    if (!name) {
      return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const baseSlug = rawSlug ? toSlug(rawSlug) : toSlug(name);
    const slug = await uniqueSlug(baseSlug);

    // Alta manual: si se marca `accepted`, la ficha nace como aceptada para
    // poder agendarla en Programa. No se envía ningún correo: sólo el endpoint
    // /api/speakers/[id]/approve escribe a las personas, y acá no se llama.
    const aceptada = accepted === true;

    const profile = await SpeakerProfile.create({
      name,
      email: typeof email === "string" ? email.trim() : "",
      countryCity: typeof countryCity === "string" ? countryCity.trim() : "",
      role: role ?? "",
      tagline: tagline ?? "",
      company: company ?? "",
      companyLogo: companyLogo ?? "",
      bio: bio ?? "",
      photo: photo ?? "",
      social: social ?? {},
      talkTitle: talkTitle ?? "",
      talkAbstract: talkAbstract ?? "",
      format: format === "workshop" ? "workshop" : "talk",
      track: track ?? "general",
      sessionId: sessionId || null,
      isPublic: isPublic ?? false,
      ...(aceptada
        ? { status: "accepted", approvedAt: new Date(), approvedBy: user._id.toString() }
        : {}),
      slug,
    });

    revalidatePublic(SPEAKERS_TAG, AGENDA_TAG);

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "SPEAKER_PROFILE_CREATED",
      target: name,
      targetId: profile._id.toString(),
      details: slug,
    });

    return Response.json({ profile }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
