import QRCode from "qrcode";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Registration } from "@/models/registration";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ registrationId: string }> },
) {
  try {
    await requireAuth(["admin", "organizer"]);
    const { registrationId } = await params;

    await connectDB();
    const registration = await Registration.findById(registrationId);

    if (!registration) {
      return Response.json({ error: "No encontrado" }, { status: 404 });
    }

    const qrBuffer = await QRCode.toBuffer(registration.qrCode, {
      type: "png",
      width: 300,
      margin: 2,
      color: { dark: "#C143BC", light: "#0E0E1A" },
    });

    return new Response(new Uint8Array(qrBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
