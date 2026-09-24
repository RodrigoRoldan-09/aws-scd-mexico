import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Passport } from "@/models/passport";
import { Registration } from "@/models/registration";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export async function GET(req: NextRequest) {
  try {
    await requireAuth(["admin", "organizer", "volunteer"]);
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "all";

    await connectDB();
    const filter = role !== "all" ? { role } : {};

    const [passports, regs] = await Promise.all([
      Passport.find(filter)
        .select("shortId role firstName lastName company jobTitle viewPin confirmed badgePrinted badgeFirstName badgeLastName linkedRegistrationId")
        .lean() as Promise<Array<Record<string, unknown>>>,
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
    for (const p of passports) {
      p.q = p.linkedRegistrationId ? (regText.get(String(p.linkedRegistrationId)) ?? "") : "";
      delete p.linkedRegistrationId;
    }

    // The badge prints the chosen name (or the first token of each registered name).
    // The list MUST be ordered by THAT printed name, so handing out badges in
    // alphabetical order matches what's actually on each badge.
    const firstToken = (s: unknown) => String(s ?? "").trim().split(/\s+/)[0] || "";
    const badgeFirst = (p: Record<string, unknown>) => String(p.badgeFirstName || firstToken(p.firstName)).toUpperCase();
    const badgeLast = (p: Record<string, unknown>) => String(p.badgeLastName || firstToken(p.lastName)).toUpperCase();

    passports.sort((a, b) => {
      // Confirmed first (printing priority)
      const ca = a.confirmed ? 1 : 0;
      const cb = b.confirmed ? 1 : 0;
      if (ca !== cb) return cb - ca;
      // Then alphabetical by the printed badge name (accent-insensitive)
      const f = badgeFirst(a).localeCompare(badgeFirst(b), "es", { sensitivity: "base" });
      if (f !== 0) return f;
      return badgeLast(a).localeCompare(badgeLast(b), "es", { sensitivity: "base" });
    });

    return Response.json({ people: passports });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
