import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/registration";
import { generateRegistrationPDF } from "@/lib/pdf/registration";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> },
) {
  try {
    const { qrCode } = await params;
    await connectDB();

    const registration = await Registration.findOne({ qrCode });
    if (!registration) {
      return Response.json({ error: "No encontrado" }, { status: 404 });
    }

    const name = `${registration.firstName} ${registration.lastName}`.trim();

    const qrBuffer = await QRCode.toBuffer(registration.qrCode, {
      type: "png",
      width: 300,
      margin: 2,
      color: { dark: "#232F3E", light: "#FFFFFF" },
    });

    const pdf = await generateRegistrationPDF(name, qrBuffer, registration.qrCode);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="pase-aws-scd.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
