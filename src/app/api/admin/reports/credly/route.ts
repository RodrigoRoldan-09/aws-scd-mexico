import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/user";
import { VolunteerSubmission } from "@/models/volunteer-submission";
import { SpeakerProfile } from "@/models/speaker-profile";
import { Registration } from "@/models/registration";
import { Log } from "@/models/log";
import ExcelJS from "exceljs";

const up = (s: unknown) => String(s ?? "").trim().toUpperCase();
const mail = (s: unknown) => String(s ?? "").trim();

// Acciones operativas: marcan a un voluntario como "activo" (trabajó en el evento).
const OPS = ["MEAL_CLAIMED", "SESSION_ATTENDANCE", "BADGE_GIVEN", "CHECK_IN", "BADGE_PRINTED", "REGISTRATION_MANUAL"];
const ONLINE = ["online", "virtual"];

// Colores
const FILL_HEADER = "FFC143BC";
const FILL_BAND = "FF232F3E";
const FILL_ACTIVE = "FFD9F2D9"; // verde claro — voluntario activo
const FILL_CHECKIN = "FFD6E8FF"; // azul claro — asistente con check-in
const FILL_FAILED = "FFF8D7DA"; // rojo claro — correo fallido

// Base de datos consolidada para solicitar badges de Credly.
export async function GET() {
  try {
    const actor = await requireAuth(["admin"]);
    await connectDB();

    const [orgUsers, volSubs, profiles, regs, activeUserIds] = await Promise.all([
      User.find({ role: { $in: ["admin", "organizer"] } }).select("name email").lean<{ name?: string; email?: string }[]>(),
      VolunteerSubmission.find({ approved: true }).select("firstName lastName email").lean(),
      SpeakerProfile.find({ status: { $in: ["accepted", "scheduled"] } }).select("name email sessionType coSpeakers").lean(),
      Registration.find({}).select("firstName lastName email checkedIn emailStatus").lean(),
      Log.distinct("userId", { action: { $in: OPS } }) as Promise<string[]>,
    ]);

    // Correos de voluntarios "activos" (su cuenta de usuario hizo acciones operativas)
    const activeUsers = await User.find({ _id: { $in: activeUserIds }, role: "volunteer" }).select("email").lean<{ email?: string }[]>();
    const activeEmails = new Set(activeUsers.map((u) => mail(u.email).toLowerCase()).filter(Boolean));

    // ── Workbook ──
    const wb = new ExcelJS.Workbook();
    wb.creator = "AWS Student Community Day";
    const sheet = wb.addWorksheet("Credly Database");
    sheet.columns = [
      { key: "n", width: 6 },
      { key: "name", width: 40 },
      { key: "email", width: 34 },
      { key: "role", width: 32 },
    ] as ExcelJS.Column[];

    // Título + responsable
    const t1 = sheet.addRow(["CREDLY BADGES DATABASE — AWS STUDENT COMMUNITY DAY MÉXICO 2026"]);
    sheet.mergeCells(t1.number, 1, t1.number, 4);
    t1.getCell(1).font = { bold: true, size: 13, color: { argb: "FF232F3E" } };
    t1.height = 22;
    const t2 = sheet.addRow([`RESPONSIBLE: ${up(actor.name)} — ${mail(actor.email)}`]);
    sheet.mergeCells(t2.number, 1, t2.number, 4);
    t2.getCell(1).font = { italic: true, size: 11, color: { argb: "FF52525B" } };
    sheet.addRow([]);

    // Header
    const header = sheet.addRow(["#", "FULL NAME", "EMAIL", "ROLE / STATUS"]);
    header.eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL_HEADER } };
      c.font = { bold: true, color: { argb: "FF1A1A1A" } };
      c.alignment = { vertical: "middle", horizontal: "center" };
    });
    header.height = 20;
    sheet.views = [{ state: "frozen", ySplit: header.number }];

    let idx = 0;
    const band = (title: string) => {
      const r = sheet.addRow([title]);
      sheet.mergeCells(r.number, 1, r.number, 4);
      const c = r.getCell(1);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL_BAND } };
      c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      c.alignment = { vertical: "middle", horizontal: "left" };
      r.height = 18;
    };
    const person = (name: string, email: string, role: string, fill?: string) => {
      idx += 1;
      const r = sheet.addRow({ n: idx, name: up(name), email: mail(email), role: up(role) });
      r.getCell("n").alignment = { horizontal: "center" };
      if (fill) {
        for (const k of ["n", "name", "email", "role"]) {
          r.getCell(k).fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
        }
      }
    };

    // 1) ORGANIZERS (admins + organizers)
    band(`ORGANIZERS (${orgUsers.length})`);
    for (const u of orgUsers) person(u.name ?? "", u.email ?? "", "ORGANIZERS");

    // 2) VOLUNTEERS (activos resaltados)
    const vols = volSubs.map((v) => ({
      name: `${v.firstName} ${v.lastName}`.trim(),
      email: v.email ?? "",
    }));
    const activeCount = vols.filter((v) => activeEmails.has(v.email.toLowerCase())).length;
    band(`VOLUNTEERS (${vols.length} — ${activeCount} active highlighted)`);
    for (const v of vols) {
      const active = activeEmails.has(v.email.toLowerCase());
      person(v.name, v.email, active ? "VOLUNTEER (ACTIVE)" : "VOLUNTEER", active ? FILL_ACTIVE : undefined);
    }

    // 3) SPEAKERS — presenciales y virtuales (incluye co-speakers)
    type Sp = { name: string; email: string };
    const inPerson: Sp[] = [];
    const online: Sp[] = [];
    for (const p of profiles) {
      const isOnline = ONLINE.includes(String(p.sessionType ?? ""));
      const bucket = isOnline ? online : inPerson;
      bucket.push({ name: p.name ?? "", email: p.email ?? "" });
      for (const cs of p.coSpeakers ?? []) {
        const nm = `${cs.firstName ?? ""} ${cs.lastName ?? ""}`.trim();
        if (nm || cs.email) bucket.push({ name: nm, email: cs.email ?? "" });
      }
    }
    band(`SPEAKERS — IN-PERSON (${inPerson.length})`);
    for (const s of inPerson) person(s.name, s.email, "SPEAKER (IN-PERSON)");
    band(`SPEAKERS — ONLINE (${online.length})`);
    for (const s of online) person(s.name, s.email, "SPEAKER (ONLINE)");

    // 4) ATTENDEES — check-in primero (resaltado), luego el resto, fallidos al final
    const att = regs.map((r) => ({
      name: `${r.firstName} ${r.lastName}`.trim(),
      email: r.email ?? "",
      checkedIn: r.checkedIn === true,
      failed: r.emailStatus === "failed",
    }));
    const checkin = att.filter((a) => a.checkedIn && !a.failed);
    const rest = att.filter((a) => !a.checkedIn && !a.failed);
    const failed = att.filter((a) => a.failed);

    band(`ATTENDEES — CHECK-IN / WALK-IN (${checkin.length})`);
    for (const a of checkin) person(a.name, a.email, "ATTENDEE — CHECK-IN / WALK-IN", FILL_CHECKIN);
    band(`ATTENDEES — REGISTERED (${rest.length})`);
    for (const a of rest) person(a.name, a.email, "ATTENDEE");
    band(`ATTENDEES — FAILED EMAIL (${failed.length})`);
    for (const a of failed) person(a.name, a.email, "ATTENDEE (FAILED EMAIL)", FILL_FAILED);

    const grandTotal = sheet.addRow(["", `TOTAL PEOPLE: ${idx}`, "", ""]);
    grandTotal.getCell(2).font = { bold: true };

    const buffer = await wb.xlsx.writeBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="credly-database-aws-scd.xlsx"`,
      },
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
