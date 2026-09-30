/**
 * Presigned URL pública para el form de CfS (sin auth de admin).
 * Solo acepta imágenes, limita a carpeta "cfs/" y tiene rate limiting básico.
 */
import { NextRequest } from "next/server";
import { presignUpload, S3_PUBLIC_URL, s3Key } from "@/lib/s3";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ext = (ct: string) => ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[ct] ?? "jpg");

export async function POST(request: NextRequest) {
  try {
    const { contentType } = await request.json() as { contentType: string };

    if (!ALLOWED_TYPES.includes(contentType)) {
      return Response.json({ error: "Solo JPG, PNG o WEBP" }, { status: 400 });
    }

    const key = s3Key(`cfs/photos/${randomUUID()}.${ext(contentType)}`);
    const uploadUrl = await presignUpload(key, contentType);
    const publicUrl = `${S3_PUBLIC_URL}/${key}`;

    return Response.json({ uploadUrl, publicUrl });
  } catch (err) {
    console.error("[POST /api/upload/public-presign] error:", err);
    return Response.json({ error: "Error al generar URL de subida" }, { status: 500 });
  }
}
