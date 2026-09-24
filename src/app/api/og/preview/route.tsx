/**
 * Card preview — Variant B only (production design)
 * GET /api/og/preview?slugs=slug1,slug2,slug3,slug4   → different speakers
 * GET /api/og/preview?slug=carlos-zambrano&count=1     → same speaker N times
 */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { SpeakerProfile, type ISpeakerProfile } from "@/models/speaker-profile";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import sharp from "sharp";
import QRCode from "qrcode";
import { EVENT, SITE_HOST, SITE_URL } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1080;
const H = 1080;
const ORANGE = "#F2A6F0";
const BG = "#0A0A0F";

function loadAsset(filePath: string, mime: string) {
  const buf = fs.readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), filePath));
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const TRACK_COLORS: Record<string, string> = {
  cloud: "#F2A6F0", devops: "#4FC3F7", "ai-ml": "#CE93D8",
  security: "#EF9A9A", "soft-skills": "#A5D6A7", general: "#F2A6F0",
};


interface Speaker {
  slug: string;
  name: string;
  role: string;
  company: string;
  tagline: string;
  photo: string;
  talkTitle: string;
  track: string;
  companyLogo: string;
  audienceLevel: string;
}

// ── Photo tile (overflow + objectFit + accent border) ────────────────────────
function PhotoTile({ photo, name, w, h, radius = 16 }: { photo: string; name: string; w: number; h: number; radius?: number }) {
  const initials = name.split(" ").slice(0, 2).map((s) => s[0] ?? "").join("").toUpperCase();
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      overflow: "hidden", display: "flex",
      border: `4px solid ${ORANGE}70`,
    }}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" style={{ width: w, height: h, objectFit: "cover" }} />
      ) : (
        <div style={{ width: w, height: h, background: "#16161F", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: Math.floor(w * 0.28), fontWeight: 700, color: ORANGE }}>{initials}</span>
        </div>
      )}
    </div>
  );
}



// ── VARIANT B ─────────────────────────────────────────────────────────────────
function VariantB({
  speakers, awsLogo, eventLogo, sbgIcon, fontData, qrDataUrl,
}: {
  speakers: Speaker[];
  awsLogo: string;
  eventLogo: string;
  sbgIcon: string;
  fontData: ArrayBuffer;
  qrDataUrl: string;
}) {
  const primary = speakers[0];
  const n = speakers.length;
  const isMulti = n > 1;

  const trackColor = TRACK_COLORS[primary.track] ?? ORANGE;
  const trackLabel = primary.track.replace(/-/g, " ").toUpperCase();
  const speakerLine = primary.tagline || [primary.role, primary.company].filter(Boolean).join(" · ");

  // No title truncation — full title always
  const title = primary.talkTitle;
  const titleSize = isMulti ? 42 : title.length <= 60 ? 49 : title.length <= 80 ? 41 : title.length <= 105 ? 34 : 27;

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, position: "relative", display: "flex", background: BG, fontFamily: "JetBrainsMono" }}>

        {/* Accent left stripe */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 7, height: H, background: ORANGE, display: "flex" }} />

        {/* ── SINGLE SPEAKER: full-height photo on left ── */}
        {!isMulti && primary.photo && (
          <>
            <div style={{ position: "absolute", top: 0, left: 7, width: 490, height: H, display: "flex", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={primary.photo} alt="" style={{ width: 490, height: H, objectFit: "cover" }} />
            </div>
            <div style={{
              position: "absolute", top: 0, left: 310, width: 190, height: H,
              background: `linear-gradient(to right, transparent, ${BG})`,
              display: "flex",
            }} />
          </>
        )}

        {/* ── HEADER: AWS logo + SBG chip ── */}
        <div style={{
          position: "absolute", top: 30,
          left: isMulti ? 67 : 530, right: 60,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={awsLogo} alt="" style={{ height: 48, width: 78, objectFit: "contain" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Student</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Community Day</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>México 2026</span>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sbgIcon} alt="" style={{ width: 152, height: 152, objectFit: "contain" }} />
        </div>

        {/* ── CONTENT: track badge + title ── */}
        <div style={{
          position: "absolute",
          top: isMulti ? 220 : 180,
          left: isMulti ? 67 : 530,
          right: 60,
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          {primary.track && (
            <div style={{ display: "flex" }}>
              <span style={{
                background: trackColor + "20", border: `2px solid ${trackColor}60`,
                borderRadius: 999, padding: "5px 18px",
                fontSize: 15, color: trackColor, fontWeight: 700, letterSpacing: "0.06em",
              }}>
                {trackLabel}
              </span>
            </div>
          )}

          <div style={{ fontSize: titleSize, fontWeight: 700, color: "#fff", lineHeight: 1.18, letterSpacing: "-0.2px" }}>
            {title}
          </div>

          {/* Single speaker name section */}
          {!isMulti && (
            <div style={{
              position: "absolute", top: 352, left: 0, right: 0,
              display: "flex", flexDirection: "column", gap: 0,
              borderTop: `3px solid ${ORANGE}50`, paddingTop: 20,
            }}>
              <span style={{ fontSize: 40, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>{primary.name}</span>
              {speakerLine && (
                <span style={{ fontSize: 20, color: ORANGE, fontWeight: 700, marginTop: 8 }}>{speakerLine.slice(0, 50)}</span>
              )}
            </div>
          )}
        </div>

        {/* ── MULTI: 2 speakers ── */}
        {isMulti && n === 2 && (
          <div style={{ position: "absolute", top: 390, left: 67, display: "flex", gap: 56 }}>
            {speakers.map((sp, i) => {
              const tag = (sp.tagline || [sp.role, sp.company].filter(Boolean).join(" · ")).slice(0, 44);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <PhotoTile photo={sp.photo} name={sp.name} w={390} h={385} radius={20} />
                  <span style={{ fontSize: 26, fontWeight: 700, color: "#fff", textAlign: "center" }}>{sp.name}</span>
                  {tag && <span style={{ fontSize: 17, color: ORANGE, textAlign: "center", fontWeight: 700 }}>{tag}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── MULTI: 3 speakers ── */}
        {isMulti && n === 3 && (
          <div style={{ position: "absolute", top: 390, left: 67, display: "flex", gap: 26 }}>
            {speakers.map((sp, i) => {
              const tag = (sp.tagline || [sp.role, sp.company].filter(Boolean).join(" · ")).slice(0, 40);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <PhotoTile photo={sp.photo} name={sp.name} w={300} h={320} radius={16} />
                  <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", textAlign: "center" }}>{sp.name}</span>
                  {tag && <span style={{ fontSize: 14, color: ORANGE, textAlign: "center", fontWeight: 700 }}>{tag}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── MULTI: 4 speakers ── */}
        {isMulti && n >= 4 && (
          <div style={{ position: "absolute", top: 390, left: 67, display: "flex", gap: 20 }}>
            {speakers.slice(0, 4).map((sp, i) => {
              const tag = (sp.tagline || [sp.role, sp.company].filter(Boolean).join(" · ")).slice(0, 34);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <PhotoTile photo={sp.photo} name={sp.name} w={218} h={260} radius={14} />
                  <span style={{ fontSize: 17, fontWeight: 700, color: "#fff", textAlign: "center" }}>{sp.name}</span>
                  {tag && <span style={{ fontSize: 12, color: ORANGE, textAlign: "center", fontWeight: 700 }}>{tag}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── INFO + QR: single speaker — below name ── */}
        {!isMulti && (
          <div style={{
            position: "absolute", top: 645, left: 530, right: 60,
            display: "flex", flexDirection: "column", gap: 3,
          }}>
            <span style={{ fontSize: 19, fontWeight: 700, color: "#ffffff" }}>Nov 4, 2026</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>{EVENT.venue.name}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>Ciudad de México</span>
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="" style={{ width: 170, height: 170, marginTop: 32 }} />
            )}
          </div>
        )}

        {/* ── INFO: 2-speaker ── */}
        {isMulti && n === 2 && (
          <div style={{
            position: "absolute", bottom: 110, left: 0, right: 0,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          }}>
            <span style={{ fontSize: 19, fontWeight: 700, color: "#ffffff" }}>Nov 4, 2026</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>{EVENT.venue.name}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>Ciudad de México</span>
          </div>
        )}

        {/* ── INFO: 3-speaker — centered between photos and domain ── */}
        {isMulti && n === 3 && (
          <div style={{
            position: "absolute", bottom: 160, left: 0, right: 0,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          }}>
            <span style={{ fontSize: 19, fontWeight: 700, color: "#ffffff" }}>Nov 4, 2026</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>{EVENT.venue.name}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>Ciudad de México</span>
          </div>
        )}

        {/* ── INFO: 4-speaker — centered between photos and domain ── */}
        {isMulti && n >= 4 && (
          <div style={{
            position: "absolute", bottom: 195, left: 0, right: 0,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          }}>
            <span style={{ fontSize: 19, fontWeight: 700, color: "#ffffff" }}>Nov 4, 2026</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>{EVENT.venue.name}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>Ciudad de México</span>
          </div>
        )}

        {/* ── QR: 2-speaker — smaller, nudged right ── */}
        {isMulti && n === 2 && qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="" style={{
            position: "absolute", bottom: 40, left: 68,
            width: 148, height: 148,
          }} />
        )}

        {/* ── QR: 3 & 4-speaker — full size, mirrors event logo ── */}
        {isMulti && n >= 3 && qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="" style={{
            position: "absolute", bottom: 40, left: 44,
            width: 195, height: 195,
          }} />
        )}

        {/* ── DOMAIN — centered, accent ── */}
        <div style={{
          position: "absolute", bottom: 58, left: 0, right: 0,
          display: "flex", justifyContent: "center",
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: ORANGE, letterSpacing: "0.08em" }}>
            {SITE_HOST}
          </span>
        </div>

        {/* ── COMPANY LOGO — bottom-left corner, single speaker only ── */}
        {!isMulti && primary.companyLogo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primary.companyLogo} alt="" style={{ position: "absolute", bottom: 16, left: 16, width: 180, height: 72, objectFit: "contain", opacity: 0.9 }} />
        )}

        {/* ── EVENT LOGO — bottom-right ── */}
        {/* card 1: untouched */}
        {!isMulti && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={eventLogo} alt="" style={{ position: "absolute", bottom: 40, right: 44, width: 195, height: 195, objectFit: "contain" }} />
        )}
        {/* card 2: same size, lowered to center-align with the smaller QR */}
        {isMulti && n === 2 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={eventLogo} alt="" style={{ position: "absolute", bottom: 17, right: 44, width: 195, height: 195, objectFit: "contain" }} />
        )}
        {/* cards 3 & 4: enlarged so visible logo matches QR visual size */}
        {isMulti && n >= 3 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={eventLogo} alt="" style={{ position: "absolute", bottom: 40, right: 44, width: 240, height: 240, objectFit: "contain" }} />
        )}
      </div>
    ),
    { width: W, height: H, fonts: [{ name: "JetBrainsMono", data: fontData, weight: 700, style: "normal" }] },
  );
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

function fetchBuffer(url: string, redirectsLeft = 5): Promise<{ buf: Buffer; ct: string } | null> {
  return new Promise((resolve) => {
    let parsed: URL;
    try { parsed = new URL(url); } catch { return resolve(null); }

    const lib = parsed.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        method: "GET",
        family: 4, // force IPv4 DNS resolution
        headers: { "User-Agent": "Mozilla/5.0 NextJS-OG/1.0", "Accept": "image/*,*/*" },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if ([301, 302, 307, 308].includes(status) && res.headers.location && redirectsLeft > 0) {
          res.resume();
          fetchBuffer(res.headers.location, redirectsLeft - 1).then(resolve);
          return;
        }
        if (status !== 200) { res.resume(); return resolve(null); }
        const ct = (res.headers["content-type"] as string | undefined) ?? "image/png";
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve({ buf: Buffer.concat(chunks), ct }));
        res.on("error", () => resolve(null));
      },
    );
    req.on("error", (err) => { console.error(`[og] socket error: ${err.message}`); resolve(null); });
    req.setTimeout(15000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function fetchAsDataUrl(url: string, label = "img"): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  const result = await fetchBuffer(url);
  if (!result) {
    console.error(`[og] ${label} FAILED → ${url.slice(0, 80)}`);
    return "";
  }
  // Keep PNG as-is to preserve transparency
  if (result.ct.includes("png") || url.toLowerCase().includes(".png")) {
    return `data:image/png;base64,${result.buf.toString("base64")}`;
  }
  try {
    const jpeg = await sharp(result.buf).jpeg({ quality: 92 }).toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (e) {
    console.warn(`[og] ${label} sharp failed: ${e}`);
    return `data:${result.ct};base64,${result.buf.toString("base64")}`;
  }
}

async function buildSpeaker(base: Awaited<ReturnType<typeof SpeakerProfile.findOne>> | (ISpeakerProfile & { _id: unknown })): Promise<Speaker> {
  if (!base) throw new Error("null profile");
  const [photo, companyLogo] = await Promise.all([
    fetchAsDataUrl(base.photo ?? "", "photo"),
    fetchAsDataUrl((base.companyLogo as string | undefined) ?? "", "logo"),
  ]);
  return {
    slug: (base.slug as string | undefined) ?? "",
    name: base.name ?? "",
    role: (base.role as string | undefined) ?? "",
    company: (base.company as string | undefined) ?? "",
    tagline: (base.tagline as string | undefined) ?? "",
    photo,
    talkTitle: base.talkTitle ?? "",
    track: (base.track as string | undefined) ?? "general",
    companyLogo,
    audienceLevel: (base.audienceLevel as string | undefined) ?? "",
  };
}

async function generateQR(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    color: { dark: "#F2A6F0", light: "#00000000" },
    width: 220,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const slugsParam = searchParams.get("slugs");
  const slugParam = searchParams.get("slug") ?? "carlos-zambrano";
  const count = Math.min(4, Math.max(1, parseInt(searchParams.get("count") ?? "1", 10)));

  await connectDB();

  let speakers: Speaker[];

  if (slugsParam) {
    const slugList = slugsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
    const profiles = await Promise.all(slugList.map((s) => SpeakerProfile.findOne({ slug: s }).lean()));
    speakers = await Promise.all(profiles.filter(Boolean).map((p) => buildSpeaker(p)));
    if (speakers.length === 0) return new Response("No speakers found", { status: 404 });
  } else {
    const base = await SpeakerProfile.findOne({ slug: slugParam }).lean();
    if (!base) return new Response("Speaker not found", { status: 404 });
    const sp = await buildSpeaker(base);
    speakers = Array.from({ length: count }, () => sp);
  }

  const fontBuf = fs.readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), "public/fonts/JetBrainsMono-Bold.ttf"));
  const fontData = fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength) as ArrayBuffer;
  const awsLogo = loadAsset("public/images/logos/aws-logo.svg", "image/svg+xml");
  const eventLogo = loadAsset("public/images/logos/event-logo.png", "image/png");
  const sbgIcon = loadAsset("public/images/logos/sbg-icon-orange.png", "image/png");

  const primary = speakers[0];
  const qrTarget = primary.slug
    ? `${SITE_URL}/speakers/${primary.slug}`
    : SITE_URL;
  const qrDataUrl = await generateQR(qrTarget);

  const res = VariantB({ speakers, awsLogo, eventLogo, sbgIcon, fontData, qrDataUrl });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
