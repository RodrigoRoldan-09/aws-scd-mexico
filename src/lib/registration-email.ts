import QRCode from "qrcode";
import { render } from "@react-email/components";
import { RegistrationConfirmationEmail } from "@/emails/registration-confirmation";
import { RegistrationConfirmationVirtualEmail } from "@/emails/registration-confirmation-virtual";
import { generateRegistrationPDF } from "@/lib/pdf/registration";
import type { Attendance } from "@/models/registration";

/**
 * Arma el correo de confirmación de un registro.
 *
 * Lo usan el registro nuevo y el reenvío desde el panel.
 *
 * La diferencia entre las dos versiones no es cosmética: a quien se conecta
 * desde su casa no le sirve un QR —no hay puerta donde escanearlo—, ni la
 * dirección, ni cómo llegar en metro. Recibe en cambio el aviso de que el
 * enlace de la transmisión le llega el día del evento.
 */

export type BuiltEmail = {
  subject: string;
  html: string;
  attachments: { filename: string; content: string }[];
  isVirtual: boolean;
};

export async function buildRegistrationEmail(
  name: string,
  qrCode: string,
  attendance: Attendance,
): Promise<BuiltEmail> {
  const isVirtual = attendance === "online";

  if (isVirtual) {
    return {
      subject: "Estás dentro del Track Online — AWS Student Community Day México 2026",
      html: await render(RegistrationConfirmationVirtualEmail({ name })),
      attachments: [],
      isVirtual: true,
    };
  }

  const qrBuffer = await QRCode.toBuffer(qrCode, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#232F3E", light: "#FFFFFF" },
  });
  const pdfBuffer = await generateRegistrationPDF(name, qrBuffer, qrCode);

  return {
    subject: "Registro Confirmado — AWS Student Community Day 2026",
    html: await render(RegistrationConfirmationEmail({ name })),
    attachments: [{ filename: "pase-aws-scd.pdf", content: pdfBuffer.toString("base64") }],
    isVirtual: false,
  };
}
