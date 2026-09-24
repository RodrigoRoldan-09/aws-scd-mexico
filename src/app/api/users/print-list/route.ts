import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuth(["admin", "organizer", "volunteer"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const users = await User.find({ role: { $in: ["admin", "organizer"] } })
    .select("name role")
    .sort({ name: 1 })
    .lean();

  const organizers = users.map((u) => ({
    id: String(u._id),
    name: u.name,
    role: u.role,
  }));

  return NextResponse.json({ organizers });
}
