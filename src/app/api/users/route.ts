import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { render } from "@react-email/components";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/user";
import { PasswordToken } from "@/models/password-token";
import { sendEmail, EMAIL_FROM } from "@/lib/resend";
import { InvitationEmail } from "@/emails/invitation";
import { createLog } from "@/lib/log";
import { SITE_URL } from "@/lib/constants";

export async function GET() {
  try {
    await requireAuth(["admin"]);
    await connectDB();

    const rawUsers = await User.find({}).sort({ createdAt: -1 }).lean();
    const users = rawUsers.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      allowedBadges: u.allowedBadges ?? [],
      hasPassword: !!u.passwordHash,
      lastLoginAt: u.lastLoginAt ?? null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    return Response.json({ users });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAuth(["admin"]);
    const { name, email, role, allowedBadges, password } = await request.json();

    if (!name || !email || !role) {
      return Response.json({ error: "Nombre, email y rol son requeridos" }, { status: 400 });
    }

    if (!["admin", "organizer", "volunteer", "badges"].includes(role)) {
      return Response.json({ error: "Rol inválido" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return Response.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
    }

    const allowed = role === "admin" ? [] : (Array.isArray(allowedBadges) ? allowedBadges.map(String) : []);

    // Modo directo (genérico de respaldo): el admin fija la contraseña; sin correo ni token.
    if (typeof password === "string" && password.length > 0) {
      if (password.length < 8) {
        return Response.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email: email.toLowerCase().trim(), role, allowedBadges: allowed, passwordHash });
      await createLog({
        userId: actor._id.toString(), userName: actor.name, userRole: actor.role,
        action: "USER_CREATED", target: `${name} (${email})`, targetId: user._id.toString(),
        details: `${role} · directo`,
      });
      return Response.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, direct: true });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      role,
      // Admin da todos los badges; el resto según lo configurado
      allowedBadges: allowed,
    });

    const token = crypto.randomUUID();
    await PasswordToken.create({
      userId: user._id.toString(),
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const appUrl = SITE_URL;
    const createPasswordUrl = `${appUrl}/es/admin/create-password?token=${token}`;

    try {
      const html = await render(InvitationEmail({ name, role, createPasswordUrl }));
      await sendEmail({
        from: EMAIL_FROM,
        to: email,
        subject: "Invitación — AWS Student Community Day Admin",
        html,
      });
    } catch {
      // Email send failed — user still created
    }

    await createLog({
      userId: actor._id.toString(),
      userName: actor.name,
      userRole: actor.role,
      action: "USER_CREATED",
      target: `${name} (${email})`,
      targetId: user._id.toString(),
      details: role,
    });

    return Response.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      createPasswordUrl,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
