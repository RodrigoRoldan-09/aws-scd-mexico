import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SpeakerProfile } from "@/models/speaker-profile";
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

const TRACK_COLORS: Record<string, string> = {
  cloud: "#F2A6F0", devops: "#4FC3F7", "ai-ml": "#CE93D8",
  security: "#EF9A9A", "soft-skills": "#A5D6A7", general: "#F2A6F0",
};

function loadAsset(filePath: string, mime: string) {
  const buf = fs.readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), filePath));
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

// ── Fetch remote image → data URL ────────────────────────────────────────────

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
        family: 4,
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
    req.on("error", () => resolve(null));
    req.setTimeout(15000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function fetchAsDataUrl(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  const result = await fetchBuffer(url);
  if (!result) return "";
  try {
    const jpeg = await sharp(result.buf)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return `data:${result.ct};base64,${result.buf.toString("base64")}`;
  }
}

async function generateQR(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    color: { dark: "#F2A6F0", light: "#00000000" },
    width: 220, margin: 1, errorCorrectionLevel: "M",
  });
}

// ── Photo tile (rounded borders + accent — used in multi-speaker) ──────

function PhotoTile({ photo, name, w, h, radius = 16 }: { photo: string; name: string; w: number; h: number; radius?: number }) {
  const initials = name.split(" ").slice(0, 2).map((s) => s[0] ?? "").join("").toUpperCase();
  return (
    <div style={{ width: w, height: h, borderRadius: radius, overflow: "hidden", display: "flex", border: `4px solid ${ORANGE}70` }}>
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

// ── Types ─────────────────────────────────────────────────────────────────────

type CoSpeakerData = {
  firstName?: string; lastName?: string;
  role?: string; tagline?: string; company?: string;
  companyLogo?: string; photo?: string;
};

interface SpeakerEntry {
  name: string; photo: string;
  role: string; tagline: string; company: string; companyLogo: string;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  await connectDB();
  const profile = await SpeakerProfile.findOne({ slug }).lean();
  if (!profile) return new Response("Not found", { status: 404 });

  const isPreview = _request.nextUrl.searchParams.has("preview");
  const storedCardUrl = (profile.cardImageUrl as string | undefined) ?? "";
  if (storedCardUrl && !isPreview) {
    return NextResponse.redirect(storedCardUrl, { status: 302 });
  }

  // Co-speakers (max 3 → 4 total)
  const rawCoSpeakers = (profile.coSpeakers as CoSpeakerData[] | undefined) ?? [];
  const coSpeakers = rawCoSpeakers.slice(0, 3);
  const totalSpeakers = 1 + coSpeakers.length;
  const isMulti = totalSpeakers > 1;

  // Fetch all photos in parallel
  const photoResults = await Promise.all([
    fetchAsDataUrl((profile.photo as string | undefined) ?? ""),
    fetchAsDataUrl((profile.companyLogo as string | undefined) ?? ""),
    ...coSpeakers.map((cs) => Promise.all([
      fetchAsDataUrl((cs.photo as string | undefined) ?? ""),
      fetchAsDataUrl((cs.companyLogo as string | undefined) ?? ""),
    ])),
  ]);
  const mainPhoto     = photoResults[0] as string;
  const companyLogo   = photoResults[1] as string;
  const coResults     = (photoResults.slice(2) as [string, string][]);

  // Build speaker entries for multi-speaker layout
  const speakers: SpeakerEntry[] = [
    {
      name: (profile.name as string | undefined) ?? "",
      photo: mainPhoto,
      role: (profile.role as string | undefined) ?? "",
      tagline: (profile.tagline as string | undefined) ?? "",
      company: (profile.company as string | undefined) ?? "",
      companyLogo,
    },
    ...coSpeakers.map((cs, i) => ({
      name: [cs.firstName, cs.lastName].filter(Boolean).join(" "),
      photo: coResults[i]?.[0] ?? "",
      role: cs.role ?? "",
      tagline: cs.tagline ?? "",
      company: cs.company ?? "",
      companyLogo: coResults[i]?.[1] ?? "",
    })),
  ];

  const fontBuf = fs.readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), "public/fonts/JetBrainsMono-Bold.ttf"));
  const fontData = bufferToArrayBuffer(fontBuf);
  const awsLogo   = loadAsset("public/images/logos/aws-logo.svg", "image/svg+xml");
  const eventLogo = loadAsset("public/images/logos/event-logo.png", "image/png");
  const sbgIcon   = loadAsset("public/images/logos/sbg-icon-orange.png", "image/png");

  const profileUrl = `${SITE_URL}/speakers/${slug}`;
  const qrDataUrl  = await generateQR(profileUrl);

  // Canvas editor overrides — only applied in single-speaker mode
  const sp = _request.nextUrl.searchParams;
  const qTitle = isPreview && sp.has("titleCard")  ? sp.get("titleCard")!         : null;
  const qRole  = isPreview && sp.has("roleCard")   ? sp.get("roleCard")!          : null;
  const qCX    = isPreview && sp.has("contentX")   ? Number(sp.get("contentX"))   : null;
  const qCY    = isPreview && sp.has("contentY")   ? Number(sp.get("contentY"))   : null;
  const qNO    = isPreview && sp.has("nameOffset") ? Number(sp.get("nameOffset")) : null;
  const qTS    = isPreview && sp.has("titleSize")  ? Number(sp.get("titleSize"))  : null;
  const qNS    = isPreview && sp.has("nameSize")   ? Number(sp.get("nameSize"))   : null;

  const trackColor  = TRACK_COLORS[(profile.track as string | undefined) ?? "general"] ?? ORANGE;
  const trackLabel  = ((profile.track as string | undefined) ?? "general").replace(/-/g, " ").toUpperCase();

  const speakerLine = qRole ?? (
    (profile.roleCard as string | undefined) ||
    (profile.tagline as string | undefined) ||
    [profile.role as string | undefined, profile.company as string | undefined].filter(Boolean).join(" · ")
  );
  const title = (qTitle ?? ((profile.talkTitleCard as string | undefined) || (profile.talkTitle as string | undefined))) ?? "";
  const name  = (profile.name as string | undefined) ?? "";

  // Single-speaker canvas controls
  const contentX   = qCX ?? (profile.cardContentX   as number | undefined) ?? 530;
  const contentY   = qCY ?? (profile.cardContentY   as number | undefined) ?? 180;
  const nameOffset = qNO ?? (profile.cardNameOffset  as number | undefined) ?? 532;
  const autoSize   = title.length <= 60 ? 49 : title.length <= 80 ? 41 : title.length <= 105 ? 34 : 27;
  const titleSize  = qTS ?? (profile.cardTitleSize as number | null | undefined) ?? autoSize;
  const nameSize   = qNS ?? (profile.cardNameSize  as number | undefined) ?? 40;

  // Multi-speaker title size (fixed — canvas controls don't apply)
  const multiTitleSize = isMulti ? 42 : titleSize;

  const response = new ImageResponse(
    (
      <div style={{ width: W, height: H, position: "relative", display: "flex", background: BG, fontFamily: "JetBrainsMono" }}>

        {/* Accent left stripe */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 7, height: H, background: ORANGE, display: "flex" }} />

        {/* ── SINGLE: full-height photo on left ── */}
        {!isMulti && mainPhoto && (
          <div style={{ display: "flex" }}>
            <div style={{ position: "absolute", top: 0, left: 7, width: 490, height: H, display: "flex", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mainPhoto} alt="" style={{ width: 490, height: H, objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", top: 0, left: 375, width: 125, height: H, background: `linear-gradient(to right, transparent, ${BG})`, display: "flex" }} />
          </div>
        )}

        {/* ── HEADER: AWS logo + SBG chip ── */}
        <div style={{
          position: "absolute", top: 30,
          left: isMulti ? 67 : contentX, right: 60,
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

        {/* ── TRACK BADGE + TITLE ── */}
        <div style={{
          position: "absolute",
          top: isMulti ? 220 : contentY,
          left: isMulti ? 67 : contentX,
          right: 60,
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          {profile.track && (
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
          <div style={{ fontSize: multiTitleSize, fontWeight: 700, color: "#fff", lineHeight: 1.18, letterSpacing: "-0.2px" }}>
            {title}
          </div>
        </div>

        {/* ── SINGLE: name + role ── */}
        {!isMulti && (
          <div style={{
            position: "absolute", top: nameOffset, left: contentX, right: 60,
            display: "flex", flexDirection: "column", gap: 0,
            borderTop: `3px solid ${ORANGE}50`, paddingTop: 20,
          }}>
            <span style={{ fontSize: nameSize, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>{name}</span>
            {speakerLine && (
              <span style={{ fontSize: 20, color: ORANGE, fontWeight: 700, marginTop: 8 }}>{speakerLine.slice(0, 50)}</span>
            )}
          </div>
        )}

        {/* ── MULTI: 2 speakers ── */}
        {isMulti && totalSpeakers === 2 && (
          <div style={{ position: "absolute", top: 390, left: 67, display: "flex", gap: 56 }}>
            {speakers.map((s, i) => {
              const tag = (s.tagline || [s.role, s.company].filter(Boolean).join(" · ")).slice(0, 44);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <PhotoTile photo={s.photo} name={s.name} w={390} h={385} radius={20} />
                  <span style={{ fontSize: 26, fontWeight: 700, color: "#fff", textAlign: "center" }}>{s.name}</span>
                  {tag && <span style={{ fontSize: 17, color: ORANGE, textAlign: "center", fontWeight: 700 }}>{tag}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── MULTI: 3 speakers ── */}
        {isMulti && totalSpeakers === 3 && (
          <div style={{ position: "absolute", top: 390, left: 67, display: "flex", gap: 26 }}>
            {speakers.map((s, i) => {
              const tag = (s.tagline || [s.role, s.company].filter(Boolean).join(" · ")).slice(0, 40);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <PhotoTile photo={s.photo} name={s.name} w={300} h={320} radius={16} />
                  <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", textAlign: "center" }}>{s.name}</span>
                  {tag && <span style={{ fontSize: 14, color: ORANGE, textAlign: "center", fontWeight: 700 }}>{tag}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── MULTI: 4 speakers ── */}
        {isMulti && totalSpeakers >= 4 && (
          <div style={{ position: "absolute", top: 390, left: 67, display: "flex", gap: 20 }}>
            {speakers.slice(0, 4).map((s, i) => {
              const tag = (s.tagline || [s.role, s.company].filter(Boolean).join(" · ")).slice(0, 34);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <PhotoTile photo={s.photo} name={s.name} w={218} h={260} radius={14} />
                  <span style={{ fontSize: 17, fontWeight: 700, color: "#fff", textAlign: "center" }}>{s.name}</span>
                  {tag && <span style={{ fontSize: 12, color: ORANGE, textAlign: "center", fontWeight: 700 }}>{tag}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── INFO + QR: single speaker ── */}
        {!isMulti && (
          <div style={{ position: "absolute", top: 645, left: contentX, right: 60, display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 19, fontWeight: 700, color: "#ffffff" }}>Nov 4, 2026</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>{EVENT.venue.name}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>Ciudad de México</span>
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="" style={{ width: 170, height: 170, marginTop: 32 }} />
            )}
          </div>
        )}

        {/* ── INFO: 2-speaker — centered ── */}
        {isMulti && totalSpeakers === 2 && (
          <div style={{ position: "absolute", bottom: 110, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 19, fontWeight: 700, color: "#ffffff" }}>Nov 4, 2026</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>{EVENT.venue.name}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>Ciudad de México</span>
          </div>
        )}

        {/* ── INFO: 3-speaker ── */}
        {isMulti && totalSpeakers === 3 && (
          <div style={{ position: "absolute", bottom: 160, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 19, fontWeight: 700, color: "#ffffff" }}>Nov 4, 2026</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>{EVENT.venue.name}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>Ciudad de México</span>
          </div>
        )}

        {/* ── INFO: 4-speaker ── */}
        {isMulti && totalSpeakers >= 4 && (
          <div style={{ position: "absolute", bottom: 195, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 19, fontWeight: 700, color: "#ffffff" }}>Nov 4, 2026</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>{EVENT.venue.name}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>Ciudad de México</span>
          </div>
        )}

        {/* ── QR: 2-speaker ── */}
        {isMulti && totalSpeakers === 2 && qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="" style={{ position: "absolute", bottom: 40, left: 68, width: 148, height: 148 }} />
        )}

        {/* ── QR: 3 & 4-speaker ── */}
        {isMulti && totalSpeakers >= 3 && qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="" style={{ position: "absolute", bottom: 40, left: 44, width: 195, height: 195 }} />
        )}

        {/* ── DOMAIN ── */}
        <div style={{ position: "absolute", bottom: 58, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: ORANGE, letterSpacing: "0.08em" }}>{SITE_HOST}</span>
        </div>

        {/* ── COMPANY LOGO — single speaker only ── */}
        {!isMulti && companyLogo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={companyLogo} alt="" style={{ position: "absolute", bottom: 16, left: 16, width: 180, height: 72, objectFit: "contain", opacity: 0.9 }} />
        )}

        {/* ── EVENT LOGO ── */}
        {!isMulti && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={eventLogo} alt="" style={{ position: "absolute", bottom: 40, right: 44, width: 195, height: 195, objectFit: "contain" }} />
        )}
        {isMulti && totalSpeakers === 2 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={eventLogo} alt="" style={{ position: "absolute", bottom: 17, right: 44, width: 195, height: 195, objectFit: "contain" }} />
        )}
        {isMulti && totalSpeakers >= 3 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={eventLogo} alt="" style={{ position: "absolute", bottom: 40, right: 44, width: 240, height: 240, objectFit: "contain" }} />
        )}

      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [{ name: "JetBrainsMono", data: fontData, weight: 700, style: "normal" }],
    },
  );

  response.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  return response;
}
