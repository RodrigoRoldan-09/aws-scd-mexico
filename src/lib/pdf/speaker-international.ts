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

// Datos para quien viaja desde fuera de México.
const TIPS = [
  { icon: "✈", text: "El Aeropuerto Internacional de la Ciudad de México (MEX) tiene vuelos directos desde toda Latinoamérica." },
  { icon: "🚌", text: "Desde el aeropuerto llegas al centro en Metrobús (Línea 4), Metro (Línea 5, Terminal Aérea) o taxi autorizado." },
  { icon: "🌡", text: "Noviembre en CDMX es temporada seca: 8–23 °C. Mañanas frías, conviene una chamarra ligera." },
  { icon: "💵", text: "Moneda local: Peso Mexicano (MXN). Hay cajeros en el aeropuerto y se paga con tarjeta en casi todos lados." },
  { icon: "⛰", text: "La ciudad está a 2,240 m de altura: hidrátate bien los primeros días." },
  { icon: "🍽", text: "Habrá coffee break y comida incluidos para speakers. ¡Bienvenido a México!" },
];

export async function generateInternationalSpeakerPDF(name: string): Promise<Buffer> {
  const doc = createDoc();

  /* ── Header ── */
  let y = drawHeader(doc);
  y += 28;

  /* ── Subtitle ── */
  doc
    .font("Helvetica")
    .fontSize(13)
    .fillColor(COLORS.muted)
    .text("¡Gracias por viajar hasta México!", 0, y, { width: PAGE_W, align: "center" });
  y += 22;

  /* ── Name ── */
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(COLORS.navy)
    .text(name || "Participante", MARGIN, y, { width: PAGE_W - MARGIN * 2, align: "center" });
  y += 30;

  /* ── Accent line ── */
  y = drawAccentLine(doc, y);

  /* ── Role title ── */
  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(COLORS.orange)
    .text("Speaker Internacional Oficial", 0, y, { width: PAGE_W, align: "center" });
  y += 22;

  /* ── Body ── */
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(COLORS.muted)
    .text(
      "Tu postulación fue seleccionada para el AWS Student Community Day México 2026. " +
      "Estamos honrados de que hagas parte de este evento desde el exterior. " +
      "El equipo organizador estará en contacto contigo para coordinar los detalles de tu participación.",
      MARGIN + 8, y,
      { width: PAGE_W - (MARGIN + 8) * 2, align: "center", lineGap: 3 },
    );
  y += 52;

  /* ── SPEAKER INTERNACIONAL badge ── */
  const badgeW = 220;
  const badgeH = 34;
  const badgeX = (PAGE_W - badgeW) / 2;

  doc.roundedRect(badgeX, y, badgeW, badgeH, 17).fill("#FFF7E6");
  doc.roundedRect(badgeX, y, badgeW, badgeH, 17).lineWidth(1).stroke(COLORS.borderOrange);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.orange)
    .text("🌍  SPEAKER INTERNACIONAL", 0, y + 11, { width: PAGE_W, align: "center" });
  y += badgeH + 20;

  /* ── Tips section ── */
  const tipsBoxX = MARGIN;
  const tipsBoxW = PAGE_W - MARGIN * 2;
  const tipH = 12;
  const tipPad = 10;
  const tipsBoxH = tipPad * 2 + TIPS.length * tipH + (TIPS.length - 1) * 4;

  doc.roundedRect(tipsBoxX, y, tipsBoxW, tipsBoxH, 6).fill("#EFF6FF");
  doc.roundedRect(tipsBoxX, y, tipsBoxW, tipsBoxH, 6).lineWidth(0.5).stroke("#BFDBFE");

  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor("#1D4ED8")
    .text("TIPS PARA TU VIAJE A CDMX", tipsBoxX + tipPad, y + tipPad);

  let tipY = y + tipPad + 14;
  for (const tip of TIPS) {
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.navy)
      .text(tip.icon, tipsBoxX + tipPad, tipY, { continued: false });
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(COLORS.muted)
      .text(tip.text, tipsBoxX + tipPad + 16, tipY, {
        width: tipsBoxW - tipPad * 2 - 16,
        lineGap: 1,
      });
    tipY += tipH + 4;
  }

  y = y + tipsBoxH + 16;

  /* ── Event details ── */
  y = drawEventDetails(doc, y);

  /* ── Footer ── */
  drawFooter(doc);

  return pdfToBuffer(doc);
}
