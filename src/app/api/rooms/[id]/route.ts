import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Room } from "@/models/room";
import { AgendaEvent } from "@/models/agenda-event";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth(["admin", "organizer"]);
    const { id } = await params;
    const { name, capacity, virtualLink, track, order } = await req.json();

    await connectDB();
    const room = await Room.findByIdAndUpdate(
      id,
      { $set: { name, capacity, virtualLink, track, order } },
      { returnDocument: "after" },
    );
    if (!room) return Response.json({ error: "not found" }, { status: 404 });

    // Los bloques del programa guardan el nombre de la sala como texto además
    // del id, así que renombrar el salón tiene que arrastrarlos: si no, la
    // agenda sigue enseñando el nombre anterior.
    if (typeof name === "string" && name.trim()) {
      await AgendaEvent.updateMany({ roomId: id }, { $set: { room: name.trim() } });
    }

    return Response.json({ room });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden")    return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth(["admin", "organizer"]);
    const { id } = await params;
    await connectDB();
    await Room.findByIdAndDelete(id);
    return Response.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden")    return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
