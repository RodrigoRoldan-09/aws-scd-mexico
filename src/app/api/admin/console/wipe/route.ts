import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Registration } from "@/models/registration";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { SpeakerProfile } from "@/models/speaker-profile";
import { Passport } from "@/models/passport";
import { AgendaEvent } from "@/models/agenda-event";
import { createLog } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * Borrado masivo por colección.
 *
 * Es la operación más destructiva del panel y no tiene deshacer, así que pide
 * escribir una frase exacta —no un "¿seguro?" que se aprieta sin leer— y sólo
 * la puede ejecutar un admin. Queda registrada en el log con el número de
 * documentos borrados, que es lo único que después permite reconstruir qué
 * pasó.
 *
 * Sirve para lo que de verdad se usa: dejar la base limpia después de probar,
 * antes de abrir los formularios de verdad.
 */

const TARGETS = {
  attendees: {
    label: "asistentes",
    /** Los pasaportes cuelgan del registro: se van con él o quedan huérfanos. */
    async run() {
      const regs = await Registration.find({}).select("qrCode _id").lean();
      const ids = regs.map((r) => String(r._id));
      const codes = regs.map((r) => r.qrCode).filter(Boolean);
      const passports = await Passport.deleteMany({
        $or: [{ linkedRegistrationId: { $in: ids } }, { shortId: { $in: codes } }],
      });
      const main = await Registration.deleteMany({});
      return {
        deleted: main.deletedCount ?? 0,
        extra: passports.deletedCount ? `${passports.deletedCount} pasaporte(s)` : "",
      };
    },
  },
  volunteers: {
    label: "voluntarios",
    async run() {
      const vols = await VolunteerSubmission.find({}).select("_id").lean();
      const passports = await Passport.deleteMany({
        linkedRegistrationId: { $in: vols.map((v) => String(v._id)) },
      });
      const main = await VolunteerSubmission.deleteMany({});
      return {
        deleted: main.deletedCount ?? 0,
        extra: passports.deletedCount ? `${passports.deletedCount} pasaporte(s)` : "",
      };
    },
  },
  speakers: {
    label: "speakers",
    /**
     * La agenda apunta a los speakers por `speakerId`.
     *
     * Borrarlos dejaría bloques con un enlace a un documento que ya no existe,
     * y en la agenda pública eso se ve como una sesión sin ponente. Se limpia
     * la referencia en vez de borrar el bloque: el horario y la sala siguen
     * siendo válidos, sólo queda sin persona asignada.
     */
    async run() {
      const main = await SpeakerProfile.deleteMany({});
      const agenda = await AgendaEvent.updateMany(
        { speakerId: { $ne: null } },
        { $set: { speakerId: null, speaker: "", speakerSlug: "" } },
      );
      return {
        deleted: main.deletedCount ?? 0,
        extra: agenda.modifiedCount ? `${agenda.modifiedCount} bloque(s) de agenda sin ponente` : "",
      };
    },
  },
  passports: {
    label: "pasaportes",
    async run() {
      const main = await Passport.deleteMany({});
      return { deleted: main.deletedCount ?? 0, extra: "" };
    },
  },
} as const;

type WipeTarget = keyof typeof TARGETS;

/**
 * La frase que hay que escribir para que el borrado se ejecute.
 *
 * Va con la etiqueta en español y no con la clave interna: quien la escribe
 * está leyendo "Asistentes" en pantalla, no "attendees".
 */
function phraseFor(target: WipeTarget): string {
  return `BORRAR ${TARGETS[target].label.toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(["admin"]);
    const { target, confirm } = (await req.json()) as { target?: string; confirm?: string };

    if (!target || !(target in TARGETS)) {
      return Response.json({ error: "No sé qué lista borrar." }, { status: 400 });
    }
    const entry = TARGETS[target as WipeTarget];

    // La comprobación va también en el servidor: la de la pantalla se puede
    // saltar armando la petición a mano, y esto no se deshace.
    const phrase = phraseFor(target as WipeTarget);
    if ((confirm ?? "").trim().toUpperCase() !== phrase) {
      return Response.json(
        { error: `Para confirmar hay que escribir exactamente "${phrase}".` },
        { status: 400 },
      );
    }

    await connectDB();
    const { deleted, extra } = await entry.run();

    await createLog({
      userId: actor._id.toString(),
      userName: actor.name,
      userRole: actor.role,
      action: "DATA_WIPED",
      target: entry.label,
      details: [`${deleted} documento(s)`, extra].filter(Boolean).join(" · "),
    });

    return Response.json({ ok: true, deleted, extra, label: entry.label });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    console.error("[consola/wipe]", e);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
