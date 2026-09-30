import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET!;
export const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || process.env.AWS_S3_PUBLIC_URL!;

// Carpeta de uploads cuando el bucket se comparte con otro país (p. ej.
// S3_PREFIX=mx → todo va bajo "mx/..."). Con bucket propio se deja vacío.
const S3_PREFIX = (process.env.S3_PREFIX || "").replace(/^\/+|\/+$/g, "");

/** Antepone el prefijo del país a una key (no-op si S3_PREFIX está vacío). */
export function s3Key(key: string): string {
  const clean = key.replace(/^\/+/, "");
  return S3_PREFIX ? `${S3_PREFIX}/${clean}` : clean;
}

// Vacío es válido con bucket propio, pero con bucket compartido pisaría los
// archivos del otro país sin ningún error, así que se avisa.
if (!S3_PREFIX) {
  console.warn(
    "[s3] S3_PREFIX está vacío: las subidas van a la raíz del bucket. " +
      "Si este bucket se comparte con otro país, setea S3_PREFIX (ej. mx).",
  );
}

const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

export const s3 = new S3Client({
  region: REGION,
  ...(accessKeyId && secretAccessKey
    ? {
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      }
    : {}),
});

export async function uploadBuffer(key: string, body: Buffer, contentType: string): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType });
  await s3.send(cmd);
  return `${S3_PUBLIC_URL}/${key}`;
}

export async function presignUpload(key: string, contentType: string): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, cmd, { expiresIn: 300 });
}
