import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  changeAttendance,
  registrationToVolunteer,
  speakerToRegistration,
  volunteerToRegistration,
  type Move,
} from "@/lib/moves";

export const dynamic = "force-dynamic";

/**
 * Movimientos de una persona entre listas, desde la consola.
 *
 * Una sola entrada para los cuatro casos: la lógica está en `@/lib/moves`, que
 * también usan los botones de las tablas, así que no hay dos maneras de mover a
 * alguien que hagan cosas distintas.
 *
 * Cuando faltan datos responde **422** con la lista de campos, en vez de crear
 * una ficha a medias. La interfaz los pide y reintenta.
 */

const KINDS = [
  "registration_to_volunteer",
  "volunteer_to_registration",
  "speaker_to_registration",
  "attendance_in_person",
  "attendance_online",
] as const;
type Kind = (typeof KINDS)[number];

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(["admin"]);
    const body = (await req.json()) as {
      kind?: string;
      id?: string;
      data?: Record<string, unknown>;
    };

    const kind = body.kind as Kind | undefined;
    const id = typeof body.id === "string" ? body.id : "";
    const data = (body.data ?? {}) as Record<string, unknown>;

    if (!kind || !(KINDS as readonly string[]).includes(kind)) {
      return Response.json({ error: "Movimiento desconocido." }, { status: 400 });
    }
    if (!id) return Response.json({ error: "Falta a quién mover." }, { status: 400 });

    await connectDB();

    const who = { _id: actor._id, name: actor.name, role: actor.role };
    let result: Move;

    switch (kind) {
      case "registration_to_volunteer":
        result = await registrationToVolunteer(id, data, who);
        break;
      case "volunteer_to_registration":
        result = await volunteerToRegistration(id, data, who);
        break;
      case "speaker_to_registration":
        result = await speakerToRegistration(id, data, who);
        break;
      case "attendance_in_person":
        result = await changeAttendance(id, "in-person", data, who);
        break;
      case "attendance_online":
        result = await changeAttendance(id, "online", data, who);
        break;
    }

    if (result.ok) return Response.json(result);
    if ("needs" in result) {
      return Response.json({ needs: result.needs, message: result.message }, { status: 422 });
    }
    return Response.json({ error: result.error }, { status: 409 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    console.error("[consola/move]", e);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
