"use client";

import { use, useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

type State = "loading" | "ok" | "used" | "expired" | "error";

export default function ConfirmarCambiosPage({ params }: { params: Promise<{ token: string; locale: string }> }) {
  const { token } = use(params);
  const [state, setState] = useState<State>("loading");
  const [shortId, setShortId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/confirm-passport-edit/${token}`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          setState("ok");
          setShortId(data.shortId ?? null);
          if (data.shortId) setTimeout(() => { window.location.href = `/pasaporte/${data.shortId}`; }, 2200);
        } else if (res.status === 409) { setState("used"); setShortId(data.shortId ?? null); }
        else if (res.status === 410) { setState("expired"); setShortId(data.shortId ?? null); }
        else setState("error");
      } catch { setState("error"); }
    })();
  }, [token]);

  const ui = {
    loading: { Icon: Loader2, color: "#F2A6F0", title: "Confirmando...", sub: "Aplicando tus cambios de forma segura.", spin: true },
    ok: { Icon: CheckCircle2, color: "#34d399", title: "¡Cambios confirmados!", sub: "Tus datos se actualizaron. Te llevamos a tu pasaporte...", spin: false },
    used: { Icon: AlertTriangle, color: "#fbbf24", title: "Este enlace ya fue usado", sub: "Tus cambios ya se habían confirmado antes.", spin: false },
    expired: { Icon: AlertTriangle, color: "#fbbf24", title: "El enlace expiró", sub: "Por seguridad caduca a las 24h. Vuelve a guardar el cambio desde tu pasaporte.", spin: false },
    error: { Icon: XCircle, color: "#f87171", title: "No pudimos confirmar", sub: "Intenta de nuevo o vuelve a guardar el cambio desde tu pasaporte.", spin: false },
  }[state];

  const Icon = ui.Icon;

  return (
    <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080a0f", padding: "0 24px" }}>
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center", borderRadius: 24, border: "1px solid rgba(255,255,255,.08)", background: "linear-gradient(160deg, #0d1018 0%, #131824 100%)", padding: "40px 28px", boxShadow: "0 32px 80px rgba(0,0,0,.7)" }}>
        <div style={{ width: 84, height: 84, margin: "0 auto 20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.04)", border: `1px solid ${ui.color}33` }}>
          <Icon style={{ width: 44, height: 44, color: ui.color, animation: ui.spin ? "spin 1s linear infinite" : "none" }} />
        </div>
        <p style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 800, color: "#f9fafb", margin: "0 0 8px" }}>{ui.title}</p>
        <p style={{ fontFamily: "monospace", fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{ui.sub}</p>

        {(state === "used" || state === "expired" || state === "error") && shortId && (
          <a href={`/pasaporte/${shortId}`} style={{ display: "inline-block", marginTop: 22, padding: "11px 22px", borderRadius: 12, background: "#F2A6F0", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#080a0f", textDecoration: "none" }}>
            Ir a mi pasaporte
          </a>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
