import { NextRequest } from "next/server";
import { cleanWhitespace, cleanMultiline, normalizeEmail, toUpper } from "@/lib/normalize";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { verifyCaptcha } from "@/lib/captcha";
import { CFP_DEADLINE, CFP_ONLINE_SPEAKERS } from "@/data/cfp";
import { Setting } from "@/models/setting";
import { render } from "@react-email/components";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { SpeakerSubmissionConfirmationEmail } from "@/emails/speaker-submission-confirmation";
import { SpeakerProfile, isProfileStatus } from "@/models/speaker-profile";

export const dynamic = "force-dynamic";

// ── Slug helpers ──────────────────────────────────────────────────────────────
function toSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function buildSlugFromNames(firstName: string, lastName: string, coSpeakers: { firstName: string; lastName: string }[]): string {
  const mainSlug = toSlug(`${firstName} ${lastName}`);
  const coSlugs = coSpeakers
    .filter((cs) => cs.firstName || cs.lastName)
    .map((cs) => toSlug(`${cs.firstName} ${cs.lastName}`))
    .filter(Boolean);
  const all = [mainSlug, ...coSlugs];
  if (all.length === 1) return all[0];
  const last = all[all.length - 1];
  return all.slice(0, -1).join("-") + "-y-" + last;
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 2;
  while (await SpeakerProfile.exists({ slug })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

// ── Static form validation ────────────────────────────────────────────────────
// Mientras CFP_ONLINE_SPEAKERS esté apagado, «online» no es un valor válido:
// se cae en «Campos requeridos: sessionType», igual que si no hubieran elegido.
const SESSION_TYPES = CFP_ONLINE_SPEAKERS ? (["online", "in-person"] as const) : (["in-person"] as const);
const LEVELS        = ["100", "200", "300", "400"] as const;
const LANGUAGES     = ["es", "en"] as const;

function validateBody(body: Record<string, unknown>) {
  const str = (v: unknown, max?: number) => {
    if (typeof v !== "string" || !v.trim()) return null;
    const clean = cleanWhitespace(v);
    if (!clean) return null;
    return max ? clean.slice(0, max) : clean;
  };
  /** Identidad y texto corto: van en mayúsculas a la base. */
  const upper = (v: unknown, max?: number) => {
    const base = str(v, max);
    return base === null ? null : toUpper(base);
  };
  /** Texto largo: se limpia pero conserva la caja — en mayúsculas es ilegible. */
  const long = (v: unknown, max?: number) => {
    if (typeof v !== "string" || !v.trim()) return null;
    const clean = cleanMultiline(v);
    if (!clean) return null;
    return max ? clean.slice(0, max) : clean;
  };
  /** URLs: sin tocar la caja, la ruta la distingue. */
  const url = (v: unknown, max = 300) =>
    typeof v === "string" ? cleanWhitespace(v).slice(0, max) : "";
  const firstName  = upper(body.firstName, 80);
  const lastName   = upper(body.lastName, 80);
  const emailRaw   = typeof body.email === "string" ? body.email : "";
  const emailCheck = normalizeEmail(emailRaw);
  const email      = emailCheck.ok ? emailCheck.value.slice(0, 200) : null;
  const tagline    = upper(body.tagline, 120);
  const bio        = long(body.bio, 1000);
  const photo      = url(body.photo, 500);
  const talkTitle  = upper(body.talkTitle, 120);
  const abstract   = long(body.talkAbstract, 2000);
  const country    = upper(body.countryCity, 120);

  const sessionType    = SESSION_TYPES.includes(body.sessionType as never) ? (body.sessionType as string) : null;
  const audienceLevel  = LEVELS.includes(body.audienceLevel as never)      ? (body.audienceLevel as string) : null;
  const language       = LANGUAGES.includes(body.language as never)        ? (body.language as string) : null;
  const preRecordingDate = typeof body.preRecordingDate === "string" ? body.preRecordingDate.slice(0, 100) : "";

  const missing = [
    !firstName && "firstName",
    !lastName  && "lastName",
    !email     && "email",
    !tagline   && "tagline",
    !bio       && "bio",
    !photo     && "photo",
    !talkTitle && "talkTitle",
    !abstract  && "talkAbstract",
    !country   && "countryCity",
    !sessionType   && "sessionType",
    !audienceLevel && "audienceLevel",
    !language      && "language",
    (sessionType === "online" && !preRecordingDate) && "preRecordingDate",
  ].filter(Boolean);

  if (missing.length) return { error: `Campos requeridos: ${missing.join(", ")}` };

  const social = (body.social && typeof body.social === "object") ? body.social as Record<string, unknown> : {};

  return {
    firstName:      firstName!,
    lastName:       lastName!,
    email:          email!,
    tagline:        tagline!,
    bio:            bio!,
    photo:          photo!,
    talkTitle:      talkTitle!,
    talkAbstract:   abstract!,
    sessionType:       sessionType!,
    preRecordingDate:  preRecordingDate,
    audienceLevel:     audienceLevel!,
    language:          language!,
    requirements:      long(body.requirements, 500) ?? "",
    countryCity:    country!,
    // Sólo dígitos y el "+" del indicativo: nunca espacios ni guiones.
    phone:          typeof body.phone === "string" ? cleanWhitespace(body.phone).replace(/[^\d+]/g, "").slice(0, 20) : "",
    firstTimeSpeaker: body.firstTimeSpeaker === true,
    coSpeakers:     Array.isArray(body.coSpeakers)
      ? (body.coSpeakers as unknown[]).slice(0, 3).map((cs) => {
          if (!cs || typeof cs !== "object") return null;
          const c = cs as Record<string, unknown>;
          const cs_social = (c.social && typeof c.social === "object") ? c.social as Record<string, unknown> : {};
          return {
            firstName: upper(c.firstName, 80) ?? "",
            lastName:  upper(c.lastName, 80) ?? "",
            email:     typeof c.email === "string" ? (normalizeEmail(c.email).value).slice(0, 200) : "",
            bio:       long(c.bio, 500) ?? "",
            photo:     url(c.photo, 500),
            social: {
              linkedin:  url(cs_social.linkedin),
              twitter:   url(cs_social.twitter),
              instagram: url(cs_social.instagram),
            },
          };
        }).filter((c): c is NonNullable<typeof c> => c !== null)
      : [],
    social: {
      builderCenter: url(social.builderCenter),
      linkedin:      url(social.linkedin),
      twitter:       url(social.twitter),
      instagram:     url(social.instagram),
      github:        url(social.github),
      blog:          url(social.blog),
    },
  };
}

// ── GET — list submissions (admin) ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await requireAuth(["admin", "organizer"]);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    return Response.json({ error: msg }, { status: 403 });
  }

  await connectDB();
  const { searchParams } = req.nextUrl;
  // El status llega como texto libre de la query: se valida contra el enum del
  // modelo antes de filtrar, en vez de pasarlo crudo (Mongoose 9.9 lo rechaza,
  // y además evita filtrar por valores que no existen).
  const statusParam = searchParams.get("status");
  const filter =
    statusParam && statusParam !== "all" && isProfileStatus(statusParam)
      ? { status: statusParam }
      : {};

  const profiles = await SpeakerProfile.find(filter)
    .sort({ submittedAt: -1 })
    .lean();

  // Una fila por persona: el mismo documento trae el estado del trámite y sus
  // datos. Se arma acá y no en el navegador para que la tabla reciba campos
  // con nombre y tipo.
  const rows = profiles.map((p) => {
    return {
      id: String(p._id),
      slug: p.slug ?? "",
      status: p.status,
      speakerType: p.speakerType ?? null,
      approved: p.status === "accepted",
      approvedAt: p.approvedAt ? p.approvedAt.toISOString() : null,
      submittedAt: p.submittedAt ? p.submittedAt.toISOString() : "",
      scheduledAt: p.scheduledAt ? p.scheduledAt.toISOString() : null,
      profileId: String(p._id),

      // Campos del perfil público: es el mismo documento que la postulación.
      isPublic: p.isPublic ?? false,
      track: p.track ?? "general",
      sortOrder: p.sortOrder ?? 0,
      cardApproved: p.cardApproved ?? false,
      cardImageUrl: p.cardImageUrl ?? "",

      firstName: p?.firstName ?? "",
      lastName: p?.lastName ?? "",
      name: p?.name ?? "",
      email: p?.email ?? "",
      phone: p?.phone ?? "",
      countryCity: p?.countryCity ?? "",
      role: p?.role ?? "",
      tagline: p?.tagline ?? "",
      company: p?.company ?? "",
      companyLogo: p?.companyLogo ?? "",
      bio: p?.bio ?? "",
      photo: p?.photo ?? "",
      firstTimeSpeaker: p?.firstTimeSpeaker ?? false,

      talkTitle: p?.talkTitle ?? "",
      talkAbstract: p?.talkAbstract ?? "",
      sessionType: p?.sessionType ?? "",
      preRecordingDate: p?.preRecordingDate ?? "",
      audienceLevel: p?.audienceLevel ?? "",
      language: p?.language ?? "",
      requirements: p?.requirements ?? "",

      social: {
        builderCenter: p?.social?.builderCenter ?? "",
        linkedin: p?.social?.linkedin ?? "",
        twitter: p?.social?.twitter ?? "",
        github: p?.social?.github ?? "",
        instagram: p?.social?.instagram ?? "",
        website: p?.social?.website ?? "",
        blog: p?.social?.blog ?? "",
        facebook: p?.social?.facebook ?? "",
      },
      coSpeakers: (p?.coSpeakers ?? []).map((c) => ({
        name: `${c.firstName} ${c.lastName}`.trim(),
        email: c.email ?? "",
        role: c.role ?? "",
        company: c.company ?? "",
        // La ficha grande enseña la cara de los acompañantes, no sólo su nombre.
        photo: c.photo ?? "",
        tagline: c.tagline ?? "",
        countryCity: c.countryCity ?? "",
      })),
    };
  });

  return Response.json({ submissions: rows });
}

// ── POST — new submission (public) ───────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // El Call for Speakers cierra solo cuando pasa CFP_DEADLINE. Se comprueba
    // aca y no solo en el cliente: si dependiera del boton de la interfaz, una
    // peticion hecha a mano seguiria entrando despues del cierre anunciado.
    //
    // La constante lleva el offset horario explicito, asi que la comparacion es
    // absoluta y no depende de la zona en la que corra el servidor.
    if (Date.now() > new Date(CFP_DEADLINE).getTime()) {
      return Response.json({ error: "La convocatoria de speakers está cerrada." }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();

    // Captcha verification
    const captchaToken = typeof body.captchaToken === "string" ? body.captchaToken : "";
    const captchaOk = await verifyCaptcha(captchaToken);
    if (!captchaOk) {
      return Response.json({ error: "Captcha inválido. Por favor intenta de nuevo." }, { status: 400 });
    }

    const validated = validateBody(body);
    if ("error" in validated) {
      return Response.json({ error: validated.error }, { status: 400 });
    }

    const {
      firstName, lastName, email, tagline, bio, photo,
      talkTitle, talkAbstract, sessionType, preRecordingDate, audienceLevel, language,
      requirements, countryCity, phone, firstTimeSpeaker,
      coSpeakers, social,
    } = validated;

    await connectDB();

    // ¿Se puede postular más de una vez con el mismo correo?
    //
    // Por defecto sí: es normal que alguien mande dos charlas distintas, y
    // antes la segunda rebotaba con un 409 que no explicaba nada. Se apaga
    // desde Ajustes de speakers (`speaker_multi_submit` = "0"), y entonces
    // vuelve a valer una por correo.
    //
    // La comprobación se hace acá y no en el formulario: es la base la que
    // decide, no la interfaz.
    const ajuste = await Setting.findOne({ key: "speaker_multi_submit" }).lean();
    const variasPorCorreo = ajuste?.value !== "0";

    if (!variasPorCorreo) {
      // Se busca en el perfil, que es donde vive el correo desde que la
      // postulación guarda sólo el estado.
      const dup = await SpeakerProfile.findOne({ email });
      if (dup) {
        return Response.json(
          { error: "Ya tienes una postulación enviada con este correo" },
          { status: 409 },
        );
      }
    }


    // Un documento por persona: el perfil guarda tanto los datos como el
    // estado del trámite. Antes se creaban dos —postulación y perfil— y había
    // que enlazarlos en los dos sentidos.
    const baseSlug = buildSlugFromNames(firstName, lastName, coSpeakers);
    const slug = await uniqueSlug(baseSlug);

    const profile = await SpeakerProfile.create({
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
      slug,
      role: tagline,
      tagline,
      bio,
      photo,
      talkTitle,
      talkAbstract,
      sessionType,
      preRecordingDate,
      audienceLevel,
      language,
      requirements,
      countryCity,
      phone,
      firstTimeSpeaker,
      coSpeakers,
      social,
      track: "general",
      status: "submitted",
      isPublic: false,
      submittedAt: new Date(),
      metadata: {
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    // Acuse de recibo con copia de lo enviado.
    //
    // Va envuelto en su propio try: si el correo falla, la postulación ya está
    // guardada y no tiene sentido devolver un error que invite a reenviarla —
    // se duplicaría. El fallo queda en el log y desde el panel se puede
    // reenviar.
    try {
      const html = await render(
        SpeakerSubmissionConfirmationEmail({
          firstName,
          talkTitle,
          talkAbstract,
          sessionType,
          audienceLevel,
          language,
          countryCity,
          tagline,
          requirements,
          coSpeakerNames: coSpeakers
            .map((c) => `${c.firstName} ${c.lastName}`.trim())
            .filter(Boolean),
          slug: profile.slug,
        }),
      );
      await sendEmail({
        from: EMAIL_FROM,
        to: email,
        subject: `Recibimos tu propuesta — ${talkTitle}`,
        html,
      });
    } catch (mailErr) {
      console.error("[POST /api/speakers] acuse de recibo", mailErr);
    }

    return Response.json({ id: profile._id, slug: profile.slug }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/speakers]", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
