"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import { useConfirm } from "@/components/admin/confirm";

interface FAQButton {
  labelEs: string;
  labelEn: string;
  url: string;
}

interface FAQItem {
  _id: string;
  questionEs: string;
  answerEs: string;
  questionEn: string;
  answerEn: string;
  order: number;
  isActive: boolean;
  buttons?: FAQButton[];
}

interface FAQForm {
  questionEs: string;
  answerEs: string;
  questionEn: string;
  answerEn: string;
  isActive: boolean;
  buttons: FAQButton[];
}

const emptyForm: FAQForm = {
  questionEs: "",
  answerEs: "",
  questionEn: "",
  answerEn: "",
  isActive: true,
  buttons: [],
};

export default function FAQAdminPage() {
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FAQItem | null>(null);
  const [form, setForm] = useState<FAQForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/faq?all=true");
      const data = await res.json();
      setFaqs(data.faqs || []);
    } catch {
      toast("Error al cargar las preguntas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (faq: FAQItem) => {
    setEditing(faq);
    setForm({
      questionEs: faq.questionEs,
      answerEs: faq.answerEs,
      questionEn: faq.questionEn,
      answerEn: faq.answerEn,
      isActive: faq.isActive,
      buttons: faq.buttons ?? [],
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.questionEs || !form.answerEs || !form.questionEn || !form.answerEn) {
      toast("Todos los campos son requeridos", "error");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/faq/${editing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, order: editing.order }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast(data.error || "Error al actualizar", "error");
          return;
        }
        toast("Pregunta actualizada", "success");
      } else {
        const maxOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.order)) + 1 : 0;
        const res = await fetch("/api/faq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, order: maxOrder }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast(data.error || "Error al crear", "error");
          return;
        }
        toast("Pregunta creada", "success");
      }
      setModalOpen(false);
      await fetchFaqs();
    } catch {
      toast("Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faq: FAQItem) => {
    const ok = await confirm({
      title: "Eliminar pregunta",
      message: `Se elimina "${faq.questionEs}" del FAQ público. No se puede deshacer.`,
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/faq/${faq._id}`, { method: "DELETE" });
      if (!res.ok) {
        toast("Error al eliminar", "error");
        return;
      }
      toast("Pregunta eliminada", "success");
      await fetchFaqs();
    } catch {
      toast("Error al eliminar", "error");
    }
  };

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleActive = async (faq: FAQItem) => {
    setTogglingId(faq._id);
    try {
      const res = await fetch(`/api/faq/${faq._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...faq, isActive: !faq.isActive }),
      });
      if (!res.ok) {
        toast("Error al actualizar", "error");
        return;
      }
      setFaqs((prev) =>
        prev.map((f) => (f._id === faq._id ? { ...f, isActive: !f.isActive } : f)),
      );
      toast(faq.isActive ? "Pregunta desactivada" : "Pregunta activada", "success");
    } catch {
      toast("Error al actualizar", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleReorder = async (faq: FAQItem, direction: "up" | "down") => {
    const sorted = [...faqs].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((f) => f._id === faq._id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const other = sorted[swapIndex];
    const faqOrder = faq.order;
    const otherOrder = other.order;

    try {
      await Promise.all([
        fetch(`/api/faq/${faq._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...faq, order: otherOrder }),
        }),
        fetch(`/api/faq/${other._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...other, order: faqOrder }),
        }),
      ]);
      setFaqs((prev) =>
        prev
          .map((f) => {
            if (f._id === faq._id) return { ...f, order: otherOrder };
            if (f._id === other._id) return { ...f, order: faqOrder };
            return f;
          })
          .sort((a, b) => a.order - b.order),
      );
    } catch {
      toast("Error al reordenar", "error");
    }
  };

  const sorted = [...faqs].sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b-2 border-surface-600 pb-4">
        <div className="text-center lg:text-left">
          <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
            Preguntas Frecuentes
          </h1>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar pregunta
        </Button>
      </div>

      <div className="-mx-4 overflow-x-auto border-y-2 border-surface-600 bg-surface-800 sm:mx-0 sm:border-2">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-surface-600">
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-surface-400">
                #
              </th>
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-surface-400">
                Pregunta (ES)
              </th>
              <th className="px-4 py-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-surface-400">
                Activa
              </th>
              <th className="px-4 py-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-surface-400">
                Orden
              </th>
              <th className="px-4 py-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-surface-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-aws-orange border-t-transparent" />
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center font-mono text-sm text-surface-300"
                >
                  No hay preguntas frecuentes
                </td>
              </tr>
            ) : (
              sorted.map((faq, index) => (
                <tr
                  key={faq._id}
                  className="border-b border-surface-600/50 transition-colors hover:bg-surface-800"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-surface-400">{index + 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-surface-100 line-clamp-2">
                      {faq.questionEs}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={faq.isActive}
                        onChange={() => handleToggleActive(faq)}
                        disabled={togglingId === faq._id}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleReorder(faq, "up")}
                        disabled={index === 0}
                        className="p-1 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200 disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReorder(faq, "down")}
                        disabled={index === sorted.length - 1}
                        className="p-1 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200 disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(faq)}
                        className="p-1.5 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(faq)}
                        className="p-1.5 text-surface-400 transition-colors hover:bg-surface-700 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar pregunta" : "Nueva pregunta"}
        size="xl"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Pregunta (ES)"
            required
            value={form.questionEs}
            onChange={(e) => setForm({ ...form, questionEs: e.target.value })}
            placeholder="Escribe la pregunta en español..."
          />
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-sm text-surface-200">
              Respuesta (ES)<span className="ml-1 text-aws-orange">*</span>
            </label>
            <textarea
              required
              value={form.answerEs}
              onChange={(e) => setForm({ ...form, answerEs: e.target.value })}
              placeholder="Escribe la respuesta en español..."
              rows={3}
              className="w-full border-2 border-surface-600 bg-surface-800 px-4 py-3 font-mono text-sm text-surface-100 placeholder:text-surface-400 outline-none transition-all focus:border-aws-orange hover:border-aws-orange resize-none"
            />
          </div>
          <Input
            label="Pregunta (EN)"
            required
            value={form.questionEn}
            onChange={(e) => setForm({ ...form, questionEn: e.target.value })}
            placeholder="Write the question in English..."
          />
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-sm text-surface-200">
              Respuesta (EN)<span className="ml-1 text-aws-orange">*</span>
            </label>
            <textarea
              required
              value={form.answerEn}
              onChange={(e) => setForm({ ...form, answerEn: e.target.value })}
              placeholder="Write the answer in English..."
              rows={3}
              className="w-full border-2 border-surface-600 bg-surface-800 px-4 py-3 font-mono text-sm text-surface-100 placeholder:text-surface-400 outline-none transition-all focus:border-aws-orange hover:border-aws-orange resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-sm text-surface-200">Botones de enlace</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, buttons: [...form.buttons, { labelEs: "", labelEn: "", url: "" }] })}
                className="flex items-center gap-1 border-2 border-surface-600 px-2 py-1 font-mono text-xs text-surface-300 transition-colors hover:border-aws-orange hover:text-aws-orange"
              >
                <Plus className="h-3 w-3" />
                Agregar
              </button>
            </div>
            {form.buttons.map((btn, i) => (
              <div key={i} className="flex items-center gap-2 border-2 border-surface-600 bg-surface-800 px-3 py-2">
                <input
                  type="text"
                  placeholder="Texto ES"
                  value={btn.labelEs}
                  onChange={(e) => { const next = [...form.buttons]; next[i] = { ...next[i], labelEs: e.target.value }; setForm({ ...form, buttons: next }); }}
                  className="min-w-0 flex-1 bg-transparent font-mono text-xs text-surface-100 placeholder:text-surface-400 outline-none"
                />
                <span className="shrink-0 text-surface-600 font-mono text-xs">|</span>
                <input
                  type="text"
                  placeholder="Text EN"
                  value={btn.labelEn}
                  onChange={(e) => { const next = [...form.buttons]; next[i] = { ...next[i], labelEn: e.target.value }; setForm({ ...form, buttons: next }); }}
                  className="min-w-0 flex-1 bg-transparent font-mono text-xs text-surface-100 placeholder:text-surface-400 outline-none"
                />
                <span className="shrink-0 text-surface-600 font-mono text-xs">|</span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={btn.url}
                  onChange={(e) => { const next = [...form.buttons]; next[i] = { ...next[i], url: e.target.value }; setForm({ ...form, buttons: next }); }}
                  className="min-w-0 flex-[2] bg-transparent font-mono text-xs text-surface-100 placeholder:text-surface-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, buttons: form.buttons.filter((_, j) => j !== i) })}
                  className="shrink-0 p-1 text-surface-300 transition-colors hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Switch
            label="Activa"
            checked={form.isActive}
            onChange={(checked) => setForm({ ...form, isActive: checked })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmaciones propias, no el popup del navegador. */}
      {dialog}
    </div>
  );
}
