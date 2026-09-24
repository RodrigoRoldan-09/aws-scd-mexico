"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";
import { CONFIRMATION_DEADLINE, EVENT, EVENT_OPS } from "@/lib/constants";
import { avatarUrl } from "@/lib/avatar";
import { localePath } from "@/lib/utils";

interface BadgeOption { first: string; last: string; label: string }

interface ConfirmData {
  found: boolean;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  role: string;
  email: string;
  nameOptions: BadgeOption[];
  status: "pending" | "confirmed" | "expired";
  badgeFirstName: string;
  badgeLastName: string;
  deadline: string;
}

const ROLE_BADGE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  attendee:  { bg: "rgba(14,165,233,.12)",  text: "#7dd3fc", border: "rgba(14,165,233,.3)",  label: "ASISTENTE" },
  speaker:   { bg: "rgba(242,166,240,.12)",   text: "#F2A6F0", border: "rgba(242,166,240,.45)",  label: "SPEAKER" },
  volunteer: { bg: "rgba(52,211,153,.12)",  text: "#6ee7b7", border: "rgba(52,211,153,.3)",  label: "VOLUNTARIO" },
  organizer: { bg: "rgba(167,139,250,.12)", text: "#c4b5fd", border: "rgba(167,139,250,.3)", label: "ORGANIZADOR" },
};

async function fireConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#F2A6F0", "#FCD34D", "#34d399", "#C143BC", "#f9fafb"];
  const end = Date.now() + 900;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 120, spread: 100, origin: { y: 0.6 }, colors, startVelocity: 45 });
}

export default function ConfirmarPage() {
  const params = useParams();
  const token = String(params.token ?? "");
  const locale = String(params.locale ?? "es");

  const [data, setData] = useState<ConfirmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<BadgeOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [error, setError] = useState("");

  const { days, hours, minutes, seconds, isExpired } = useCountdown(CONFIRMATION_DEADLINE);

  useEffect(() => {
    fetch(`/api/confirm/${token}`)
      .then(async (r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json() as Promise<ConfirmData>;
      })
      .then((d) => {
        if (d?.found) {
          setData(d);
          setSelected(d.nameOptions[0] ?? null);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const handleConfirm = useCallback(async () => {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/confirm/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeFirstName: selected.first, badgeLastName: selected.last }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo confirmar");
      setJustConfirmed(true);
      setData((d) => d ? { ...d, status: "confirmed", badgeFirstName: selected.first, badgeLastName: selected.last } : d);
      setTimeout(fireConfetti, 120);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [selected, token]);

  const role = data ? (ROLE_BADGE[data.role] ?? ROLE_BADGE.attendee) : ROLE_BADGE.attendee;
  const isConfirmed = data?.status === "confirmed";
  const isExpiredState = !isConfirmed && (data?.status === "expired" || isExpired);

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#080a0f", overflow: "hidden" }}>
      <style>{`
        @keyframes grad-border { 0%,100% { background-position:0% 50% } 50% { background-position:100% 50% } }
        @keyframes breathe { 0%,100% { opacity:.5; transform:translateX(-50%) scale(1) } 50% { opacity:.9; transform:translateX(-50%) scale(1.15) } }
        @keyframes text-glow { 0%,100% { text-shadow:0 0 20px rgba(242,166,240,.3) } 50% { text-shadow:0 0 45px rgba(242,166,240,.75) } }
        @keyframes fade-up { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pop { 0% { transform:scale(.7); opacity:0 } 70% { transform:scale(1.08) } 100% { transform:scale(1); opacity:1 } }
        @keyframes pulse-ring { 0% { transform:scale(1); opacity:.5 } 100% { transform:scale(1.7); opacity:0 } }
      `}</style>

      {/* Ambient glow */}
      <div style={{ position: "absolute", top: 0, left: "50%", width: 600, height: 400, background: "radial-gradient(ellipse at center, rgba(242,166,240,.065) 0%, transparent 68%)", animation: "breathe 5s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(242,166,240,.04) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 560, margin: "0 auto", padding: "0 16px 48px" }}>
        {/* Header banner */}
        <img src="/images/emails/email-header.png" alt="AWS Student Community Day México 2026"
          style={{ display: "block", width: "100%", borderRadius: "0 0 16px 16px" }} />

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(242,166,240,.25)", borderTopColor: "#F2A6F0", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {!loading && notFound && (
          <div style={{ textAlign: "center", padding: "56px 24px", animation: "fade-up .5s ease both" }}>
            <p style={{ fontSize: 48, margin: 0 }}>🔍</p>
            <h1 style={{ color: "#f9fafb", fontSize: 22, fontWeight: 800, margin: "12px 0 6px" }}>Enlace no válido</h1>
            <p style={{ color: "#9ca3af", fontSize: 14, fontFamily: "monospace", lineHeight: 1.6, maxWidth: 360, margin: "0 auto 24px" }}>
              No encontramos este registro. Revisa que hayas abierto el enlace completo de tu correo.
            </p>
            <a
              href={localePath(locale, "")}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px 26px", borderRadius: 14, textDecoration: "none",
                background: "linear-gradient(135deg,#F2A6F0,#FCD34D)", color: "#0A0A0F",
                fontSize: 14, fontWeight: 800, boxShadow: "0 10px 28px rgba(242,166,240,.28)",
              }}
            >
              Ir al inicio
              <ArrowRight size={16} strokeWidth={2.4} />
            </a>
          </div>
        )}

        {!loading && data && (
          <div style={{ marginTop: 24, padding: "1.5px", borderRadius: 26, background: "linear-gradient(135deg,#F2A6F0 0%,#FCD34D 25%,#C143BC 50%,#34d399 75%,#F2A6F0 100%)", backgroundSize: "300% 300%", animation: "grad-border 4s ease infinite", boxShadow: "0 32px 80px rgba(0,0,0,.75)" }}>
            <div style={{ borderRadius: 25, background: "linear-gradient(160deg,#0d1018 0%,#131824 55%,#0d1018 100%)", padding: "32px 24px", animation: "fade-up .6s ease both" }}>

              {/* Avatar */}
              <div style={{ display: "flex", justifyContent: "center", paddingBottom: 18 }}>
                <div style={{ position: "relative", display: "inline-flex" }}>
                  <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "1px solid rgba(242,166,240,.2)", animation: "pulse-ring 2.8s ease-out infinite" }} />
                  <div style={{ position: "absolute", inset: -5, borderRadius: "50%", border: "1px solid rgba(242,166,240,.12)", animation: "pulse-ring 2.8s ease-out .9s infinite" }} />
                  <div style={{
                    width: 104, height: 104, borderRadius: "50%", padding: 3,
                    background: "linear-gradient(135deg, #F2A6F0, #FCD34D, #F2A6F0)",
                    backgroundSize: "200% 200%", animation: "grad-border 3s ease infinite",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl(token)}
                      alt={`${data.firstName} ${data.lastName}`}
                      style={{ width: "100%", height: "100%", borderRadius: "50%", display: "block" }}
                    />
                  </div>
                </div>
              </div>

              {/* Role + name */}
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "inline-block", padding: "4px 13px", borderRadius: 20, fontFamily: "monospace", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", background: role.bg, color: role.text, border: `1px solid ${role.border}` }}>
                  {role.label}
                </span>
                <h1 style={{ margin: "16px 0 0", fontSize: "clamp(28px,8vw,40px)", fontWeight: 900, color: "#f9fafb", letterSpacing: "-0.025em", lineHeight: .95, textTransform: "uppercase" }}>
                  {data.firstName}
                </h1>
                <h1 style={{ margin: 0, fontSize: "clamp(28px,8vw,40px)", fontWeight: 900, color: "#F2A6F0", letterSpacing: "-0.025em", lineHeight: .95, textTransform: "uppercase", animation: "text-glow 3s ease-in-out infinite" }}>
                  {data.lastName}
                </h1>
                {(data.jobTitle || data.company) && (
                  <p style={{ margin: "10px 0 0", fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>
                    {[data.jobTitle, data.company].filter(Boolean).join(" · ")}
                  </p>
                )}
                {data.email && (
                  <p style={{ margin: "4px 0 0", fontFamily: "monospace", fontSize: 10, color: "#4b5563" }}>{data.email}</p>
                )}
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,.06)", margin: "28px 0" }} />

              {/* ───── CONFIRMED ───── */}
              {isConfirmed && (
                <div style={{ textAlign: "center", animation: "pop .5s ease both" }}>
                  <p style={{ fontSize: 44, margin: 0 }}>🎉</p>
                  <h2 style={{ color: "#34d399", fontSize: 20, fontWeight: 800, margin: "8px 0 4px" }}>
                    {justConfirmed ? "¡Asistencia confirmada!" : "Ya confirmaste tu asistencia"}
                  </h2>
                  <p style={{ color: "#9ca3af", fontSize: 13, fontFamily: "monospace", margin: "0 0 20px" }}>
                    Así aparecerá tu nombre en la escarapela:
                  </p>
                  <div style={{ display: "inline-block", padding: "16px 28px", borderRadius: 14, background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.3)" }}>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#f9fafb", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                      {data.badgeFirstName}
                    </p>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#F2A6F0", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                      {data.badgeLastName}
                    </p>
                  </div>
                  {/* Event details */}
                  <div style={{ marginTop: 24, padding: "16px 18px", borderRadius: 14, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Calendar size={17} color="#F2A6F0" strokeWidth={2.2} style={{ flexShrink: 0 }} />
                      <span style={{ color: "#f9fafb", fontSize: 13, fontWeight: 600 }}>{EVENT.dateLabel}</span>
                    </div>
                    <div style={{ height: 1, background: "rgba(255,255,255,.05)", margin: "12px 0" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Clock size={17} color="#F2A6F0" strokeWidth={2.2} style={{ flexShrink: 0 }} />
                      <span style={{ color: "#f9fafb", fontSize: 13, fontWeight: 600 }}>8:00 AM · Check-In y escarapela</span>
                    </div>
                    <div style={{ height: 1, background: "rgba(255,255,255,.05)", margin: "12px 0" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <MapPin size={17} color="#F2A6F0" strokeWidth={2.2} style={{ flexShrink: 0 }} />
                      <span style={{ color: "#d1d5db", fontSize: 12.5, lineHeight: 1.4 }}>{EVENT.venue.name}<br /><span style={{ color: "#6b7280" }}>{EVENT.venue.address}</span></span>
                    </div>
                  </div>

                  {/* Directory CTA */}
                  <a
                    href={localePath(locale, "/directorio")}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      marginTop: 14, padding: "14px", borderRadius: 14, textDecoration: "none",
                      background: "rgba(242,166,240,.1)", border: "1px solid rgba(242,166,240,.35)",
                      color: "#F2A6F0", fontSize: 14, fontWeight: 700,
                    }}
                  >
                    Ver el directorio de speakers
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </a>
                </div>
              )}

              {/* ───── EXPIRED ───── */}
              {isExpiredState && (
                <div style={{ textAlign: "center", animation: "fade-up .5s ease both" }}>
                  <p style={{ fontSize: 44, margin: 0 }}>⏰</p>
                  <h2 style={{ color: "#f9fafb", fontSize: 19, fontWeight: 800, margin: "8px 0 8px" }}>
                    La confirmación de registros terminó
                  </h2>
                  <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.7, fontFamily: "monospace", margin: 0 }}>
                    Te esperamos el <strong style={{ color: "#F2A6F0" }}>{EVENT_OPS.weekday} 4 de noviembre a las 8:00 AM</strong> para que confirmes tu asistencia directamente en Registro.
                  </p>
                </div>
              )}

              {/* ───── PENDING (form) ───── */}
              {!isConfirmed && !isExpiredState && (
                <div style={{ animation: "fade-up .5s ease both" }}>
                  {/* Countdown */}
                  <p style={{ textAlign: "center", color: "#6b7280", fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 10px" }}>
                    Confirma antes de que cierre
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
                    {[{ v: days, l: "días" }, { v: hours, l: "hrs" }, { v: minutes, l: "min" }, { v: seconds, l: "seg" }].map((b) => (
                      <div key={b.l} style={{ textAlign: "center" }}>
                        <div style={{ minWidth: 48, padding: "8px 6px", borderRadius: 10, background: "rgba(242,166,240,.08)", border: "1px solid rgba(242,166,240,.25)" }}>
                          <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 800, color: "#F2A6F0" }}>
                            {String(b.v).padStart(2, "0")}
                          </span>
                        </div>
                        <span style={{ display: "block", marginTop: 4, fontFamily: "monospace", fontSize: 9, color: "#52525b" }}>{b.l}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ color: "#d1d5db", fontSize: 13, lineHeight: 1.6, textAlign: "center", margin: "0 0 6px" }}>
                    Confirma tu asistencia para asegurar tu <strong style={{ color: "#F2A6F0" }}>escarapela</strong>.
                  </p>
                  <p style={{ color: "#6b7280", fontSize: 12, textAlign: "center", margin: "0 0 20px", fontFamily: "monospace" }}>
                    {data.nameOptions.length > 1
                      ? "¿Cómo quieres que aparezca tu nombre en ella?"
                      : "Así aparecerá tu nombre en ella:"}
                  </p>

                  {data.nameOptions.length > 1 ? (
                    /* Name selector */
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 26 }}>
                      {data.nameOptions.map((opt) => {
                        const active = selected?.label === opt.label;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setSelected(opt)}
                            style={{
                              cursor: "pointer", padding: "14px 12px", borderRadius: 14, textAlign: "center",
                              background: active ? "rgba(242,166,240,.12)" : "rgba(255,255,255,.03)",
                              border: active ? "1.5px solid #F2A6F0" : "1.5px solid rgba(255,255,255,.08)",
                              transition: "all .15s ease",
                            }}
                          >
                            <span style={{ display: "block", fontSize: 16, fontWeight: 800, color: active ? "#f9fafb" : "#9ca3af", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Single option — just show it, nothing to choose */
                    <div style={{ textAlign: "center", marginBottom: 26 }}>
                      <div style={{ display: "inline-block", padding: "14px 28px", borderRadius: 14, background: "rgba(242,166,240,.08)", border: "1.5px solid rgba(242,166,240,.3)" }}>
                        <span style={{ display: "block", fontSize: 20, fontWeight: 900, color: "#f9fafb", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                          {selected?.label ?? `${data.firstName} ${data.lastName}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p style={{ color: "#f87171", fontSize: 12, textAlign: "center", margin: "0 0 14px", fontFamily: "monospace" }}>{error}</p>
                  )}

                  {/* Giant confirm button */}
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={submitting || !selected}
                    style={{
                      width: "100%", padding: "18px", borderRadius: 16, border: "none",
                      cursor: submitting ? "wait" : "pointer",
                      background: submitting ? "#b36b00" : "linear-gradient(135deg,#F2A6F0,#FCD34D)",
                      color: "#0A0A0F", fontSize: 17, fontWeight: 900, letterSpacing: "0.02em",
                      boxShadow: "0 12px 32px rgba(242,166,240,.3)", transition: "transform .12s ease",
                    }}
                  >
                    {submitting ? "Confirmando…" : "✓ Confirmar mi asistencia"}
                  </button>
                  <p style={{ color: "#4b5563", fontSize: 10, textAlign: "center", margin: "12px 0 0", fontFamily: "monospace" }}>
                    Solo puedes confirmar una vez.
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Footer banner */}
        {!loading && (
          <img src="/images/emails/email-footer.png" alt="AWS Student Community Day México 2026"
            style={{ display: "block", width: "100%", marginTop: 24, borderRadius: "16px 16px 0 0" }} />
        )}
      </div>
    </div>
  );
}
