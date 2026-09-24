import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/user";
import { createLog } from "@/lib/log";

// Editar rol y/o badges permitidos de un usuario (solo admin).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAuth(["admin"]);
    const { id } = await params;
    const { role, allowedBadges } = await request.json();

    await connectDB();
    const user = await User.findById(id);
    if (!user) return Response.json({ error: "No encontrado" }, { status: 404 });

    const updates: string[] = [];
    if (typeof role === "string") {
      if (!["admin", "organizer", "volunteer", "badges"].includes(role)) {
        return Response.json({ error: "Rol inválido" }, { status: 400 });
      }
      user.role = role as typeof user.role;
      updates.push(`rol: ${role}`);
    }
    if (Array.isArray(allowedBadges)) {
      // Admin da todos → no necesita lista
      user.allowedBadges = user.role === "admin" ? [] : allowedBadges.map(String);
      updates.push(`badges: ${user.allowedBadges.length}`);
    } else if (user.role === "admin") {
      user.allowedBadges = [];
    }

    await user.save();

    await createLog({
      userId: actor._id.toString(), userName: actor.name, userRole: actor.role,
      action: "USER_UPDATED",
      target: `${user.name} (${user.email})`,
      targetId: user._id.toString(),
      details: updates.join(" · "),
    });

    return Response.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
