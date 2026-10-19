import { SESClient, SendRawEmailCommand, SendEmailCommand } from "@aws-sdk/client-ses";

/**
 * Cliente de AWS SES (Simple Email Service).
 *
 * Utiliza las credenciales de AWS del entorno (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
 * o el proveedor por defecto de AWS CLI/IAM role) y la región configurada.
 */
const region = process.env.AWS_REGION || "us-east-1";

// Acepta las credenciales con prefijo APP_ (las que escribe amplify.yml) o sin él
// (las de .env.example), igual que src/lib/s3.ts. Si no hay ninguna, cae al
// proveedor de credenciales por defecto de AWS (IAM role, CLI, etc.).
const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

export const sesClient = new SESClient({
  region,
  credentials:
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined,
});

export interface EmailAttachment {
  filename: string;
  content: string; // base64
  contentType?: string;
}

export interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  id: string | null;
  error: string | null;
}

/**
 * Codifica encabezados de correo que puedan contener caracteres especiales (RFC 2047).
 */
function encodeHeaderWord(str: string): string {
  // Si solo tiene ASCII imprimible no hace falta B-encoding
  if (/^[\x20-\x7E]*$/.test(str)) return str;
  return `=?UTF-8?B?${Buffer.from(str, "utf8").toString("base64")}?=`;
}

/**
 * Limpia y formatea el campo From (p. ej. "Nombre <correo@dominio.com>")
 */
function formatFromHeader(from: string): string {
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    const name = match[1].trim();
    const email = match[2].trim();
    return `${encodeHeaderWord(name)} <${email}>`;
  }
  return from;
}

/**
 * Construye un mensaje MIME estándar en memoria para enviar vía SendRawEmailCommand.
 * Soporta HTML enriquecido y archivos adjuntos (PDFs de entradas, imágenes, etc.).
 */
export function buildRawMimeMessage({
  from,
  to,
  subject,
  html,
  attachments = [],
}: SendEmailOptions): Buffer {
  const boundaryMixed = `----=_Part_Mixed_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const boundaryAlt = `----=_Part_Alt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const lines: string[] = [];

  lines.push(`From: ${formatFromHeader(from)}`);
  lines.push(`To: ${to}`);
  lines.push(`Subject: ${encodeHeaderWord(subject)}`);
  lines.push("MIME-Version: 1.0");

  if (attachments.length === 0) {
    // Solo HTML
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(Buffer.from(html, "utf8").toString("base64"));
  } else {
    // Multipart/mixed para adjuntos
    lines.push(`Content-Type: multipart/mixed; boundary="${boundaryMixed}"`);
    lines.push("");

    // Parte del cuerpo
    lines.push(`--${boundaryMixed}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(Buffer.from(html, "utf8").toString("base64"));

    // Adjuntos
    for (const att of attachments) {
      const mimeType =
        att.contentType ||
        (att.filename.endsWith(".pdf")
          ? "application/pdf"
          : att.filename.endsWith(".png")
            ? "image/png"
            : att.filename.endsWith(".jpg") || att.filename.endsWith(".jpeg")
              ? "image/jpeg"
              : "application/octet-stream");

      lines.push(`--${boundaryMixed}`);
      lines.push(`Content-Type: ${mimeType}; name="${encodeHeaderWord(att.filename)}"`);
      lines.push(`Content-Disposition: attachment; filename="${encodeHeaderWord(att.filename)}"`);
      lines.push("Content-Transfer-Encoding: base64");
      lines.push("");
      lines.push(att.content);
    }

    lines.push(`--${boundaryMixed}--`);
  }

  return Buffer.from(lines.join("\r\n"), "utf8");
}

/**
 * Envía un correo individual a través de AWS SES.
 */
export async function sendEmailSES(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const rawData = buildRawMimeMessage(options);

    const command = new SendRawEmailCommand({
      RawMessage: {
        Data: rawData,
      },
    });

    const response = await sesClient.send(command);
    return { id: response.MessageId || null, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido en AWS SES";
    console.error(`[AWS SES] Error enviando a ${options.to}:`, msg);
    return { id: null, error: msg };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Envía un lote de correos a través de AWS SES con control de tasa de envío (rate limit).
 */
export async function sendEmailBatchSES(
  emails: SendEmailOptions[],
  concurrencyLimit = 5,
  delayMs = 200,
): Promise<{ sentCount: number; failedCount: number; errors: { to: string; error: string }[] }> {
  let sentCount = 0;
  let failedCount = 0;
  const errors: { to: string; error: string }[] = [];

  for (let i = 0; i < emails.length; i += concurrencyLimit) {
    const chunk = emails.slice(i, i + concurrencyLimit);
    const results = await Promise.all(chunk.map((e) => sendEmailSES(e)));

    results.forEach((res, idx) => {
      if (res.error) {
        failedCount++;
        errors.push({ to: chunk[idx].to, error: res.error });
      } else {
        sentCount++;
      }
    });

    if (i + concurrencyLimit < emails.length) {
      await sleep(delayMs);
    }
  }

  return { sentCount, failedCount, errors };
}
