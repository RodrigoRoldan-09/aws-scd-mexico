"use client";

import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { Empty } from "@/components/admin/ui";
import { Switch } from "@/components/ui/switch";
import type { CustomFieldType, ICustomField } from "@/models/activity";

const inputCls =
  "w-full border-2 border-surface-600 bg-surface-900 px-3 py-2 font-mono text-xs text-surface-100 outline-none focus:border-[#D85A30]";

function toKey(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 75);
}

/**
 * Constructor no-code de preguntas personalizadas (`text`, `textarea`, `select`, `url`, `checkbox`).
 * Se usa en el editor de cada actividad y en las preguntas globales del formulario unificado.
 */
export function CustomFieldsBuilder({
  fields,
  onChange,
  intro,
  emptyMessage,
  keyPrefix = "pregunta_",
}: {
  fields: ICustomField[];
  onChange: (next: ICustomField[]) => void;
  intro: string;
  emptyMessage: string;
  /** Prefijo de la llave autogenerada (se reemplaza al escribir la pregunta) */
  keyPrefix?: string;
}) {
  const add = () => {
    onChange([
      ...fields,
      {
        key: `${keyPrefix}${fields.length + 1}`,
        label: "",
        labelEn: "",
        type: "text",
        required: true,
        placeholder: "",
        placeholderEn: "",
        options: [],
      },
    ]);
  };

  const update = (idx: number, patch: Partial<ICustomField>) =>
    onChange(fields.map((cf, i) => (i === idx ? { ...cf, ...patch } : cf)));

  const remove = (idx: number) => onChange(fields.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 font-mono text-xs text-surface-300">{intro}</p>
        <button
          type="button"
          onClick={add}
          className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 border-2 border-[#D85A30] bg-[#D85A30] px-3 py-1.5 font-mono text-xs font-bold text-[#0E0E1A]"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar pregunta
        </button>
      </div>

      {fields.length === 0 ? (
        <Empty icon={HelpCircle}>{emptyMessage}</Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {fields.map((cf, idx) => (
            <div key={idx} className="border-2 border-surface-600 bg-surface-900 p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-surface-700 pb-2">
                <span className="font-mono text-xs font-bold text-[#3DD6D0]">Pregunta #{idx + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 font-mono text-xs text-surface-200">
                    <span>Obligatoria</span>
                    <Switch checked={cf.required} onChange={(val) => update(idx, { required: val })} />
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="cursor-pointer text-red-400 hover:underline font-mono text-xs inline-flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block font-mono text-[10px] uppercase text-surface-300">
                    Pregunta (Español) *
                  </label>
                  <input
                    value={cf.label}
                    onChange={(e) =>
                      update(idx, {
                        label: e.target.value,
                        key: cf.key.startsWith(keyPrefix)
                          ? toKey(e.target.value) || `${keyPrefix}${idx + 1}`
                          : cf.key,
                      })
                    }
                    placeholder="Ej. ¿Cuál es tu nivel de experiencia en AWS?"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase text-surface-300">
                    Tipo de respuesta
                  </label>
                  <select
                    value={cf.type}
                    onChange={(e) =>
                      update(idx, {
                        type: e.target.value as CustomFieldType,
                        options:
                          e.target.value === "select" && (!cf.options || cf.options.length === 0)
                            ? [{ value: "opcion_1", label: "Opción 1", labelEn: "Option 1" }]
                            : cf.options,
                      })
                    }
                    className={inputCls}
                  >
                    <option value="text">Texto corto</option>
                    <option value="textarea">Párrafo / Texto largo</option>
                    <option value="select">Lista desplegable (Opciones)</option>
                    <option value="url">Enlace URL (GitHub, LinkedIn…)</option>
                    <option value="checkbox">Casilla Sí / No</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase text-surface-300">
                    Pregunta (Inglés — opcional)
                  </label>
                  <input
                    value={cf.labelEn}
                    onChange={(e) => update(idx, { labelEn: e.target.value })}
                    placeholder="What is your AWS experience level?"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase text-surface-300">
                    Placeholder / Ejemplo (opcional)
                  </label>
                  <input
                    value={cf.placeholder ?? ""}
                    onChange={(e) => update(idx, { placeholder: e.target.value })}
                    placeholder="Texto de ayuda dentro del campo"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Opciones cuando es tipo `select` */}
              {cf.type === "select" && (
                <div className="border-t border-surface-700 pt-2.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-surface-200">
                      Opciones del desplegable ({(cf.options ?? []).length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        update(idx, {
                          options: [
                            ...(cf.options ?? []),
                            { value: `opt_${(cf.options?.length ?? 0) + 1}`, label: "", labelEn: "" },
                          ],
                        })
                      }
                      className="cursor-pointer border border-surface-500 px-2 py-0.5 font-mono text-[11px] text-[#3DD6D0]"
                    >
                      + Añadir opción
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {(cf.options ?? []).map((opt, oIdx) => (
                      <div key={oIdx} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-center">
                        <input
                          value={opt.label}
                          onChange={(e) => {
                            const nextOpts = [...(cf.options ?? [])];
                            nextOpts[oIdx] = {
                              ...opt,
                              label: e.target.value,
                              value: toKey(e.target.value) || `opt_${oIdx + 1}`,
                            };
                            update(idx, { options: nextOpts });
                          }}
                          placeholder="Opción en Español"
                          className={inputCls}
                        />
                        <input
                          value={opt.labelEn}
                          onChange={(e) => {
                            const nextOpts = [...(cf.options ?? [])];
                            nextOpts[oIdx] = { ...opt, labelEn: e.target.value };
                            update(idx, { options: nextOpts });
                          }}
                          placeholder="Opción en Inglés (opcional)"
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            update(idx, { options: (cf.options ?? []).filter((_, i) => i !== oIdx) })
                          }
                          className="cursor-pointer p-1.5 text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
