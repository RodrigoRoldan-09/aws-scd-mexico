"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { Save, Link as LinkIcon, Plus, X, Users, Trash2, RefreshCw, AlertTriangle, HeartHandshake, UserCheck } from "lucide-react";
import { useConfirm } from "@/components/admin/confirm";

interface Config {
  trackVirtualUrl: string;
  photosUrl: string;
  recordingsUrl: string;
  notify2027Url: string;
  showSponsorsCta: boolean;
  showSpeakerCta: boolean;
  tips: string[];
}

function Toggle({ label, hint, checked, onChange }: {
  label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-surface-400">{label}</p>
        {hint && <p className="font-mono text-[11px] text-surface-300 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ${checked ? "bg-aws-orange" : "bg-surface-600"}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function UrlField({ label, hint, value, onChange }: {
  label: string; hint: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-xs font-semibold uppercase tracking-widest text-surface-400">{label}</label>
      <p className="font-mono text-[11px] text-surface-300">{hint}</p>
      <div className="relative mt-0.5">
        <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-300" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full border-2 border-surface-600 bg-surface-700/40 py-2.5 pl-9 pr-4 font-mono text-sm text-surface-100 placeholder:text-surface-400 focus:border-aws-orange focus:outline-none"
        />
      </div>
    </div>
  );
}

export default function ConfigPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [config, setConfig] = useState<Config>({ trackVirtualUrl: "", photosUrl: "", recordingsUrl: "", notify2027Url: "", showSponsorsCta: true, showSpeakerCta: true, tips: [] });
  const [newTip, setNewTip] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!loading && user && user.role !== "admin") router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/event-config")
      .then((r) => r.json())
      .then((d) => { setConfig(d); setFetched(true); })
      .catch(() => setFetched(true));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/event-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error();
      toast("Configuración guardada", "success");
    } catch {
      toast("Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  const set = (k: keyof Config) => (v: string) => setConfig((c) => ({ ...c, [k]: v }));
  const setBool = (k: keyof Config) => (v: boolean) => setConfig((c) => ({ ...c, [k]: v }));

  if (loading || !fetched) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-aws-orange border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 border-b-2 border-surface-600 pb-4">
        <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
          configuración del evento
        </h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Día del evento */}
        <div className="border-2 border-surface-600 bg-surface-800 p-6">
          <h2 className="mb-5 font-mono text-sm font-semibold uppercase tracking-wider text-surface-300">
            Día del Evento · 4 nov
          </h2>
          <UrlField
            label="URL del Track Virtual"
            hint='Botón "Track Virtual" en el home cuando el evento ha comenzado.'
            value={config.trackVirtualUrl}
            onChange={set("trackVirtualUrl")}
          />
        </div>

        {/* Post-evento */}
        <div className="border-2 border-surface-600 bg-surface-800 p-6">
          <h2 className="mb-5 font-mono text-sm font-semibold uppercase tracking-wider text-surface-300">
            Post-Evento · 5 nov en adelante
          </h2>
          <div className="flex flex-col gap-5">
            <UrlField
              label="Galería de Fotos"
              hint='Botón "Ver Galería de Fotos" en el home después del evento.'
              value={config.photosUrl}
              onChange={set("photosUrl")}
            />
            <UrlField
              label="Grabaciones"
              hint='Botón "Ver Grabaciones" en el home después del evento.'
              value={config.recordingsUrl}
              onChange={set("recordingsUrl")}
            />
            <UrlField
              label="Notificación 2027"
              hint='Botón "Notifícame del 2027" — puede ser un Google Form o newsletter.'
              value={config.notify2027Url}
              onChange={set("notify2027Url")}
            />
          </div>
        </div>

        {/* Tips del correo 1d */}
        <div className="border-2 border-surface-600 bg-surface-800 p-6">
          <h2 className="mb-1 font-mono text-sm font-semibold uppercase tracking-wider text-surface-300">
            Recordatorios · Tips del día anterior
          </h2>
          <p className="mb-5 font-mono text-[11px] text-surface-300 leading-relaxed">
            Lista de consejos que aparecen en el correo &quot;¡Es mañana!&quot; (1 día antes del evento). Incluye el emoji en el texto, ej:{" "}
            <span className="text-surface-300">💧 Trae tu botella de agua</span>
          </p>

          <div className="flex flex-col gap-2 mb-4">
            {config.tips.map((tip, i) => (
              <div key={i} className="flex items-center gap-2 border-2 border-surface-600 bg-surface-700/40 px-3 py-2">
                <span className="flex-1 font-mono text-sm text-surface-200">{tip}</span>
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, tips: c.tips.filter((_, j) => j !== i) }))}
                  className="shrink-0 text-surface-300 hover:text-red-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {config.tips.length === 0 && (
              <p className="font-mono text-xs text-surface-600 italic">Sin tips — se usarán los valores por defecto al enviar.</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTip}
              onChange={(e) => setNewTip(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const t = newTip.trim();
                  if (t) { setConfig((c) => ({ ...c, tips: [...c.tips, t] })); setNewTip(""); }
                }
              }}
              placeholder="💡 Nuevo tip (Enter para agregar)"
              className="flex-1 border-2 border-surface-600 bg-surface-700/40 px-3 py-2 font-mono text-sm text-surface-100 placeholder:text-surface-400 focus:border-aws-orange focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const t = newTip.trim();
                if (t) { setConfig((c) => ({ ...c, tips: [...c.tips, t] })); setNewTip(""); }
              }}
              className="inline-flex items-center gap-1.5 border-2 border-surface-600 bg-surface-700 px-4 py-2 font-mono text-sm text-surface-200 hover:bg-surface-600 transition-colors"
            >
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </div>
        </div>

        {/* Sección de patrocinadores */}
        <div className="border-2 border-surface-600 bg-surface-800 p-6">
          <h2 className="mb-5 font-mono text-sm font-semibold uppercase tracking-wider text-surface-300">
            Sponsors
          </h2>
          <Toggle
            label="CTA ¿Quieres ser patrocinador?"
            hint='Muestra u oculta la tarjeta "¿Quieres ser patrocinador? · Contáctanos" en la sección de sponsors.'
            checked={config.showSponsorsCta}
            onChange={setBool("showSponsorsCta")}
          />
        </div>

        {/* Sección de speakers */}
        <div className="border-2 border-surface-600 bg-surface-800 p-6">
          <h2 className="mb-5 font-mono text-sm font-semibold uppercase tracking-wider text-surface-300">
            Speakers
          </h2>
          <Toggle
            label='CTA "Postúlate como speaker"'
            hint='Muestra u oculta el botón de postulación en el home y en el directorio. Desactívalo cuando las convocatorias estén cerradas.'
            checked={config.showSpeakerCta}
            onChange={setBool("showSpeakerCta")}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-aws-orange px-5 py-2.5 font-mono text-sm font-bold text-surface-900 transition-all hover:shadow-[0_0_20px_rgba(242,166,240,0.3)] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>

      {/* Duplicados registros ⇄ voluntarios */}
      <DuplicatesSection />
    </div>
  );
}

interface DuplicateRow {
  email: string;
  registration: { id: string; name: string };
  volunteer: { id: string; name: string; approved: boolean };
}

function DuplicatesSection() {
  const { confirm, dialog } = useConfirm();
  const { toast } = useToast();
  const [dups, setDups] = useState<DuplicateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingEmail, setActingEmail] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/duplicates");
      if (!res.ok) throw new Error();
      const data = await res.json() as { duplicates: DuplicateRow[] };
      setDups(data.duplicates || []);
    } catch {
      toast("Error al cargar duplicados", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const removeRegistration = async (row: DuplicateRow) => {
    const ok = await confirm({
      title: "Eliminar el registro",
      message: `Se elimina el registro de asistente de ${row.registration.name} (${row.email}) y su pasaporte. Sigue como voluntario.`,
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;
    setActingEmail(row.email);
    try {
      const res = await fetch(`/api/registrations/${row.registration.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      setDups((p) => p.filter((d) => d.email !== row.email));
      toast("Registro eliminado · queda como voluntario", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setActingEmail(null);
    }
  };

  const removeVolunteer = async (row: DuplicateRow) => {
    const ok = await confirm({
      title: "Eliminar la postulación",
      message: `Se elimina la postulación de voluntario de ${row.volunteer.name} (${row.email}). Sigue como asistente.`,
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;
    setActingEmail(row.email);
    try {
      const res = await fetch(`/api/volunteers/${row.volunteer.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      setDups((p) => p.filter((d) => d.email !== row.email));
      toast("Voluntario eliminado · queda como registro", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setActingEmail(null);
    }
  };

  return (
    <div className="mt-8 border-2 border-surface-600 bg-surface-800 p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-surface-300">
          <Users className="h-4 w-4 text-aws-orange" /> Duplicados · Asistentes ⇄ Voluntarios
        </h2>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 border-2 border-surface-600 bg-surface-700/40 px-3 py-1.5 font-mono text-xs text-surface-300 transition-colors hover:border-aws-orange hover:text-aws-orange disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      </div>
      <p className="mb-5 font-mono text-[11px] text-surface-300 leading-relaxed">
        Correos que aparecen <span className="text-surface-300">a la vez</span> como registro y como solicitud de voluntario. Elige cuál conservar — eliminar un registro también borra su pasaporte y lo demás.
      </p>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse border-2 border-surface-600 bg-surface-800" />
          ))}
        </div>
      ) : dups.length === 0 ? (
        <div className="flex items-center gap-2 border border-emerald/20 bg-emerald/5 px-4 py-3 font-mono text-xs text-emerald">
          <UserCheck className="h-4 w-4" /> No hay correos duplicados entre registros y voluntarios.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 font-mono text-[11px] text-yellow-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {dups.length} correo{dups.length !== 1 ? "s" : ""} duplicado{dups.length !== 1 ? "s" : ""}.
          </div>
          {dups.map((row) => {
            const busy = actingEmail === row.email;
            return (
              <div key={row.email} className="border-2 border-surface-600 bg-surface-800 p-4">
                <p className="font-mono text-sm font-bold text-surface-100 break-all">{row.email}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-surface-400">
                  <span>Registro: <span className="text-surface-200">{row.registration.name}</span></span>
                  <span className="flex items-center gap-1">
                    Voluntario: <span className="text-surface-200">{row.volunteer.name}</span>
                    {row.volunteer.approved && (
                      <span className="bg-emerald/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald">aprobado</span>
                    )}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => removeRegistration(row)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 border border-green-500/30 bg-green-500/10 px-3 py-1.5 font-mono text-xs font-medium text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
                  >
                    <HeartHandshake className="h-3.5 w-3.5" /> Eliminar registro · dejar voluntario
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVolunteer(row)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-mono text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar voluntario · dejar registro
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmaciones propias, no el popup del navegador. */}
      {dialog}
    </div>
  );
}
