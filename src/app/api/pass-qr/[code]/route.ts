import { NextRequest } from "next/server";
import QRCode from "qrcode";

// QR público (PNG) de un código, para mostrarlo inline en correos (sin auth, como /api/passes).
// Codifica el código tal cual — mismo contenido que el pase de registro.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    if (!code) return Response.json({ error: "code requerido" }, { status: 400 });

    const png = await QRCode.toBuffer(code, {
      type: "png",
      width: 360,
      margin: 2,
      color: { dark: "#111827", light: "#FFFFFF" },
    });

    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
