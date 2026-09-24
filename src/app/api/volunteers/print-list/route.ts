import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { VolunteerSubmission } from "@/models/volunteer-submission";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuth(["admin", "organizer", "volunteer"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const submissions = await VolunteerSubmission.find({ approved: true })
    .select("firstName lastName")
    .lean();

  const volunteers = submissions
    .map((s) => ({
      id: String(s._id),
      firstName: s.firstName ?? "",
      lastName: s.lastName ?? "",
    }))
    .filter((v) => v.firstName);

  volunteers.sort((a, b) => a.firstName.localeCompare(b.firstName, "es"));

  return NextResponse.json({ volunteers });
}
