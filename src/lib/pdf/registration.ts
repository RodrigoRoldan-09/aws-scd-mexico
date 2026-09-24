import {
  createDoc,
  pdfToBuffer,
  drawHeader,
  drawEventDetails,
  drawFooter,
  hardBox,
  mono,
  COLORS,
  PAGE_W,
  MARGIN,
} from "./common";

/**
 * Pase de acceso que se adjunta al correo de confirmación.
 *
 * Lo que importa acá es una sola cosa: que en la puerta, con sol y con prisa,
 * el QR se lea al primer intento. Por eso va grande, sobre blanco puro y con el
 * mayor contraste de la página; todo lo demás se acomoda alrededor.
 */
export async function generateRegistrationPDF(
  name: string,
  qrPngBuffer: Buffer,
  qrCodeText: string,
): Promise<Buffer> {
  const doc = createDoc();
  const clean = (name || "").trim();
  const firstName = clean ? clean.split(/\s+/)[0] : "";

  // El alto de la página es fijo: cabecera 96 + contenido + cinta de pie 26.
  // Si se pasa, PDFKit abre una segunda hoja en blanco.
  let y = drawHeader(doc);
  y += 16;

  const nameW = PAGE_W - MARGIN * 2;
  const centrado = { width: nameW, align: "center" as const };

  mono(doc)
    .fontSize(8)
    .fillColor(COLORS.deep)
    .text("PASE DE ACCESO", MARGIN, y, { ...centrado, lineBreak: false });
  y += 15;

  // Nombre en grande. Se recorta a dos líneas: un nombre muy largo no debe
  // empujar el QR fuera de la página.
  doc.font("Helvetica-Bold").fontSize(22).fillColor(COLORS.ink);
  const displayName = (clean || "Asistente").toUpperCase();
  const nameH = Math.min(doc.heightOfString(displayName, { width: nameW }), 56);
  doc.text(displayName, MARGIN, y, { ...centrado, height: 56, ellipsis: true, lineGap: -3 });
  y += nameH + 8;

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.ink)
    .text(
      firstName
        ? `${firstName}, este es tu pase. Muéstralo en la entrada.`
        : "Muestra este código en la entrada.",
      MARGIN,
      y,
      centrado,
    );
  y += 22;

  // ── QR ──
  // Caja blanca con borde negro y sombra dura. El blanco alrededor del código
  // no es decorativo: los lectores necesitan esa zona de silencio para
  // engancharlo.
  const qrSize = 150;
  const pad = 13;
  const boxSize = qrSize + pad * 2;
  const qrX = (PAGE_W - boxSize) / 2;

  hardBox(doc, qrX, y, boxSize, boxSize, { fill: COLORS.white, shadow: 6 });
  doc.image(qrPngBuffer, qrX + pad, y + pad, { width: qrSize, height: qrSize });
  y += boxSize + 10;

  // Código en texto, por si el lector falla y hay que teclearlo.
  mono(doc)
    .fontSize(11)
    .fillColor(COLORS.ink)
    .text(qrCodeText, 0, y, { width: PAGE_W, align: "center", lineBreak: false });
  y += 13;

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(COLORS.deep)
    .text("Si el lector falla, este código sirve igual.", 0, y, {
      width: PAGE_W,
      align: "center",
    });
  y += 16;

  // ── Datos del evento ──
  y = drawEventDetails(doc, y);

  drawFooter(doc);
  return pdfToBuffer(doc);
}
