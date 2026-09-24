import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SpeakerProfile } from "@/models/speaker-profile";

export const dynamic = "force-dynamic";

function toSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("slug") ?? "";
  const slug = toSlug(raw);

  if (!slug || slug.length < 2) {
    return NextResponse.json({ available: false, slug, reason: "too_short" });
  }

  await connectDB();
  const exists = await SpeakerProfile.exists({ slug });

  return NextResponse.json({ available: !exists, slug });
}
