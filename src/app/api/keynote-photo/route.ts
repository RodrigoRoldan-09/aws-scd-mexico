import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

const SPEAKERS: Record<string, string> = {
  daniel: "daniel-saldarriaga.png",
  alejandra: "alejandra-bricio.png",
};

const W = 560;

function buildGradientSVG(h: number, toColor: string): Buffer {
  const gradientStart = Math.round(h * 0.45);
  const svg = `<svg width="${W}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${toColor}" stop-opacity="0"/>
        <stop offset="${Math.round((1 - gradientStart / h) * 100)}%" stop-color="${toColor}" stop-opacity="0"/>
        <stop offset="100%" stop-color="${toColor}" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${h}" fill="url(#g)"/>
  </svg>`;
  return Buffer.from(svg, "utf8");
}

export async function GET(request: NextRequest) {
  const speaker = request.nextUrl.searchParams.get("speaker");
  const theme = request.nextUrl.searchParams.get("theme") ?? "light";

  if (!speaker || !SPEAKERS[speaker]) {
    return NextResponse.json({ error: "speaker param required: daniel | alejandra" }, { status: 400 });
  }

  const imgPath = path.join(process.cwd(), "public", "images", "keynotes", SPEAKERS[speaker]);
  if (!fs.existsSync(imgPath)) {
    return NextResponse.json({ error: "photo not found" }, { status: 404 });
  }

  const gradientColor = theme === "dark" ? "#0C0D10" : "#ffffff";

  const source = sharp(imgPath).resize(W, undefined, { withoutEnlargement: true });
  const { height: h } = await source.metadata();
  const finalH = h ?? 600;

  const gradient = await sharp(buildGradientSVG(finalH, gradientColor))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const result = await sharp(imgPath)
    .resize(W, undefined, { withoutEnlargement: true })
    .composite([{ input: gradient.data, raw: { width: W, height: finalH, channels: 4 }, blend: "over" }])
    .png()
    .toBuffer();

  return new NextResponse(new Uint8Array(result), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
