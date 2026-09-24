import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { PasswordToken } from "@/models/password-token";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return Response.json({ valid: false, reason: "not_found" }, { status: 400 });
  }

  try {
    await connectDB();

    const passwordToken = await PasswordToken.findOne({ token });

    if (!passwordToken) {
      return Response.json({ valid: false, reason: "not_found" });
    }

    if (passwordToken.usedAt) {
      return Response.json({ valid: false, reason: "used" });
    }

    if (passwordToken.expiresAt <= new Date()) {
      return Response.json({ valid: false, reason: "expired" });
    }

    return Response.json({ valid: true });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
