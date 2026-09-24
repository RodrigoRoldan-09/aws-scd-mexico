import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { VolunteerSubmission } from "@/models/volunteer-submission";
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

    const submission = await VolunteerSubmission.findById(id);
    if (!submission) {
      return Response.json({ error: "Voluntario no encontrado" }, { status: 404 });
    }

    const name = `${submission.firstName} ${submission.lastName}`.trim() || submission.email || id;

    // Borra en cascada su pasaporte de voluntario (si el admin lo generó)
    const passportResult = await Passport.deleteMany({ linkedRegistrationId: id });
    await VolunteerSubmission.findByIdAndDelete(id);

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "VOLUNTEER_DELETED",
      target: name,
      targetId: id,
      details: passportResult.deletedCount
        ? `${passportResult.deletedCount} pasaporte(s) eliminado(s)`
        : null,
    });

    return Response.json({ ok: true, passportsDeleted: passportResult.deletedCount });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
