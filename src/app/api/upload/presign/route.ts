import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { presignUpload, S3_PUBLIC_URL, s3Key } from "@/lib/s3";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const MAX_MB = 50;

/**
 * Carpetas permitidas. `folder` llega en el cuerpo del request y termina dentro
 * de la key de S3, así que se compara contra una lista en vez de intentar
 * sanearlo: con una lista cerrada no hay que razonar sobre `..`, ni sobre
 * barras repetidas, ni sobre caracteres raros que se vean como una barra. Es
 * también lo que garantiza que nada se salga del prefijo del país.
 *
 * Si hace falta una carpeta nueva, se agrega acá.
 */
const ALLOWED_FOLDERS = [
  "speakers",
  "speakers/photos",
  "speakers/logos",
  "agenda",
  "sponsors",
];

function ext(contentType: string): string {
  return ({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  })[contentType] ?? "bin";
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin", "organizer"]);

    const body = await request.json();
    const { contentType, folder = "speakers" } = body as { contentType: string; folder?: string };

    if (!ALLOWED_TYPES.includes(contentType)) {
      return Response.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return Response.json({ error: "Carpeta no permitida" }, { status: 400 });
    }

    const key = s3Key(`${folder}/${randomUUID()}.${ext(contentType)}`);
    const uploadUrl = await presignUpload(key, contentType);
    const publicUrl = `${S3_PUBLIC_URL}/${key}`;

    return Response.json({ uploadUrl, publicUrl });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export { MAX_MB };
