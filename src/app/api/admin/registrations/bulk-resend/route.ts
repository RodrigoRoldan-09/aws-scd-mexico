import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Registration } from "@/models/registration";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { buildRegistrationEmail } from "@/lib/registration-email";

export const maxDuration = 300; // 5 minutos máximo

export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get("x-admin-key");
    const isKeyAuth = adminKey && adminKey === process.env.JWT_SECRET;
    if (!isKeyAuth) {
      await requireAuth(["admin", "organizer"]);
    }

    await connectDB();

    const body = await request.json().catch(() => ({}));
    const testEmail = typeof body.testEmail === "string" ? body.testEmail.trim() : undefined;
    const limit = typeof body.limit === "number" ? body.limit : 0;

    const filter = testEmail ? { email: testEmail } : {};
    const query = Registration.find(filter).sort({ createdAt: 1 });
    if (limit > 0) query.limit(limit);

    const registrations = await query.exec();

    let sent = 0;
    let failed = 0;
    const results: { email: string; name: string; status: string; error?: string }[] = [];

    for (const reg of registrations) {
      const email = reg.email;
      if (!email) continue;

      const name = `${reg.firstName} ${reg.lastName}`.trim();
      try {
        const built = await buildRegistrationEmail(name, reg.qrCode, reg.attendance);
        const html = `${built.html}<!-- ref:${reg.qrCode} -->`;

        const res = await sendEmail({
          from: EMAIL_FROM,
          to: email,
          subject: built.subject,
          html,
          attachments: built.attachments,
        });

        if (res.error) {
          failed++;
          reg.emailStatus = "failed";
          reg.emailError = res.error;
          results.push({ email, name, status: "failed", error: res.error });
        } else {
          sent++;
          reg.emailStatus = "sent";
          reg.emailSentAt = new Date();
          reg.resendId = res.id;
          reg.emailError = null;
          results.push({ email, name, status: "sent" });
        }
        await reg.save();
      } catch (err: unknown) {
        failed++;
        const errMsg = err instanceof Error ? err.message : "Error desconocido";
        reg.emailStatus = "failed";
        reg.emailError = errMsg;
        await reg.save();
        results.push({ email, name, status: "failed", error: errMsg });
      }

      // Delay de 600ms para respetar el rate limit de Resend (~2 req/s)
      await new Promise((r) => setTimeout(r, 600));
    }

    return Response.json({
      success: true,
      total: registrations.length,
      sent,
      failed,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error del servidor";
    return Response.json({ error: message }, { status: 500 });
  }
}
