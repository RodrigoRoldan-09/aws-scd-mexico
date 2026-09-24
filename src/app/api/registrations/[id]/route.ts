import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Registration } from "@/models/registration";
import { Passport } from "@/models/passport";
import { createLog } from "@/lib/log";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(["admin"]);
    const { id } = await params;

    await connectDB();

    const registration = await Registration.findById(id);
    if (!registration) {
      return Response.json({ error: "No encontrado" }, { status: 404 });
    }

    const name = `${registration.firstName} ${registration.lastName}`.trim();

    // En cascada: borra el pasaporte (con sus sellos, asistencia, comidas y stats).
    // Está ligado por linkedRegistrationId o por shortId === qrCode.
    const passportResult = await Passport.deleteMany({
      $or: [{ linkedRegistrationId: id }, { shortId: registration.qrCode }],
    });

    await Registration.findByIdAndDelete(id);

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "REGISTRATION_DELETED",
      target: name,
      targetId: id,
      details: `${passportResult.deletedCount} pasaporte(s) eliminado(s)`,
    });

    return Response.json({ ok: true, passportsDeleted: passportResult.deletedCount });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
