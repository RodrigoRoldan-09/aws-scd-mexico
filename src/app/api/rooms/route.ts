import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Room } from "@/models/room";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  const rooms = await Room.find().sort({ order: 1, name: 1 }).lean();
  return Response.json({ rooms });
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin", "organizer"]);
    const { name, capacity, virtualLink, track, order } = await req.json();
    if (!name?.trim()) return Response.json({ error: "name required" }, { status: 400 });

    await connectDB();
    const room = await Room.create({
      name: name.trim(),
      capacity: capacity ?? undefined,
      virtualLink: virtualLink ?? "",
      track: track ?? "",
      order: order ?? 0,
    });

    return Response.json({ room }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden")    return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
