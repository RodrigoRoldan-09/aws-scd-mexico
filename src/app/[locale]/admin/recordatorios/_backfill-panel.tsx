"use client";

import { useRef, useState } from "react";
import { CalendarClock, MailCheck, Search, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { REMINDER_DATES, REMINDER_SEND_TIME_LABEL } from "@/lib/reminder-schedule";

const ENDPOINT = "/api/admin/registrations/backfill-confirmations";
// Tandas chicas: cada correo genera un PDF y espera 250 ms; 100 por tanda
// queda muy por debajo del límite de 300 s de la función.
const BATCH_SIZE = 100;

type DryRun = {
  scanned: number;
  totalEligible: number;
  statusCounts: Record<string, number>;
  sample: { email: string; name: string; attendance?: string; emailStatus?: string }[];
};

const STATUS_LABEL: Record<string, string> = {
  sent: "enviado",
  failed: "falló",
  pending: "pendiente",
  skipped: "omitido a propósito",
  sin_estado: "sin estado",
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Panel de admin para:
 *  1. Ver el calendario de recordatorios automáticos (los dispara EventBridge).
 *  2. Mandar la confirmación de registro a quien nunca la recibió, con revisión
 *     previa (dry-run) y envío por tandas con progreso.
 */
export function BackfillPanel() {
  const { toast } = useToast();
  const [includeSkipped, setIncludeSkipped] = useState(false);
  const [checking, setChecking] = useState(false);
  const [preview, setPreview] = useState<DryRun | null>(null);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; remaining: number } | null>(null);
  const stopRef = useRef(false);

  const check = async (skipped = includeSkipped) => {
    setChecking(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true, includeSkipped: skipped }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo revisar");
      setPreview(data as DryRun);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setChecking(false);
    }
  };

  const send = async () => {
    if (!preview || preview.totalEligible === 0) return;
    const ok = window.confirm(
      `Se mandarán ${preview.totalEligible} correos REALES de confirmación de registro, en tandas de ${BATCH_SIZE}.\n\n¿Continuar?`,
    );
    if (!ok) return;

    stopRef.current = false;
    setSending(true);
    let sent = 0;
    let failed = 0;
    let remaining = preview.totalEligible;
    setProgress({ sent, failed, remaining });

    try {
      while (remaining > 0 && !stopRef.current) {
        const res = await fetch(`${ENDPOINT}?limit=${BATCH_SIZE}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dryRun: false, confirm: "SEND", includeSkipped }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al enviar");
        sent += data.sent;
        failed += data.failed;
        remaining = data.remaining;
        setProgress({ sent, failed, remaining });
        // Si una tanda no logra mandar nada, los que quedan están fallando
        // (p. ej. sin credenciales): no tiene caso seguir reintentando.
        if (data.sent === 0) break;
      }
      toast(
        `${sent} confirmaciones enviadas${failed ? ` · ${failed} fallidas` : ""}${remaining > 0 ? ` · quedan ${remaining}` : ""}`,
        failed || remaining > 0 ? "error" : "success",
      );
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSending(false);
      check();
    }
  };

  return (
    <section className="mb-10">
      {/* Calendario de recordatorios automáticos */}
      <div className="mb-4 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-surface-400" />
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface-400">
          Recordatorios automáticos
        </h2>
      </div>
      <div className="mb-8 border border-[#C143BC]/25 bg-[#C143BC]/5 p-5">
        <p className="text-xs leading-relaxed text-surface-300">
          Salen solos a las {REMINDER_SEND_TIME_LABEL} a toda la audiencia (registrados, speakers, voluntarios
          e internos), con la cuenta regresiva y los sponsors. No se duplican aunque el disparo se repita el mismo día.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {REMINDER_DATES.map((d) => (
            <span
              key={d}
              className="border border-[#C143BC]/30 bg-[#0E0E1A] px-2.5 py-1 font-mono text-xs text-[#E6E4DA]"
            >
              {formatDate(d)}
            </span>
          ))}
        </div>
      </div>

      {/* Confirmaciones pendientes */}
      <div className="mb-4 flex items-center gap-2">
        <MailCheck className="h-4 w-4 text-surface-400" />
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface-400">
          Confirmaciones de registro pendientes
        </h2>
      </div>
      <div className="border border-emerald-500/25 bg-emerald-500/5 p-5">
        <p className="text-xs leading-relaxed text-surface-300">
          Manda el correo de confirmación (con QR y PDF, o la versión online) a los registrados que nunca lo
          recibieron. Primero revisa a cuántos les llegaría; nada se envía hasta que confirmes.
        </p>

        <label className="mt-4 flex items-center gap-2 font-mono text-xs text-surface-300">
          <input
            type="checkbox"
            checked={includeSkipped}
            disabled={sending}
            onChange={(e) => {
              setIncludeSkipped(e.target.checked);
              if (preview) check(e.target.checked);
            }}
          />
          Incluir registros manuales a los que se eligió no enviar correo
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={() => check()} disabled={checking || sending}>
            <Search className="mr-2 h-4 w-4" />
            {checking ? "Revisando…" : "Revisar pendientes"}
          </Button>
          {preview && preview.totalEligible > 0 && !sending && (
            <Button size="sm" variant="conversion" onClick={send}>
              <Send className="mr-2 h-4 w-4" />
              Enviar {preview.totalEligible} confirmaciones
            </Button>
          )}
          {sending && (
            <Button size="sm" variant="danger" onClick={() => (stopRef.current = true)}>
              <Square className="mr-2 h-4 w-4" />
              Detener al terminar la tanda
            </Button>
          )}
        </div>

        {progress && (
          <p className="mt-4 font-mono text-xs text-surface-200" aria-live="polite">
            {sending ? "Enviando… " : "Último envío: "}
            {progress.sent} enviadas · {progress.failed} fallidas · {progress.remaining} pendientes
          </p>
        )}

        {preview && (
          <div className="mt-4 border-t border-surface-700 pt-4">
            <p className="font-mono text-sm text-surface-50">
              {preview.totalEligible === 0
                ? "Todos los registrados ya tienen su confirmación."
                : `${preview.totalEligible} de ${preview.scanned} registrados no tienen su confirmación.`}
            </p>
            <p className="mt-1 font-mono text-[11px] text-surface-400">
              {Object.entries(preview.statusCounts)
                .map(([k, v]) => `${STATUS_LABEL[k] ?? k}: ${v}`)
                .join(" · ")}
            </p>
            {preview.sample.length > 0 && (
              <ul className="mt-3 space-y-1">
                {preview.sample.map((r) => (
                  <li key={r.email} className="font-mono text-[11px] text-surface-300">
                    {r.name || "(sin nombre)"} · {r.email} · {r.attendance === "online" ? "online" : "presencial"} ·{" "}
                    {STATUS_LABEL[r.emailStatus ?? "sin_estado"] ?? r.emailStatus}
                  </li>
                ))}
                {preview.totalEligible > preview.sample.length && (
                  <li className="font-mono text-[11px] text-surface-500">
                    … y {preview.totalEligible - preview.sample.length} más
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
