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
    loading: { Icon: Loader2, color: "#C143BC", title: "Confirmando...", sub: "Aplicando tus cambios de forma segura.", spin: true },
    ok: { Icon: CheckCircle2, color: "#3DD6D0", title: "¡Cambios confirmados!", sub: "Tus datos se actualizaron. Te llevamos a tu pasaporte...", spin: false },
    used: { Icon: AlertTriangle, color: "#D85A30", title: "Este enlace ya fue usado", sub: "Tus cambios ya se habían confirmado antes.", spin: false },
    expired: { Icon: AlertTriangle, color: "#D85A30", title: "El enlace expiró", sub: "Por seguridad caduca a las 24h. Vuelve a guardar el cambio desde tu pasaporte.", spin: false },
    error: { Icon: XCircle, color: "#E24B4A", title: "No pudimos confirmar", sub: "Intenta de nuevo o vuelve a guardar el cambio desde tu pasaporte.", spin: false },
  }[state];

  const Icon = ui.Icon;

  return (
    <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0E0E1A", padding: "0 24px" }}>
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center", borderRadius: 12, border: "1px solid #2C2550", background: "#1E1838", padding: "40px 28px", boxShadow: "0 8px 32px rgba(0,0,0,.5)" }}>
        <div style={{ width: 84, height: 84, margin: "0 auto 20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0E0E1A", border: `1px solid ${ui.color}33` }}>
          <Icon style={{ width: 44, height: 44, color: ui.color, animation: ui.spin ? "spin 1s linear infinite" : "none" }} />
        </div>
        <p style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: 20, fontWeight: 700, color: "#E6E4DA", margin: "0 0 8px" }}>{ui.title}</p>
        <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: "#B4B2A9", lineHeight: 1.6, margin: 0 }}>{ui.sub}</p>

        {(state === "used" || state === "expired" || state === "error") && shortId && (
          <a href={`/pasaporte/${shortId}`} style={{ display: "inline-block", marginTop: 22, padding: "11px 22px", borderRadius: 6, background: "#D85A30", fontFamily: "var(--font-mono, monospace)", fontSize: 12, fontWeight: 700, color: "#FFFFFF", textDecoration: "none" }}>
            Ir a mi pasaporte
          </a>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
