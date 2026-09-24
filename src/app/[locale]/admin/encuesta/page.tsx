"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { ClipboardList, MousePointerClick, Clock, Send, Eye, RefreshCw } from "lucide-react";
import { useConfirm } from "@/components/admin/confirm";

interface ClickRow { name: string; roleLabel: string; clicked: boolean; clickedAt: string | null; }
interface Data { sent: number; clicked: number; list: ClickRow[]; }

export default function EncuestaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "clic" | "pendiente">("todos");
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/survey/clicks")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (user?.role !== "admin") {
    return <div className="flex items-center justify-center py-24"><p className="font-mono text-surface-400">No tienes acceso a esta sección</p></div>;
  }

  const resend = async () => {
    const ok = await confirm({
      title: "Enviar encuesta",
      message: "Va a quienes todavía no han dado clic. La primera vez le llega a todo el mundo.",
      confirmLabel: "Sí, enviar",
      tone: "accent",
    });
    if (!ok) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/campaigns/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "post_survey" }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast(`Enviados: ${d.sentCount}${d.failedCount ? ` · fallidos: ${d.failedCount}` : ""}`, "success");
      setTimeout(load, 1500);
    } catch (e) { toast((e as Error).message, "error"); } finally { setSending(false); }
  };

  const pending = data ? data.sent - data.clicked : 0;
  const list = (data?.list ?? []).filter((r) => filtro === "todos" || (filtro === "clic" ? r.clicked : !r.clicked));
  const fmt = (s: string | null) => (s ? new Date(s).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b-2 border-surface-600 pb-4">
        <div className="flex items-center gap-2.5">
          <div>
            <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
              encuesta post-evento
            </h1>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button onClick={load} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-semibold text-surface-200 hover:bg-surface-700 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
          </button>
          <button onClick={() => window.open("/api/admin/campaigns/email-preview?type=post_survey", "_blank")} className="inline-flex min-h-11 items-center justify-center gap-2 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-semibold text-surface-200 hover:bg-surface-700">
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
          <button onClick={resend} disabled={sending} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 border-2 border-aws-orange bg-aws-orange px-4 py-2 font-mono text-xs font-bold text-surface-900 sm:col-span-1 hover:shadow-[0_0_16px_rgba(193,67,188,0.4)] disabled:opacity-50">
            <Send className="h-3.5 w-3.5" /> {sending ? "Enviando…" : "Enviar / Reenviar a pendientes"}
          </button>
        </div>
      </div>

      {/* Contadores */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Enviados", value: data?.sent ?? 0, icon: ClipboardList, accent: "text-surface-100" },
          { label: "Dieron clic", value: data?.clicked ?? 0, icon: MousePointerClick, accent: "text-emerald-400" },
          { label: "Pendientes", value: pending, icon: Clock, accent: "text-amber-400" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="border-2 border-surface-600 bg-surface-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-surface-400">{c.label}</p>
                  <p className={`mt-1.5 font-mono text-2xl font-bold tabular-nums ${c.accent}`}>{c.value.toLocaleString("es-MX")}</p>
                </div>
                <Icon className={`h-5 w-5 ${c.accent}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtro */}
      <div className="mb-4 flex gap-1 border-2 border-surface-600 bg-surface-800 p-1 self-start w-fit">
        {([["todos", "Todos"], ["clic", "Con clic"], ["pendiente", "Pendientes"]] as const).map(([v, label]) => (
          <button key={v} onClick={() => setFiltro(v)} className={`px-3 py-1.5 font-mono text-xs font-semibold transition-all ${filtro === v ? "bg-aws-orange text-surface-900" : "text-surface-400 hover:text-surface-200"}`}>{label}</button>
        ))}
      </div>

      {/* Tabla */}
      <div className="-mx-4 overflow-x-auto border-y-2 border-surface-600 bg-surface-800 sm:mx-0 sm:border-2">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-surface-600">
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-surface-400">Nombre</th>
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-surface-400">Rol</th>
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-surface-400">Estado</th>
              <th className="hidden px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-surface-400 sm:table-cell">Clic</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center"><div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-aws-orange border-t-transparent" /></td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center font-mono text-sm text-surface-300">{data?.sent ? "Sin resultados para este filtro" : "Aún no se ha enviado la encuesta"}</td></tr>
            ) : (
              list.map((r, i) => (
                <tr key={i} className="border-b border-surface-600/50 hover:bg-surface-800">
                  <td className="px-4 py-3 font-mono text-sm text-surface-100 truncate max-w-[220px]">{r.name}</td>
                  <td className="px-4 py-3"><span className="inline-block bg-surface-700 px-2 py-0.5 font-mono text-[10px] text-surface-300">{r.roleLabel}</span></td>
                  <td className="px-4 py-3">
                    {r.clicked
                      ? <span className="inline-flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald"><MousePointerClick className="h-3 w-3" /> Dio clic</span>
                      : <span className="inline-flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400"><Clock className="h-3 w-3" /> Pendiente</span>}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-surface-400 whitespace-nowrap sm:table-cell">{fmt(r.clickedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmaciones propias, no el popup del navegador. */}
      {dialog}
    </div>
  );
}
