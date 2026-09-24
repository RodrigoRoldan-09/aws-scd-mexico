import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { presignUpload, S3_PUBLIC_URL, s3Key } from "@/lib/s3";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const { key: settingKey } = await request.json() as { key: string };
    if (!["pdf_local", "pdf_international"].includes(settingKey)) {
      return Response.json({ error: "key inválida" }, { status: 400 });
    }
    const filename = s3Key(`pdfs/${settingKey}-${randomUUID()}.pdf`);
    const uploadUrl = await presignUpload(filename, "application/pdf");
    const publicUrl = `${S3_PUBLIC_URL}/${filename}`;
    return Response.json({ uploadUrl, publicUrl });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    return Response.json({ error: msg }, { status: 403 });
  }
}
