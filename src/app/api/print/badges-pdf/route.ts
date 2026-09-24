import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Passport } from "@/models/passport";
import { PrintConfig } from "@/models/print-config";
import { pdfToBuffer } from "@/lib/pdf/common";
import { SITE_URL } from "@/lib/constants";

const APP_URL = SITE_URL;
const MM = 72 / 25.4; // mm → pt
const ROLE_LABEL: Record<string, string> = { attendee: "ASISTENTE", speaker: "SPEAKER", volunteer: "VOLUNTARIO", organizer: "ORGANIZADOR" };
const ft = (s?: string) => (s || "").trim().split(/\s+/)[0] || "";

type Person = { shortId: string; role: string; firstName: string; lastName: string; company?: string; jobTitle?: string; viewPin?: string; badgeFirstName?: string; badgeLastName?: string };
type Align = "left" | "center" | "right";
type Layout = "side" | "stacked";
type Cfg = { qrPct: number; fontScale: number; showQr: boolean; showRole: boolean; showCompany: boolean; showJobTitle: boolean; alignName: Align; alignJobTitle: Align; alignCompany: Align; alignRole: Align; layout: Layout };

// Dispatcher: elige el layout según el preset.
async function drawBadge(pdf: InstanceType<typeof PDFDocument>, p: Person, x: number, y: number, w: number, h: number, c: Cfg) {
  if (c.layout === "stacked") return drawBadgeStacked(pdf, p, x, y, w, h, c);
  return drawBadgeSide(pdf, p, x, y, w, h, c);
}

// Lado a lado: nombre a la izquierda, QR a la derecha (ideal para etiquetas grandes 4×6).
async function drawBadgeSide(pdf: InstanceType<typeof PDFDocument>, p: Person, x: number, y: number, w: number, h: number, c: Cfg) {
  let textW = w;

  if (c.showQr) {
    const qrSize = Math.min(h * 0.8, w * (c.qrPct / 100));
    try {
      const png = await QRCode.toBuffer(`${APP_URL}/pasaporte/${p.shortId}`, { width: 320, margin: 0, color: { dark: "#000000", light: "#ffffff" } });
      const qx = x + w - qrSize, qy = y + Math.max(0, (h - qrSize) / 2) - h * 0.04;
      pdf.image(png, qx, qy, { width: qrSize, height: qrSize });
      const idTxt = p.viewPin || p.shortId.slice(0, 6).toUpperCase();
      pdf.font("Helvetica").fontSize(Math.max(5, qrSize * 0.1)).fillColor("#555555")
        .text(idTxt, qx, qy + qrSize + 2, { width: qrSize, align: "center", lineBreak: false });
    } catch { /* sin QR */ }
    textW = w - qrSize - w * 0.05;
  }

  const first = (p.badgeFirstName || ft(p.firstName)).toUpperCase();
  const last = (p.badgeLastName || ft(p.lastName)).toUpperCase();
  const role = ROLE_LABEL[p.role] ?? String(p.role || "").toUpperCase();
  const lines = last ? 2 : 1;

  // Nombre lo más grande posible que quepa en el ancho y deje espacio para info/rol
  let nameSize = Math.min((h * 0.5) / lines, textW * 0.34) * c.fontScale;
  nameSize = Math.max(7, Math.min(nameSize, 200));
  pdf.font("Helvetica-Bold").fontSize(nameSize);
  while (nameSize > 7 && (pdf.widthOfString(first) > textW || pdf.widthOfString(last) > textW)) {
    nameSize -= 0.5; pdf.fontSize(nameSize);
  }
  const infoSize = Math.max(6, nameSize * 0.32);
  const roleSize = Math.max(6, nameSize * 0.3);

  let blockH = nameSize * 1.06 * lines;
  if (c.showJobTitle && p.jobTitle) blockH += infoSize * 1.5;
  if (c.showCompany && p.company) blockH += infoSize * 1.5;
  if (c.showRole && role) blockH += roleSize * 2;
  let ty = y + Math.max(0, (h - blockH) / 2);

  pdf.font("Helvetica-Bold").fontSize(nameSize).fillColor("#000000");
  pdf.text(first, x, ty, { width: textW, lineBreak: false, align: c.alignName }); ty += nameSize * 1.06;
  if (last) { pdf.text(last, x, ty, { width: textW, lineBreak: false, align: c.alignName }); ty += nameSize * 1.06; }
  if (c.showJobTitle && p.jobTitle) { pdf.font("Helvetica").fontSize(infoSize).fillColor("#222222").text(p.jobTitle, x, ty + 3, { width: textW, lineBreak: false, align: c.alignJobTitle }); ty += infoSize * 1.5; }
  if (c.showCompany && p.company) { pdf.font("Helvetica").fontSize(infoSize).fillColor("#222222").text(p.company, x, ty + 3, { width: textW, lineBreak: false, align: c.alignCompany }); ty += infoSize * 1.5; }
  // La térmica imprime sólo negro: un rol en color saldría invisible.
  if (c.showRole && role) { pdf.font("Helvetica-Bold").fontSize(roleSize).fillColor("#000000").text(role, x, ty + 5, { width: textW, characterSpacing: 0.5, lineBreak: false, align: c.alignRole }); }
}

// Apilada y centrada: nombre grande arriba (ancho completo), cargo/empresa, rol, y QR centrado abajo.
async function drawBadgeStacked(pdf: InstanceType<typeof PDFDocument>, p: Person, x: number, y: number, w: number, h: number, c: Cfg) {
  const first = (p.badgeFirstName || ft(p.firstName)).toUpperCase();
  const last = (p.badgeLastName || ft(p.lastName)).toUpperCase();
  const role = ROLE_LABEL[p.role] ?? String(p.role || "").toUpperCase();
  const lines = last ? 2 : 1;

  // QR de tamaño fijo respecto a la etiqueta (va centrado abajo)
  const qrSize = c.showQr ? Math.min(h * 0.42, w * (c.qrPct / 100)) : 0;
  const idH = c.showQr ? Math.max(5, qrSize * 0.12) + 2 : 0;

  // Alturas de todo el bloque para un tamaño de nombre dado
  const measure = (ns: number) => {
    const infoS = Math.max(5.5, ns * 0.3);
    const roleS = Math.max(5.5, ns * 0.28);
    const g = ns * 0.3; // separación texto → QR
    let bh = ns * 1.05 * lines;
    if (c.showJobTitle && p.jobTitle) bh += infoS * 1.35;
    if (c.showCompany && p.company) bh += infoS * 1.35;
    if (c.showRole && role) bh += roleS * 1.7;
    if (c.showQr) bh += g + qrSize + idH;
    return { infoS, roleS, g, bh };
  };

  // Nombre lo más grande que quepa en el ancho COMPLETO y deje caber todo en alto
  let nameSize = Math.max(8, Math.min(Math.min(w * 0.62, h * 0.55) * c.fontScale, 300));
  const fitsW = (ns: number) => { pdf.font("Helvetica-Bold").fontSize(ns); return pdf.widthOfString(first) <= w && pdf.widthOfString(last) <= w; };
  while (nameSize > 8 && (!fitsW(nameSize) || measure(nameSize).bh > h)) nameSize -= 0.5;

  const { infoS, roleS, g, bh } = measure(nameSize);
  let ty = y + Math.max(0, (h - bh) / 2);

  // Nombre
  pdf.font("Helvetica-Bold").fontSize(nameSize).fillColor("#000000");
  pdf.text(first, x, ty, { width: w, lineBreak: false, align: c.alignName }); ty += nameSize * 1.05;
  if (last) { pdf.text(last, x, ty, { width: w, lineBreak: false, align: c.alignName }); ty += nameSize * 1.05; }
  // Cargo / Empresa
  if (c.showJobTitle && p.jobTitle) { pdf.font("Helvetica").fontSize(infoS).fillColor("#222222").text(p.jobTitle, x, ty, { width: w, lineBreak: false, align: c.alignJobTitle }); ty += infoS * 1.35; }
  if (c.showCompany && p.company) { pdf.font("Helvetica").fontSize(infoS).fillColor("#222222").text(p.company, x, ty, { width: w, lineBreak: false, align: c.alignCompany }); ty += infoS * 1.35; }
  // Rol (negro para térmica)
  if (c.showRole && role) { pdf.font("Helvetica-Bold").fontSize(roleS).fillColor("#000000").text(role, x, ty, { width: w, lineBreak: false, align: c.alignRole, characterSpacing: 0.5 }); ty += roleS * 1.7; }
  // QR centrado abajo
  if (c.showQr) {
    ty += g;
    const qx = x + (w - qrSize) / 2;
    try {
      const png = await QRCode.toBuffer(`${APP_URL}/pasaporte/${p.shortId}`, { width: 320, margin: 0, color: { dark: "#000000", light: "#ffffff" } });
      pdf.image(png, qx, ty, { width: qrSize, height: qrSize });
      const idTxt = p.viewPin || p.shortId.slice(0, 6).toUpperCase();
      pdf.font("Helvetica").fontSize(Math.max(5, qrSize * 0.12)).fillColor("#555555")
        .text(idTxt, qx, ty + qrSize + 2, { width: qrSize, align: "center", lineBreak: false });
    } catch { /* sin QR */ }
  }
}

// Genera un PDF con las escarapelas al tamaño EXACTO de la etiqueta (sin encabezados del navegador).
export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin", "organizer", "volunteer"]);
    const { shortIds, configId } = await req.json() as { shortIds?: string[]; configId?: string };
    if (!Array.isArray(shortIds) || shortIds.length === 0) {
      return Response.json({ error: "shortIds requerido" }, { status: 400 });
    }

    await connectDB();

    const cfg = (configId ? await PrintConfig.findById(configId).lean() : null)
      ?? await PrintConfig.findOne({ isDefault: true }).lean();
    const widthMm = cfg?.widthMm ?? 101.6, heightMm = cfg?.heightMm ?? 152.4, marginMm = cfg?.marginMm ?? 3;
    const perLabel = cfg?.perLabel === 2 ? 2 : 1;
    const rotate = [90, 180, 270].includes(Number(cfg?.rotate)) ? Number(cfg?.rotate) : 0;
    const al = (v: unknown): Align => (v === "center" || v === "right" ? v : "left");
    const c: Cfg = {
      qrPct: cfg?.qrPct ?? 32, fontScale: cfg?.fontScale ?? 1,
      showQr: cfg?.showQr ?? true, showRole: cfg?.showRole ?? true,
      showCompany: cfg?.showCompany ?? true, showJobTitle: cfg?.showJobTitle ?? true,
      alignName: al(cfg?.alignName), alignJobTitle: al(cfg?.alignJobTitle),
      alignCompany: al(cfg?.alignCompany), alignRole: al(cfg?.alignRole),
      layout: cfg?.layout === "stacked" ? "stacked" : "side",
    };

    const docs = await Passport.find({ shortId: { $in: shortIds } })
      .select("shortId role firstName lastName company jobTitle viewPin badgeFirstName badgeLastName")
      .lean<Person[]>();
    const byId = new Map(docs.map((d) => [d.shortId, d]));
    const people = shortIds.map((id) => byId.get(id)).filter(Boolean) as Person[];

    const W = widthMm * MM, H = heightMm * MM, M = marginMm * MM;
    // Dimensiones lógicas (donde dibujamos). Con giro 90/270 se intercambian.
    const swap = rotate === 90 || rotate === 270;
    const LW = swap ? H : W, LH = swap ? W : H;
    const pdf = new PDFDocument({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 }, autoFirstPage: false, info: { Title: "Escarapelas AWS SCD 2026" } });

    // Abre una página y gira el lienzo si hace falta (el contenido se dibuja en coords lógicas LW×LH).
    const beginPage = () => {
      pdf.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
      if (rotate) {
        pdf.save();
        pdf.translate(W / 2, H / 2);
        pdf.rotate(rotate);
        pdf.translate(-LW / 2, -LH / 2);
      }
    };
    const endPage = () => { if (rotate) pdf.restore(); };

    if (perLabel === 2) {
      // Dos por etiqueta (arriba / abajo) para cortar a la mitad
      const gap = 4 * MM;
      const halfH = (LH - 2 * M - gap) / 2;
      for (let i = 0; i < people.length; i += 2) {
        beginPage();
        await drawBadge(pdf, people[i], M, M, LW - 2 * M, halfH, c);
        if (people[i + 1]) await drawBadge(pdf, people[i + 1], M, M + halfH + gap, LW - 2 * M, halfH, c);
        // Línea de corte punteada en el centro
        const cutY = M + halfH + gap / 2;
        pdf.save();
        pdf.dash(4, { space: 3 }).moveTo(M, cutY).lineTo(LW - M, cutY).lineWidth(0.5).strokeColor("#bbbbbb").stroke().undash();
        pdf.restore();
        endPage();
      }
    } else {
      for (const p of people) {
        beginPage();
        await drawBadge(pdf, p, M, M, LW - 2 * M, LH - 2 * M, c);
        endPage();
      }
    }

    const buffer = await pdfToBuffer(pdf);
    return new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=escarapelas.pdf" },
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
