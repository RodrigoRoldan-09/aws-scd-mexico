import path from "node:path";
import fs from "node:fs";
import zlib from "node:zlib";
import { PDFDocument, PDFName, PDFArray, PDFRawStream, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/*
 * Certificado de voluntario sobre la plantilla oficial SBG
 * (public/certificates/Certificate.pdf, página verde = índice 1).
 *
 * La plantilla es una imagen de fondo (arte + firma real de Tracy Wang) con solo
 * DOS textos reales: "Student Name" (Tm 556.17 219.1) y "University Name"
 * (Tm 193.3 382.4). Se vacían esos textos, se tapa el motivo quemado en la
 * imagen con un parche navy (#161D26, muestreado del bitmap) y se dibuja lo nuestro.
 */

const NAVY = rgb(0x16 / 255, 0x1d / 255, 0x26 / 255);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(0x00 / 255, 0xe5 / 255, 0x82 / 255);
const GRAY = rgb(0x97 / 255, 0x9a / 255, 0x9e / 255);
const BLACK = rgb(0x0a / 255, 0x0f / 255, 0x14 / 255);

// Centros de los bloques de texto (medidos del stream de la plantilla)
const NAME_CX = 620.7;   // centro del rect [434.38, w372.6]
const NAME_MAX_W = 358;  // ancho útil para el nombre
const PANEL_CX = 234;    // centro del rect del panel verde [38.25, w391.63]

let cachedTemplate: Buffer | null = null;
let cachedFont: Buffer | null = null;

function loadTemplate(): Buffer {
  if (!cachedTemplate) {
    cachedTemplate = fs.readFileSync(path.join(process.cwd(), "public", "certificates", "Certificate.pdf"));
  }
  return cachedTemplate;
}

function loadMonoFont(): Buffer {
  if (!cachedFont) {
    cachedFont = fs.readFileSync(path.join(process.cwd(), "public", "fonts", "JetBrainsMono-Bold.ttf"));
  }
  return cachedFont;
}

// Junta los content streams de la página (uno o array) decodificados
function decodedContents(doc: PDFDocument, page: ReturnType<PDFDocument["getPage"]>): string {
  const contents = page.node.get(PDFName.of("Contents"));
  const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
  const parts: string[] = [];
  for (const ref of refs) {
    const stream = doc.context.lookup(ref);
    if (!(stream instanceof PDFRawStream)) continue;
    const raw = Buffer.from(stream.getContents());
    const filter = stream.dict.get(PDFName.of("Filter"));
    const isFlate = filter && String(filter).includes("FlateDecode");
    try {
      parts.push((isFlate ? zlib.inflateSync(raw) : raw).toString("latin1"));
    } catch { /* stream ilegible: se omite */ }
  }
  return parts.join("\n");
}

// Vacía el TJ del bloque de texto cuyo Tm coincide (borra el placeholder)
function blankTextAt(content: string, tmX: string, tmY: string): string {
  const re = new RegExp(`(1 0 0 1 ${tmX.replace(".", "\\.")} ${tmY.replace(".", "\\.")} Tm[\\s\\S]{0,120}?)\\[[^\\]]*\\]\\s*TJ`);
  return content.replace(re, "$1[] TJ");
}

export async function generateVolunteerCertificate(rawName: string): Promise<Buffer> {
  const name = rawName.trim().toUpperCase();

  // Doc nuevo con SOLO la página verde de la plantilla
  const template = await PDFDocument.load(new Uint8Array(loadTemplate()));
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [page] = await doc.copyPages(template, [1]);
  doc.addPage(page);

  // 1) Vaciar los placeholders "Student Name" y "University Name"
  let content = decodedContents(doc, page);
  content = blankTextAt(content, "556.17", "219.1");
  content = blankTextAt(content, "193.3", "382.4");
  const newStream = doc.context.flateStream(content);
  page.node.set(PDFName.of("Contents"), doc.context.register(newStream));

  const mono = await doc.embedFont(new Uint8Array(loadMonoFont()), { subset: true });

  // 2) Parche navy sobre el motivo quemado (entre las líneas del grid: x 432-804, y 149)
  page.drawRectangle({ x: 440, y: 152, width: 356, height: 38, color: NAVY });

  // 3) Nombre del voluntario (blanco, centrado, auto-ajuste)
  let nameSize = 24;
  while (nameSize > 9 && mono.widthOfTextAtSize(name, nameSize) > NAME_MAX_W) nameSize -= 0.5;
  page.drawText(name, {
    x: NAME_CX - mono.widthOfTextAtSize(name, nameSize) / 2,
    y: 219.1,
    size: nameSize,
    font: mono,
    color: WHITE,
  });

  // 4) Panel verde: tapar el "AWS Student Builder Group at" quemado (bbox 133-333, y 396-407)
  //    y centrar nuestra línea única en el espacio de las dos líneas originales
  page.drawRectangle({ x: 120, y: 392, width: 230, height: 20, color: GREEN });
  const org = "AWS Student Builder Groups México";
  const orgSize = 12;
  page.drawText(org, {
    x: PANEL_CX - mono.widthOfTextAtSize(org, orgSize) / 2,
    y: 391,
    size: orgSize,
    font: mono,
    color: BLACK,
  });

  // 5) Motivo dentro del slot del parche (y 152-190); la gratitud va entre la
  //    línea del grid (y=149) y la firma de Tracy (imagen y 75.7-126.7) sin tocarlas
  const centered = (text: string, y: number, size: number, color = GRAY) => {
    page.drawText(text, { x: NAME_CX - mono.widthOfTextAtSize(text, size) / 2, y, size, font: mono, color });
  };
  centered("For volunteering at the", 178, 9);
  centered("AWS Student Community Day México 2026", 165.5, 9.5, WHITE);
  centered("held on November 4th, 2026 — Mexico City, Mexico", 154, 8.5);
  centered("Thank you for making this event possible!", 135, 9, GREEN);

  return Buffer.from(await doc.save());
}
