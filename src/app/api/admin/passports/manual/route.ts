import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Passport } from "@/models/passport";

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const { firstName, lastName, company, jobTitle, role } = await req.json();

    if (!firstName?.trim()) {
      return Response.json({ error: "Nombre requerido" }, { status: 400 });
    }
    const validRoles = ["attendee", "speaker", "volunteer", "organizer"];
    if (!validRoles.includes(role)) {
      return Response.json({ error: "Rol inválido" }, { status: 400 });
    }

    await connectDB();

    const viewPin = String(Math.floor(1000 + Math.random() * 9000));
    const doc = await Passport.create({
      shortId: nanoid(8),
      role,
      firstName: firstName.trim(),
      lastName: lastName?.trim() || "",
      company: company?.trim() || undefined,
      jobTitle: jobTitle?.trim() || undefined,
      isManual: true,
      viewPin,
    });

    return Response.json({ passport: doc }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
