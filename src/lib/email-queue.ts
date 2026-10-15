import { connectDB } from "@/lib/db";
import { Registration } from "@/models/registration";
import { sendEmail, EMAIL_FROM } from "@/lib/email-service";
import { buildRegistrationEmail } from "@/lib/registration-email";

export interface RetryResult {
  total: number;
  sent: number;
  failed: number;
  results: { email: string; name: string; status: "sent" | "failed"; error?: string }[];
}

let isRetrying = false;

/**
 * Reintenta el envío de correos de confirmación de registro a todos aquellos
 * asistentes cuyo estado quedó en "failed" o "pending" (por ejemplo si se agotó
 * la cuota diaria del proveedor de correo o falló temporalmente la conexión).
 */
export async function retryPendingRegistrations(limit = 100): Promise<RetryResult> {
  if (isRetrying) {
    console.log("[Email Queue] Ya hay un proceso de reintento en ejecución. Saltando...");
    return { total: 0, sent: 0, failed: 0, results: [] };
  }

  isRetrying = true;
  try {
    await connectDB();

    const pending = await Registration.find({
      emailStatus: { $in: ["failed", "pending"] },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();

    if (pending.length === 0) {
      return { total: 0, sent: 0, failed: 0, results: [] };
    }

    console.log(`[Email Queue] Iniciando reenvío para ${pending.length} registros pendientes/fallidos...`);

    let sent = 0;
    let failed = 0;
    const results: RetryResult["results"] = [];

    for (const reg of pending) {
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
          console.warn(`[Email Queue] Falló reenvío a ${email}: ${res.error}`);
        } else {
          sent++;
          reg.emailStatus = "sent";
          reg.emailSentAt = new Date();
          reg.resendId = res.id;
          reg.emailError = null;
          results.push({ email, name, status: "sent" });
          console.log(`[Email Queue] ✓ Enviado exitosamente a ${email}`);
        }
        await reg.save();
      } catch (err: unknown) {
        failed++;
        const errMsg = err instanceof Error ? err.message : "Error inesperado al construir/enviar correo";
        reg.emailStatus = "failed";
        reg.emailError = errMsg;
        await reg.save();
        results.push({ email, name, status: "failed", error: errMsg });
        console.error(`[Email Queue] Excepción reenviando a ${email}:`, errMsg);
      }

      // Pequeña pausa entre correos para respetar rate limits
      await new Promise((r) => setTimeout(r, 250));
    }

    console.log(`[Email Queue] Finalizado: ${sent} enviados, ${failed} fallidos de ${pending.length} procesados.`);

    return {
      total: pending.length,
      sent,
      failed,
      results,
    };
  } finally {
    isRetrying = false;
  }
}
