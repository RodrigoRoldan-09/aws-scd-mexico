"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/admin/confirm";
import { CheckSquare, Square, Eye, Pencil, Send, Loader2, RefreshCw, Search, X } from "lucide-react";

interface VolRow {
  id: string;
  name: string;     // efectivo (override o del form)
  rawName: string;  // como vino en el form
  email: string;
  certSentAt: string | null;
}

export default function CertificadosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [rows, setRows] = useState<VolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<VolRow | null>(null);
  const [editing, setEditing] = useState<VolRow | null>(null);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/certificates")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setRows(d.volunteers || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (user?.role !== "admin") {
    return <div className="flex items-center justify-center py-24"><p className="font-mono text-surface-400">No tienes acceso a esta sección</p></div>;
  }

  const filtered = q
    ? rows.filter((r) => `${r.name} ${r.rawName} ${r.email}`.toLowerCase().includes(q.toLowerCase()))
    : rows;
  const sentCount = rows.filter((r) => r.certSentAt).length;

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => (s.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.id))));

  const send = async (ids: string[]) => {
    if (ids.length === 0) return;
    const already = rows.filter((r) => ids.includes(r.id) && r.certSentAt).length;
    const ok = await confirm({
      title: ids.length === 1 ? "Enviar certificado" : `Enviar ${ids.length} certificados`,
      message: [
        ids.length === 1
          ? "Se le manda el certificado por correo, con el PDF adjunto."
          : `Se les manda el certificado por correo a ${ids.length} voluntarios, con el PDF adjunto.`,
        already
          ? already === 1
            ? "Uno de ellos ya lo había recibido: se le reenvía."
            : `${already} ya lo habían recibido: se les reenvía.`
          : "",
      ].filter(Boolean).join(" "),
      confirmLabel: "Sí, enviar",
      tone: "accent",
    });
    if (!ok) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/certificates/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast(`${d.sentCount} enviados${d.failedCount ? ` · ${d.failedCount} fallidos` : ""}${d.skipped ? ` · ${d.skipped} sin correo` : ""}`, d.failedCount ? "error" : "success");
      setSelected(new Set());
      load();
    } catch (e) { toast((e as Error).message, "error"); } finally { setSending(false); }
  };

  const sendTest = async (id: string) => {
    const email = testEmail.trim();
    if (!email.includes("@")) { toast("Escribe un correo válido para la prueba", "error"); return; }
    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/certificates/test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast(`Prueba enviada a ${email} (con PDF adjunto)`, "success");
    } catch (e) { toast((e as Error).message, "error"); } finally { setSendingTest(false); }
  };

  const openEdit = (r: VolRow) => { setEditing(r); setEditName(r.name); };
  const saveName = async () => {
    if (!editing) return;
    setSavingName(true);
    try {
      const res = await fetch(`/api/admin/certificates/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certName: editName.trim() === editing.rawName.trim() ? "" : editName }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast("Nombre actualizado", "success");
      setEditing(null);
      load();
    } catch (e) { toast((e as Error).message, "error"); } finally { setSavingName(false); }
  };

  const fmt = (s: string | null) => (s ? new Date(s).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : null);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b-2 border-surface-600 pb-4">
        <div className="flex items-center gap-2.5">
          <div>
            <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
              certificados de voluntarios
            </h1>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          className="inline-flex items-center justify-center gap-2 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-semibold text-surface-200 hover:bg-surface-700 disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      </div>

      {/* Buscador + acciones */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-300" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o correo…"
            className="w-full border-2 border-surface-600 bg-surface-700/40 py-2 pl-8 pr-8 font-mono text-xs text-surface-100 placeholder:text-surface-400 focus:border-aws-orange focus:outline-none" />
          {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <button onClick={toggleAll} className="flex items-center gap-1.5 font-mono text-xs text-surface-400 hover:text-surface-200 transition-colors">
          {selected.size === filtered.length && filtered.length > 0
            ? <CheckSquare className="h-4 w-4 text-aws-orange" />
            : <Square className="h-4 w-4" />}
          {selected.size === 0 ? "Seleccionar todos" : `${selected.size} de ${filtered.length}`}
        </button>
        {selected.size > 0 && (
          <button onClick={() => send(Array.from(selected))} disabled={sending}
            className="inline-flex items-center gap-1.5 bg-aws-orange px-4 py-2 font-mono text-xs font-bold text-surface-900 hover:shadow-[0_0_16px_rgba(242,166,240,0.4)] disabled:opacity-50 transition-all">
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Enviar a {selected.size} seleccionados
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-0 border-2 border-surface-600 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-aws-orange border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center font-mono text-sm text-surface-300">{rows.length === 0 ? "No hay voluntarios aprobados" : "Sin resultados"}</p>
        ) : (
          filtered.map((r, i) => (
            <div key={r.id} onClick={() => toggle(r.id)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${i % 2 === 0 ? "bg-surface-900" : "bg-surface-800"} ${
                selected.has(r.id) ? "bg-aws-orange/10 border-l-2 border-aws-orange" : "hover:bg-surface-700/40 border-l-2 border-transparent"
              }`}>
              {selected.has(r.id)
                ? <CheckSquare className="h-4 w-4 shrink-0 text-aws-orange" />
                : <Square className="h-4 w-4 shrink-0 text-surface-600" />}
              <div className="flex-1 min-w-0">
                <span className="block font-mono text-sm text-surface-100 truncate uppercase">{r.name || "(sin nombre)"}</span>
                <span className="block font-mono text-[10px] text-surface-300 truncate">
                  {r.email || "(sin correo)"}{r.name.trim() !== r.rawName.trim() && r.rawName ? ` · form: ${r.rawName}` : ""}
                </span>
              </div>
              {r.certSentAt ? (
                <span className="shrink-0 border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider text-emerald-400">
                  ENVIADO {fmt(r.certSentAt)}
                </span>
              ) : (
                <span className="shrink-0 border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider text-yellow-400">
                  PENDIENTE
                </span>
              )}
              <button onClick={(e) => { e.stopPropagation(); setPreview(r); }} title="Ver certificado"
                className="shrink-0 inline-flex items-center gap-1 border-2 border-surface-600 px-2 py-1 font-mono text-[10px] text-surface-300 hover:border-aws-orange hover:text-aws-orange transition-colors">
                <Eye className="h-3 w-3" /> Ver
              </button>
              <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} title="Editar nombre"
                className="shrink-0 inline-flex items-center gap-1 border-2 border-surface-600 px-2 py-1 font-mono text-[10px] text-surface-300 hover:border-aws-orange hover:text-aws-orange transition-colors">
                <Pencil className="h-3 w-3" /> Nombre
              </button>
              <button onClick={(e) => { e.stopPropagation(); send([r.id]); }} disabled={sending} title="Enviar certificado"
                className="shrink-0 inline-flex items-center gap-1 border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-mono text-[10px] text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-50 transition-colors">
                <Send className="h-3 w-3" /> Enviar
              </button>
            </div>
          ))
        )}
      </div>

      {/* Preview del certificado */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview ? `Certificado — ${preview.name.toUpperCase()}` : "Certificado"} size="xl">
        {preview && (
          <div className="flex flex-col gap-3">
            <iframe src={`/api/admin/certificates/${preview.id}/pdf`} className="h-[62vh] w-full border-2 border-surface-600 bg-white" title="Certificado" />
            {/* Envío de prueba a cualquier correo (no marca como enviado) */}
            <div className="flex flex-wrap items-center gap-2 border-2 border-surface-600 bg-surface-800 px-3 py-2">
              <span className="font-mono text-[11px] text-surface-400">Prueba:</span>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="correo@para-probar.com"
                onKeyDown={(e) => { if (e.key === "Enter") sendTest(preview.id); }}
                className="flex-1 min-w-[180px] border-2 border-surface-600 bg-surface-900 px-3 py-1.5 font-mono text-xs text-surface-100 placeholder:text-surface-400 focus:border-aws-orange focus:outline-none"
              />
              <button onClick={() => sendTest(preview.id)} disabled={sendingTest}
                className="inline-flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-1.5 font-mono text-xs font-semibold text-surface-200 hover:bg-surface-700 disabled:opacity-50">
                {sendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Enviar prueba
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { openEdit(preview); setPreview(null); }}
                className="inline-flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-200 hover:bg-surface-700">
                <Pencil className="h-3.5 w-3.5" /> Editar nombre
              </button>
              <button onClick={() => { send([preview.id]); setPreview(null); }} disabled={sending}
                className="inline-flex items-center gap-1.5 bg-aws-orange px-4 py-2 font-mono text-xs font-bold text-surface-900 disabled:opacity-50">
                <Send className="h-3.5 w-3.5" /> Enviar este certificado
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Editar nombre */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Nombre en el certificado` : ""}>
        {editing && (
          <div className="flex flex-col gap-4">
            <p className="font-mono text-xs text-surface-400">
              Como vino en el form: <span className="text-surface-200">{editing.rawName || "(vacío)"}</span>
            </p>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
              className="border-2 border-surface-600 bg-surface-900 px-3 py-2.5 font-mono text-sm text-surface-100 focus:border-aws-orange focus:outline-none" />
            <p className="font-mono text-[10px] text-surface-300">Se imprime en MAYÚSCULAS en el certificado. Deja el nombre igual al del form para quitar el override.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="border-2 border-surface-600 bg-surface-800 px-4 py-2 font-mono text-xs text-surface-300 hover:bg-surface-700">Cancelar</button>
              <button onClick={saveName} disabled={savingName}
                className="inline-flex items-center gap-1.5 bg-aws-orange px-4 py-2 font-mono text-xs font-bold text-surface-900 disabled:opacity-50">
                {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Guardar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmaciones propias, no el popup del navegador. */}
      {dialog}
    </div>
  );
}
