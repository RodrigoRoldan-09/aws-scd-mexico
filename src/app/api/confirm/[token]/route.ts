import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/registration";
import { Passport } from "@/models/passport";
import { badgeNameOptions } from "@/lib/utils";
import { CONFIRMATION_DEADLINE } from "@/lib/constants";
import { createLog } from "@/lib/log";

function isExpired(): boolean {
  return Date.now() > new Date(CONFIRMATION_DEADLINE).getTime();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    await connectDB();

    const reg = await Registration.findOne({ qrCode: token }).lean();
    if (!reg) return Response.json({ found: false }, { status: 404 });

    const { options } = badgeNameOptions(reg.firstName, reg.lastName);

    // Normalized display fields come from the linked passport (shortId === qrCode)
    const passport = await Passport.findOne({ shortId: token })
      .select("firstName lastName company jobTitle role")
      .lean() as Record<string, unknown> | null;

    const confirmation = (reg.confirmation as {
      confirmed?: boolean; confirmedAt?: Date | null; badgeFirstName?: string; badgeLastName?: string;
    } | undefined) ?? {};

    const status: "confirmed" | "expired" | "pending" =
      confirmation.confirmed ? "confirmed" : isExpired() ? "expired" : "pending";

    return Response.json({
      found: true,
      firstName: (passport?.firstName as string) ?? "",
      lastName: (passport?.lastName as string) ?? "",
      company: (passport?.company as string) ?? "",
      jobTitle: (passport?.jobTitle as string) ?? "",
      role: (passport?.role as string) ?? "attendee",
      email: reg.email,
      nameOptions: options,
      status,
      badgeFirstName: confirmation.badgeFirstName ?? "",
      badgeLastName: confirmation.badgeLastName ?? "",
      confirmedAt: confirmation.confirmedAt ?? null,
      deadline: CONFIRMATION_DEADLINE,
    });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const body = await req.json().catch(() => ({})) as { badgeFirstName?: string; badgeLastName?: string };

    await connectDB();
    const reg = await Registration.findOne({ qrCode: token });
    if (!reg) return Response.json({ error: "No encontrado" }, { status: 404 });

    if (reg.confirmation?.confirmed) {
      return Response.json({ error: "Ya confirmaste tu asistencia" }, { status: 409 });
    }
    if (isExpired()) {
      return Response.json({ error: "El periodo de confirmación terminó" }, { status: 410 });
    }

    const { firsts, lasts } = badgeNameOptions(reg.firstName, reg.lastName);

    const badgeFirstName = (body.badgeFirstName ?? "").trim().toUpperCase();
    const badgeLastName = (body.badgeLastName ?? "").trim().toUpperCase();

    if (!firsts.includes(badgeFirstName) || !lasts.includes(badgeLastName)) {
      return Response.json({ error: "Selección de nombre inválida" }, { status: 400 });
    }

    const now = new Date();
    reg.confirmation = { confirmed: true, confirmedAt: now, badgeFirstName, badgeLastName };
    await reg.save();

    // Mirror to the passport so printing is trivial
    await Passport.updateOne(
      { shortId: token },
      { $set: { confirmed: true, confirmedAt: now, badgeFirstName, badgeLastName } },
    );

    const fullName = `${reg.firstName} ${reg.lastName}`.trim() || `${badgeFirstName} ${badgeLastName}`;
    await createLog({
      userId: String(reg._id),
      userName: fullName,
      userRole: "attendee",
      action: "ATTENDANCE_CONFIRMED",
      target: fullName,
      targetId: token,
      details: `Escarapela: ${badgeFirstName} ${badgeLastName}`,
    });

    return Response.json({ ok: true, badgeFirstName, badgeLastName });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
