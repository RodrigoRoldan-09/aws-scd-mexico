"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { Plus, Edit2, Check, X, Loader2, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useConfirm } from "@/components/admin/confirm";

type Tab = "sponsors" | "generate";

// Pestaña activa en la URL
const FILTROS = { tab: "sponsors" };

interface SponsorPin {
  _id: string;
  sponsorName: string;
  logoUrl?: string;
  pin: string;
  isActive: boolean;
  totalStamps: number;
}

interface GenerateResult { created: number; skipped: number; failed: number; }

const ROLES = [
  { key: "attendee",  label: "Asistentes"   },
  { key: "volunteer", label: "Voluntarios"   },
  { key: "speaker",   label: "Speakers"      },
  { key: "organizer", label: "Organizadores" },
] as const;

/* ── Sponsors tab ── */
function SponsorsTab() {
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [pins, setPins] = useState<SponsorPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({ sponsorName: "", logoUrl: "", pin: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/sponsor-pins")
      .then((r) => r.json())
      .then((d) => setPins(d.pins ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!form.sponsorName.trim() || !/^\d{4}$/.test(form.pin)) {
      toast("Nombre y PIN de 4 dígitos requeridos", "error"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sponsor-pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error || "Error", "error"); return; }
      setPins((p) => [data.pin, ...p]);
      setForm({ sponsorName: "", logoUrl: "", pin: "" });
      setShowAdd(false);
      toast("Sponsor creado", "success");
    } finally { setSaving(false); }
  }

  async function handleToggle(sp: SponsorPin) {
    try {
      const res = await fetch(`/api/admin/sponsor-pins/${sp._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !sp.isActive }),
      });
      const data = await res.json();
      if (res.ok) setPins((p) => p.map((x) => (x._id === sp._id ? data.pin : x)));
    } catch { toast("Error", "error"); }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: "Eliminar sponsor",
      message: "Se elimina el sponsor y su PIN. Los sellos ya dados en los pasaportes se conservan.",
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/sponsor-pins/${id}`, { method: "DELETE" });
    if (res.ok) { setPins((p) => p.filter((x) => x._id !== id)); toast("Eliminado", "success"); }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-aws-orange" /></div>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-surface-400">Cada sponsor tiene un PIN único de 4 dígitos que los asistentes ingresan para obtener su sello.</p>
        <button onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 border-2 border-aws-orange/40 bg-aws-orange/10 px-4 py-2 font-mono text-xs font-semibold text-aws-orange hover:bg-aws-orange/20 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Añadir sponsor
        </button>
      </div>

      {showAdd && (
        <div className="border-2 border-surface-600 bg-surface-700/40 p-5 flex flex-col gap-4">
          <p className="font-mono text-sm font-semibold text-surface-200">Nuevo sponsor</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs text-surface-400">Nombre del sponsor</label>
              <input value={form.sponsorName} onChange={(e) => setForm((f) => ({ ...f, sponsorName: e.target.value }))}
                placeholder="Clouxter, Epam, AWS…"
                className="border-2 border-surface-600 bg-surface-900 px-4 py-2.5 font-mono text-sm text-surface-100 focus:border-aws-orange focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs text-surface-400">PIN (4 dígitos)</label>
              <input value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                placeholder="1234" maxLength={4} inputMode="numeric"
                className="border-2 border-surface-600 bg-surface-900 px-4 py-2.5 font-mono text-sm tracking-[0.3em] text-surface-100 focus:border-aws-orange focus:outline-none" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-surface-400">Logo del sponsor</label>
            <ImageUpload
              value={form.logoUrl}
              onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
              folder="sponsors"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)}
              className="border-2 border-surface-600 px-4 py-2 font-mono text-xs text-surface-400 hover:text-surface-200">
              Cancelar
            </button>
            <button onClick={handleCreate} disabled={saving}
              className="inline-flex items-center gap-2 bg-aws-orange px-5 py-2 font-mono text-xs font-bold text-surface-900 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Guardar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {pins.length === 0 && <p className="py-8 text-center font-mono text-sm text-surface-300">No hay sponsors configurados aún.</p>}
        {pins.map((sp) => (
          <div key={sp._id} className={`border ${sp.isActive ? "border-surface-700" : "border-surface-800 opacity-60"} bg-surface-800 px-5 py-4 flex items-center gap-4`}>
            {sp.logoUrl ? (
              <div className="relative h-10 w-20 shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sp.logoUrl} alt={sp.sponsorName} className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="h-10 w-20 shrink-0 flex items-center justify-center bg-surface-700">
                <span className="font-mono text-xs text-surface-400">{sp.sponsorName.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-semibold text-surface-100 truncate">{sp.sponsorName}</p>
              <p className="font-mono text-xs text-surface-300">{sp.totalStamps} sellos dados</p>
            </div>
            <div className="font-mono text-base font-bold tracking-[0.3em] text-aws-orange bg-aws-orange/10 border-2 border-aws-orange/20 px-3 py-1.5">
              {sp.pin}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => handleToggle(sp)} title={sp.isActive ? "Desactivar" : "Activar"}
                className="p-1.5 text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-colors">
                {sp.isActive ? <ToggleRight className="h-5 w-5 text-green-400" /> : <ToggleLeft className="h-5 w-5" />}
              </button>
              <button onClick={() => handleDelete(sp._id)} title="Eliminar"
                className="p-1.5 text-surface-600 hover:text-red-400 hover:bg-surface-700 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmaciones propias, no el popup del navegador. */}
      {dialog}
    </div>
  );
}

/* ── Generate tab ── */
function GenerateTab() {
  const { toast } = useToast();
  const [results, setResults] = useState<Record<string, GenerateResult | "loading">>({});

  async function generate(role: string) {
    setResults((r) => ({ ...r, [role]: "loading" }));
    try {
      const res = await fetch("/api/admin/passports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults((r) => ({ ...r, [role]: data }));
        toast(`${data.created} pasaportes creados`, "success");
      } else {
        toast(data.error || "Error", "error");
        setResults((r) => { const n = { ...r }; delete n[role]; return n; });
      }
    } catch {
      toast("Error de conexión", "error");
      setResults((r) => { const n = { ...r }; delete n[role]; return n; });
    }
  }

  async function syncAll() {
    for (const { key } of ROLES) await generate(key);
    toast("Sincronización completa", "success");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-surface-700 bg-surface-800 p-5 flex flex-col gap-3">
        <p className="font-mono text-sm font-semibold text-surface-200">Generar pasaportes por rol</p>
        <p className="font-mono text-xs text-surface-400">
          Para los 800+ registros existentes, genera todos los pasaportes de una vez. Es idempotente — si ya existe, se omite. Corre &quot;Sincronizar todos&quot; la noche anterior al evento.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {ROLES.map(({ key, label }) => {
            const res = results[key];
            return (
              <button key={key} onClick={() => generate(key)} disabled={res === "loading"}
                className="flex flex-col items-start gap-2 border-2 border-surface-600 bg-surface-700/40 px-4 py-3 text-left transition-all hover:border-aws-orange hover:bg-aws-orange/5 disabled:opacity-60">
                <span className="font-mono text-sm font-semibold text-surface-100">{label}</span>
                {res === "loading" ? (
                  <span className="flex items-center gap-1.5 font-mono text-xs text-surface-400">
                    <Loader2 className="h-3 w-3 animate-spin" /> Generando…
                  </span>
                ) : res ? (
                  <span className="font-mono text-[10px] text-surface-400">
                    ✅ {res.created} creados · {res.skipped} existentes{res.failed > 0 ? ` · ⚠ ${res.failed} errores` : ""}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-surface-300">Clic para generar</span>
                )}
              </button>
            );
          })}
        </div>
        <button onClick={syncAll}
          className="mt-1 w-full bg-aws-orange px-5 py-3 font-mono text-sm font-bold text-surface-900 hover:shadow-[0_0_20px_rgba(193,67,188,0.3)] transition-all">
          Sincronizar todos (noche anterior al evento)
        </button>
      </div>
    </div>
  );
}


/* ── Page ── */
const TABS: { id: Tab; label: string }[] = [
  { id: "sponsors", label: "Sponsors" },
  { id: "generate", label: "Generar" },
];

function PassaportesPageInner() {
  const { values, set } = useUrlFilters(FILTROS);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 border-b-2 border-surface-600 pb-4">
        <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
          pasaporte digital
        </h1>
      </div>

      <div className="mb-5 flex gap-1 border-2 border-surface-600 bg-surface-800 p-1">
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => set("tab", id)}
            className={`flex-1 py-2 font-mono text-xs font-semibold transition-all ${values.tab === id ? "bg-aws-orange text-surface-900" : "text-surface-400 hover:text-surface-200"}`}>
            {label}
          </button>
        ))}
      </div>

      {values.tab === "sponsors" && <SponsorsTab />}
      {values.tab === "generate" && <GenerateTab />}
    </div>
  );
}

// useSearchParams requiere un <Suspense> alrededor
export default function PassaportesPage() {
  return (
    <Suspense>
      <PassaportesPageInner />
    </Suspense>
  );
}
