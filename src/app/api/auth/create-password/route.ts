import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { PasswordToken } from "@/models/password-token";
import { User } from "@/models/user";
import { Session } from "@/models/session";

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      const parsed = await request.json();
      if (typeof parsed !== "object" || parsed === null) throw new Error("invalid body");
      body = parsed as Record<string, unknown>;
    } catch {
      return Response.json({ error: "Solicitud inválida" }, { status: 400 });
    }
    const { token, password } = body;

    // Exige strings: un objeto en `token` (ej. {"$ne":null}) sería inyección NoSQL.
    if (typeof token !== "string" || typeof password !== "string" || !token || !password) {
      return Response.json({ error: "Token y contraseña son requeridos" }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }

    await connectDB();

    const passwordToken = await PasswordToken.findOne({
      token,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!passwordToken) {
      return Response.json({ error: "Token inválido o expirado" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.findByIdAndUpdate(passwordToken.userId, { passwordHash, currentSessionId: null });
    await PasswordToken.findByIdAndUpdate(passwordToken._id, { usedAt: new Date() });
    await Session.deleteMany({ userId: passwordToken.userId });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
