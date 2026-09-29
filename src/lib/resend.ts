import https from "node:https";
import dns from "node:dns";
import { SITE_HOST } from "@/lib/constants";

export const EMAIL_FROM = process.env.EMAIL_FROM || `AWS Student Community Day Mexico <noreply@${SITE_HOST}>`;
export const MARKETING_EMAIL_FROM = process.env.MARKETING_EMAIL_FROM || EMAIL_FROM;

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

interface EmailAttachment {
  filename: string;
  content: string; // base64
}

interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

interface SendEmailResult {
  id: string | null;
  error: string | null;
}

function resolveHost(hostname: string): Promise<string> {
  return new Promise((resolve, reject) => {
    dns.resolve4(hostname, (err, addresses) => {
      if (err) reject(err);
      else resolve(addresses[0]);
    });
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// OJO: el endpoint /emails/batch de Resend NO soporta adjuntos (los ignora en
// silencio). Los correos con attachments se envían uno a uno por /emails.
export async function sendEmailBatch(
  emails: SendEmailOptions[]
): Promise<{ sentCount: number; failedCount: number }> {
  let sentCount = 0;
  let failedCount = 0;

  let buffer: SendEmailOptions[] = [];
  const flush = async () => {
    if (buffer.length === 0) return;
    const r = await sendBatchRaw(buffer);
    sentCount += r.sentCount;
    failedCount += r.failedCount;
    buffer = [];
  };

  for (const e of emails) {
    if (e.attachments && e.attachments.length > 0) {
      await flush();
      const res = await sendEmail(e);
      if (res.error) failedCount++; else sentCount++;
      await sleep(550); // rate limit de Resend (~2 req/s)
    } else {
      buffer.push(e);
    }
  }
  await flush();

  return { sentCount, failedCount };
}

async function sendBatchRaw(
  emails: SendEmailOptions[]
): Promise<{ sentCount: number; failedCount: number }> {
  let sentCount = 0;
  let failedCount = 0;

  let ip: string;
  try {
    ip = await resolveHost("api.resend.com");
  } catch {
    return { sentCount: 0, failedCount: emails.length };
  }

  const chunkSize = 100;
  for (let i = 0; i < emails.length; i += chunkSize) {
    const chunk = emails.slice(i, i + chunkSize);
    const payload = chunk.map(({ from, to, subject, html, attachments }) => {
      const obj: Record<string, unknown> = { from, to, subject, html };
      if (attachments && attachments.length > 0) obj.attachments = attachments;
      return obj;
    });
    const body = JSON.stringify(payload);

    const result = await new Promise<{ sentCount: number; failedCount: number }>((resolve) => {
      const req = https.request(
        {
          hostname: ip,
          path: "/emails/batch",
          method: "POST",
          headers: {
            "Host": "api.resend.com",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          },
          servername: "api.resend.com",
        },
        (res) => {
          let data = "";
          res.on("data", (d) => (data += d));
          res.on("end", () => {
            try {
              if (res.statusCode && res.statusCode >= 400) {
                resolve({ sentCount: 0, failedCount: chunk.length });
              } else {
                const json = JSON.parse(data) as { data?: unknown[] };
                const count = Array.isArray(json.data) ? json.data.length : chunk.length;
                resolve({ sentCount: count, failedCount: chunk.length - count });
              }
            } catch {
              resolve({ sentCount: 0, failedCount: chunk.length });
            }
          });
        },
      );
      req.on("error", () => resolve({ sentCount: 0, failedCount: chunk.length }));
      req.write(body);
      req.end();
    });

    sentCount += result.sentCount;
    failedCount += result.failedCount;
  }

  return { sentCount, failedCount };
}

export async function sendEmail({ from, to, subject, html, attachments }: SendEmailOptions): Promise<SendEmailResult> {
  let ip: string;
  try {
    ip = await resolveHost("api.resend.com");
  } catch {
    return { id: null, error: "DNS resolution failed for api.resend.com" };
  }

  return new Promise((resolve) => {
    const payload: Record<string, unknown> = { from, to, subject, html };
    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }
    const body = JSON.stringify(payload);

    const req = https.request(
      {
        hostname: ip,
        path: "/emails",
        method: "POST",
        headers: {
          "Host": "api.resend.com",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        servername: "api.resend.com",
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 400) {
              resolve({ id: null, error: json.message || `Resend error ${res.statusCode}` });
            } else {
              resolve({ id: json.id, error: null });
            }
          } catch {
            resolve({ id: null, error: `Invalid response: ${data}` });
          }
        });
      },
    );

    req.on("error", (err) => {
      resolve({ id: null, error: err.message });
    });

    req.write(body);
    req.end();
  });
}
