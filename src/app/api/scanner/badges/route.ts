import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SponsorPin } from "@/models/sponsor-pin";

export const dynamic = "force-dynamic";

// Badges (SponsorPin activos) que el usuario actual puede dar. Admin = todos.
export async function GET() {
  let user;
  try {
    user = await requireAuth(["admin", "organizer", "volunteer", "badges"]);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 401 });
  }

  await connectDB();
  const all = await SponsorPin.find({ isActive: true })
    .select("_id sponsorName logoUrl")
    .sort({ sponsorName: 1 })
    .lean<{ _id: unknown; sponsorName: string; logoUrl?: string }[]>();

  const list = all.map((s) => ({ id: String(s._id), sponsorName: s.sponsorName, logoUrl: s.logoUrl ?? "" }));
  if (user.role === "admin") return NextResponse.json({ badges: list });

  const allowed = new Set((user.allowedBadges ?? []).map(String));
  return NextResponse.json({ badges: list.filter((b) => allowed.has(b.id)) });
}
