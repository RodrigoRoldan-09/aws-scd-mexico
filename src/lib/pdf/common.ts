import path from "node:path";
import fs from "node:fs";
import PDFDocument from "pdfkit";
import { EVENT, SITE_HOST } from "@/lib/constants";

/**
 * Primitivas de los PDF, en el mismo lenguaje visual que el sitio: bloque de
 * color a sangre, tinta oscura, esquinas rectas y sombras desplazadas sólidas.
 *
 * Sólo hay una tipografía embebible: JetBrains Mono Bold. PDFKit no lee woff2,
 * así que Oxanium y Handjet, que sí usa el sitio, no se pueden incrustar. El
 * peso regular sale de Helvetica, que viene dentro de PDFKit. La combinación
 * mono + palo seco es la misma idea del sitio.
 */

export const COLORS = {
  /** Fondo de página: el color del bloque/superficie SBG. */
  block: "#1E1838",
  /** Tinta. Todo el texto principal y las cajas duras. */
  ink: "#0E0E1A",
  /** Acento fucsia oficial SBG. */
  deep: "#C143BC",
  white: "#FFFFFF",
  /** Gris para letra chica. */
  muted: "#73726C",

  // Alias compatibles para PDFs
  orange: "#D85A30",
  navy: "#0E0E1A",
  lightGray: "#F4F4F5",
  text: "#0E0E1A",
  softOrange: "#C143BC",
  borderOrange: "#0E0E1A",
};

export const PAGE_W = 420;
export const PAGE_H = 595;
export const MARGIN = 36;

let cachedLogo: Buffer | null = null;
let cachedFont: Buffer | null = null;

export function loadAwsLogo(): Buffer {
  if (!cachedLogo) {
    cachedLogo = fs.readFileSync(
      path.join(process.cwd(), "public", "images", "logos", "aws-logo.png"),
    );
  }
  return cachedLogo;
}

function loadJetBrainsFont(): Buffer | null {
  if (cachedFont) return cachedFont;
  const fontPath = path.join(process.cwd(), "public", "fonts", "JetBrainsMono-Bold.ttf");
  if (fs.existsSync(fontPath)) {
    cachedFont = fs.readFileSync(fontPath);
    return cachedFont;
  }
  return null;
}

type Doc = InstanceType<typeof PDFDocument>;

function registerFonts(doc: Doc) {
  const fontData = loadJetBrainsFont();
  if (fontData) doc.registerFont("JetBrains", fontData);
}

/** `JetBrains` si se pudo cargar; si no, la mono de PDFKit. */
export function mono(doc: Doc): Doc {
  return doc.font(cachedFont ? "JetBrains" : "Courier-Bold");
}

export function pdfToBuffer(doc: Doc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

/** Documento nuevo, ya con el fondo morado pintado a sangre. */
export function createDoc(): Doc {
  const doc = new PDFDocument({
    size: [PAGE_W, PAGE_H],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title: "AWS Student Community Day México 2026",
      Author: "AWS Student Builder Groups México",
    },
  });
  registerFonts(doc);
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLORS.block);
  return doc;
}

/**
 * Caja dura: rectángulo recto con sombra sólida desplazada.
 *
 * Es el gesto que define el estilo. La sombra no se difumina — es otro
 * rectángulo detrás, corrido en diagonal.
 */
export function hardBox(
  doc: Doc,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: string; stroke?: string; shadow?: number } = {},
) {
  const { fill, stroke = COLORS.ink, shadow = 5 } = opts;
  if (shadow > 0) {
    doc.rect(x + shadow, y + shadow, w, h).fill(COLORS.ink);
  }
  if (fill) doc.rect(x, y, w, h).fill(fill);
  doc.rect(x, y, w, h).lineWidth(2).stroke(stroke);
}

/**
 * Cinta invertida: barra negra con texto en morado, repetido hasta llenar.
 *
 * Es la marquesina del sitio, quieta. Marca el borde superior e inferior de la
 * página sin necesidad de una imagen.
 */
export function strip(doc: Doc, y: number, text: string, h = 26) {
  doc.rect(0, y, PAGE_W, h).fill(COLORS.ink);

  mono(doc).fontSize(8).fillColor(COLORS.block);
  const piece = `${text}   ·   `;
  const pieceW = doc.widthOfString(piece);
  const repeats = Math.ceil(PAGE_W / Math.max(pieceW, 1)) + 1;

  // Se recorta al rectángulo y se dibuja SIN `width`: con ancho, PDFKit parte
  // el texto en varias líneas aunque se pida `lineBreak: false`.
  doc.save();
  doc.rect(0, y, PAGE_W, h).clip();
  doc.text(piece.repeat(repeats), 4, y + (h - doc.currentLineHeight()) / 2, {
    lineBreak: false,
  });
  doc.restore();

  return y + h;
}

/**
 * Cabecera: cinta negra con el mismo lockup que la barra del sitio.
 *
 * Logo a la izquierda y, pegado a su derecha, el nombre en tres renglones —
 * "Student / Community Day" en blanco y "México 2026" en acento. El conjunto va
 * centrado en la página: se mide primero para saber dónde empieza, porque el
 * ancho depende de la tipografía que se haya podido cargar.
 */
export function drawHeader(doc: Doc): number {
  const headerH = 84;
  doc.rect(0, 0, PAGE_W, headerH).fill(COLORS.ink);

  const logoW = 46;
  const logoH = 28;
  const gap = 9;

  // Medida del bloque de texto con la fuente ya aplicada.
  mono(doc).fontSize(9);
  const textW = Math.max(
    doc.widthOfString("Student"),
    doc.widthOfString("Community Day"),
  );

  const lockupW = logoW + gap + textW;
  const x = (PAGE_W - lockupW) / 2;
  const top = (headerH - logoH) / 2;

  doc.image(loadAwsLogo(), x, top, { width: logoW, height: logoH });

  // Los tres renglones se centran verticalmente contra el logo.
  const lineH = 11;
  const blockH = lineH * 3;
  let ty = (headerH - blockH) / 2;
  const tx = x + logoW + gap;

  mono(doc).fontSize(9).fillColor(COLORS.white);
  doc.text("Student", tx, ty, { lineBreak: false });
  ty += lineH;
  doc.text("Community Day", tx, ty, { lineBreak: false });
  ty += lineH;
  mono(doc).fontSize(7.5).fillColor(COLORS.block);
  doc.text(`México ${EVENT.year}`, tx, ty + 1, { lineBreak: false, characterSpacing: 0.8 });

  // Filo morado que separa la cinta del cuerpo.
  doc.rect(0, headerH, PAGE_W, 4).fill(COLORS.deep);
  return headerH + 4;
}

/** Regla gruesa corta, para separar bloques de texto. */
export function drawAccentLine(doc: Doc, y: number): number {
  doc.rect(MARGIN, y, 56, 5).fill(COLORS.ink);
  return y + 18;
}

/** Datos del evento en una caja dura blanca, en filas etiqueta / valor. */
export function drawEventDetails(doc: Doc, y: number): number {
  const boxX = MARGIN;
  const boxW = PAGE_W - MARGIN * 2;
  const rows = [
    ["FECHA", EVENT.dateLabel],
    ["HORA", EVENT.timeLabel],
    ["LUGAR", EVENT.venue.name],
    ["DIRECCIÓN", EVENT.venue.address],
    ["ENTRADA", "Gratuita"],
  ];
  const pad = 12;
  const rowH = 15;
  const boxH = pad * 2 + rows.length * rowH;

  hardBox(doc, boxX, y, boxW, boxH, { fill: COLORS.white, shadow: 4 });

  let rowY = y + pad;
  for (const [label, value] of rows) {
    mono(doc).fontSize(7).fillColor(COLORS.deep).text(label, boxX + pad, rowY, { lineBreak: false });
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(COLORS.ink)
      .text(value, boxX + pad + 74, rowY - 1, { width: boxW - pad * 2 - 74, lineBreak: false });
    rowY += rowH;
  }

  return y + boxH + 6;
}

/** Pie: dos cintas invertidas pegadas al borde inferior, una sobre otra. */
export function drawFooter(doc: Doc): void {
  strip(doc, PAGE_H - 52, "NOS VEMOS AHÍ", 26);
  strip(doc, PAGE_H - 26, `${SITE_HOST.toUpperCase()}   ·   ${EVENT.dateShort}   ·   CDMX`, 26);
}
