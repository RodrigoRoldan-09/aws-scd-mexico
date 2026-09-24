"use client";

import Link from "next/link";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { avatarUrl } from "@/lib/avatar";
import {
  Settings, Loader2,
  Fingerprint, X, Check, Pencil, Eye,
} from "lucide-react";

/* ── CSS Animations (injected once as <style>) ── */
const ANIM_CSS = `
@keyframes gradient-border {
  0%,100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
@keyframes breathe {
  0%,100% { opacity:.5; transform:translateX(-50%) scale(1); }
  50%      { opacity:.9; transform:translateX(-50%) scale(1.15); }
}
@keyframes pulse-ring {
  0%   { transform:scale(1);   opacity:.5; }
  100% { transform:scale(1.7); opacity:0; }
}
@keyframes stamp-appear {
  0%   { transform:scale(.4) rotate(-18deg); opacity:0; }
  75%  { transform:scale(1.06);              opacity:1; }
  100% { transform:scale(1);                 opacity:1; }
}
@keyframes fade-up {
  from { opacity:0; transform:translateY(20px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes owner-pulse {
  0%,100% { box-shadow:0 0 6px rgba(52,211,153,.4); }
  50%     { box-shadow:0 0 18px rgba(52,211,153,.7); }
}
@keyframes text-glow {
  0%,100% { text-shadow:0 0 20px rgba(193,67,188,.3); }
  50%     { text-shadow:0 0 45px rgba(193,67,188,.75); }
}
@keyframes spin { to { transform:rotate(360deg); } }
`;

/* ── Social platforms ──
   atSign: el handle se muestra con @ (Builder Center, Instagram, TikTok).
   domains: para validar un enlace pegado. prefix: hint en modo "usuario".
   Se guarda siempre el USERNAME; urlFn arma la URL. */
const SOCIAL_PLATFORMS = [
  {
    id: "builderCenter" as const,
    label: "Builder Center", bg: "#232F3E",
    placeholder: "tu-usuario", atSign: true,
    domains: ["builder.aws.com"], prefix: "builder.aws.com/community/@",
    urlFn: (u: string) => `https://builder.aws.com/community/@${u}`,
    icon: (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/images/logos/aws-logo.svg" alt="AWS" style={{ height: 13, width: "auto", filter: "brightness(0) invert(1)" }} />
    ),
  },
  {
    id: "linkedin" as const,
    label: "LinkedIn", bg: "#0077B5",
    placeholder: "tu-usuario", atSign: false,
    domains: ["linkedin.com"], prefix: "linkedin.com/in/",
    urlFn: (u: string) => `https://linkedin.com/in/${u}`,
    icon: <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
  },
  {
    id: "instagram" as const,
    label: "Instagram", bg: "#E1306C",
    placeholder: "tu.usuario", atSign: true,
    domains: ["instagram.com"], prefix: "instagram.com/",
    urlFn: (u: string) => `https://instagram.com/${u}`,
    icon: <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  },
  {
    id: "x" as const,
    label: "X / Twitter", bg: "#14171A",
    placeholder: "tu_usuario", atSign: false,
    domains: ["x.com", "twitter.com"], prefix: "x.com/",
    urlFn: (u: string) => `https://x.com/${u}`,
    icon: <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  {
    id: "github" as const,
    label: "GitHub", bg: "#24292f",
    placeholder: "tu-usuario", atSign: false,
    domains: ["github.com"], prefix: "github.com/",
    urlFn: (u: string) => `https://github.com/${u}`,
    icon: <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>,
  },
  {
    id: "tiktok" as const,
    label: "TikTok", bg: "#010101",
    placeholder: "tu.usuario", atSign: true,
    domains: ["tiktok.com"], prefix: "tiktok.com/@",
    urlFn: (u: string) => `https://tiktok.com/@${u}`,
    icon: <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.77a4.85 4.85 0 0 1-1-.08z"/></svg>,
  },
] as const;

type SocialPlatformId = typeof SOCIAL_PLATFORMS[number]["id"];

/* Saca el username de un enlace pegado (valida dominio). Devuelve null si no corresponde. */
function usernameFromLink(plat: typeof SOCIAL_PLATFORMS[number], raw: string): string | null {
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); } catch { return null; }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  if (!(plat.domains as readonly string[]).includes(host)) return null;
  const segs = u.pathname.split("/").map((s) => s.trim()).filter(Boolean);
  let user = "";
  if (plat.id === "linkedin") { const i = segs.indexOf("in"); user = i >= 0 ? segs[i + 1] ?? "" : segs[segs.length - 1] ?? ""; }
  else if (plat.id === "builderCenter") { const i = segs.indexOf("community"); user = i >= 0 ? segs[i + 1] ?? "" : segs[segs.length - 1] ?? ""; }
  else { user = segs[0] ?? ""; }
  user = user.replace(/^@+/, "");
  return /^[A-Za-z0-9._-]{1,60}$/.test(user) ? user : null;
}

/* Limpia un username escrito a mano. Devuelve null si no es válido. */
function cleanUsername(raw: string): string | null {
  const u = raw.trim().replace(/^@+/, "").replace(/\s+/g, "");
  return /^[A-Za-z0-9._-]{1,60}$/.test(u) ? u : null;
}

const ROLE_LABEL: Record<string, string> = {
  attendee: "Asistente", speaker: "Speaker",
  volunteer: "Voluntario", organizer: "Organizador",
};
const ROLE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  attendee:  { bg: "rgba(14,165,233,.12)",  text: "#7dd3fc", border: "rgba(14,165,233,.3)"  },
  speaker:   { bg: "rgba(193,67,188,.12)",  text: "#C143BC", border: "rgba(193,67,188,.45)" },
  volunteer: { bg: "rgba(52,211,153,.12)",  text: "#6ee7b7", border: "rgba(52,211,153,.3)"  },
  organizer: { bg: "rgba(97,59,184,.15)",  text: "#a78bfa", border: "rgba(97,59,184,.4)"  },
};

interface PassportSocial {
  builderCenter?: string; linkedin?: string; instagram?: string;
  x?: string; github?: string; tiktok?: string;
}
interface PassportStats {
  views: number;
  clicks: Record<string, number>;
}
interface PassportData {
  shortId: string; role: string; firstName: string; lastName: string;
  company?: string; jobTitle?: string; social?: PassportSocial;
  stats?: PassportStats;
  stamps: { sponsorId: string; sponsorName: string; stampedAt: string }[];
}
interface Sponsor { _id: string; sponsorName: string; logoUrl?: string; }

/* ── Helpers ── */
function Perf() {
  return (
    <div style={{ display: "flex", gap: 3, padding: "2px 18px", margin: "2px 0" }}>
      {Array.from({ length: 48 }).map((_, i) => (
        <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "rgba(193,67,188,0.14)", flexShrink: 0 }} />
      ))}
    </div>
  );
}

const STAMP_ROTS = [-11, 7, -5, 13, -8, 6, -13, 9, -4, 11];

function StampItem({ sponsor, collected, index }: { sponsor: Sponsor; collected: boolean; index: number }) {
  const rot = STAMP_ROTS[index % STAMP_ROTS.length];
  return (
    <div style={{
      aspectRatio: "1", borderRadius: "50%", padding: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
      filter: collected ? "drop-shadow(0 0 10px rgba(255,255,255,.55))" : "grayscale(1) opacity(.2)",
      transition: "all .5s cubic-bezier(.34,1.56,.64,1)",
    }}>
      {sponsor.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sponsor.logoUrl} alt={sponsor.sponsorName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        <span style={{ fontFamily: "monospace", fontSize: 8, color: "#8B84A0", textAlign: "center", lineHeight: 1.2 }}>
          {sponsor.sponsorName}
        </span>
      )}
    </div>
  );
}

function PinDigits({ digits, onChange, hasError, disabled }: {
  digits: string[]; onChange: (d: string[]) => void; hasError?: boolean; disabled?: boolean;
}) {
  const refs: React.RefObject<HTMLInputElement | null>[] = [
    { current: null }, { current: null }, { current: null }, { current: null },
  ];
  function handleChange(i: number, val: string) {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = d; onChange(next);
    if (d && i < 3) refs[i + 1].current?.focus();
  }
  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs[i - 1].current?.focus();
  }
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i] as React.RefObject<HTMLInputElement>}
          type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1}
          value={d} disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          autoFocus={i === 0}
          style={{
            width: 52, height: 56, textAlign: "center",
            fontFamily: "monospace", fontSize: 22, fontWeight: 700,
            color: "#f9fafb", borderRadius: 14,
            border: hasError ? "1.5px solid rgba(239,68,68,.5)" : d ? "1.5px solid rgba(193,67,188,.7)" : "1.5px solid #2C2550",
            background: hasError ? "rgba(239,68,68,.05)" : d ? "rgba(193,67,188,.08)" : "#1E1838",
            outline: "none", transition: "all .2s",
            opacity: disabled ? .4 : 1, cursor: disabled ? "not-allowed" : "text",
          }}
        />
      ))}
    </div>
  );
}

/* ══════ MAIN PAGE ══════ */
export default function PasaportePage({ params }: { params: Promise<{ shortId: string }> }) {
  const { shortId } = use(params);

  const [passport, setPassport]   = useState<PassportData | null>(null);
  const [sponsors, setSponsors]   = useState<Sponsor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);

  const [isOwner, setIsOwner]             = useState(false);
  const [showPinSection, setShowPinSection] = useState(false);
  const [pinDigits, setPinDigits]         = useState(["", "", "", ""]);
  const [pinError, setPinError]           = useState<string | null>(null);
  const [pinBlocked, setPinBlocked]       = useState(false);
  const [verifyingPin, setVerifyingPin]   = useState(false);

  const [showStampModal, setShowStampModal] = useState(false);
  const [stampDigits, setStampDigits]       = useState(["", "", "", ""]);
  const [stamping, setStamping]             = useState(false);
  const [stampResult, setStampResult]       = useState<{ ok: boolean; msg: string } | null>(null);

  const [editingSocial, setEditingSocial] = useState(false);
  const [socialDraft, setSocialDraft]     = useState<Partial<Record<SocialPlatformId, string>>>({});
  const [savingSocial, setSavingSocial]   = useState(false);
  const [socialSaved, setSocialSaved]     = useState(false);
  const [addingPlatform, setAddingPlatform] = useState<SocialPlatformId | null>(null);
  const [addMode, setAddMode]             = useState<"username" | "link">("username");
  const [addInput, setAddInput]           = useState("");
  const [addError, setAddError]           = useState<string | null>(null);
  const [pendingFields, setPendingFields] = useState<string[]>([]);
  const [pendingEmail, setPendingEmail]   = useState<string | null>(null);
  const [unverified, setUnverified]       = useState(false);

  const viewTracked = useRef(false);

  const cookieKey = `pp_owner_${shortId}`;
  function saveOwnerCookie(p: string) { document.cookie = `${cookieKey}=${p}; max-age=${24*3600}; SameSite=Strict; path=/`; }
  function readOwnerCookie() { const m = document.cookie.match(new RegExp(`(?:^|; )${cookieKey}=([^;]*)`)); return m ? m[1] : null; }
  function clearOwnerCookie() { document.cookie = `${cookieKey}=; max-age=0; path=/`; }

  const loadPassport = useCallback(async (withPin?: string) => {
    try {
      const res  = await fetch(`/api/passport/${shortId}${withPin ? `?pin=${withPin}` : ""}`);
      const data = await res.json();
      if (res.status === 404) { setNotFound(true); return; }
      if (data.passport) {
        setPassport(data.passport);
        setSponsors(data.sponsors ?? []);
        if (data.isOwner) {
          setIsOwner(true);
          if (withPin) saveOwnerCookie(withPin);
          const s = data.passport.social ?? {};
          setSocialDraft({ builderCenter: s.builderCenter ?? "", linkedin: s.linkedin ?? "", instagram: s.instagram ?? "", x: s.x ?? "", github: s.github ?? "", tiktok: s.tiktok ?? "" });
        }
      }
      if (res.status === 429 || data.rateLimited) { setPinBlocked(true); setPinError(data.error ?? "Demasiados intentos."); }
      else if (withPin && !data.isOwner && data.pinError) { setPinError(data.pinError); if (data.rateLimited) { setPinBlocked(true); clearOwnerCookie(); } }
    } catch { setNotFound(true); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortId]);

  useEffect(() => {
    (async () => { setLoading(true); await loadPassport(readOwnerCookie() ?? undefined); setLoading(false); })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortId]);

  useEffect(() => { if (isOwner) setShowPinSection(false); }, [isOwner]);

  /* ── Stat helpers — cookie-gated to prevent trivial inflation ── */
  function statCookieKey(type: string) { return `pp_stat_${type}_${shortId}`; }
  function hasStatCookie(type: string) {
    return document.cookie.includes(`${statCookieKey(type)}=1`);
  }
  function setStatCookie(type: string, maxAgeS: number) {
    document.cookie = `${statCookieKey(type)}=1; max-age=${maxAgeS}; SameSite=Strict; path=/`;
  }

  /* ── Track view (non-owners, once per 24 h per device) ── */
  useEffect(() => {
    if (passport && !isOwner && !viewTracked.current) {
      viewTracked.current = true;
      if (hasStatCookie("view")) return;           // already counted on this device today
      setStatCookie("view", 24 * 3600);
      fetch(`/api/passport/${shortId}/stats`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "view" }),
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passport, isOwner, shortId]);

  function recordClick(platform: string) {
    const key = `click_${platform}`;
    if (hasStatCookie(key)) return;                // already counted this platform this hour
    setStatCookie(key, 3600);
    fetch(`/api/passport/${shortId}/stats`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "click", platform }),
    }).catch(() => {});
  }

  /* ── Stamp auto-submit when 4 digits filled ── */
  useEffect(() => {
    if (stampDigits.join("").length === 4 && !stamping && showStampModal) {
      void handleStampAuto(stampDigits.join(""));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stampDigits]);

  async function handleStampAuto(pin: string) {
    setStamping(true); setStampResult(null);
    try {
      const res  = await fetch(`/api/passport/${shortId}/stamp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
      const data = await res.json();
      if (res.ok) {
        setStampResult({ ok: true, msg: `¡Sello de ${data.sponsorName} añadido!` });
        const sv = readOwnerCookie(); if (sv) await loadPassport(sv);
        setTimeout(() => { setShowStampModal(false); setStampResult(null); setStampDigits(["","","",""]); }, 2000);
      } else {
        setStampResult({ ok: false, msg: data.error || "PIN incorrecto" });
        setStampDigits(["","","",""]);
      }
    } catch { setStampResult({ ok: false, msg: "Error de conexión" }); setStampDigits(["","","",""]); }
    finally { setStamping(false); }
  }

  async function verifyPin(pin: string) {
    if (pin.length < 4 || verifyingPin || pinBlocked) return;
    setVerifyingPin(true); setPinError(null);
    await loadPassport(pin);
    setVerifyingPin(false);
    // si sigue sin ser owner (PIN malo), la sección queda abierta para reintentar
  }

  async function handleVerifyPin(e: React.FormEvent) {
    e.preventDefault();
    await verifyPin(pinDigits.join(""));
  }

  /* ── PIN auto-desbloqueo al completar 4 dígitos (igual que recolectar un sello) ── */
  useEffect(() => {
    if (pinDigits.join("").length === 4 && !verifyingPin && !pinBlocked && showPinSection && !isOwner) {
      void verifyPin(pinDigits.join(""));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinDigits]);

  async function handleStamp(e: React.FormEvent) {
    e.preventDefault();
    const p = stampDigits.join("");
    if (p.length < 4 || stamping) return;
    setStamping(true); setStampResult(null);
    try {
      const res  = await fetch(`/api/passport/${shortId}/stamp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: p }) });
      const data = await res.json();
      if (res.ok) { setStampResult({ ok: true, msg: `¡Sello de ${data.sponsorName} añadido!` }); setStampDigits(["","","",""]); const sv = readOwnerCookie(); if (sv) await loadPassport(sv); }
      else        { setStampResult({ ok: false, msg: data.error || "Error al canjear" }); setStampDigits(["","","",""]); }
    } catch { setStampResult({ ok: false, msg: "Error de conexión" }); }
    finally { setStamping(false); }
  }

  async function handleSaveSocial() {
    const savedPin = readOwnerCookie(); if (!savedPin) return;
    setSavingSocial(true);
    try {
      const res = await fetch(`/api/passport/${shortId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: savedPin, social: socialDraft }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSocialSaved(true); setTimeout(() => setSocialSaved(false), 3000);
        // Las adiciones se aplican al instante; las ediciones quedan pendientes (Bloque C)
        if (Array.isArray(data.pending) && data.pending.length > 0) {
          setPendingFields(data.pending as string[]);
          setPendingEmail(typeof data.maskedEmail === "string" ? data.maskedEmail : null);
          setUnverified(false);
        } else {
          setPendingFields([]); setPendingEmail(null);
          setUnverified(data.unverified === true);
        }
        const sv = readOwnerCookie(); if (sv) await loadPassport(sv);
      }
    } finally { setSavingSocial(false); }
  }

  function openAddSocial(id: SocialPlatformId) {
    setAddingPlatform(id); setAddMode("username"); setAddInput(""); setAddError(null);
  }
  function submitAddSocial() {
    if (!addingPlatform) return;
    const plat = SOCIAL_PLATFORMS.find((p) => p.id === addingPlatform)!;
    let username: string | null;
    if (addMode === "link") {
      username = usernameFromLink(plat, addInput);
      if (!username) { setAddError(`Ese enlace no parece de ${plat.label}.`); return; }
    } else {
      username = cleanUsername(addInput);
      if (!username) { setAddError("Usuario inválido — sin espacios ni @, solo letras/números . _ -"); return; }
    }
    setSocialDraft((d) => ({ ...d, [addingPlatform]: username! }));
    setAddingPlatform(null);
  }

  /* ── States ── */
  if (loading) return (
    <>
      <style>{ANIM_CSS}</style>
      <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0E0E1A" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#C143BC", animation: "spin 1s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.3em", color: "#8B84A0", textTransform: "uppercase" }}>Cargando pasaporte</p>
        </div>
      </div>
    </>
  );

  if (notFound) return (
    <>
      <style>{ANIM_CSS}</style>
      <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0E0E1A" }}>
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <p style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#f9fafb", marginBottom: 8 }}>Pasaporte no encontrado</p>
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "#8B84A0" }}>Verifica el código QR de tu escarapela.</p>
        </div>
      </div>
    </>
  );

  if (!passport) return null;

  /* ── Computed ── */
  const collectedIds   = new Set(passport.stamps.map((s) => s.sponsorId));
  const totalSponsors  = sponsors.length;
  const totalCollected = passport.stamps.filter((s) => sponsors.some((sp) => sp._id === s.sponsorId)).length;
  const progressPct    = totalSponsors ? (totalCollected / totalSponsors) * 100 : 0;
  const roleStyle      = ROLE_STYLE[passport.role] ?? ROLE_STYLE.attendee;
  const avatarSrc      = avatarUrl(shortId);
  const activeSocials  = SOCIAL_PLATFORMS.filter((p) => { const v = passport.social?.[p.id]; return v && v.trim().length > 0; });

  /* MRZ */
  const pad = (s: string, n: number) => s.toUpperCase().replace(/[^A-Z0-9]/g, "<").padEnd(n, "<").slice(0, n);
  const mrz1 = `AWSSCD<<${pad(passport.lastName, 18)}<<${pad(passport.firstName, 10)}`;
  const mrz2 = `${shortId.toUpperCase().padEnd(12, "<")}CHL261024${pad(passport.role, 9)}`;

  return (
    <>
      <style>{ANIM_CSS}</style>

      {/* ═══ PAGE SHELL ═══ */}
      <div style={{ minHeight: "100svh", background: "#0E0E1A", overflowX: "hidden", paddingBottom: 64 }}>

        {/* Ambient glow — accent top */}
        <div style={{ position: "fixed", top: "12%", left: "50%", width: 520, height: 420, pointerEvents: "none", background: "radial-gradient(ellipse at center, rgba(193,67,188,.07) 0%, transparent 68%)", animation: "breathe 5s ease-in-out infinite" }} />
        {/* Ambient glow — purple bottom-right */}
        <div style={{ position: "fixed", bottom: "8%", right: "-8%", width: 380, height: 300, pointerEvents: "none", background: "radial-gradient(ellipse at center, rgba(97,59,184,.08) 0%, transparent 68%)" }} />
        {/* Dot grid */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, rgba(193,67,188,.04) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        {/* ═══ CARD AREA ═══ */}
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "28px 16px 0", animation: "fade-up .55s ease forwards" }}>

          {/* ── HOLOGRAPHIC BORDER ── */}
          <div style={{
            padding: "1.5px", borderRadius: 26,
            background: "linear-gradient(135deg, #C143BC 0%, #D85A30 25%, #613BB8 50%, #34d399 75%, #C143BC 100%)",
            backgroundSize: "300% 300%",
            animation: "gradient-border 4s ease infinite",
            boxShadow: "0 32px 80px rgba(0,0,0,.75), 0 0 0 1px rgba(193,67,188,.15)",
          }}>

            {/* ── INNER CARD ── */}
            <div style={{ borderRadius: 25, background: "linear-gradient(160deg, #0E0E1A 0%, #1E1838 55%, #0E0E1A 100%)", overflow: "hidden", position: "relative" }}>

              {/* === PIN OVERLAY — centered in card, light blur on background === */}
              {showPinSection && !isOwner && (
                <>
                  {/* Dim + blur layer — blocks interaction with card content */}
                  <div
                    onClick={() => setShowPinSection(false)}
                    style={{
                      position: "absolute", inset: 0, zIndex: 15,
                      background: "rgba(14,14,26,0.65)",
                      backdropFilter: "blur(3px)",
                      WebkitBackdropFilter: "blur(3px)",
                      borderRadius: 25,
                    }}
                  />
                  {/* PIN panel — centered */}
                  <div style={{
                    position: "absolute",
                    top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 20,
                    width: "calc(100% - 48px)",
                    background: "linear-gradient(160deg, #0E0E1A 0%, #1E1838 100%)",
                    borderRadius: 20,
                    border: "1px solid rgba(193,67,188,.22)",
                    boxShadow: "0 16px 48px rgba(0,0,0,.7)",
                    padding: "22px 20px 24px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#C143BC" }}>
                        <Fingerprint style={{ width: 15, height: 15 }} />
                        <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                          {pinBlocked ? "Acceso bloqueado" : "PIN de propietario"}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowPinSection(false)}
                        style={{ background: "none", border: "none", color: "#8B84A0", cursor: "pointer", display: "flex", padding: 4 }}
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                    <form onSubmit={handleVerifyPin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <PinDigits digits={pinDigits} onChange={setPinDigits} hasError={!!pinError} disabled={pinBlocked || verifyingPin} />
                      </div>
                      {pinError && (
                        <p style={{ fontFamily: "monospace", fontSize: 10, color: "#fca5a5", margin: 0, textAlign: "center" }}>{pinError}</p>
                      )}
                      {verifyingPin ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
                          <Loader2 style={{ width: 18, height: 18, color: "#C143BC", animation: "spin 1s linear infinite" }} />
                        </div>
                      ) : (
                        <p style={{ fontFamily: "monospace", fontSize: 9, color: "#8B84A0", margin: 0, textAlign: "center" }}>
                          {pinBlocked ? "Demasiados intentos, espera un momento" : "Se desbloquea automáticamente al completar el PIN"}
                        </p>
                      )}
                    </form>
                  </div>
                </>
              )}

              {/* === HEADER === */}
              <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logos/aws-logo.svg" alt="AWS" style={{ height: 32, width: "auto" }} />

                {/* Owner / settings toggle */}
                <button
                  onClick={() => {
                    if (isOwner) return;
                    setShowPinSection((v) => { if (!v) { setPinDigits(["","","",""]); setPinError(null); } return !v; });
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 20, cursor: isOwner ? "default" : "pointer",
                    border: isOwner ? "1px solid rgba(52,211,153,.45)" : "1px solid rgba(255,255,255,.3)",
                    background: isOwner ? "rgba(52,211,153,.12)" : "rgba(255,255,255,.1)",
                    color: isOwner ? "#6ee7b7" : "#f9fafb",
                    animation: isOwner ? "owner-pulse 2s ease-in-out infinite" : "none",
                    transition: "all .2s",
                  }}
                  title={isOwner ? "Modo propietario activo" : "Editar mi pasaporte (PIN)"}
                >
                  <Settings style={{ width: 15, height: 15 }} />
                  <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
                    {isOwner ? "OWNER" : "Editar"}
                  </span>
                </button>
              </div>

              {/* === AVATAR === */}
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 4, paddingBottom: 18 }}>
                <div style={{ position: "relative", display: "inline-flex" }}>
                  {/* Outer pulse */}
                  <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "1px solid rgba(193,67,188,.2)", animation: "pulse-ring 2.8s ease-out infinite" }} />
                  {/* Middle pulse (offset) */}
                  <div style={{ position: "absolute", inset: -5, borderRadius: "50%", border: "1px solid rgba(193,67,188,.12)", animation: "pulse-ring 2.8s ease-out .9s infinite" }} />
                  {/* Gradient ring */}
                  <div style={{
                    width: 112, height: 112, borderRadius: "50%", padding: 3,
                    background: "linear-gradient(135deg, #C143BC, #D85A30, #613BB8)",
                    backgroundSize: "200% 200%",
                    animation: "gradient-border 3s ease infinite",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarSrc} alt={`${passport.firstName} ${passport.lastName}`} style={{ width: "100%", height: "100%", borderRadius: "50%", display: "block" }} />
                  </div>
                </div>
              </div>

              {/* === NAME === */}
              <div style={{ textAlign: "center", padding: "0 20px 8px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px,8.5vw,44px)", fontWeight: 900, color: "#f9fafb", letterSpacing: "-0.025em", lineHeight: .92, textTransform: "uppercase", margin: 0 }}>
                  {passport.firstName}
                </p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px,8.5vw,44px)", fontWeight: 900, color: "#C143BC", letterSpacing: "-0.025em", lineHeight: .92, textTransform: "uppercase", margin: "1px 0 0", animation: "text-glow 3s ease-in-out infinite" }}>
                  {passport.lastName}
                </p>

                {(passport.jobTitle || passport.company) && (
                  <p style={{ fontFamily: "monospace", fontSize: 11, color: "#8B84A0", marginTop: 11, lineHeight: 1.5, margin: "11px 0 0" }}>
                    {[passport.jobTitle, passport.company].filter(Boolean).join(" · ")}
                  </p>
                )}

                <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
                  <span style={{
                    fontFamily: "monospace", fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.15em", textTransform: "uppercase",
                    padding: "4px 13px", borderRadius: 20,
                    background: roleStyle.bg, color: roleStyle.text,
                    border: `1px solid ${roleStyle.border}`,
                  }}>
                    {ROLE_LABEL[passport.role] || passport.role}
                  </span>
                </div>
              </div>

              <Perf />

              {/* === SOCIAL (visitantes: solo lectura) === */}
              {!isOwner && (
                <div style={{ padding: "14px 18px" }}>
                  <p style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", color: "#8B84A0", textTransform: "uppercase", margin: "0 0 10px" }}>
                    Conectar
                  </p>
                  {activeSocials.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {activeSocials.map((plat) => (
                        <a
                          key={plat.id}
                          href={plat.urlFn(passport.social?.[plat.id] ?? "")}
                          target="_blank" rel="noopener noreferrer"
                          onClick={() => recordClick(plat.id)}
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, background: plat.bg, color: "#fff", fontFamily: "monospace", fontSize: 11, fontWeight: 600, textDecoration: "none", transition: "filter .15s, transform .15s" }}
                          onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.filter = "brightness(1.15)"; el.style.transform = "scale(1.02)"; }}
                          onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.filter = ""; el.style.transform = ""; }}
                        >
                          {plat.icon}
                          {plat.label}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontFamily: "monospace", fontSize: 11, color: "#8B84A0", textAlign: "center", padding: "6px 0" }}>
                      Sin redes configuradas aún.
                    </p>
                  )}
                </div>
              )}

              {/* === OWNER: REDES (editar donde se ven) === */}
              {isOwner && (
                <>
                  <Perf />
                  <div style={{ padding: "14px 18px", background: "rgba(193,67,188,.025)" }}>
                    {/* Header con toggle Editar / Ver */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <p style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.3em", color: "rgba(193,67,188,.75)", textTransform: "uppercase", margin: 0 }}>
                        Mis redes sociales
                      </p>
                      {!editingSocial ? (
                        <button onClick={() => setEditingSocial(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(193,67,188,.3)", background: "rgba(193,67,188,.08)", fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: "#C143BC", cursor: "pointer" }}>
                          <Pencil style={{ width: 11, height: 11 }} /> Editar
                        </button>
                      ) : (
                        <button onClick={() => setEditingSocial(false)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", fontFamily: "monospace", fontSize: 10, color: "#8B84A0", cursor: "pointer" }}>
                          <Eye style={{ width: 11, height: 11 }} /> Ver
                        </button>
                      )}
                    </div>

                    {/* Banner: cambios pendientes de confirmar por correo */}
                    {pendingFields.length > 0 && (
                      <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(193,67,188,.08)", border: "1px solid rgba(193,67,188,.28)" }}>
                        <p style={{ fontFamily: "monospace", fontSize: 10, color: "#FCD34D", margin: 0, lineHeight: 1.55 }}>
                          Por seguridad, tus cambios en <strong>{pendingFields.join(", ")}</strong> quedaron pendientes.
                          {pendingEmail ? <> Te enviamos un correo a <strong>{pendingEmail}</strong> para confirmarlos.</> : " Revisa tu correo para confirmarlos."}
                        </p>
                      </div>
                    )}

                    {/* Banner: se aplicó sin verificar (sin correo en el registro) */}
                    {unverified && pendingFields.length === 0 && (
                      <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(148,163,184,.08)", border: "1px solid rgba(148,163,184,.25)" }}>
                        <p style={{ fontFamily: "monospace", fontSize: 10, color: "#cbd5e1", margin: 0, lineHeight: 1.55 }}>
                          Cambios guardados. No verificamos por correo porque tu pasaporte no tiene un correo asociado.
                        </p>
                      </div>
                    )}

                    {!editingSocial ? (
                      /* Vista: solo lectura */
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {SOCIAL_PLATFORMS.map((plat) => {
                          const val = socialDraft[plat.id] ?? "";
                          return val.trim() ? (
                            <a key={plat.id} href={plat.urlFn(val)} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", textDecoration: "none", transition: "border-color .15s" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(193,67,188,.3)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,.07)"; }}>
                              <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: plat.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{plat.icon}</div>
                              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#9ca3af", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{plat.atSign ? "@" : ""}{val}</span>
                            </a>
                          ) : (
                            <div key={plat.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, opacity: .3 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: plat.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{plat.icon}</div>
                              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#8B84A0" }}>—</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Edición: agregar / cambiar / quitar por red */
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {SOCIAL_PLATFORMS.map((plat) => {
                          const val = socialDraft[plat.id] ?? "";
                          return (
                            <div key={plat.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: plat.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{plat.icon}</div>
                              {val.trim() ? (
                                <>
                                  <span style={{ flex: 1, fontFamily: "monospace", fontSize: 11, color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{plat.atSign ? "@" : ""}{val}</span>
                                  <button onClick={() => openAddSocial(plat.id)} style={{ padding: "5px 9px", borderRadius: 8, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", fontFamily: "monospace", fontSize: 10, color: "#9ca3af", cursor: "pointer", flexShrink: 0 }}>Cambiar</button>
                                  <button onClick={() => setSocialDraft((d) => ({ ...d, [plat.id]: "" }))} title="Quitar" style={{ display: "flex", padding: 5, borderRadius: 8, border: "1px solid rgba(239,68,68,.25)", background: "rgba(239,68,68,.08)", color: "#fca5a5", cursor: "pointer", flexShrink: 0 }}><X style={{ width: 12, height: 12 }} /></button>
                                </>
                              ) : (
                                <>
                                  <span style={{ flex: 1, fontFamily: "monospace", fontSize: 11, color: "#8B84A0" }}>{plat.label}</span>
                                  <button onClick={() => openAddSocial(plat.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(193,67,188,.3)", background: "rgba(193,67,188,.08)", fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: "#C143BC", cursor: "pointer", flexShrink: 0 }}>+ Agregar</button>
                                </>
                              )}
                            </div>
                          );
                        })}
                        <button onClick={() => { void handleSaveSocial(); }} disabled={savingSocial} style={{ marginTop: 4, padding: "10px 0", borderRadius: 12, border: "none", background: "#D85A30", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#ffffff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 0 15px rgba(216,90,48,.35)", opacity: savingSocial ? .6 : 1, transition: "opacity .2s, box-shadow .2s" }}>
                          {savingSocial ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : socialSaved ? <><Check style={{ width: 14, height: 14 }} />Guardado</> : "Guardar cambios"}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* === OWNER: STAMP CLAIM BUTTON (arriba de los sellos) === */}
              {isOwner && totalSponsors > 0 && (
                <>
                  <Perf />
                  <div style={{ padding: "14px 18px", background: "rgba(193,67,188,.025)" }}>
                    <button
                      onClick={() => { setShowStampModal(true); setStampDigits(["","","",""]); setStampResult(null); }}
                      style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: "1px solid rgba(193,67,188,.3)", background: "rgba(193,67,188,.08)", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#C143BC", cursor: "pointer", letterSpacing: "0.08em" }}
                    >
                      Canjear sello
                    </button>
                  </div>
                </>
              )}

              {/* === STAMPS === */}
              {totalSponsors > 0 && (
                <>
                  <Perf />
                  <div style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <p style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", color: "#8B84A0", textTransform: "uppercase", margin: 0 }}>Sellos</p>
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#C143BC" }}>
                        {totalCollected}<span style={{ color: "#8B84A0", fontWeight: 400 }}> / {totalSponsors}</span>
                      </span>
                    </div>
                    <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,.05)", marginBottom: 14, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${progressPct}%`, background: "linear-gradient(90deg, #C143BC, #613BB8)", boxShadow: "0 0 8px rgba(193,67,188,.4)", transition: "width .8s ease" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                      {sponsors.map((sp, i) => <StampItem key={sp._id} sponsor={sp} collected={collectedIds.has(sp._id)} index={i} />)}
                    </div>
                  </div>
                </>
              )}

              {/* === MRZ ZONE === */}
              <div style={{ borderTop:"1px solid rgba(193,67,188,.07)", padding:"11px 20px 13px", background:"rgba(0,0,0,.25)", textAlign:"center" }}>
                <p style={{ fontFamily:"'Courier New',monospace", fontSize:8, letterSpacing:"0.08em", color:"rgba(193,67,188,.25)", lineHeight:1.9, wordBreak:"break-all", margin:0, userSelect:"none" }}>
                  {mrz1}<br />{mrz2}
                </p>
              </div>

            </div>{/* /inner card */}
          </div>{/* /holographic border */}

          {/* Bottom logo — links to home */}
          <Link
            href="/"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginTop: 28, textDecoration: "none", opacity: .55, transition: "opacity .2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = ".55"; }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logos/aws-logo.svg" alt="AWS" style={{ height: 32, width: "auto" }} />
            <p style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: "#9ca3af", margin: 0 }}>Student Community Day</p>
            <p style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "0.25em", color: "#4b5563", margin: 0 }}>MÉXICO 2026</p>
          </Link>

        </div>{/* /card area */}
      </div>{/* /page */}

      {/* ═══ STAMP MODAL ═══ */}
      {showStampModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", padding: "0 24px" }}>
          <div style={{ width: "100%", maxWidth: 340, borderRadius: 22, overflow: "hidden", background: "linear-gradient(160deg, #0E0E1A, #1E1838)", border: "1px solid rgba(193,67,188,.25)", boxShadow: "0 24px 64px rgba(0,0,0,.8)" }}>
            <div style={{ height: 2, background: "linear-gradient(90deg,#C143BC,#613BB8,#C143BC)", backgroundSize: "200% 200%", animation: "gradient-border 3s ease infinite" }} />
            <div style={{ padding: "22px 22px 26px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <p style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#C143BC", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>Canjear sello</p>
                <button onClick={() => { setShowStampModal(false); setStampDigits(["","","",""]); setStampResult(null); }} style={{ background: "none", border: "none", color: "#8B84A0", cursor: "pointer", display: "flex", padding: 4 }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>

              {stampResult ? (
                /* Result state */
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <p style={{ fontFamily: "monospace", fontSize: 12, color: stampResult.ok ? "#6ee7b7" : "#fca5a5", padding: "10px 16px", borderRadius: 12, background: stampResult.ok ? "rgba(52,211,153,.08)" : "rgba(239,68,68,.08)", border: `1px solid ${stampResult.ok ? "rgba(52,211,153,.2)" : "rgba(239,68,68,.2)"}` }}>
                    {stampResult.msg}
                  </p>
                  {!stampResult.ok && (
                    <p style={{ fontFamily: "monospace", fontSize: 10, color: "#8B84A0", marginTop: 10 }}>Intenta otro PIN</p>
                  )}
                </div>
              ) : stamping ? (
                /* Loading state */
                <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
                  <Loader2 style={{ width: 28, height: 28, color: "#C143BC", animation: "spin 1s linear infinite" }} />
                </div>
              ) : (
                /* PIN entry — auto-submits on 4 digits */
                <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                  <p style={{ fontFamily: "monospace", fontSize: 10, color: "#8B84A0", textAlign: "center", margin: 0 }}>
                    Ingresa el PIN del sponsor para reclamar tu sello
                  </p>
                  <PinDigits
                    digits={stampDigits}
                    onChange={(d) => { setStampDigits(d); setStampResult(null); }}
                  />
                  <p style={{ fontFamily: "monospace", fontSize: 9, color: "#8B84A0", margin: 0 }}>
                    Se envía automáticamente al completar los 4 dígitos
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD/EDIT SOCIAL MODAL ═══ */}
      {addingPlatform && (() => {
        const plat = SOCIAL_PLATFORMS.find((p) => p.id === addingPlatform)!;
        const modeBtn = (active: boolean): React.CSSProperties => ({
          flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer",
          border: active ? "1px solid rgba(193,67,188,.5)" : "1px solid rgba(255,255,255,.1)",
          background: active ? "rgba(193,67,188,.15)" : "rgba(255,255,255,.03)",
          color: active ? "#C143BC" : "#8B84A0",
          fontFamily: "monospace", fontSize: 11, fontWeight: 700,
        });
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", padding: "0 24px" }}>
            <div style={{ width: "100%", maxWidth: 360, borderRadius: 22, overflow: "hidden", background: "linear-gradient(160deg, #0E0E1A, #1E1838)", border: "1px solid rgba(193,67,188,.25)", boxShadow: "0 24px 64px rgba(0,0,0,.8)" }}>
              <div style={{ height: 2, background: "linear-gradient(90deg,#C143BC,#613BB8,#C143BC)" }} />
              <div style={{ padding: "20px 20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: plat.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{plat.icon}</div>
                    <p style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#f9fafb", margin: 0 }}>{plat.label}</p>
                  </div>
                  <button onClick={() => setAddingPlatform(null)} style={{ background: "none", border: "none", color: "#8B84A0", cursor: "pointer", display: "flex", padding: 4 }}><X style={{ width: 14, height: 14 }} /></button>
                </div>

                <p style={{ fontFamily: "monospace", fontSize: 10, color: "#8B84A0", margin: "0 0 10px" }}>¿Cómo quieres agregarla?</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <button onClick={() => { setAddMode("username"); setAddError(null); }} style={modeBtn(addMode === "username")}>Usuario</button>
                  <button onClick={() => { setAddMode("link"); setAddError(null); }} style={modeBtn(addMode === "link")}>Enlace directo</button>
                </div>

                {addMode === "username" ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", borderRadius: 10, border: "1px solid #2C2550", background: "#1E1838", overflow: "hidden" }}>
                      {plat.atSign && <span style={{ padding: "9px 0 9px 12px", fontFamily: "monospace", fontSize: 12, color: "#C143BC", fontWeight: 700 }}>@</span>}
                      <input
                        autoFocus value={addInput}
                        onChange={(e) => { setAddInput(e.target.value); setAddError(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") submitAddSocial(); }}
                        placeholder={plat.placeholder}
                        style={{ flex: 1, padding: plat.atSign ? "9px 12px 9px 4px" : "9px 12px", border: "none", background: "transparent", fontFamily: "monospace", fontSize: 12, color: "#e5e7eb", outline: "none" }}
                      />
                    </div>
                    <p style={{ fontFamily: "monospace", fontSize: 9, color: "#8B84A0", margin: "7px 0 0" }}>
                      Quedará: {plat.prefix}{plat.atSign ? "" : ""}{addInput.trim() ? cleanUsername(addInput) ?? "…" : (plat.placeholder)}
                    </p>
                  </>
                ) : (
                  <>
                    <input
                      autoFocus type="url" value={addInput}
                      onChange={(e) => { setAddInput(e.target.value); setAddError(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") submitAddSocial(); }}
                      placeholder={plat.urlFn("tu-usuario")}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #2C2550", background: "#1E1838", fontFamily: "monospace", fontSize: 11, color: "#e5e7eb", outline: "none" }}
                    />
                    <p style={{ fontFamily: "monospace", fontSize: 9, color: "#8B84A0", margin: "7px 0 0" }}>Pega el enlace de tu perfil de {plat.label}.</p>
                  </>
                )}

                {addError && <p style={{ fontFamily: "monospace", fontSize: 10, color: "#fca5a5", margin: "10px 0 0" }}>{addError}</p>}

                <button
                  onClick={submitAddSocial}
                  disabled={!addInput.trim()}
                  style={{ width: "100%", marginTop: 16, padding: "11px 0", borderRadius: 12, border: "none", background: "#D85A30", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#ffffff", cursor: "pointer", opacity: addInput.trim() ? 1 : .4, transition: "opacity .2s, box-shadow .2s", boxShadow: "0 0 15px rgba(216,90,48,.35)" }}
                >
                  {addMode === "link" ? "Validar y agregar" : "Agregar"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
