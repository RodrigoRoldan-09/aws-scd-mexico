import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Passport } from "@/models/passport";
import { roleLabelOf } from "@/data/attendee-form";
import { Registration } from "@/models/registration";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { SpeakerProfile } from "@/models/speaker-profile";
import { User } from "@/models/user";

type GenerateRole = "attendee" | "speaker" | "volunteer" | "organizer";

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const { role } = (await req.json()) as { role: GenerateRole };

    await connectDB();

    let created = 0, skipped = 0, failed = 0;

    if (role === "attendee") {
      const regs = await Registration.find({}).lean();
      for (const reg of regs) {
        try {
          const firstName = reg.firstName || "Sin";
          const lastName = reg.lastName || "Nombre";
          const company = reg.entityName ?? undefined;
          const jobTitle = roleLabelOf(reg.role, reg.roleOther) || undefined;

          const result = await Passport.updateOne(
            { shortId: reg.qrCode, isManual: { $ne: true } },
            {
              $setOnInsert: { shortId: reg.qrCode, role: "attendee", linkedRegistrationId: reg._id.toString(), isManual: false, viewPin: generatePin() },
              $set: { firstName, lastName, company, jobTitle },
            },
            { upsert: true },
          );
          if (result.upsertedCount > 0) {
            created++;
          } else {
            // Assign viewPin to existing passports that don't have one yet
            await Passport.updateOne({ shortId: reg.qrCode, viewPin: { $in: [null, undefined, ""] } }, { $set: { viewPin: generatePin() } });
            skipped++;
          }
        } catch { failed++; }
      }
    }

    if (role === "volunteer") {
      const { nanoid } = await import("nanoid");
      const volunteers = await VolunteerSubmission.find({ approved: true }).lean();
      for (const vol of volunteers) {
        try {
          const firstName = vol.firstName?.trim() || "Sin";
          const lastName = vol.lastName?.trim() || "Nombre";
          // El SBG describe mejor de dónde viene un voluntario que la entidad,
          // que muchas veces es la misma universidad del grupo.
          const company =
            (vol.sbg && vol.sbg !== "none" ? vol.sbg : vol.entityName) || undefined;

          const result = await Passport.updateOne(
            { linkedRegistrationId: vol._id.toString(), role: "volunteer" },
            {
              $setOnInsert: { shortId: nanoid(8), role: "volunteer", linkedRegistrationId: vol._id.toString(), isManual: false, viewPin: generatePin() },
              $set: { firstName, lastName, company },
            },
            { upsert: true },
          );
          if (result.upsertedCount > 0) {
            created++;
          } else {
            await Passport.updateOne(
              { linkedRegistrationId: vol._id.toString(), role: "volunteer", viewPin: { $in: [null, undefined, ""] } },
              { $set: { viewPin: generatePin() } },
            );
            skipped++;
          }
        } catch { failed++; }
      }
    }

    if (role === "speaker") {
      const { nanoid } = await import("nanoid");
      const speakers = await SpeakerProfile.find({
        status: { $in: ["accepted", "scheduled"] },
        sessionType: "in-person",
      }).lean();
      for (const sp of speakers) {
        try {
          const parts = (sp.name || "").trim().split(" ");
          const firstName = parts[0] || "Sin";
          const lastName = parts.slice(1).join(" ") || "Nombre";
          const company = sp.company || undefined;
          const jobTitle = sp.role || sp.tagline || undefined;

          const result = await Passport.updateOne(
            { linkedRegistrationId: sp._id.toString(), role: "speaker" },
            {
              $setOnInsert: { shortId: nanoid(8), role: "speaker", linkedRegistrationId: sp._id.toString(), isManual: false, viewPin: generatePin() },
              $set: { firstName, lastName, company, jobTitle },
            },
            { upsert: true },
          );
          if (result.upsertedCount > 0) {
            created++;
          } else {
            await Passport.updateOne(
              { linkedRegistrationId: sp._id.toString(), role: "speaker", viewPin: { $in: [null, undefined, ""] } },
              { $set: { viewPin: generatePin() } },
            );
            skipped++;
          }
        } catch { failed++; }
      }
    }

    if (role === "organizer") {
      const { nanoid } = await import("nanoid");
      const users = await User.find({ role: { $in: ["admin", "organizer"] } }).lean();
      for (const u of users) {
        try {
          const parts = (u.name || "").trim().split(" ");
          const firstName = parts[0] || "Sin";
          const lastName = parts.slice(1).join(" ") || "Nombre";

          const result = await Passport.updateOne(
            { linkedRegistrationId: u._id.toString(), role: "organizer" },
            {
              $setOnInsert: { shortId: nanoid(8), role: "organizer", linkedRegistrationId: u._id.toString(), isManual: false, viewPin: generatePin() },
              $set: { firstName, lastName },
            },
            { upsert: true },
          );
          if (result.upsertedCount > 0) {
            created++;
          } else {
            await Passport.updateOne(
              { linkedRegistrationId: u._id.toString(), role: "organizer", viewPin: { $in: [null, undefined, ""] } },
              { $set: { viewPin: generatePin() } },
            );
            skipped++;
          }
        } catch { failed++; }
      }
    }

    return Response.json({ ok: true, created, skipped, failed });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}