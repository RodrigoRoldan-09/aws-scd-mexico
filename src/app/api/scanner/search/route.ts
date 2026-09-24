import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Passport } from "@/models/passport";
import { Registration } from "@/models/registration";

export const dynamic = "force-dynamic";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Búsqueda de respaldo para los escáneres (salas / almuerzos / badges): busca
// pasaportes por nombre, apellido, empresa o cualquier dato del registro
// (p. ej. número de documento). Devuelve el shortId para registrar manualmente.
export async function GET(req: NextRequest) {
  try {
    await requireAuth(["admin", "organizer", "volunteer"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  const nq = norm(q);

  await connectDB();
  const [passports, regs] = await Promise.all([
    Passport.find({})
      .select("shortId firstName lastName role company linkedRegistrationId")
      .lean<{ shortId: string; firstName?: string; lastName?: string; role?: string; company?: string; linkedRegistrationId?: string }[]>(),
    Registration.find({}).select("firstName lastName email documentNumber").lean(),
  ]);

  // Texto buscable por registro (incluye el documento, que vive en las respuestas)
  const regText = new Map<string, string>();
  for (const r of regs) {
    // Los cuatro campos por los que de verdad se busca a alguien.
    regText.set(
      String(r._id),
      norm([r.firstName, r.lastName, r.email, r.documentNumber].filter(Boolean).join(" ")),
    );
  }

  const results: Array<{ shortId: string; firstName: string; lastName: string; role: string }> = [];
  for (const p of passports) {
    const extra = p.linkedRegistrationId ? (regText.get(String(p.linkedRegistrationId)) ?? "") : "";
    const hay = norm([p.firstName, p.lastName, p.company, p.shortId].filter(Boolean).join(" ")) + " " + extra;
    if (!hay.includes(nq)) continue;
    results.push({
      shortId: p.shortId,
      firstName: p.firstName ?? "",
      lastName: p.lastName ?? "",
      role: p.role ?? "attendee",
    });
    if (results.length >= 25) break;
  }

  return NextResponse.json({ results });
}
