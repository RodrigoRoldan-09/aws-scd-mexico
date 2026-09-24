import { NextRequest } from "next/server";
import { render } from "@react-email/components";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/user";
import { PasswordToken } from "@/models/password-token";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { InvitationEmail } from "@/emails/invitation";
import { createLog } from "@/lib/log";
import { SITE_URL } from "@/lib/constants";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAuth(["admin"]);
    const { id } = await params;

    await connectDB();

    const user = await User.findById(id);
    if (!user) return Response.json({ error: "Usuario no encontrado" }, { status: 404 });

    await PasswordToken.deleteMany({ userId: id, usedAt: null });

    // Create a fresh 24-hour token
    const token = crypto.randomUUID();
    await PasswordToken.create({
      userId: id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const appUrl = SITE_URL;
    const createPasswordUrl = `${appUrl}/es/admin/create-password?token=${token}`;

    const html = await render(InvitationEmail({ name: user.name, role: user.role, createPasswordUrl }));
    await sendEmail({
      from: EMAIL_FROM,
      to: user.email,
      subject: "Invitación — AWS Student Community Day Admin",
      html,
    });

    await createLog({
      userId: actor._id.toString(),
      userName: actor.name,
      userRole: actor.role,
      action: "USER_INVITE_RESENT",
      target: `${user.name} (${user.email})`,
      targetId: id,
    });

    return Response.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error al enviar invitación" }, { status: 500 });
  }
}
