"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Cargando, HardButton } from "@/components/admin/ui";
import { CustomFieldsBuilder } from "@/components/admin/custom-fields-builder";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import type { UnifiedActivityFormConfig } from "@/types/activities";

const inputCls =
  "w-full border-2 border-surface-600 bg-surface-900 px-3 py-2 font-mono text-xs text-surface-100 outline-none focus:border-[#D85A30]";

/** Modal "Configurar Formulario Unificado de Actividades" (`PUT /api/activities/unified-form`). */
export function UnifiedFormConfigModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: (config: UnifiedActivityFormConfig) => void;
}) {
  const { toast } = useToast();
  const [config, setConfig] = useState<UnifiedActivityFormConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/activities/unified-form");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo cargar la configuración");
        if (!cancelled) setConfig(data.config as UnifiedActivityFormConfig);
      } catch (err) {
        if (!cancelled) {
          toast((err as Error).message, "error");
          onClose();
        }
      }
    })();
    return () => {
      cancelled = true;
      setConfig(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const patch = (p: Partial<UnifiedActivityFormConfig>) =>
    setConfig((prev) => (prev ? { ...prev, ...p } : prev));

  const updatePrereq = (idx: number, lang: "es" | "en", val: string) => {
    if (!config) return;
    const es = [...config.prerequisitesList];
    const en = [...config.prerequisitesListEn];
    if (lang === "es") es[idx] = val;
    else en[idx] = val;
    patch({ prerequisitesList: es, prerequisitesListEn: en });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/activities/unified-form", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Error al guardar la configuración", "error");
        return;
      }
      toast("Formulario de actividades actualizado", "success");
      onSaved?.(data.config as UnifiedActivityFormConfig);
      onClose();
    } catch {
      toast("Error de red al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Formulario Unificado de Actividades" className="max-w-3xl">
      {!config ? (
        <Cargando />
      ) : (
        <>
          <div className="flex flex-col gap-5 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between border border-surface-600 bg-surface-900 p-3">
                <div>
                  <div className="font-mono text-xs font-bold text-surface-100">Recepción abierta</div>
                  <div className="font-mono text-[11px] text-surface-400">
                    Abre o cierra el formulario de actividades al instante.
                  </div>
                </div>
                <Switch checked={config.isOpen} onChange={(val) => patch({ isOpen: val })} />
              </div>

              <div className="flex items-center justify-between border border-surface-600 bg-surface-900 p-3">
                <div>
                  <div className="font-mono text-xs font-bold text-surface-100">Exigir laptop (general)</div>
                  <div className="font-mono text-[11px] text-surface-400">
                    Aplica sin importar las actividades elegidas.
                  </div>
                </div>
                <Switch checked={config.requireLaptop} onChange={(val) => patch({ requireLaptop: val })} />
              </div>
            </div>

            <div className="border-2 border-surface-600 bg-surface-900 p-4">
              <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                Prioridades obligatorias (Top N, de 1 a 5)
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={config.maxPriorities}
                onChange={(e) =>
                  patch({ maxPriorities: Math.min(5, Math.max(1, Number(e.target.value) || 1)) })
                }
                className={`${inputCls} max-w-32`}
              />
              <p className="m-0 mt-2 font-mono text-[11px] leading-relaxed text-surface-400">
                El asistente debe ordenar exactamente este número de actividades. Si tiene menos
                actividades disponibles sin conflicto de horario, ordena el total disponible.
              </p>
            </div>

            <div className="border-2 border-surface-600 bg-surface-900 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase text-surface-100">
                  Requisitos generales ({config.prerequisitesList.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      prerequisitesList: [...config.prerequisitesList, ""],
                      prerequisitesListEn: [...config.prerequisitesListEn, ""],
                    })
                  }
                  className="cursor-pointer inline-flex items-center gap-1 border border-[#D85A30] bg-[#D85A30]/15 px-2.5 py-1 font-mono text-xs font-bold text-[#D85A30]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar requisito
                </button>
              </div>

              {config.prerequisitesList.length === 0 ? (
                <p className="m-0 font-mono text-xs text-surface-400">Sin requisitos generales.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {config.prerequisitesList.map((itemEs, idx) => (
                    <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-center">
                      <input
                        value={itemEs}
                        onChange={(e) => updatePrereq(idx, "es", e.target.value)}
                        placeholder="Requisito en Español"
                        className={inputCls}
                      />
                      <input
                        value={config.prerequisitesListEn[idx] ?? ""}
                        onChange={(e) => updatePrereq(idx, "en", e.target.value)}
                        placeholder="En Inglés (opcional)"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          patch({
                            prerequisitesList: config.prerequisitesList.filter((_, i) => i !== idx),
                            prerequisitesListEn: config.prerequisitesListEn.filter((_, i) => i !== idx),
                          })
                        }
                        className="cursor-pointer border border-surface-600 p-2 text-red-400 hover:border-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t-2 border-surface-600 pt-4">
              <div className="mb-3 font-mono text-xs font-bold uppercase text-[#3DD6D0]">
                Preguntas globales ({config.globalCustomFields.length})
              </div>
              <CustomFieldsBuilder
                fields={config.globalCustomFields}
                onChange={(globalCustomFields) => patch({ globalCustomFields })}
                intro="Se preguntan una sola vez a cualquier postulante a actividades."
                emptyMessage="No hay preguntas globales configuradas."
                keyPrefix="global_"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t-2 border-surface-600 pt-4">
            <HardButton tone="ghost" onClick={onClose}>
              Cancelar
            </HardButton>
            <HardButton onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Guardando…" : "Guardar configuración"}
            </HardButton>
          </div>
        </>
      )}
    </Modal>
  );
}
