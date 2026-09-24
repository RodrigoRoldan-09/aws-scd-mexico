import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";
import { createSession, setAuthCookie } from "@/lib/auth";
import { createLog } from "@/lib/log";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { normalizeEmail } from "@/lib/normalize";

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(`login:${getIp(request)}`, 10, 15 * 60 * 1000);
    if (!rl.ok) {
      return Response.json(
        { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    // Si el body no es JSON válido (un objeto), es error del cliente (400), no un 500.
    let body: Record<string, unknown>;
    try {
      const parsed = await request.json();
      if (typeof parsed !== "object" || parsed === null) throw new Error("invalid body");
      body = parsed as Record<string, unknown>;
    } catch {
      return Response.json({ error: "Solicitud inválida" }, { status: 400 });
    }
    const { email, password, captchaToken } = body;

    // Verifica el captcha primero, así cada intento consume un token nuevo (sin reuso).
    const okCaptcha = await verifyCaptcha(typeof captchaToken === "string" ? captchaToken : "");
    if (!okCaptcha) {
      return Response.json(
        { error: "Captcha inválido o expirado. Recárgalo e intenta de nuevo." },
        { status: 400 },
      );
    }

    // Exige que email y password sean strings (evita inyección NoSQL y 500 con objetos).
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return Response.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Validación de formato en el servidor: `type="email"` del navegador es
    // laxo y una petición armada a mano se lo salta. Devolver el motivo no
    // filtra nada: habla de la sintaxis, no de si la cuenta existe.
    const checked = normalizeEmail(email);
    if (!checked.ok) {
      return Response.json({ error: checked.reason }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: checked.value });
    if (!user || !user.passwordHash) {
      return Response.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const sessionId = await createSession(user._id.toString());
    await setAuthCookie(user._id.toString(), sessionId);
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "USER_LOGIN",
      target: user.email,
    });

    return Response.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
