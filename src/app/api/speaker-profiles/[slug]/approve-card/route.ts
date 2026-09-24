import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SpeakerProfile } from "@/models/speaker-profile";
import { uploadBuffer, s3Key } from "@/lib/s3";
import { createLog } from "@/lib/log";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

const APP_URL = SITE_URL;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireAuth(["admin"]);
    await connectDB();

    const { slug } = await params;
    const profile = await SpeakerProfile.findOne({ slug });
    if (!profile) return Response.json({ error: "No encontrado" }, { status: 404 });

    const ogUrl = `${APP_URL}/api/og/speaker/${slug}?preview=1`;
    const res = await fetch(ogUrl);
    if (!res.ok) return Response.json({ error: "Error al generar imagen" }, { status: 500 });

    const buffer = Buffer.from(await res.arrayBuffer());
    const cardImageUrl = await uploadBuffer(s3Key(`speaker-cards/${slug}.png`), buffer, "image/png");

    profile.cardApproved = true;
    profile.cardImageUrl = cardImageUrl;
    await profile.save();

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "SPEAKER_CARD_APPROVED",
      target: profile.name,
      targetId: profile._id.toString(),
      details: cardImageUrl,
    });

    return Response.json({ cardImageUrl });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireAuth(["admin"]);
    await connectDB();

    const { slug } = await params;
    const profile = await SpeakerProfile.findOneAndUpdate(
      { slug },
      { cardApproved: false, cardImageUrl: "" },
      { returnDocument: "after" },
    );
    if (!profile) return Response.json({ error: "No encontrado" }, { status: 404 });

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "SPEAKER_CARD_RESET",
      target: profile.name,
      targetId: profile._id.toString(),
    });

    return Response.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
