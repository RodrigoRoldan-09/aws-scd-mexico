import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Registration } from "@/models/registration";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(["admin", "organizer", "volunteer"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const qr = req.nextUrl.searchParams.get("qr")?.trim();
  if (!qr) return NextResponse.json({ error: "QR requerido" }, { status: 400 });

  await connectDB();
  const registration = await Registration.findOne({ qrCode: qr })
    .select("firstName lastName")
    .lean();

  if (!registration) {
    return NextResponse.json({ found: false, error: "No encontrado" }, { status: 404 });
  }

  const firstName = registration.firstName;
  const lastName = registration.lastName;
  const registrationId = String(registration._id);

  return NextResponse.json({ found: true, firstName, lastName, registrationId });
}
