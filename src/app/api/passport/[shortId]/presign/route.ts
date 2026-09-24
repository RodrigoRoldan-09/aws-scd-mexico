import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Passport } from "@/models/passport";
import { presignUpload, S3_PUBLIC_URL, s3Key } from "@/lib/s3";
import { randomUUID } from "crypto";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  try {
    const { shortId } = await params;
    const { pin, contentType } = await req.json();

    if (!ALLOWED.includes(contentType)) {
      return Response.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }

    await connectDB();
    const passport = await Passport.findOne({ shortId }).select("viewPin");
    if (!passport) return Response.json({ error: "No encontrado" }, { status: 404 });
    if (pin !== passport.viewPin) return Response.json({ error: "PIN incorrecto" }, { status: 401 });

    const key = s3Key(`passports/${randomUUID()}.${EXT[contentType]}`);
    const uploadUrl = await presignUpload(key, contentType);
    const publicUrl = `${S3_PUBLIC_URL}/${key}`;

    return Response.json({ uploadUrl, publicUrl });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
