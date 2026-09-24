import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { volunteerToRegistration } from "@/lib/moves";

/**
 * Mueve un voluntario a la lista de asistentes.
 *
 * La lógica está en `@/lib/moves`, compartida con la consola. Falta un dato que
 * el voluntariado no pregunta —si va a asistir presencial o en línea—, así que
 * el endpoint puede responder **422** pidiéndolo; desde la tabla se asume
 * presencial, que es lo que era como voluntario.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAuth(["admin"]);
    const { id } = await params;
    const body = await request.json().catch(() => ({})) as { data?: Record<string, unknown> };

    await connectDB();
    const data = { attendance: "in-person", ...(body.data ?? {}) };
    const result = await volunteerToRegistration(id, data, {
      _id: actor._id,
      name: actor.name,
      role: actor.role,
    });

    if (result.ok) {
      return Response.json({
        ok: true,
        // La tabla lo usa para elegir el mensaje: si ya existía, no se creó nada.
        createdRegistration: !result.done.some((d) => d.startsWith("Ya existía")),
        done: result.done,
      });
    }
    if ("needs" in result) {
      return Response.json({ needs: result.needs, message: result.message }, { status: 422 });
    }
    return Response.json({ error: result.error }, { status: 409 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
