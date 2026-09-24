"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { Search, Printer, X, CheckSquare, Square, Loader2, Settings, Plus, Trash2, Star, AlignLeft, AlignCenter, AlignRight, Check, Undo2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { Modal } from "@/components/ui/modal";
import { useUrlFilters, useDebounce } from "@/hooks/use-url-filters";
import { useConfirm } from "@/components/admin/confirm";

type RoleFilter = "all" | "attendee" | "volunteer" | "speaker" | "organizer";

interface PrintCfg {
  id: string; name: string;
  widthMm: number; heightMm: number; marginMm: number;
  qrPct: number; fontScale: number; perLabel: number; rotate: number; layout: string;
  alignName: string; alignJobTitle: string; alignCompany: string; alignRole: string;
  showQr: boolean; showRole: boolean; showCompany: boolean; showJobTitle: boolean;
  isDefault: boolean;
}

// Filtros en la URL
const FILTROS = { rol: "all", buscar: "" };

const ROLE_LABEL: Record<string, string> = {
  attendee:  "ASISTENTE",
  speaker:   "SPEAKER",
  volunteer: "VOLUNTARIO",
  organizer: "ORGANIZADOR",
};

const FILTERS: { id: RoleFilter; label: string }[] = [
  { id: "all",       label: "Todos"         },
  { id: "attendee",  label: "Asistentes"    },
  { id: "volunteer", label: "Voluntarios"   },
  { id: "speaker",   label: "Speakers"      },
  { id: "organizer", label: "Organizadores" },
];

interface Person {
  _id?: string;
  shortId: string;
  role: string;
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  viewPin?: string;
  confirmed?: boolean;
  badgePrinted?: boolean;
  badgeFirstName?: string;
  badgeLastName?: string;
  q?: string; // texto buscable del registro (incluye documento), normalizado
}

/* ── Effective badge name: what actually gets printed (chosen, or first token of each) ── */
function effBadgeName(p: Person) {
  const ft = (s?: string) => (s || "").trim().split(/\s+/)[0] || "";
  const first = p.badgeFirstName || ft(p.firstName);
  const last = p.badgeLastName || ft(p.lastName);
  const printed = `${first} ${last}`.trim();
  const full = `${p.firstName}${p.lastName ? ` ${p.lastName}` : ""}`.trim();
  return { first, last, printed, full, differs: printed.toUpperCase() !== full.toUpperCase() };
}

/* ── Imprime vía PDF al tamaño exacto de la etiqueta (sin encabezados del navegador) ── */
async function printBadges(people: Person[], configId: string) {
  const res = await fetch("/api/print/badges-pdf", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shortIds: people.map((p) => p.shortId), configId: configId || undefined }),
  });
  if (!res.ok) throw new Error("No se pudo generar el PDF");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  // Imprime el PDF desde un iframe oculto → el diálogo sale sin about:blank ni la hora.
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  iframe.src = url;
  iframe.onload = () => { setTimeout(() => { try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch {} }, 250); };
  document.body.appendChild(iframe);
  setTimeout(() => { URL.revokeObjectURL(url); iframe.remove(); }, 120000);
}

/* ── Bulk Print tab ── */
function BulkPrintTab() {
  const { values, set } = useUrlFilters(FILTROS);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // La búsqueda filtra al instante (local) y se sincroniza a la URL con debounce
  const [q, setQ] = useState(values.buscar);
  const debouncedQ = useDebounce(q, 300);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printing, setPrinting] = useState(false);
  const [vista, setVista] = useState<"pendientes" | "impresas">("pendientes");
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const [configs, setConfigs] = useState<PrintCfg[]>([]);
  const [configId, setConfigId] = useState<string>("");
  const [showConfig, setShowConfig] = useState(false);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/print/config");
      if (res.ok) {
        const d = await res.json();
        const list: PrintCfg[] = d.configs || [];
        setConfigs(list);
        setConfigId((cur) => cur || (list.find((c) => c.isDefault)?.id ?? list[0]?.id ?? ""));
      }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  useEffect(() => { set("buscar", debouncedQ); }, [debouncedQ, set]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/print/full-list?role=${values.rol}`);
      const data = await res.json();
      setPeople(data.people ?? []);
      setSelected(new Set());
      setLoaded(true);
    } finally { setLoading(false); }
  }, [values.rol]);

  useEffect(() => { if (loaded) load(); }, [values.rol]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = q
    ? people.filter((p) => {
        const ql = q.toLowerCase();
        return `${p.firstName} ${p.lastName} ${p.badgeFirstName ?? ""} ${p.badgeLastName ?? ""}`.toLowerCase().includes(ql)
          || (p.q ?? "").includes(ql); // documento, email, etc.
      })
    : people;

  // Los impresos se pasan a otra sección (lógica interna para ir sacando gente de la lista)
  const pendientes = filtered.filter((p) => !p.badgePrinted);
  const impresas = filtered.filter((p) => p.badgePrinted);
  const visibles = vista === "pendientes" ? pendientes : impresas;
  // Solo se renderizan las primeras filas (el resto se acota con la búsqueda) para que la lista grande vaya fluida
  const RENDER_CAP = 120;
  const shown = visibles.slice(0, RENDER_CAP);

  // Marca / desmarca impresos: optimista en la lista local + persiste en el server
  async function setPrinted(ids: string[], printed: boolean) {
    if (ids.length === 0) return;
    setPeople((prev) => prev.map((p) => (ids.includes(p.shortId) ? { ...p, badgePrinted: printed } : p)));
    setSelected(new Set());
    try {
      const res = await fetch("/api/print/mark", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shortIds: ids, printed }) });
      if (!res.ok) throw new Error();
      toast(printed ? `${ids.length} marcada(s) como impresa(s)` : `${ids.length} desmarcada(s)`, "success");
    } catch {
      toast("No se pudo guardar, recarga la lista", "error");
    }
  }

  function toggleAll() {
    if (selected.size === visibles.length) setSelected(new Set());
    else setSelected(new Set(visibles.map((p) => p.shortId)));
  }

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function handlePrint(subset: Person[]) {
    if (subset.length === 0) return;
    if (!configId) { toast("Crea o elige un preset de impresión primero", "error"); return; }
    setPrinting(true);
    try { await printBadges(subset, configId); }
    catch { toast("No se pudo generar el PDF", "error"); }
    finally { setPrinting(false); }
  }

  const selectedPeople = visibles.filter((p) => selected.has(p.shortId));

  return (
    <div className="flex flex-col gap-5">
      {/* Load button */}
      {!loaded && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Printer className="h-12 w-12 text-surface-700" />
          <p className="font-mono text-sm text-surface-400">Carga la lista completa para seleccionar e imprimir.</p>
          <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 bg-aws-orange px-6 py-3 font-mono text-sm font-bold text-surface-900 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            {loading ? "Cargando…" : "Cargar lista completa"}
          </button>
        </div>
      )}

      {loaded && (
        <>
          {/* Filters + search */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1 border-2 border-surface-600 bg-surface-800 p-1">
              {FILTERS.map(({ id, label }) => (
                <button key={id} onClick={() => { set("rol", id); }}
                  className={`px-3 py-1.5 font-mono text-xs font-semibold transition-all ${values.rol === id ? "bg-aws-orange text-surface-900" : "text-surface-400 hover:text-surface-200"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-300" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre…"
                className="w-full border-2 border-surface-600 bg-surface-700/40 py-2 pl-8 pr-8 font-mono text-xs text-surface-100 placeholder:text-surface-400 focus:border-aws-orange focus:outline-none" />
              {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300"><X className="h-3.5 w-3.5" /></button>}
            </div>
          </div>

          {/* Preset de impresión (tamaño de etiqueta) */}
          <div className="flex flex-wrap items-center gap-2 border-2 border-surface-600 bg-surface-800 px-3 py-2">
            <Printer className="h-3.5 w-3.5 text-surface-300" />
            <span className="font-mono text-[11px] text-surface-400">Etiqueta:</span>
            {configs.length === 0 ? (
              <span className="font-mono text-[11px] text-surface-300">Sin presets — {isAdmin ? "crea uno con Configurar →" : "pide a un admin que configure uno"}</span>
            ) : (
              <select value={configId} onChange={(e) => setConfigId(e.target.value)}
                className="border-2 border-surface-600 bg-surface-900 px-2 py-1 font-mono text-xs text-surface-100 focus:outline-none">
                {configs.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.widthMm}×{c.heightMm}mm{c.isDefault ? " ★" : ""}</option>)}
              </select>
            )}
            {isAdmin && (
              <button onClick={() => setShowConfig(true)} className="ml-auto inline-flex items-center gap-1.5 border-2 border-surface-600 px-2.5 py-1 font-mono text-[11px] text-surface-300 transition-colors hover:border-aws-orange hover:text-aws-orange">
                <Settings className="h-3 w-3" /> Configurar
              </button>
            )}
          </div>

          {/* Pestañas Pendientes / Impresas */}
          <div className="flex gap-1 border-2 border-surface-600 bg-surface-800 p-1 self-start">
            {([["pendientes", "Pendientes", pendientes.length], ["impresas", "Impresas", impresas.length]] as const).map(([v, label, count]) => (
              <button key={v} onClick={() => { setVista(v); setSelected(new Set()); }}
                className={`px-3 py-1.5 font-mono text-xs font-semibold transition-all ${vista === v ? (v === "impresas" ? "bg-emerald-500 text-surface-900" : "bg-aws-orange text-surface-900") : "text-surface-400 hover:text-surface-200"}`}>
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={toggleAll} className="flex items-center gap-1.5 font-mono text-xs text-surface-400 hover:text-surface-200 transition-colors">
                {selected.size === visibles.length && visibles.length > 0
                  ? <CheckSquare className="h-4 w-4 text-aws-orange" />
                  : <Square className="h-4 w-4" />}
                {selected.size === 0 ? "Seleccionar todos" : `${selected.size} de ${visibles.length}`}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.size > 0 && (
                vista === "pendientes" ? (
                  <button onClick={() => setPrinted(Array.from(selected), true)}
                    className="inline-flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 font-mono text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 transition-colors">
                    <Check className="h-3.5 w-3.5" /> Marcar impresas ({selected.size})
                  </button>
                ) : (
                  <button onClick={() => setPrinted(Array.from(selected), false)}
                    className="inline-flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-4 py-2 font-mono text-xs font-semibold text-surface-300 hover:bg-surface-700 transition-colors">
                    <Undo2 className="h-3.5 w-3.5" /> Desmarcar ({selected.size})
                  </button>
                )
              )}
              {selected.size > 0 && (
                <button onClick={() => handlePrint(selectedPeople)} disabled={printing}
                  className="inline-flex items-center gap-1.5 border-2 border-aws-orange/40 bg-aws-orange/10 px-4 py-2 font-mono text-xs font-semibold text-aws-orange hover:bg-aws-orange/20 disabled:opacity-50 transition-colors">
                  {printing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                  Imprimir seleccionados ({selected.size})
                </button>
              )}
              <button onClick={() => handlePrint(visibles)} disabled={printing || visibles.length === 0}
                className="inline-flex items-center gap-1.5 bg-aws-orange px-4 py-2 font-mono text-xs font-bold text-surface-900 hover:shadow-[0_0_16px_rgba(193,67,188,0.4)] disabled:opacity-50 transition-all">
                {printing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                Imprimir todos ({visibles.length})
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex flex-col gap-0 border-2 border-surface-600 overflow-hidden">
            {visibles.length === 0 && (
              <p className="py-10 text-center font-mono text-sm text-surface-300">
                {people.length === 0 ? "No hay pasaportes generados aún. Ve a la sección Pasaporte Digital → Generar." : vista === "impresas" ? "Nada marcado como impreso aún." : "Sin pendientes — todo impreso."}
              </p>
            )}
            {shown.map((p, i) => (
              <div key={p.shortId}
                onClick={() => toggle(p.shortId)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${i % 2 === 0 ? "bg-surface-900" : "bg-surface-800"} ${
                  selected.has(p.shortId)
                    ? "bg-aws-orange/10 border-l-2 border-aws-orange"
                    : p.confirmed
                      ? "hover:bg-surface-700/40 border-l-2 border-emerald-400/70 bg-emerald-400/[0.04]"
                      : "hover:bg-surface-700/40 border-l-2 border-transparent"
                }`}>
                {selected.has(p.shortId)
                  ? <CheckSquare className="h-4 w-4 shrink-0 text-aws-orange" />
                  : <Square className="h-4 w-4 shrink-0 text-surface-600" />}
                {(() => { const b = effBadgeName(p); return (
                  <div className="flex-1 min-w-0">
                    <span className={`block font-mono text-sm truncate uppercase ${p.confirmed ? "text-emerald-300 font-semibold" : "text-surface-100"}`}>
                      {b.printed || "—"}
                    </span>
                    {b.differs && (
                      <span className="block font-mono text-[10px] text-surface-300 truncate">reg: {b.full}</span>
                    )}
                  </div>
                ); })()}
                {p.confirmed && (
                  <span className="shrink-0 font-mono text-[9px] font-bold tracking-wider px-2 py-0.5 border text-emerald-400 border-emerald-400/40 bg-emerald-400/10">
                    ✓ CONFIRMADO
                  </span>
                )}
                {(p.jobTitle || p.company) && (
                  <span className="hidden sm:block font-mono text-xs text-surface-300 truncate max-w-[200px]">
                    {[p.jobTitle, p.company].filter(Boolean).join(" · ")}
                  </span>
                )}
                <span className={`shrink-0 font-mono text-[10px] font-bold tracking-wider px-2.5 py-0.5 border ${
                  p.role === "attendee"  ? "text-blue-400 border-blue-400/30 bg-blue-400/10" :
                  p.role === "speaker"   ? "text-purple-400 border-purple-400/30 bg-purple-400/10" :
                  p.role === "volunteer" ? "text-green-400 border-green-400/30 bg-green-400/10" :
                  "text-aws-orange border-aws-orange/30 bg-aws-orange/10"
                }`}>
                  {ROLE_LABEL[p.role] ?? p.role}
                </span>
                {p.badgePrinted ? (
                  <button onClick={(e) => { e.stopPropagation(); setPrinted([p.shortId], false); }} title="Desmarcar impresa"
                    className="shrink-0 inline-flex items-center gap-1 border-2 border-surface-600 bg-surface-800 px-2 py-1 font-mono text-[10px] text-surface-400 hover:text-surface-100 transition-colors">
                    <Undo2 className="h-3 w-3" /> Desmarcar
                  </button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setPrinted([p.shortId], true); }} title="Marcar como impresa"
                    className="shrink-0 inline-flex items-center gap-1 border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-mono text-[10px] text-emerald-300 hover:bg-emerald-400/20 transition-colors">
                    <Check className="h-3 w-3" /> Impresa
                  </button>
                )}
              </div>
            ))}
            {visibles.length > RENDER_CAP && (
              <p className="border-t-2 border-surface-600 bg-surface-900 py-3 text-center font-mono text-[11px] text-surface-300">
                Mostrando {RENDER_CAP} de {visibles.length} — afina la búsqueda (nombre o documento) para ver el resto. Imprimir/marcar aplica a todos.
              </p>
            )}
          </div>
        </>
      )}

      {isAdmin && showConfig && (
        <PrintConfigModal open={showConfig} onClose={() => setShowConfig(false)} configs={configs} onChanged={fetchConfigs} />
      )}
    </div>
  );
}

/* ── Modal de configuración de impresión (presets por modelo de impresora) ── */
function emptyDraft(): Omit<PrintCfg, "id"> {
  return { name: "", widthMm: 101.6, heightMm: 152.4, marginMm: 3, qrPct: 32, fontScale: 1, perLabel: 1, rotate: 0, layout: "side", alignName: "left", alignJobTitle: "left", alignCompany: "left", alignRole: "left", showQr: true, showRole: true, showCompany: true, showJobTitle: true, isDefault: false };
}

function PrintConfigModal({ open, onClose, configs, onChanged }: { open: boolean; onClose: () => void; configs: PrintCfg[]; onChanged: () => void }) {
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<PrintCfg, "id">>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const startNew = () => { setEditingId(null); setDraft(emptyDraft()); };
  const startEdit = (c: PrintCfg) => { setEditingId(c.id); const { id: _id, ...rest } = c; void _id; setDraft(rest); };

  const save = async () => {
    if (!draft.name.trim() || !(draft.widthMm > 0) || !(draft.heightMm > 0)) { toast("Nombre, ancho y alto (mm) son requeridos", "error"); return; }
    setSaving(true);
    try {
      const url = editingId ? `/api/print/config/${editingId}` : "/api/print/config";
      const res = await fetch(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const d = await res.json(); if (!res.ok) throw new Error(d.error);
      toast(editingId ? "Preset actualizado" : "Preset creado", "success");
      startNew(); onChanged();
    } catch (e) { toast((e as Error).message, "error"); } finally { setSaving(false); }
  };

  const del = async (c: PrintCfg) => {
    const ok = await confirm({
      title: "Eliminar preset",
      message: `Se elimina "${c.name}". Los ajustes de impresión guardados en él se pierden.`,
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/print/config/${c.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Preset eliminado", "success");
      if (editingId === c.id) startNew();
      onChanged();
    } catch { toast("Error al eliminar", "error"); }
  };

  const numField = (label: string, key: keyof Omit<PrintCfg, "id" | "name">, step = 1) => (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-surface-400">{label}</span>
      <input type="number" step={step} value={draft[key] as number}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: Number(e.target.value) }))}
        className="border-2 border-surface-600 bg-surface-900 px-2.5 py-2 font-mono text-sm text-surface-100 focus:border-aws-orange focus:outline-none" />
    </label>
  );

  const alignField = (label: string, key: "alignName" | "alignJobTitle" | "alignCompany" | "alignRole") => (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-surface-400">{label}</span>
      <div className="flex gap-1">
        {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([v, Icon]) => (
          <button key={v} type="button" onClick={() => setDraft((d) => ({ ...d, [key]: v }))}
            className={`flex h-7 w-7 items-center justify-center border transition-colors ${draft[key] === v ? "border-aws-orange/50 bg-aws-orange/15 text-aws-orange" : "border-surface-600 bg-surface-800 text-surface-400"}`}>
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  );

  const checkField = (label: string, key: "showQr" | "showRole" | "showCompany" | "showJobTitle" | "isDefault") => (
    <button type="button" onClick={() => setDraft((d) => ({ ...d, [key]: !d[key] }))}
      className={`flex items-center gap-2 px-3 py-2 text-left font-mono text-xs transition-colors ${draft[key] ? "bg-aws-orange/10 text-aws-orange" : "bg-surface-800 text-surface-400"}`}>
      <span className={`flex h-4 w-4 items-center justify-center rounded border ${draft[key] ? "border-aws-orange bg-aws-orange/20" : "border-surface-600"}`}>{draft[key] && "✓"}</span>
      {label}
    </button>
  );

  return (
    <Modal open={open} onClose={onClose} title="Configuración de impresión" size="lg">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Presets existentes */}
        <div className="flex flex-col gap-1.5 sm:w-48 sm:shrink-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-surface-300">Presets</p>
          {configs.length === 0 && <p className="font-mono text-[11px] text-surface-600">Aún no hay presets.</p>}
          {configs.map((c) => (
            <div key={c.id} className={`flex items-center gap-1 border px-2 py-1.5 ${editingId === c.id ? "border-aws-orange/50 bg-aws-orange/5" : "border-surface-600"}`}>
              <button onClick={() => startEdit(c)} className="flex flex-1 items-center gap-1.5 text-left font-mono text-xs text-surface-200 min-w-0">
                {c.isDefault && <Star className="h-3 w-3 shrink-0 text-aws-orange" />}
                <span className="truncate">{c.name}</span>
              </button>
              <button onClick={() => del(c)} className="shrink-0 rounded p-1 text-surface-300 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <button onClick={startNew} className="mt-1 inline-flex items-center justify-center gap-1.5 border-2 border-dashed border-surface-600 px-2 py-1.5 font-mono text-xs text-surface-300 hover:border-aws-orange hover:text-aws-orange">
            <Plus className="h-3.5 w-3.5" /> Nuevo
          </button>
        </div>

        {/* Formulario */}
        <div className="flex flex-1 flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-surface-400">Nombre del preset</span>
            <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Dymo 350 — sticker"
              className="border-2 border-surface-600 bg-surface-900 px-2.5 py-2 font-mono text-sm text-surface-100 focus:border-aws-orange focus:outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            {numField("Ancho (mm)", "widthMm", 0.1)}
            {numField("Alto (mm)", "heightMm", 0.1)}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {numField("Margen (mm)", "marginMm", 0.5)}
            {numField("QR (% ancho)", "qrPct", 1)}
            {numField("Escala texto", "fontScale", 0.05)}
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-surface-400">Escarapelas por etiqueta</span>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2].map((n) => (
                <button key={n} type="button" onClick={() => setDraft((d) => ({ ...d, perLabel: n }))}
                  className={`px-3 py-2 font-mono text-xs font-semibold transition-colors ${draft.perLabel === n ? "border-2 border-aws-orange/50 bg-aws-orange/15 text-aws-orange" : "border-2 border-surface-600 bg-surface-800 text-surface-400"}`}>
                  {n === 1 ? "1 por etiqueta" : "2 (cortar a la mitad)"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-surface-400">Disposición</span>
            <div className="grid grid-cols-2 gap-2">
              {([["side", "Lado a lado"], ["stacked", "Apilado (nombre grande)"]] as const).map(([v, label]) => (
                <button key={v} type="button" onClick={() => setDraft((d) => ({ ...d, layout: v }))}
                  className={`px-3 py-2 font-mono text-xs font-semibold transition-colors ${draft.layout === v ? "border-2 border-aws-orange/50 bg-aws-orange/15 text-aws-orange" : "border-2 border-surface-600 bg-surface-800 text-surface-400"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-surface-400">Giro del contenido</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[0, 90, 180, 270].map((n) => (
                <button key={n} type="button" onClick={() => setDraft((d) => ({ ...d, rotate: n }))}
                  className={`px-2 py-2 font-mono text-xs font-semibold transition-colors ${draft.rotate === n ? "border-2 border-aws-orange/50 bg-aws-orange/15 text-aws-orange" : "border-2 border-surface-600 bg-surface-800 text-surface-400"}`}>
                  {n}&deg;
                </button>
              ))}
            </div>
            <span className="font-mono text-[10px] text-surface-300">Si sale de lado o en blanco, gira 90&deg; (o 270&deg;).</span>
          </div>
          <div className="flex flex-col gap-2 border-2 border-surface-600 bg-surface-800 p-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-surface-400">Alineación del texto</span>
            {alignField("Nombre", "alignName")}
            {alignField("Cargo", "alignJobTitle")}
            {alignField("Empresa", "alignCompany")}
            {alignField("Rol", "alignRole")}
            <span className="font-mono text-[10px] text-surface-300">El nombre va arriba y el QR centrado abajo.</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {checkField("Mostrar QR", "showQr")}
            {checkField("Mostrar rol", "showRole")}
            {checkField("Empresa", "showCompany")}
            {checkField("Cargo", "showJobTitle")}
            {checkField("Predeterminado", "isDefault")}
          </div>
          <p className="font-mono text-[10px] leading-relaxed text-surface-300">
            Tip: mide tu sticker real y pon ancho×alto en mm. Pruebas 4×6&quot; = 101.6 × 152.4 mm. Dymo 350: usa el tamaño del rollo que traiga la agencia.
          </p>
          <button onClick={save} disabled={saving}
            className="mt-1 inline-flex items-center justify-center gap-2 bg-aws-orange px-4 py-2.5 font-mono text-sm font-bold text-surface-900 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
            {editingId ? "Guardar cambios" : "Crear preset"}
          </button>
        </div>
      </div>

      {/* Confirmaciones propias, no el popup del navegador. */}
      {dialog}
    </Modal>
  );
}

/* ── Main page ── */
function PrintPageInner() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 border-b-2 border-surface-600 pb-4">
        <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
          impresión de escarapelas
        </h1>
      </div>
      <BulkPrintTab />
    </div>
  );
}

// useSearchParams (en BulkPrintTab) requiere un <Suspense> alrededor
export default function PrintPage() {
  return (
    <Suspense>
      <PrintPageInner />
    </Suspense>
  );
}
