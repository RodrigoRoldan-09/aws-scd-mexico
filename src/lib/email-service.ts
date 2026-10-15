import { sendEmailSES, sendEmailBatchSES, type SendEmailOptions, type SendEmailResult } from "./ses";
import { sendEmail as sendEmailResend, sendEmailBatch as sendEmailBatchResend, EMAIL_FROM, MARKETING_EMAIL_FROM } from "./resend";

export { EMAIL_FROM, MARKETING_EMAIL_FROM };
export type { SendEmailOptions, SendEmailResult };

/**
 * Proveedor de correo configurado:
 * - "ses": Envía mediante AWS SES. Si falla, hace fallback a Resend a menos que EMAIL_FALLBACK=false.
 * - "resend": Envía mediante Resend. Si falla, hace fallback a SES.
 * - "auto": Intenta AWS SES primero (ideal para campañas y alto volumen sin costo adicional); si falla, usa Resend.
 */
export function getEmailProvider(): "ses" | "resend" | "auto" {
  const p = (process.env.EMAIL_PROVIDER || "auto").toLowerCase();
  if (p === "ses" || p === "resend") return p;
  return "auto";
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const provider = getEmailProvider();

  if (provider === "ses" || provider === "auto") {
    const sesRes = await sendEmailSES(options);
    if (!sesRes.error) {
      return sesRes;
    }

    // Fallback a Resend si SES tuvo algún inconveniente (p. ej. correo en sandbox o error temporal)
    const fallbackEnabled = process.env.EMAIL_FALLBACK !== "false";
    if (fallbackEnabled) {
      console.warn(`[Email Service] SES falló para ${options.to} (${sesRes.error}). Intentando fallback con Resend...`);
      return sendEmailResend(options);
    }
    return sesRes;
  }

  // Si provider === "resend"
  const resendRes = await sendEmailResend(options);
  if (!resendRes.error) {
    return resendRes;
  }

  // Fallback a SES si Resend falla (p. ej. límite diario de 100 correos alcanzado)
  const fallbackEnabled = process.env.EMAIL_FALLBACK !== "false";
  if (fallbackEnabled) {
    console.warn(`[Email Service] Resend falló para ${options.to} (${resendRes.error}). Intentando fallback con AWS SES...`);
    return sendEmailSES(options);
  }
  return resendRes;
}

export async function sendEmailBatch(
  emails: SendEmailOptions[]
): Promise<{ sentCount: number; failedCount: number }> {
  const provider = getEmailProvider();

  if (provider === "ses" || provider === "auto") {
    const sesRes = await sendEmailBatchSES(emails);
    // Si algunos fallaron y hay fallback habilitado, intentamos enviar los fallidos con Resend
    if (sesRes.failedCount > 0 && process.env.EMAIL_FALLBACK !== "false") {
      const failedEmails = emails.filter((e) =>
        sesRes.errors.some((err) => err.to === e.to)
      );
      if (failedEmails.length > 0) {
        console.warn(`[Email Service] Reintentando ${failedEmails.length} correos fallidos de SES vía Resend...`);
        const fallbackRes = await sendEmailBatchResend(failedEmails);
        return {
          sentCount: sesRes.sentCount + fallbackRes.sentCount,
          failedCount: fallbackRes.failedCount,
        };
      }
    }
    return { sentCount: sesRes.sentCount, failedCount: sesRes.failedCount };
  }

  // Provider resend
  const resendRes = await sendEmailBatchResend(emails);
  return resendRes;
}
