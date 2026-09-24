import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/registration";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: { type: string; data: { email_id: string } };
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(payload, headers) as typeof event;
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { type, data } = event;
  const resendId = data?.email_id;
  if (!resendId) return Response.json({ ok: true });

  await connectDB();

  let emailStatus: "sent" | "failed" | null = null;
  let emailError: string | null = null;

  if (type === "email.delivered") {
    emailStatus = "sent";
  } else if (type === "email.bounced" || type === "email.complained") {
    emailStatus = "failed";
    emailError = type === "email.bounced" ? "Bounced" : "Complained";
  }

  if (!emailStatus) return Response.json({ ok: true });

  await Registration.updateMany(
    { resendId },
    { emailStatus, emailError },
  );

  return Response.json({ ok: true });
}
