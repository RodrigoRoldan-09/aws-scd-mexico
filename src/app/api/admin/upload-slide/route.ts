import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadBuffer, s3Key } from "@/lib/s3";
import { createLog } from "@/lib/log";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin"]);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Solo se permiten archivos PDF o PPTX" }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo supera el límite de 50 MB" }, { status: 400 });
    }

    const ext = file.type.includes("pdf") ? "pdf" : "pptx";
    const key = s3Key(`templates/${randomUUID()}.${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    const publicUrl = await uploadBuffer(key, buffer, file.type);

    await createLog({
      userId: String(user._id), userName: user.name, userRole: user.role,
      action: "SLIDE_TEMPLATE_UPLOADED",
      target: file.name,
      details: publicUrl,
    });

    return NextResponse.json({ publicUrl });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
  }
}
