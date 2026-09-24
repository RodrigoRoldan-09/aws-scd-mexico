import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Registration } from "@/models/registration";
import { createLog } from "@/lib/log";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { qrCode } = await request.json();

    if (!qrCode) {
      return Response.json({ error: "Código QR requerido" }, { status: 400 });
    }

    await connectDB();

    const registration = await Registration.findOne({ qrCode });
    if (!registration) {
      return Response.json({ error: "Registro no encontrado", status: "not_found" }, { status: 404 });
    }

    const name = `${registration.firstName} ${registration.lastName}`.trim()
      || registration.email
      || "Asistente";
    const email = registration.email;

    // La modalidad viaja en la respuesta porque quien está en la puerta no
    // tiene cómo saberla. Un registro del track online tiene código igual —es
    // la llave del registro, no una credencial— así que sin este dato el
    // escáner lo marcaba presente en silencio.
    const online = registration.attendance === "online";

    // Escarapela: lista solo si confirmó asistencia (confirmation.confirmed)
    const confirmed = !!registration.confirmation?.confirmed;
    const badgeName = confirmed
      ? [registration.confirmation?.badgeFirstName, registration.confirmation?.badgeLastName].filter(Boolean).join(" ").trim()
      : "";

    if (registration.checkedIn) {
      return Response.json({
        error: "Ya hizo check-in",
        status: "already_checked_in",
        name,
        email,
        online,
        confirmed,
        badgeName,
        checkedInAt: registration.checkedInAt,
      }, { status: 409 });
    }

    registration.checkedIn = true;
    registration.checkedInAt = new Date();
    registration.checkedInBy = user._id.toString();
    await registration.save();

    const totalCheckedIn = await Registration.countDocuments({ checkedIn: true });

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "CHECK_IN",
      target: name,
      targetId: registration._id.toString(),
      details: [
        confirmed ? "Escarapela lista" : "Sin confirmar — imprimir escarapela",
        online ? "REGISTRO ONLINE" : null,
      ].filter(Boolean).join(" · "),
    });

    return Response.json({
      status: "success",
      name,
      email,
      online,
      confirmed,
      badgeName,
      checkedInAt: registration.checkedInAt,
      totalCheckedIn,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
