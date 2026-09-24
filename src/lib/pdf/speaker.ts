import {
  createDoc,
  pdfToBuffer,
  drawHeader,
  drawAccentLine,
  drawEventDetails,
  drawFooter,
  COLORS,
  PAGE_W,
  MARGIN,
} from "./common";

type ApprovalRole = "speaker" | "volunteer";

const ROLE_LABELS: Record<ApprovalRole, { title: string; subtitle: string; body: string }> = {
  speaker: {
    title: "Aceptado como Speaker",
    subtitle: "¡Felicitaciones!",
    body: "Eres parte oficial del programa de speakers del AWS Student Community Day México 2026. Te contactaremos pronto con los detalles de tu charla.",
  },
  volunteer: {
    title: "Aceptado como Voluntario",
    subtitle: "¡Felicitaciones!",
    body: "Eres parte del equipo de voluntarios del AWS Student Community Day México 2026. Pronto te contactaremos para informarte sobre tu rol asignado.",
  },
};

async function generateApprovalPDF(name: string, role: ApprovalRole): Promise<Buffer> {
  const doc = createDoc();
  const labels = ROLE_LABELS[role];

  /* ── Header ── */
  let y = drawHeader(doc);
  y += 36;

  /* ── Subtitle ── */
  doc
    .font("Helvetica")
    .fontSize(14)
    .fillColor(COLORS.muted)
    .text(labels.subtitle, 0, y, { width: PAGE_W, align: "center" });
  y += 24;

  /* ── Name prominently ── */
  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor(COLORS.navy)
    .text(name || "Participante", MARGIN, y, { width: PAGE_W - MARGIN * 2, align: "center" });
  y += 34;

  /* ── Accent line ── */
  y = drawAccentLine(doc, y);

  /* ── Role title ── */
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(COLORS.orange)
    .text(labels.title, 0, y, { width: PAGE_W, align: "center" });
  y += 30;

  /* ── Body text ── */
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text(labels.body, MARGIN + 10, y, {
      width: PAGE_W - (MARGIN + 10) * 2,
      align: "center",
      lineGap: 4,
    });
  y += 60;

  /* ── Badge ── */
  const badgeW = 200;
  const badgeH = 36;
  const badgeX = (PAGE_W - badgeW) / 2;

  doc
    .roundedRect(badgeX, y, badgeW, badgeH, 18)
    .fill("#FFF7E6");
  doc
    .roundedRect(badgeX, y, badgeW, badgeH, 18)
    .lineWidth(1)
    .stroke(COLORS.borderOrange);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.orange)
    .text(role === "speaker" ? "SPEAKER OFICIAL" : "VOLUNTARIO OFICIAL", 0, y + 12, {
      width: PAGE_W,
      align: "center",
    });
  y += badgeH + 30;

  /* ── Event details ── */
  y = drawEventDetails(doc, y);

  /* ── Footer ── */
  drawFooter(doc);

  return pdfToBuffer(doc);
}

export async function generateSpeakerPDF(name: string): Promise<Buffer> {
  return generateApprovalPDF(name, "speaker");
}

export async function generateVolunteerPDF(name: string): Promise<Buffer> {
  return generateApprovalPDF(name, "volunteer");
}
