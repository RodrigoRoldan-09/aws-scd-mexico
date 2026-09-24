import { ImageResponse } from "next/og";
import { connectDB } from "@/lib/db";
import { SpeakerProfile } from "@/models/speaker-profile";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1080, height: 1080 };

function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

const TRACK_COLORS: Record<string, string> = {
  cloud: "#F2A6F0",
  devops: "#4FC3F7",
  "ai-ml": "#CE93D8",
  security: "#EF9A9A",
  "soft-skills": "#A5D6A7",
  general: "#F2A6F0",
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  await connectDB();
  const profile = await SpeakerProfile.findOne({ slug }).lean();

  if (!profile) {
    return new ImageResponse(<div style={{ width: 1080, height: 1080, background: "#000000", display: "flex" }} />, size);
  }

  const fontBuf = fs.readFileSync(path.join(process.cwd(), "public/fonts/JetBrainsMono-Bold.ttf"));
  const fontData = bufferToArrayBuffer(fontBuf);

  let templateDataUrl: string | null = null;
  try {
    const tmpl = fs.readFileSync(path.join(process.cwd(), "public/images/speakers/speaker-card-template.png"));
    templateDataUrl = `data:image/png;base64,${tmpl.toString("base64")}`;
  } catch { /* programmatic fallback */ }


  const initials = profile.name.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("");
  const trackColor = TRACK_COLORS[profile.track] ?? "#F2A6F0";
  const trackLabel = profile.track.replace(/-/g, " ").toUpperCase();
  const abstract = profile.talkAbstract.length > 160 ? profile.talkAbstract.slice(0, 160) + "…" : profile.talkAbstract;
  const speakerLine = [profile.role, profile.company].filter(Boolean).join(" · ");

  return new ImageResponse(
    (
      <div style={{ width: 1080, height: 1080, position: "relative", display: "flex", fontFamily: "JetBrainsMono" }}>
        {templateDataUrl ? (
          <img src={templateDataUrl} alt="" style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1080 }} />
        ) : (
          <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1080, background: "linear-gradient(135deg, #000000 0%, #0A0A0F 55%, #16161F 100%)", display: "flex" }} />
        )}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1080, display: "flex", flexDirection: "column", padding: "190px 80px 160px" }}>
          {/* Main row: content left + photo right (photo right = never touches AWS logo at top-left) */}
          <div style={{ display: "flex", flex: 1, gap: 52, alignItems: "center" }}>
            {/* LEFT: track badge, title, abstract, company logo */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 22 }}>
              <div style={{ display: "flex" }}>
                <span style={{ background: `${trackColor}28`, border: `2px solid ${trackColor}88`, borderRadius: 999, padding: "6px 22px", fontSize: 20, color: trackColor, fontWeight: 700, letterSpacing: "0.05em" }}>
                  {trackLabel}
                </span>
              </div>
              <div style={{ fontSize: 50, fontWeight: 700, color: "#ffffff", lineHeight: 1.18, letterSpacing: "-0.4px" }}>
                {profile.talkTitle || "Título de la charla"}
              </div>
              {abstract && (
                <div style={{ fontSize: 24, color: "#9ca3af", lineHeight: 1.55 }}>{abstract}</div>
              )}
              {profile.companyLogo && (
                <div style={{ display: "flex", marginTop: 6 }}>
                  <img src={profile.companyLogo} alt="" style={{ height: 52, maxWidth: 190, objectFit: "contain" }} />
                </div>
              )}
            </div>
            {/* RIGHT: Speaker photo — tall, prominent, away from AWS logo */}
            <div style={{ display: "flex", flexShrink: 0 }}>
              {profile.photo ? (
                <img src={profile.photo} alt="" style={{ width: 340, height: 490, borderRadius: 22, border: `5px solid ${trackColor}`, objectFit: "cover", objectPosition: "top center" }} />
              ) : (
                <div style={{ width: 340, height: 490, borderRadius: 22, border: `5px solid ${trackColor}`, background: "#1e2438", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 120, fontWeight: 700, color: trackColor }}>{initials}</span>
                </div>
              )}
            </div>
          </div>
          {/* Bottom: name badge left, right clear for template event logo */}
          <div style={{ display: "flex", alignItems: "center", marginTop: 40 }}>
            <div style={{ display: "flex", flexDirection: "column", background: "#F2A6F020", border: "2px solid #F2A6F055", borderRadius: 16, padding: "14px 28px" }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: "#F2A6F0" }}>{profile.name}</span>
              {speakerLine && <span style={{ fontSize: 22, color: "#d1d5db", marginTop: 4 }}>{speakerLine}</span>}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "JetBrainsMono", data: fontData, weight: 700, style: "normal" }] },
  );
}
