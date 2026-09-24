import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "AWS Student Community Day México 2026";
export const size = { width: 3200, height: 1688 };
export const contentType = "image/png";

export default function Image() {
  const data = readFileSync(join(process.cwd(), "public/images/seo/banner.png"));
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": "image/png" },
  });
}
