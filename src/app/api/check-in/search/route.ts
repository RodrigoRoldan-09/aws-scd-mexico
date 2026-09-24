import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Registration } from "@/models/registration";

export const dynamic = "force-dynamic";

// Quita tildes y baja a minúsculas para una búsqueda tolerante
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Búsqueda de respaldo para el check-in manual: busca por nombre, apellido,
// email o cualquier valor de respuesta (p. ej. número de documento).
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
  const regs = await Registration.find({})
    .select("firstName lastName email documentNumber qrCode checkedIn checkedInAt confirmation")
    .lean();

  const results: Array<Record<string, unknown>> = [];
  for (const reg of regs) {
    // Los cuatro campos por los que de verdad se busca a alguien en la puerta.
    const haystack = norm(
      [reg.firstName, reg.lastName, reg.email, reg.documentNumber, reg.qrCode]
        .filter(Boolean)
        .join(" "),
    );
    if (!haystack.includes(nq)) continue;

    const confirmed = !!reg.confirmation?.confirmed;
    results.push({
      id: String(reg._id),
      qrCode: reg.qrCode,
      name: `${reg.firstName} ${reg.lastName}`.trim() || reg.email || "Asistente",
      email: reg.email,
      checkedIn: !!reg.checkedIn,
      checkedInAt: reg.checkedInAt ?? null,
      confirmed,
      badgeName: confirmed
        ? [reg.confirmation?.badgeFirstName, reg.confirmation?.badgeLastName].filter(Boolean).join(" ").trim()
        : "",
    });
    if (results.length >= 25) break;
  }

  // Primero los que aún no han hecho check-in (los que falta atender)
  results.sort((a, b) => Number(a.checkedIn) - Number(b.checkedIn));

  return NextResponse.json({ results });
}
