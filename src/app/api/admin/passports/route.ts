import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Passport } from "@/models/passport";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const manual = searchParams.get("manual");

    await connectDB();
    const filter: Record<string, unknown> = {};
    if (role && role !== "all") filter.role = role;
    if (manual === "true") filter.isManual = true;

    const passports = await Passport.find(filter)
      .select("-viewPin")
      .sort({ lastName: 1, firstName: 1 })
      .lean();

    return Response.json({ passports });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
