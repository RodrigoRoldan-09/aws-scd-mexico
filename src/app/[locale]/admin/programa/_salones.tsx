"use client";

import { useState } from "react";
import { DoorOpen, Link as LinkIcon, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/admin/confirm";
import { Empty, HardButton, Tag } from "@/components/admin/ui";
import { TRACKS_CON_VACIO, trackLabel } from "@/data/session-tracks";
import type { Salon } from "./_shared";

/**
 * Los salones. Existen sólo para que el programa tenga de dónde elegir sala,
 * así que viven dentro del programa.
 */

const VACIO = { name: "", capacity: "", virtualLink: "", track: "", order: "0" };
type FormSalon = typeof VACIO;

const campoCls =
  "min-h-11 w-full border-2 border-surface-600 bg-surface-900 px-4 py-2.5 font-mono text-sm " +
  "text-surface-100 placeholder:text-surface-400 outline-none transition-colors focus:border-aws-orange";

const labelCls = "mb-1.5 block font-mono text-xs font-bold uppercase tracking-widest text-surface-200";

export function Salones({ salones, onChange }: { salones: Salon[]; onChange: () => void }) {
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Salon | null>(null);
  const [form, setForm] = useState<FormSalon>(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);

  const campo = (k: keyof FormSalon) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ ...VACIO, order: String(salones.length) });
    setAbierto(true);
  };

  const abrirEditar = (r: Salon) => {
    setEditando(r);
    setForm({
      name: r.name,
      capacity: r.capacity != null ? String(r.capacity) : "",
      virtualLink: r.virtualLink ?? "",
      track: r.track ?? "",
      order: String(r.order),
    });
    setAbierto(true);
  };

  const guardar = async () => {
    if (!form.name.trim()) {
      toast("El nombre no puede quedar vacío", "error");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch(editando ? `/api/rooms/${editando.id}` : "/api/rooms", {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          capacity: form.capacity ? parseInt(form.capacity) : undefined,
          virtualLink: form.virtualLink.trim() || undefined,
          track: form.track || undefined,
          order: parseInt(form.order) || 0,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(d.error || "No se pudo guardar", "error");
        return;
      }
      toast(editando ? "Salón actualizado" : "Salón creado", "success");
      setAbierto(false);
      onChange();
    } catch {
      toast("No se pudo guardar", "error");
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (r: Salon) => {
    const ok = await confirm({
      title: "Eliminar salón",
      message: `Se elimina «${r.name}». Los bloques que estén ahí quedan sin sala. No se puede deshacer.`,
      confirmLabel: "Sí, eliminar",
      tone: "danger",
    });
    if (!ok) return;
    setBorrando(r.id);
    try {
      const res = await fetch(`/api/rooms/${r.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast("No se pudo eliminar", "error");
        return;
      }
      toast("Salón eliminado", "success");
      onChange();
    } catch {
      toast("No se pudo eliminar", "error");
    } finally {
      setBorrando(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <HardButton icon={Plus} onClick={abrirNuevo} className="w-full sm:w-auto">
          Nuevo salón
        </HardButton>
      </div>

      {salones.length === 0 ? (
        <Empty icon={DoorOpen}>
          Todavía no hay salones.{" "}
          <button type="button" onClick={abrirNuevo} className="text-aws-orange underline underline-offset-2">
            Crea el primero.
          </button>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {salones.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 border-2 border-surface-600 bg-surface-800 p-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-aws-orange/40 bg-aws-orange/10">
                  <DoorOpen className="h-5 w-5 text-aws-orange" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-mono text-sm font-bold text-surface-50">{r.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {r.capacity != null && <Tag icon={Users}>{r.capacity} personas</Tag>}
                    {r.track && <Tag tone="accent">{trackLabel(r.track)}</Tag>}
                    {r.virtualLink && (
                      <a
                        href={r.virtualLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-aws-orange hover:underline"
                      >
                        <LinkIcon className="h-3 w-3" />
                        Link virtual
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:items-center">
                <HardButton tone="ghost" icon={Pencil} onClick={() => abrirEditar(r)}>Editar</HardButton>
                <HardButton tone="danger" icon={Trash2} disabled={borrando === r.id} onClick={() => borrar(r)}>
                  Eliminar
                </HardButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={abierto}
        onClose={() => !guardando && setAbierto(false)}
        title={editando ? `Editar: ${editando.name}` : "Nuevo salón"}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls} htmlFor="salon-nombre">Nombre *</label>
            <input id="salon-nombre" type="text" maxLength={100} placeholder="Ej. Auditorio principal" {...campo("name")} className={campoCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="salon-cap">Capacidad</label>
              <input id="salon-cap" type="number" min={0} placeholder="150" {...campo("capacity")} className={campoCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="salon-orden">Orden</label>
              <input id="salon-orden" type="number" min={0} placeholder="0" {...campo("order")} className={campoCls} />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="salon-track">Track asociado</label>
            <select id="salon-track" {...campo("track")} className={campoCls}>
              {TRACKS_CON_VACIO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="salon-link">Link virtual</label>
            <input id="salon-link" type="url" placeholder="https://zoom.us/j/…" {...campo("virtualLink")} className={campoCls} />
          </div>

          <div className="grid grid-cols-2 gap-2 border-t-2 border-surface-600 pt-4 sm:flex sm:justify-end">
            <HardButton tone="ghost" onClick={() => setAbierto(false)} disabled={guardando}>Cancelar</HardButton>
            <HardButton onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear salón"}
            </HardButton>
          </div>
        </div>
      </Modal>

      {dialog}
    </>
  );
}
