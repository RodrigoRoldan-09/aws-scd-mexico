import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectDB } from "./db";
import { User, type IUser } from "@/models/user";
import { Session } from "@/models/session";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "aws-scd-token";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
export const ADMIN_MAX_SESSIONS = 10;

interface JWTPayload {
  userId: string;
  sessionId: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(userId: string, sessionId: string) {
  const token = signToken({ userId, sessionId });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthUser(): Promise<IUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  await connectDB();

  const session = await Session.findOne({
    sessionId: payload.sessionId,
    userId: payload.userId,
  });
  if (!session) return null;

  const user = await User.findById(payload.userId);
  if (!user) return null;

  // Un dispositivo a la vez para roles no-admin. Los admin pueden tener hasta
  // ADMIN_MAX_SESSIONS sesiones: basta con que exista su documento Session.
  if (user.role !== "admin" && user.currentSessionId !== payload.sessionId) return null;

  return user;
}

export async function requireAuth(roles?: string[]): Promise<IUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (roles && !roles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function createSession(userId: string, role: IUser["role"]): Promise<string> {
  await connectDB();

  const isAdmin = role === "admin";

  // No-admin: el nuevo inicio de sesión reemplaza al anterior.
  if (!isAdmin) await Session.deleteMany({ userId });

  const sessionId = crypto.randomUUID();

  await Session.create({
    userId,
    sessionId,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    createdAt: new Date(),
  });

  await User.findByIdAndUpdate(userId, { currentSessionId: sessionId });

  if (isAdmin) {
    // Conserva las ADMIN_MAX_SESSIONS más recientes; las más antiguas (y las
    // previas al campo createdAt, que ordenan al final) se cierran. Nunca bloquea.
    const extra = await Session.find({ userId })
      .sort({ createdAt: -1, _id: -1 })
      .skip(ADMIN_MAX_SESSIONS)
      .select("_id")
      .lean();
    if (extra.length > 0) {
      await Session.deleteMany({ _id: { $in: extra.map((d) => d._id) } });
    }
  }

  return sessionId;
}

// Cierra la sesión de este dispositivo. Admin: solo su sesión actual (las demás
// siguen activas). Otros roles: igual que antes, todas las sesiones del usuario.
export async function endCurrentSession(user: IUser): Promise<void> {
  await connectDB();
  const userId = user._id.toString();

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;

  if (user.role === "admin" && payload) {
    await Session.deleteOne({ sessionId: payload.sessionId, userId });
    if (user.currentSessionId === payload.sessionId) {
      await User.findByIdAndUpdate(user._id, { currentSessionId: null });
    }
    return;
  }

  await Session.deleteMany({ userId });
  await User.findByIdAndUpdate(user._id, { currentSessionId: null });
}
