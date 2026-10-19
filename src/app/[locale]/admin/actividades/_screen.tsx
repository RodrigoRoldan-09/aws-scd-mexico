"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Clock,
  ExternalLink,
  Laptop,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
  UserX,
  ListChecks,
  HelpCircle,
  ClipboardList,
  Settings2,
} from "lucide-react";
import {
  Cargando,
  Empty,
  HardButton,
  PageHead,
  Select,
  Stat,
  Stats,
  TableWrap,
  Tag,
  Th,
  Toolbar,
} from "@/components/admin/ui";
import { useConfirm } from "@/components/admin/confirm";
import { ActivityApplicationsPanel } from "@/components/admin/activity-applications-panel";
import { CustomFieldsBuilder } from "@/components/admin/custom-fields-builder";
import { UnifiedFormConfigModal } from "@/components/admin/unified-form-config-modal";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import type {
  ActivityApplicationAdminRow,
  ActivityRegistrationAdminRecord,
  PublicActivityDTO,
} from "@/types/activities";
import type { ActivityType, CapacityMode, IActivityFormConfig } from "@/models/activity";
import { cn } from "@/lib/utils";
import {
  toAdminApplicationRow,
  toAdminRegistrationRecord,
  toPublicActivityDTO,
} from "@/lib/activities-dto";

interface ActivityFormState {
  slug: string;
  type: ActivityType;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  roomName: string;
  speakerName: string;
  level: "" | "100" | "200" | "300" | "400";
  startTime: string;
  endTime: string;
  isPublished: boolean;
  isOpen: boolean;
  maxCapacity: number;
  order: number;
  /** `allowMultipleEnrollment` quedó obsoleto en v2 y ya no se edita */
  formConfig: Omit<IActivityFormConfig, "allowMultipleEnrollment">;
}

const EMPTY_FORM: ActivityFormState = {
  slug: "",
  type: "workshop",
  title: "",
  titleEn: "",
  description: "",
  descriptionEn: "",
  roomName: "Laboratorio Cloud 1 · Zacatenco",
  speakerName: "",
  level: "200",
  startTime: "11:00",
  endTime: "12:30",
  isPublished: true,
  isOpen: true,
  maxCapacity: 35,
  order: 1,
  formConfig: {
    requireLaptop: true,
    prerequisitesList: ["Llevar laptop propia con cargador."],
    prerequisitesListEn: ["Bring your own laptop and charger."],
    participationMode: "individual",
    minTeamSize: 1,
    maxTeamSize: 3,
    capacityMode: "per_person",
    customFields: [],
  },
};

function autoSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 75);
}

const inputCls =
  "w-full border-2 border-surface-600 bg-surface-900 px-3 py-2 font-mono text-xs text-surface-100 outline-none focus:border-[#D85A30]";

export function AdminActividadesScreen() {
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();

  const [activities, setActivities] = useState<PublicActivityDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Vista principal: catálogo o solicitudes/asignación de actividades
  const [view, setView] = useState<"catalog" | "applications">("catalog");
  const [applications, setApplications] = useState<ActivityApplicationAdminRow[]>([]);
  const [unifiedModalOpen, setUnifiedModalOpen] = useState(false);

  // Filtros de listado
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Modal de Crear / Editar Actividad
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "logistics" | "questions">("general");
  const [editing, setEditing] = useState<PublicActivityDTO | null>(null);
  const [form, setForm] = useState<ActivityFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Modal de Inscritos por Actividad
  const [regsModalActivity, setRegsModalActivity] = useState<PublicActivityDTO | null>(null);
  const [registrations, setRegistrations] = useState<ActivityRegistrationAdminRecord[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/activities?admin=1");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar actividades");
      setActivities(((data.activities || []) as Record<string, unknown>[]).map(toPublicActivityDTO));
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/activities/applications");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar solicitudes");
      setApplications(((data.applications || []) as Record<string, unknown>[]).map(toAdminApplicationRow));
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchActivities(), fetchApplications()]);
  };

  const pendingApplications = useMemo(
    () => applications.filter((a) => a.status === "pending").length,
    [applications],
  );

  useEffect(() => {
    void fetchActivities();
    void fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities.filter((a) => {
      if (filterType !== "all" && a.type !== filterType) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        a.roomName.toLowerCase().includes(q) ||
        a.speakerName.toLowerCase().includes(q)
      );
    });
  }, [activities, filterType, search]);

  // Cifras globales
  const stats = useMemo(() => {
    const total = activities.length;
    const openCount = activities.filter((a) => a.isOpen && a.isPublished).length;
    const totalCapacity = activities.reduce((acc, a) => acc + a.maxCapacity, 0);
    const totalRegistered = activities.reduce((acc, a) => acc + a.registeredCount, 0);
    const totalSpotsLeft = activities.reduce((acc, a) => acc + a.spotsLeft, 0);
    return { total, openCount, totalCapacity, totalRegistered, totalSpotsLeft };
  }, [activities]);

  // ── Abrir Crear / Editar ──
  const openCreate = () => {
    setEditing(null);
    setForm({
      ...structuredClone(EMPTY_FORM),
      order: activities.length + 1,
    });
    setActiveTab("general");
    setModalOpen(true);
  };

  const openEdit = (act: PublicActivityDTO) => {
    setEditing(act);
    setForm({
      slug: act.slug,
      type: act.type,
      title: act.title,
      titleEn: act.titleEn,
      description: act.description,
      descriptionEn: act.descriptionEn,
      roomName: act.roomName,
      speakerName: act.speakerName,
      level: act.level,
      startTime: act.startTime,
      endTime: act.endTime,
      isPublished: act.isPublished,
      isOpen: act.isOpen,
      maxCapacity: act.maxCapacity,
      order: act.order,
      formConfig: structuredClone(act.formConfig),
    });
    setActiveTab("general");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast("El título en español es obligatorio", "error");
      setActiveTab("general");
      return;
    }

    const finalSlug = form.slug.trim() ? autoSlug(form.slug) : autoSlug(form.title);
    if (!finalSlug) {
      toast("El slug de la URL no es válido", "error");
      setActiveTab("general");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: finalSlug,
      };

      const url = editing ? `/api/activities/${editing._id}` : "/api/activities";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Error al guardar la actividad", "error");
        return;
      }

      toast(editing ? "Actividad actualizada" : "Actividad creada", "success");
      setModalOpen(false);
      await fetchActivities();
    } catch {
      toast("Error de red al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggle = async (
    act: PublicActivityDTO,
    field: "isPublished" | "isOpen",
  ) => {
    const nextVal = !act[field];
    try {
      const res = await fetch(`/api/activities/${act._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextVal }),
      });
      if (!res.ok) {
        toast("No se pudo actualizar el estado", "error");
        return;
      }
      setActivities((prev) =>
        prev.map((item) => {
          if (item._id !== act._id) return item;
          const updated = { ...item, [field]: nextVal };
          updated.isSoldOut = !updated.isOpen || updated.spotsLeft <= 0;
          return updated;
        }),
      );
      toast(
        field === "isOpen"
          ? nextVal
            ? "Registro abierto"
            : "Registro cerrado"
          : nextVal
            ? "Actividad publicada en catálogo"
            : "Actividad oculta del catálogo",
        "success",
      );
    } catch {
      toast("Error al actualizar", "error");
    }
  };

  const handleDelete = async (act: PublicActivityDTO) => {
    const ok = await confirm({
      title: "Eliminar actividad",
      message: `¿Seguro que deseas eliminar "${act.title}"? También se eliminarán sus registros asociados.`,
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/activities/${act._id}`, { method: "DELETE" });
      if (!res.ok) {
        toast("Error al eliminar la actividad", "error");
        return;
      }
      toast("Actividad eliminada", "success");
      await fetchActivities();
    } catch {
      toast("Error al eliminar", "error");
    }
  };

  // ── Gestión de Inscritos por Actividad ──
  const openRegistrationsModal = async (act: PublicActivityDTO) => {
    setRegsModalActivity(act);
    setLoadingRegs(true);
    try {
      const res = await fetch(`/api/activities/${act._id}/registrations`);
      const data = await res.json();
      setRegistrations(((data.registrations || []) as Record<string, unknown>[]).map(toAdminRegistrationRecord));
    } catch {
      toast("Error al cargar inscritos", "error");
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleCancelRegistration = async (reg: ActivityRegistrationAdminRecord) => {
    const isActivityType = regsModalActivity?.type === "activity";
    const ok = await confirm({
      title: isActivityType ? "Desasignar y liberar cupo" : "Cancelar inscripción y liberar cupo",
      message: isActivityType
        ? `${reg.firstName} ${reg.lastName} (${reg.email}) volverá a "Pendiente" en el formulario de actividades y se liberará su lugar.`
        : `Se cancelará el registro de ${reg.firstName} ${reg.lastName} (${reg.email}) y se liberarán ${reg.spotsConsumed} lugar(es) en la actividad.`,
      confirmLabel: isActivityType ? "Desasignar" : "Cancelar inscripción",
    });
    if (!ok || !regsModalActivity) return;

    try {
      const res = await fetch(
        `/api/activities/${regsModalActivity._id}/registrations?regId=${encodeURIComponent(reg.id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        toast("Error al cancelar inscripción", "error");
        return;
      }
      toast("Inscripción cancelada y cupo liberado", "success");
      await Promise.all([
        openRegistrationsModal(regsModalActivity),
        refreshAll(),
      ]);
    } catch {
      toast("Error al cancelar", "error");
    }
  };

  // ── Helpers para editar Prerrequisitos y Preguntas Dinámicas (`customFields`) ──
  const addPrereq = () => {
    setForm((prev) => ({
      ...prev,
      formConfig: {
        ...prev.formConfig,
        prerequisitesList: [...prev.formConfig.prerequisitesList, ""],
        prerequisitesListEn: [...prev.formConfig.prerequisitesListEn, ""],
      },
    }));
  };

  const updatePrereq = (idx: number, lang: "es" | "en", val: string) => {
    setForm((prev) => {
      const listEs = [...prev.formConfig.prerequisitesList];
      const listEn = [...prev.formConfig.prerequisitesListEn];
      if (lang === "es") listEs[idx] = val;
      else listEn[idx] = val;
      return {
        ...prev,
        formConfig: {
          ...prev.formConfig,
          prerequisitesList: listEs,
          prerequisitesListEn: listEn,
        },
      };
    });
  };

  const removePrereq = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      formConfig: {
        ...prev.formConfig,
        prerequisitesList: prev.formConfig.prerequisitesList.filter((_, i) => i !== idx),
        prerequisitesListEn: prev.formConfig.prerequisitesListEn.filter((_, i) => i !== idx),
      },
    }));
  };

  const typeBadge = (type: ActivityType) => {
    if (type === "workshop") return <Tag tone="info">Workshop</Tag>;
    if (type === "hackathon") return <Tag tone="accent">Hackatón</Tag>;
    return <Tag tone="good">Actividad</Tag>;
  };

  if (loading) return <Cargando />;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead
        title="Workshops, Hackatón y Actividades"
        actions={
          <>
            <Link
              href="/actividades"
              target="_blank"
              className="inline-flex min-h-11 items-center justify-center gap-2 border-2 border-surface-500 px-4 py-2.5 font-mono text-xs font-bold text-surface-100 hover:border-[#D85A30] hover:text-[#D85A30]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver catálogo público
            </Link>
            <HardButton tone="ghost" icon={Settings2} onClick={() => setUnifiedModalOpen(true)}>
              Formulario Unificado de Actividades
            </HardButton>
            <HardButton icon={Plus} onClick={openCreate}>
              Nueva actividad
            </HardButton>
          </>
        }
      />

      {/* Selector de vista principal */}
      <div className="mb-5 grid grid-cols-1 gap-1.5 border-b-2 border-surface-600 pb-3 sm:grid-cols-2">
        {(
          [
            ["catalog", "1. Catálogo: Workshops, Hackatones y Actividades", Layers, 0],
            ["applications", "2. Solicitudes y Asignación de Actividades", ClipboardList, pendingApplications],
          ] as const
        ).map(([id, label, Icon, badge]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={cn(
              "cursor-pointer flex items-center justify-center gap-2 border-2 px-3 py-2.5 font-mono text-xs font-bold transition-all",
              view === id
                ? "border-[#D85A30] bg-[#D85A30] text-[#0E0E1A]"
                : "border-surface-600 bg-surface-900 text-surface-200 hover:border-surface-400",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
            {badge > 0 && (
              <span
                className={cn(
                  "shrink-0 px-1.5 py-0.5 text-[10px]",
                  view === id ? "bg-[#0E0E1A] text-[#D85A30]" : "bg-[#D85A30] text-[#0E0E1A]",
                )}
                title="Solicitudes pendientes de asignar"
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {view === "applications" && (
        <ActivityApplicationsPanel
          applications={applications}
          activities={activities}
          onRefresh={refreshAll}
        />
      )}

      {view === "catalog" && (
        <>
      {/* KPIs */}
      <Stats cols={5}>
        <Stat
          value={stats.total}
          label="Actividades totales"
          active={filterType === "all"}
          onClick={() => setFilterType("all")}
        />
        <Stat
          value={stats.openCount}
          label="Abiertas al público"
          tone="good"
        />
        <Stat
          value={stats.totalCapacity}
          label="Cupo total sumado"
          tone="info"
        />
        <Stat
          value={stats.totalRegistered}
          label="Lugares ocupados"
          tone="accent"
        />
        <Stat
          value={stats.totalSpotsLeft}
          label="Lugares disponibles"
          tone={stats.totalSpotsLeft > 0 ? "good" : "danger"}
        />
      </Stats>

      {/* Barra de filtros */}
      <Toolbar>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, salón, speaker o slug…"
          className="col-span-2 min-h-11 flex-1 border-2 border-surface-600 bg-surface-800 px-3.5 py-2 font-mono text-xs text-surface-100 outline-none focus:border-[#D85A30]"
        />
        <Select
          value={filterType}
          onChange={setFilterType}
          label="Filtrar por categoría"
          options={[
            ["all", "Todas las categorías"],
            ["workshop", "Solo Workshops"],
            ["hackathon", "Solo Hackatón"],
            ["activity", "Solo Actividades"],
          ]}
        />
      </Toolbar>

      {/* Tabla de actividades */}
      {filtered.length === 0 ? (
        <Empty icon={Layers}>No hay actividades que coincidan con el filtro.</Empty>
      ) : (
        <TableWrap>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-surface-600 bg-surface-900/50">
                <Th>Actividad / URL</Th>
                <Th>Categoría / Horario</Th>
                <Th align="center">Cupo Ocupado</Th>
                <Th align="center">Configuración Formulario</Th>
                <Th align="center">Publicada</Th>
                <Th align="center">Abierta</Th>
                <Th align="right">Acciones</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {filtered.map((act) => {
                const pct = Math.min(100, Math.round((act.registeredCount / act.maxCapacity) * 100));
                return (
                  <tr key={act._id} className="hover:bg-surface-700/30">
                    <td className="px-3 py-3.5 sm:px-4">
                      <div className="font-mono text-xs sm:text-sm font-bold text-surface-50">
                        {act.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-surface-300">
                        <Link
                          href={
                            act.type === "activity"
                              ? `/actividades/registro-actividades?prefer=${act.slug}`
                              : `/actividades/${act.slug}`
                          }
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[#3DD6D0] hover:underline"
                        >
                          /{act.slug}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        {act.roomName && (
                          <span className="inline-flex items-center gap-1 text-surface-400">
                            · <MapPin className="h-3 w-3" /> {act.roomName}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3.5 sm:px-4">
                      <div className="flex items-center gap-1.5">
                        {typeBadge(act.type)}
                        {act.level && <Tag tone="neutral">Nvl {act.level}</Tag>}
                      </div>
                      <div className="mt-1.5 inline-flex items-center gap-1 font-mono text-xs text-surface-200">
                        <Clock className="h-3.5 w-3.5 text-[#D85A30]" />
                        {act.startTime} – {act.endTime}
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-center sm:px-4">
                      <div className="font-mono text-xs font-bold text-surface-50">
                        {act.registeredCount} / {act.maxCapacity}
                      </div>
                      <div className="mx-auto mt-1 h-2 w-24 overflow-hidden bg-surface-900 border border-surface-600">
                        <div
                          className={cn(
                            "h-full",
                            act.spotsLeft === 0
                              ? "bg-red-500"
                              : act.spotsLeft <= 5
                                ? "bg-amber-400"
                                : "bg-[#3DD6D0]",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-surface-300">
                        {act.spotsLeft} libres
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-center sm:px-4">
                      <div className="flex flex-wrap justify-center gap-1">
                        {act.type === "activity" && <Tag tone="accent">Asignación manual</Tag>}
                        <Tag tone="neutral" icon={Users}>
                          {act.formConfig.participationMode === "individual"
                            ? "Individual"
                            : `Equipos (máx ${act.formConfig.maxTeamSize})`}
                        </Tag>
                        {act.formConfig.requireLaptop && (
                          <Tag tone="warn" icon={Laptop}>
                            Laptop
                          </Tag>
                        )}
                        {act.formConfig.customFields.length > 0 && (
                          <Tag tone="info" icon={HelpCircle}>
                            +{act.formConfig.customFields.length} preg.
                          </Tag>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-center sm:px-4">
                      <div className="flex justify-center">
                        <Switch
                          checked={act.isPublished}
                          onChange={() => void handleQuickToggle(act, "isPublished")}
                        />
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-center sm:px-4">
                      <div className="flex justify-center">
                        <Switch
                          checked={act.isOpen}
                          onChange={() => void handleQuickToggle(act, "isOpen")}
                        />
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-right sm:px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => void openRegistrationsModal(act)}
                          className="cursor-pointer inline-flex items-center gap-1 border border-surface-500 bg-surface-900 px-2.5 py-1.5 font-mono text-[11px] font-bold text-surface-100 hover:border-[#3DD6D0] hover:text-[#3DD6D0]"
                          title="Ver participantes inscritos"
                        >
                          <Users className="h-3.5 w-3.5" />
                          {act.type === "activity" ? "Asignados" : "Inscritos"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(act)}
                          className="cursor-pointer border border-surface-500 bg-surface-900 p-1.5 text-surface-200 hover:border-[#D85A30] hover:text-[#D85A30]"
                          title="Editar toda la información"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(act)}
                          className="cursor-pointer border border-surface-500 bg-surface-900 p-1.5 text-red-400 hover:border-red-500 hover:bg-red-500/10"
                          title="Eliminar actividad"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      )}

        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 1: EDITOR COMPLETO DE ACTIVIDAD (3 PESTAÑAS, 0% CÓDIGO)
         ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar: ${editing.title}` : "Crear nueva actividad"}
        className="max-w-3xl"
      >
        {/* Selector de Pestañas del Editor */}
        <div className="mb-5 grid grid-cols-3 gap-1.5 border-b-2 border-surface-600 pb-3">
          {(
            [
              ["general", "1. Datos, Horario y Cupo", Layers],
              ["logistics", "2. Equipos y Requisitos", ListChecks],
              ["questions", `3. Preguntas Extra (${form.formConfig.customFields.length})`, HelpCircle],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "cursor-pointer flex items-center justify-center gap-1.5 border-2 px-2.5 py-2 font-mono text-xs font-bold transition-all",
                activeTab === id
                  ? "border-[#D85A30] bg-[#D85A30] text-[#0E0E1A]"
                  : "border-surface-600 bg-surface-900 text-surface-200 hover:border-surface-400",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {/* PESTAÑA 1: DATOS GENERALES, HORARIO Y CUPO */}
        {activeTab === "general" && (
          <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                  Categoría *
                </label>
                <select
                  value={form.type}
                  onChange={(e) => {
                    const nextType = e.target.value as ActivityType;
                    setForm((prev) => ({
                      ...prev,
                      type: nextType,
                      formConfig: {
                        ...prev.formConfig,
                        participationMode:
                          nextType === "activity"
                            ? "individual"
                            : nextType === "hackathon"
                              ? "both"
                              : prev.formConfig.participationMode,
                        ...(nextType === "activity"
                          ? { capacityMode: "per_person" as const, minTeamSize: 1, maxTeamSize: 1 }
                          : {}),
                      },
                    }));
                  }}
                  className={inputCls}
                >
                  <option value="workshop">Workshop (Taller práctico)</option>
                  <option value="hackathon">Hackatón</option>
                  <option value="activity">Actividad (registro por prioridad)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                  Cupo Máximo (Lugares) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={form.maxCapacity}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, maxCapacity: Number(e.target.value) || 1 }))
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                  Nivel técnico
                </label>
                <select
                  value={form.level}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      level: e.target.value as "" | "100" | "200" | "300" | "400",
                    }))
                  }
                  className={inputCls}
                >
                  <option value="">Sin nivel específico</option>
                  <option value="100">Nivel 100 (Introductorio)</option>
                  <option value="200">Nivel 200 (Intermedio)</option>
                  <option value="300">Nivel 300 (Avanzado)</option>
                  <option value="400">Nivel 400 (Experto)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                  Título (Español) *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      title: val,
                      slug: !editing && !prev.slug ? autoSlug(val) : prev.slug,
                    }));
                  }}
                  placeholder="Ej. Construyendo Agentes con Amazon Bedrock"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                  Título (Inglés — opcional)
                </label>
                <input
                  value={form.titleEn}
                  onChange={(e) => setForm((prev) => ({ ...prev, titleEn: e.target.value }))}
                  placeholder="Si se deja vacío usa el título en español"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                Slug de la URL (/actividades/[slug]) *
              </label>
              <div className="flex gap-2">
                <input
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="workshop-amazon-bedrock"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, slug: autoSlug(prev.title) }))}
                  className="cursor-pointer shrink-0 border-2 border-surface-600 bg-surface-800 px-3 font-mono text-xs text-surface-200 hover:border-[#D85A30]"
                >
                  Generar del título
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                  Descripción (Español)
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="De qué trata la actividad o taller…"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                  Descripción (Inglés — opcional)
                </label>
                <textarea
                  rows={3}
                  value={form.descriptionEn}
                  onChange={(e) => setForm((prev) => ({ ...prev, descriptionEn: e.target.value }))}
                  placeholder="English description…"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                  Hora Inicio (24h) *
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                  Hora Fin (24h) *
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                  Salón / Zona
                </label>
                <input
                  value={form.roomName}
                  onChange={(e) => setForm((prev) => ({ ...prev, roomName: e.target.value }))}
                  placeholder="Ej. Laboratorio Cloud 1"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                  Speaker / Instructor
                </label>
                <input
                  value={form.speakerName}
                  onChange={(e) => setForm((prev) => ({ ...prev, speakerName: e.target.value }))}
                  placeholder="Nombre del ponente o jurado"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 border-t border-surface-700 pt-3">
              <div className="flex items-center justify-between border border-surface-600 bg-surface-900 p-3">
                <div>
                  <div className="font-mono text-xs font-bold text-surface-100">
                    Publicada en el catálogo (/actividades)
                  </div>
                  <div className="font-mono text-[11px] text-surface-400">
                    Si se apaga, nadie la verá en la lista pública.
                  </div>
                </div>
                <Switch
                  checked={form.isPublished}
                  onChange={(val) => setForm((prev) => ({ ...prev, isPublished: val }))}
                />
              </div>

              <div className="flex items-center justify-between border border-surface-600 bg-surface-900 p-3">
                <div>
                  <div className="font-mono text-xs font-bold text-surface-100">
                    Recepción de registros abierta
                  </div>
                  <div className="font-mono text-[11px] text-surface-400">
                    Permite abrir o cerrar inscripciones al instante.
                  </div>
                </div>
                <Switch
                  checked={form.isOpen}
                  onChange={(val) => setForm((prev) => ({ ...prev, isOpen: val }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: MODALIDAD DE EQUIPOS Y LOGÍSTICA */}
        {activeTab === "logistics" && (
          <div className="flex flex-col gap-5 max-h-[65vh] overflow-y-auto pr-1">
            {form.type === "activity" && (
              <div className="border-2 border-[#3DD6D0]/60 bg-[#3DD6D0]/10 p-4 font-mono text-[11px] leading-relaxed text-surface-100">
                Las actividades de tipo &quot;Actividad&quot; se registran a través del Formulario Unificado por
                Prioridades y son individuales. El cupo configurado aquí se descuenta cuando un
                administrador asigna manualmente al asistente.
              </div>
            )}

            {form.type !== "activity" && (
            <div className="border-2 border-surface-600 bg-surface-900 p-4 flex flex-col gap-4">
              <div className="font-mono text-xs font-bold uppercase text-[#3DD6D0]">
                Configuración de Participación y Equipos
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                    Modalidad permitida
                  </label>
                  <select
                    value={form.formConfig.participationMode}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        formConfig: {
                          ...prev.formConfig,
                          participationMode: e.target.value as "individual" | "team" | "both",
                        },
                      }))
                    }
                    className={inputCls}
                  >
                    <option value="individual">Solo Individual (1 persona)</option>
                    <option value="both">Individual o en Equipo (el usuario elige)</option>
                    <option value="team">Obligatorio en Equipo</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                    Cómo descuenta lugares del cupo
                  </label>
                  <select
                    value={form.formConfig.capacityMode}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        formConfig: {
                          ...prev.formConfig,
                          capacityMode: e.target.value as CapacityMode,
                        },
                      }))
                    }
                    className={inputCls}
                  >
                    <option value="per_person">1 lugar por cada integrante del equipo</option>
                    <option value="per_team">1 lugar por equipo completo</option>
                  </select>
                </div>
              </div>

              {form.formConfig.participationMode !== "individual" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                      Mínimo de integrantes (incluyendo al líder)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.formConfig.minTeamSize}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          formConfig: {
                            ...prev.formConfig,
                            minTeamSize: Math.max(1, Number(e.target.value) || 1),
                          },
                        }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-[11px] font-bold uppercase text-surface-200">
                      Máximo de integrantes (incluyendo al líder)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.formConfig.maxTeamSize}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          formConfig: {
                            ...prev.formConfig,
                            maxTeamSize: Math.max(1, Number(e.target.value) || 3),
                          },
                        }))
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>

            )}

            {/* Laptop y Prerrequisitos */}
            <div className="border-2 border-surface-600 bg-surface-900 p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs font-bold uppercase text-[#D85A30]">
                    Confirmación obligatoria de llevar Laptop propia
                  </div>
                  <div className="font-mono text-[11px] text-surface-400">
                    Si está activo, el formulario exige marcar la casilla de llevar laptop.
                  </div>
                </div>
                <Switch
                  checked={form.formConfig.requireLaptop}
                  onChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      formConfig: { ...prev.formConfig, requireLaptop: val },
                    }))
                  }
                />
              </div>

              <div className="border-t border-surface-700 pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-surface-100">
                    Lista de Prerrequisitos ({form.formConfig.prerequisitesList.length})
                  </span>
                  <button
                    type="button"
                    onClick={addPrereq}
                    className="cursor-pointer inline-flex items-center gap-1 border border-[#D85A30] bg-[#D85A30]/15 px-2.5 py-1 font-mono text-xs font-bold text-[#D85A30]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar prerrequisito
                  </button>
                </div>

                {form.formConfig.prerequisitesList.length === 0 ? (
                  <p className="m-0 font-mono text-xs text-surface-400">
                    Sin prerrequisitos listados.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {form.formConfig.prerequisitesList.map((itemEs, idx) => (
                      <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-center">
                        <input
                          value={itemEs}
                          onChange={(e) => updatePrereq(idx, "es", e.target.value)}
                          placeholder="Prerrequisito en Español (ej. Tener Python 3.11 instalado)"
                          className={inputCls}
                        />
                        <input
                          value={form.formConfig.prerequisitesListEn[idx] ?? ""}
                          onChange={(e) => updatePrereq(idx, "en", e.target.value)}
                          placeholder="En Inglés (opcional)"
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={() => removePrereq(idx)}
                          className="cursor-pointer border border-surface-600 p-2 text-red-400 hover:border-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: CONSTRUCTOR DE PREGUNTAS DINÁMICAS (`customFields`) */}
        {activeTab === "questions" && (
          <div className="max-h-[65vh] overflow-y-auto pr-1">
            <CustomFieldsBuilder
              fields={form.formConfig.customFields}
              onChange={(customFields) =>
                setForm((prev) => ({ ...prev, formConfig: { ...prev.formConfig, customFields } }))
              }
              intro={
                form.type === "activity"
                  ? "Estas preguntas se mostrarán dinámicamente en el Formulario Unificado de Actividades cuando el asistente elija esta actividad dentro de sus prioridades."
                  : "Agrega preguntas personalizadas que aparecerán automáticamente en el formulario de esta actividad."
              }
              emptyMessage="Esta actividad no tiene preguntas adicionales configuradas."
            />
          </div>
        )}

        {/* Pie del Modal Editor */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t-2 border-surface-600 pt-4">
          <HardButton tone="ghost" onClick={() => setModalOpen(false)}>
            Cancelar
          </HardButton>
          <HardButton onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear actividad"}
          </HardButton>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 2: LISTA DE PARTICIPANTES Y EQUIPOS INSCRITOS EN UNA ACTIVIDAD
         ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={!!regsModalActivity}
        onClose={() => setRegsModalActivity(null)}
        title={
          regsModalActivity
            ? `${regsModalActivity.type === "activity" ? "Asignados en" : "Inscritos en"}: ${regsModalActivity.title} (${regsModalActivity.registeredCount}/${regsModalActivity.maxCapacity})`
            : "Inscritos"
        }
        className="max-w-3xl"
      >
        {loadingRegs ? (
          <Cargando />
        ) : registrations.length === 0 ? (
          <Empty icon={Users}>Aún no hay participantes inscritos en esta actividad.</Empty>
        ) : (
          <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-1">
            {registrations.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "border-2 p-3.5 font-mono text-xs",
                  r.status === "cancelled"
                    ? "border-surface-700 bg-surface-900/40 opacity-60"
                    : "border-surface-600 bg-surface-900",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-surface-50">
                        {r.firstName} {r.lastName}
                      </span>
                      <Tag tone={r.status === "registered" ? "good" : "danger"}>
                        {r.status === "registered" ? "Confirmado" : "Cancelado"}
                      </Tag>
                      <Tag tone="info">{r.spotsConsumed} lugar(es)</Tag>
                    </div>
                    <div className="mt-1 text-surface-300">
                      {r.email} · Gafete QR: <strong className="text-[#3DD6D0]">{r.qrCode}</strong>
                    </div>
                  </div>

                  {r.status === "registered" && (
                    <button
                      type="button"
                      onClick={() => void handleCancelRegistration(r)}
                      className="cursor-pointer inline-flex items-center gap-1 border border-red-500/60 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-300 hover:bg-red-500/20"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      {regsModalActivity?.type === "activity" ? "Desasignar (volver a pendiente)" : "Cancelar y liberar cupo"}
                    </button>
                  )}
                </div>

                {/* Si es en equipo, mostrar el nombre de equipo y los integrantes */}
                {r.team?.isTeam && (
                  <div className="mt-2.5 border-t border-surface-700 pt-2 text-[11px] text-surface-200">
                    <div className="font-bold text-[#D85A30]">
                      Equipo: {r.team.teamName} {r.team.roleInTeam ? `(${r.team.roleInTeam})` : ""}
                    </div>
                    {r.team.members.length > 0 && (
                      <ul className="m-0 mt-1 pl-4 text-surface-300">
                        {r.team.members.map((m, i) => (
                          <li key={i}>
                            {m.firstName} {m.lastName} — {m.email}{" "}
                            {m.roleInTeam ? `(${m.roleInTeam})` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Respuestas a customFields */}
                {Object.keys(r.customAnswers || {}).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 border-t border-surface-700 pt-2 text-[11px]">
                    {Object.entries(r.customAnswers).map(([k, v]) => (
                      <span
                        key={k}
                        className="border border-surface-600 bg-surface-800 px-2 py-0.5 text-surface-200"
                      >
                        <strong className="text-surface-400">{k}:</strong> {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <UnifiedFormConfigModal open={unifiedModalOpen} onClose={() => setUnifiedModalOpen(false)} />

      {dialog}
    </div>
  );
}
