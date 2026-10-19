"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { PageHead, Stats, Stat, HardButton, Cargando } from "@/components/admin/ui";
import {
  Layers,
  Sparkles,
  Terminal,
  Trophy,
  Users,
  Clock,
  MapPin,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Eye,
  UserCheck,
  UserX,
  Search,
  Filter,
  Settings,
  X,
  Save,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface CustomField {
  key: string;
  label: string;
  labelEn?: string;
  type: "text" | "textarea" | "select" | "checkbox" | "url";
  required?: boolean;
  placeholder?: string;
  placeholderEn?: string;
  options?: Array<{ value: string; label: string; labelEn?: string }>;
}

interface ActivityItem {
  _id: string;
  slug: string;
  type: "workshop" | "hackathon" | "activity";
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  roomName?: string;
  speakerName?: string;
  level?: string;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  isOpen: boolean;
  maxCapacity: number;
  registeredCount: number;
  spotsLeft: number;
  isSoldOut: boolean;
  formConfig?: {
    requireLaptop?: boolean;
    participationMode?: "individual" | "team" | "both";
    minTeamSize?: number;
    maxTeamSize?: number;
    prerequisitesList?: string[];
    prerequisitesListEn?: string[];
    customFields?: CustomField[];
  };
}

interface PriorityEnriched {
  priority: number;
  activityId: string;
  activitySlug: string;
  activityTitle: string;
  startTime: string;
  endTime: string;
  spotsLeft: number;
  maxCapacity: number;
  registeredCount: number;
  hasScheduleConflict: boolean;
  conflictingItem?: {
    title: string;
    type: string;
    startTime: string;
    endTime: string;
  } | null;
}

interface ApplicationItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  qrCode: string;
  status: "pending" | "assigned" | "cancelled";
  priorities: PriorityEnriched[];
  assignedActivityId?: string | null;
  assignedActivitySlug?: string | null;
  assignedPriorityRank?: number | null;
  assignedAt?: string | null;
  assignedBy?: string | null;
  adminNotes?: string;
  assignedActivity?: {
    _id: string;
    slug: string;
    title: string;
    startTime: string;
    endTime: string;
    roomName?: string;
    maxCapacity: number;
    registeredCount: number;
  } | null;
  enrolledWorkshops?: Array<{
    activityTitle: string;
    slug: string;
    type: string;
    startTime: string;
    endTime: string;
  }>;
  createdAt: string;
}

interface RegistrationItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  qrCode: string;
  status: "registered" | "cancelled" | "assigned" | "pending";
  spotsConsumed?: number;
  logistics?: {
    bringsLaptop?: boolean;
    acceptedPrerequisites?: boolean;
  };
  team?: {
    isTeam: boolean;
    teamName: string;
    roleInTeam: string;
    members: Array<{
      firstName: string;
      lastName: string;
      email: string;
      roleInTeam?: string;
    }>;
  };
  customAnswers?: Record<string, unknown>;
  createdAt: string;
}

interface UnifiedConfig {
  isOpen: boolean;
  maxPriorities: number;
  requireLaptop: boolean;
  prerequisitesList: string[];
  prerequisitesListEn: string[];
  globalCustomFields: CustomField[];
}

export function AdminActividadesScreen() {
  const { toast } = useToast();

  const [tab, setTab] = useState<"catalogo" | "postulaciones" | "inscritos" | "configuracion">("catalogo");
  const [loading, setLoading] = useState(true);

  // Activities state
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");

  // Applications state
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");

  // Registrations state
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [regLoading, setRegLoading] = useState(false);

  // Unified form config state
  const [config, setConfig] = useState<UnifiedConfig | null>(null);
  const [configSaving, setConfigSaving] = useState(false);

  // Modal State for Activity creation/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [formType, setFormType] = useState<"workshop" | "hackathon" | "activity">("workshop");
  const [formSlug, setFormSlug] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDescEn, setFormDescEn] = useState("");
  const [formSpeaker, setFormSpeaker] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [formLevel, setFormLevel] = useState("200");
  const [formStart, setFormStart] = useState("11:00");
  const [formEnd, setFormEnd] = useState("12:30");
  const [formCap, setFormCap] = useState(30);
  const [formPublished, setFormPublished] = useState(true);
  const [formOpen, setFormOpen] = useState(true);
  const [formRequireLaptop, setFormRequireLaptop] = useState(true);
  const [formParticipationMode, setFormParticipationMode] = useState<"individual" | "team" | "both">("individual");
  const [formMinTeam, setFormMinTeam] = useState(1);
  const [formMaxTeam, setFormMaxTeam] = useState(3);
  const [formPrereqs, setFormPrereqs] = useState<string[]>([]);
  const [newPrereqText, setNewPrereqText] = useState("");
  const [formCustomFields, setFormCustomFields] = useState<CustomField[]>([]);

  // Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignApp, setAssignApp] = useState<ApplicationItem | null>(null);
  const [selectedAssignTargetId, setSelectedAssignTargetId] = useState<string>("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch("/api/activities?admin=1");
      if (!res.ok) throw new Error("Error al obtener actividades");
      const data = await res.json();
      setActivities(data.activities || []);
      if (!selectedActivityId && data.activities?.length > 0) {
        setSelectedActivityId(data.activities[0]._id);
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al cargar actividades", "error");
    }
  }, [selectedActivityId, toast]);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/activities/applications");
      if (!res.ok) throw new Error("Error al obtener postulaciones");
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al cargar postulaciones", "error");
    }
  }, [toast]);

  const fetchUnifiedConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/activities/unified-form");
      if (!res.ok) throw new Error("Error al obtener configuración");
      const data = await res.json();
      setConfig(data.config);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al cargar configuración", "error");
    }
  }, [toast]);

  const fetchRegistrations = useCallback(async (activityId: string) => {
    if (!activityId) return;
    try {
      setRegLoading(true);
      const res = await fetch(`/api/activities/${activityId}/registrations`);
      if (!res.ok) throw new Error("Error al obtener inscritos");
      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al cargar inscritos", "error");
    } finally {
      setRegLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchActivities(), fetchApplications(), fetchUnifiedConfig()]);
      setLoading(false);
    }
    init();
  }, [fetchActivities, fetchApplications, fetchUnifiedConfig]);

  useEffect(() => {
    if (tab === "inscritos" && selectedActivityId) {
      fetchRegistrations(selectedActivityId);
    }
  }, [tab, selectedActivityId, fetchRegistrations]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalActs = activities.length;
    const workshops = activities.filter((a) => a.type === "workshop").length;
    const hackathons = activities.filter((a) => a.type === "hackathon").length;
    const activitiesCount = activities.filter((a) => a.type === "activity").length;
    const totalCapacity = activities.reduce((acc, a) => acc + (a.maxCapacity || 0), 0);
    const totalOccupied = activities.reduce((acc, a) => acc + (a.registeredCount || 0), 0);
    const totalApps = applications.length;
    const pendingApps = applications.filter((a) => a.status === "pending").length;
    const assignedApps = applications.filter((a) => a.status === "assigned").length;

    return {
      totalActs,
      workshops,
      hackathons,
      activitiesCount,
      totalCapacity,
      totalOccupied,
      totalApps,
      pendingApps,
      assignedApps,
    };
  }, [activities, applications]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (appStatusFilter !== "all" && app.status !== appStatusFilter) return false;
      if (appSearch.trim()) {
        const q = appSearch.toLowerCase();
        const nameMatch = `${app.firstName} ${app.lastName}`.toLowerCase().includes(q);
        const emailMatch = app.email.toLowerCase().includes(q);
        const qrMatch = app.qrCode.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !qrMatch) return false;
      }
      return true;
    });
  }, [applications, appStatusFilter, appSearch]);

  function openCreateModal() {
    setEditingActivity(null);
    setFormType("workshop");
    setFormSlug("");
    setFormTitle("");
    setFormTitleEn("");
    setFormDesc("");
    setFormDescEn("");
    setFormSpeaker("");
    setFormRoom("");
    setFormLevel("200");
    setFormStart("11:00");
    setFormEnd("12:30");
    setFormCap(30);
    setFormPublished(true);
    setFormOpen(true);
    setFormRequireLaptop(true);
    setFormParticipationMode("individual");
    setFormMinTeam(1);
    setFormMaxTeam(3);
    setFormPrereqs([]);
    setFormCustomFields([]);
    setModalOpen(true);
  }

  function openEditModal(act: ActivityItem) {
    setEditingActivity(act);
    setFormType(act.type);
    setFormSlug(act.slug);
    setFormTitle(act.title);
    setFormTitleEn(act.titleEn || "");
    setFormDesc(act.description);
    setFormDescEn(act.descriptionEn || "");
    setFormSpeaker(act.speakerName || "");
    setFormRoom(act.roomName || "");
    setFormLevel(act.level || "200");
    setFormStart(act.startTime);
    setFormEnd(act.endTime);
    setFormCap(act.maxCapacity);
    setFormPublished(act.isPublished);
    setFormOpen(act.isOpen);
    setFormRequireLaptop(act.formConfig?.requireLaptop ?? true);
    setFormParticipationMode(act.formConfig?.participationMode ?? "individual");
    setFormMinTeam(act.formConfig?.minTeamSize ?? 1);
    setFormMaxTeam(act.formConfig?.maxTeamSize ?? 3);
    setFormPrereqs(act.formConfig?.prerequisitesList ?? []);
    setFormCustomFields(act.formConfig?.customFields ?? []);
    setModalOpen(true);
  }

  async function handleSaveActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!formSlug.trim() || !formTitle.trim()) {
      toast("Slug y título son obligatorios", "error");
      return;
    }

    const payload = {
      slug: formSlug.trim().toLowerCase(),
      type: formType,
      title: formTitle.trim(),
      titleEn: formTitleEn.trim(),
      description: formDesc.trim(),
      descriptionEn: formDescEn.trim(),
      speakerName: formSpeaker.trim(),
      roomName: formRoom.trim(),
      level: formLevel,
      startTime: formStart.trim(),
      endTime: formEnd.trim(),
      maxCapacity: formCap,
      isPublished: formPublished,
      isOpen: formOpen,
      formConfig: {
        requireLaptop: formRequireLaptop,
        participationMode: formParticipationMode,
        minTeamSize: formMinTeam,
        maxTeamSize: formMaxTeam,
        prerequisitesList: formPrereqs,
        customFields: formCustomFields,
      },
    };

    try {
      if (editingActivity) {
        const res = await fetch(`/api/activities/${editingActivity._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Error al actualizar actividad");
        }
        toast("Actividad actualizada con éxito", "success");
      } else {
        const res = await fetch("/api/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Error al crear actividad");
        }
        toast("Actividad creada con éxito", "success");
      }

      setModalOpen(false);
      await fetchActivities();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al guardar", "error");
    }
  }

  async function handleDeleteActivity(act: ActivityItem) {
    if (!confirm(`¿Eliminar la actividad "${act.title}"? Esta acción cancelará las inscripciones asociadas.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/activities/${act._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar la actividad");
      toast(`Actividad "${act.title}" eliminada`, "success");
      await fetchActivities();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error interno al eliminar", "error");
    }
  }

  async function handleTogglePublished(act: ActivityItem) {
    try {
      const res = await fetch(`/api/activities/${act._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !act.isPublished }),
      });
      if (!res.ok) throw new Error("Error al cambiar estado");
      toast(!act.isPublished ? "Actividad publicada" : "Actividad despublicada", "success");
      await fetchActivities();
    } catch {
      toast("Error al actualizar visibilidad", "error");
    }
  }

  async function handleToggleOpen(act: ActivityItem) {
    try {
      const res = await fetch(`/api/activities/${act._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: !act.isOpen }),
      });
      if (!res.ok) throw new Error("Error al cambiar estado");
      toast(!act.isOpen ? "Inscripciones abiertas" : "Inscripciones pausadas/cerradas", "success");
      await fetchActivities();
    } catch {
      toast("Error al actualizar estado de inscripciones", "error");
    }
  }

  // Assign or unassign activity application
  async function handleAssignApplication(appId: string, activityId: string | null, notes?: string) {
    setAssignSubmitting(true);
    try {
      const res = await fetch(`/api/activities/applications/${appId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, adminNotes: notes || "" }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || resData.error || "Error al asignar actividad");
      }

      toast(activityId ? "Asistente asignado con éxito" : "Asistente desasignado", "success");

      setAssignModalOpen(false);
      await Promise.all([fetchApplications(), fetchActivities()]);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al procesar", "error");
    } finally {
      setAssignSubmitting(false);
    }
  }

  // Cancel application completely
  async function handleCancelApplication(appId: string) {
    if (!confirm("¿Cancelar esta solicitud de actividades? Si ya tenía una actividad asignada, se liberará el lugar.")) {
      return;
    }

    try {
      const res = await fetch(`/api/activities/applications/${appId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al cancelar solicitud");
      toast("Solicitud cancelada con éxito", "success");
      await Promise.all([fetchApplications(), fetchActivities()]);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error interno", "error");
    }
  }

  // Cancel registration from specific activity view
  async function handleCancelRegistration(regId: string) {
    if (!confirm("¿Cancelar esta inscripción? Se liberará el cupo atómicamente.")) {
      return;
    }

    try {
      const res = await fetch(`/api/activities/${selectedActivityId}/registrations?regId=${regId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al cancelar registro");
      toast("Registro cancelado y lugar liberado", "success");
      await Promise.all([fetchRegistrations(selectedActivityId), fetchActivities()]);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error interno", "error");
    }
  }

  // Save Unified Form Config
  async function handleSaveUnifiedConfig() {
    if (!config) return;
    setConfigSaving(true);
    try {
      const res = await fetch("/api/activities/unified-form", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Error al guardar configuración");
      toast("Configuración del formulario unificado guardada", "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setConfigSaving(false);
    }
  }

  if (loading) {
    return <Cargando />;
  }

  return (
    <div>
      <PageHead
        title="Gestión de Actividades, Workshops y Hackatones"
        actions={
          <div className="flex gap-2">
            <HardButton
              tone="accent"
              onClick={openCreateModal}
              icon={Plus}
            >
              Nueva Actividad
            </HardButton>
          </div>
        }
      />

      {/* Stats bar */}
      <Stats cols={4}>
        <Stat
          label="Total Actividades"
          value={stats.totalActs}
          hint={`${stats.workshops} Workshops · ${stats.hackathons} Hacks · ${stats.activitiesCount} Act.`}
          tone="ink"
        />
        <Stat
          label="Cupo Total Ocupado"
          value={`${stats.totalOccupied} / ${stats.totalCapacity}`}
          hint={`${stats.totalCapacity > 0 ? Math.round((stats.totalOccupied / stats.totalCapacity) * 100) : 0}% ocupación`}
          tone="accent"
        />
        <Stat
          label="Postulaciones Unificadas"
          value={stats.totalApps}
          hint={`${stats.pendingApps} pendientes · ${stats.assignedApps} asignadas`}
          tone="info"
        />
        <Stat
          label="Recepción Actividades"
          value={config?.isOpen ? "Abierta" : "Cerrada"}
          hint={`Top ${config?.maxPriorities || 3} prioridades`}
          tone={config?.isOpen ? "good" : "warn"}
        />
      </Stats>

      {/* Main navigation tabs */}
      <div className="mb-6 flex flex-wrap border-b-2 border-surface-600 font-mono text-xs">
        <button
          onClick={() => setTab("catalogo")}
          className={`flex items-center gap-2 px-4 py-3 font-bold border-b-2 transition-all ${
            tab === "catalogo"
              ? "border-[#D85A30] text-[#D85A30] bg-[#D85A30]/10"
              : "border-transparent text-surface-200 hover:text-white"
          }`}
        >
          <Layers className="h-4 w-4" />
          Catálogo ({activities.length})
        </button>

        <button
          onClick={() => setTab("postulaciones")}
          className={`flex items-center gap-2 px-4 py-3 font-bold border-b-2 transition-all ${
            tab === "postulaciones"
              ? "border-[#C143BC] text-[#C143BC] bg-[#C143BC]/10"
              : "border-transparent text-surface-200 hover:text-white"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Postulaciones por Prioridad ({applications.length})
          {stats.pendingApps > 0 && (
            <span className="rounded-full bg-yellow-500/20 px-1.5 py-0.2 text-[10px] text-yellow-400 font-black">
              {stats.pendingApps}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab("inscritos")}
          className={`flex items-center gap-2 px-4 py-3 font-bold border-b-2 transition-all ${
            tab === "inscritos"
              ? "border-[#3DD6D0] text-[#3DD6D0] bg-[#3DD6D0]/10"
              : "border-transparent text-surface-200 hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          Lista de Inscritos
        </button>

        <button
          onClick={() => setTab("configuracion")}
          className={`flex items-center gap-2 px-4 py-3 font-bold border-b-2 transition-all ${
            tab === "configuracion"
              ? "border-white text-white bg-white/10"
              : "border-transparent text-surface-200 hover:text-white"
          }`}
        >
          <Settings className="h-4 w-4" />
          Configuración Formulario
        </button>
      </div>

      {/* ─────────────────── TAB 1: CATÁLOGO DE ACTIVIDADES ─────────────────── */}
      {tab === "catalogo" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border-2 border-surface-600 bg-surface-900">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b-2 border-surface-600 bg-surface-800 text-[11px] text-surface-200 uppercase">
                <tr>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Título / Slug</th>
                  <th className="p-3">Horario</th>
                  <th className="p-3">Salón / Speaker</th>
                  <th className="p-3">Cupo</th>
                  <th className="p-3">Estados</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-surface-600/50">
                {activities.map((act) => {
                  const typeBadge = act.type === "workshop"
                    ? "bg-[#3DD6D0]/15 text-[#3DD6D0] border-[#3DD6D0]/40"
                    : act.type === "hackathon"
                    ? "bg-[#D85A30]/15 text-[#D85A30] border-[#D85A30]/40"
                    : "bg-[#C143BC]/15 text-[#C143BC] border-[#C143BC]/40";

                  return (
                    <tr key={act._id} className="hover:bg-surface-800/50 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${typeBadge}`}>
                          {act.type}
                        </span>
                        {act.level && (
                          <span className="ml-1.5 text-[10px] text-surface-300">N.{act.level}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-surface-50">{act.title}</p>
                        <span className="text-[10px] text-surface-300">{act.slug}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-surface-100">{act.startTime} - {act.endTime}</span>
                      </td>
                      <td className="p-3">
                        <p className="text-surface-100 truncate max-w-[180px]">{act.roomName || "Sin salón"}</p>
                        <span className="text-[10px] text-surface-300">{act.speakerName || "Sin instructor"}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`font-bold ${act.isSoldOut ? "text-red-400" : "text-[#3DD6D0]"}`}>
                          {act.registeredCount} / {act.maxCapacity}
                        </span>
                        <span className="block text-[10px] text-surface-300">
                          {act.type === "activity" ? "asignados" : `${act.spotsLeft} libres`}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap space-y-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePublished(act)}
                          className={`block rounded px-2 py-0.5 text-[10px] font-bold uppercase border transition-all ${
                            act.isPublished
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                              : "bg-surface-700 border-surface-500 text-surface-300"
                          }`}
                        >
                          {act.isPublished ? "Publicado" : "Borrador"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleOpen(act)}
                          className={`block rounded px-2 py-0.5 text-[10px] font-bold uppercase border transition-all ${
                            act.isOpen
                              ? "bg-[#3DD6D0]/10 border-[#3DD6D0]/40 text-[#3DD6D0]"
                              : "bg-red-500/10 border-red-500/40 text-red-400"
                          }`}
                        >
                          {act.isOpen ? "Abierta" : "Cerrada"}
                        </button>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedActivityId(act._id);
                              setTab("inscritos");
                            }}
                            className="p-1.5 rounded border border-surface-600 bg-surface-800 text-surface-200 hover:text-[#3DD6D0]"
                            title="Ver inscritos"
                          >
                            <Users className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(act)}
                            className="p-1.5 rounded border border-surface-600 bg-surface-800 text-surface-200 hover:text-white"
                            title="Editar actividad"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act)}
                            className="p-1.5 rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
                            title="Eliminar actividad"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 2: POSTULACIONES UNIFICADAS ─────────────────── */}
      {tab === "postulaciones" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 rounded-xl border-2 border-surface-600 bg-surface-900 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <button
                onClick={() => setAppStatusFilter("all")}
                className={`rounded px-3 py-1 font-bold ${
                  appStatusFilter === "all" ? "bg-white text-black" : "bg-surface-800 text-surface-200"
                }`}
              >
                Todas ({applications.length})
              </button>
              <button
                onClick={() => setAppStatusFilter("pending")}
                className={`rounded px-3 py-1 font-bold ${
                  appStatusFilter === "pending" ? "bg-yellow-400 text-black" : "bg-surface-800 text-surface-200"
                }`}
              >
                Pendientes ({stats.pendingApps})
              </button>
              <button
                onClick={() => setAppStatusFilter("assigned")}
                className={`rounded px-3 py-1 font-bold ${
                  appStatusFilter === "assigned" ? "bg-emerald-400 text-black" : "bg-surface-800 text-surface-200"
                }`}
              >
                Asignadas ({stats.assignedApps})
              </button>
              <button
                onClick={() => setAppStatusFilter("cancelled")}
                className={`rounded px-3 py-1 font-bold ${
                  appStatusFilter === "cancelled" ? "bg-red-400 text-black" : "bg-surface-800 text-surface-200"
                }`}
              >
                Canceladas
              </button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo, QR..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="w-full rounded border border-surface-600 bg-surface-800 py-1.5 pl-8 pr-3 font-mono text-xs text-surface-100 outline-none focus:border-[#C143BC] sm:w-64"
              />
            </div>
          </div>

          {/* Applications Table / Cards */}
          <div className="space-y-3 font-mono text-xs">
            {filteredApps.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-surface-600 p-8 text-center text-surface-300">
                No hay postulaciones con los filtros seleccionados.
              </div>
            ) : (
              filteredApps.map((app) => {
                const isAssigned = app.status === "assigned";
                const isCancelled = app.status === "cancelled";

                return (
                  <div
                    key={app._id}
                    className="rounded-xl border-2 border-surface-600 bg-surface-900 p-4 transition-all hover:border-surface-500"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      {/* Attendee Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {app.firstName} {app.lastName}
                          </h4>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              isAssigned
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : isCancelled
                                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                            }`}
                          >
                            {app.status === "assigned" ? "Asignada" : app.status === "cancelled" ? "Cancelada" : "Pendiente"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-[11px] text-surface-300">
                          <span>{app.email}</span>
                          <span>• QR: <strong className="text-[#3DD6D0]">{app.qrCode}</strong></span>
                          <span>• {new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>

                        {app.adminNotes && (
                          <p className="mt-1 text-[11px] text-surface-300 italic">
                            Notas: &quot;{app.adminNotes}&quot;
                          </p>
                        )}
                      </div>

                      {/* Assigned Status / Unassign Button */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isAssigned && app.assignedActivity && (
                          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-emerald-400">
                                Asignada: Prioridad {app.assignedPriorityRank ? `#${app.assignedPriorityRank}` : "Directa"}
                              </span>
                              <strong className="text-white">{app.assignedActivity.title}</strong>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAssignApplication(app._id, null)}
                              className="ml-2 rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase text-red-300 hover:bg-red-500 hover:text-white"
                              title="Desasignar y regresar a pendiente"
                            >
                              Desasignar
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setAssignApp(app);
                            setSelectedAssignTargetId(app.assignedActivityId || app.priorities[0]?.activityId || "");
                            setAssignNotes(app.adminNotes || "");
                            setAssignModalOpen(true);
                          }}
                          className="rounded border border-surface-500 bg-surface-800 px-3 py-1.5 text-xs font-bold text-surface-100 hover:bg-surface-700"
                        >
                          Asignar / Cambiar
                        </button>

                        {!isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleCancelApplication(app._id)}
                            className="rounded border border-red-500/30 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500 hover:text-white"
                            title="Cancelar solicitud"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Priorities list with conflict warnings and Quick Assign buttons */}
                    <div className="mt-4 border-t border-surface-700/60 pt-3">
                      <span className="text-[11px] uppercase tracking-wider text-surface-400 font-bold block mb-2">
                        Preferencias Solicitadas:
                      </span>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {app.priorities.map((p) => {
                          const isThisAssigned = isAssigned && app.assignedActivityId === p.activityId;
                          const hasConflict = p.hasScheduleConflict;
                          const isSoldOut = p.spotsLeft <= 0;

                          return (
                            <div
                              key={p.priority}
                              className={`rounded-lg border p-2.5 text-xs space-y-1.5 ${
                                isThisAssigned
                                  ? "border-emerald-500 bg-emerald-500/10"
                                  : hasConflict
                                  ? "border-red-500/40 bg-red-500/5"
                                  : "border-surface-600 bg-surface-800"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C143BC]/30 text-[10px] font-bold text-[#C143BC]">
                                  {p.priority}º
                                </span>
                                <span className={`text-[10px] font-bold ${isSoldOut ? "text-red-400" : "text-[#3DD6D0]"}`}>
                                  {p.spotsLeft} libres ({p.registeredCount}/{p.maxCapacity})
                                </span>
                              </div>

                              <p className="font-bold text-white line-clamp-1">{p.activityTitle}</p>
                              <span className="block text-[10px] text-surface-300">{p.startTime} - {p.endTime} hrs</span>

                              {/* Conflict indicator */}
                              {hasConflict && p.conflictingItem && (
                                <div className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] text-red-300 font-bold">
                                  Empalme: {p.conflictingItem.title} ({p.conflictingItem.startTime}-{p.conflictingItem.endTime})
                                </div>
                              )}

                              {/* Quick assign button */}
                              {!isThisAssigned && !isCancelled && (
                                <button
                                  type="button"
                                  disabled={hasConflict || isSoldOut}
                                  onClick={() => handleAssignApplication(app._id, p.activityId, `Asignado a prioridad #${p.priority}`)}
                                  className="w-full mt-1 rounded border border-[#C143BC]/60 bg-[#C143BC]/20 py-1 text-[10px] font-bold uppercase text-white hover:bg-[#C143BC] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {isSoldOut ? "Agotado" : hasConflict ? "Conflicto" : `Asignar Prioridad #${p.priority}`}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 3: LISTA DE INSCRITOS POR ACTIVIDAD ─────────────────── */}
      {tab === "inscritos" && (
        <div className="space-y-4 font-mono text-xs">
          {/* Activity Selector */}
          <div className="rounded-xl border-2 border-surface-600 bg-surface-900 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <label className="text-surface-300 font-bold">Seleccionar Actividad:</label>
              <select
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="rounded border border-surface-600 bg-surface-800 px-3 py-1.5 text-white outline-none focus:border-[#3DD6D0]"
              >
                {activities.map((a) => (
                  <option key={a._id} value={a._id}>
                    [{a.type.toUpperCase()}] {a.title} ({a.registeredCount}/{a.maxCapacity})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => fetchRegistrations(selectedActivityId)}
              className="inline-flex items-center gap-1.5 rounded border border-surface-600 bg-surface-800 px-3 py-1.5 text-surface-200 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </button>
          </div>

          {/* Registrations Table */}
          {regLoading ? (
            <Cargando />
          ) : registrations.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-surface-600 p-8 text-center text-surface-300">
              No hay asistentes registrados o asignados a esta actividad todavía.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border-2 border-surface-600 bg-surface-900">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b-2 border-surface-600 bg-surface-800 text-[11px] text-surface-200 uppercase">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Asistente</th>
                    <th className="p-3">QR / Estado</th>
                    <th className="p-3">Modalidad / Equipo</th>
                    <th className="p-3">Logística</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-surface-600/50">
                  {registrations.map((reg, idx) => (
                    <tr key={reg._id} className="hover:bg-surface-800/50 transition-colors">
                      <td className="p-3 text-surface-400 font-bold">{idx + 1}</td>
                      <td className="p-3">
                        <p className="font-bold text-white">{reg.firstName} {reg.lastName}</p>
                        <span className="text-[10px] text-surface-300">{reg.email}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <strong className="text-[#3DD6D0]">{reg.qrCode}</strong>
                        <span className="block text-[10px] text-surface-300 capitalize">{reg.status}</span>
                      </td>
                      <td className="p-3">
                        {reg.team?.isTeam ? (
                          <div>
                            <span className="font-bold text-[#D85A30]">{reg.team.teamName}</span>
                            <span className="block text-[10px] text-surface-300">
                              {reg.team.roleInTeam} · {reg.team.members?.length || 0} integrantes
                            </span>
                          </div>
                        ) : (
                          <span className="text-surface-300">Individual</span>
                        )}
                      </td>
                      <td className="p-3 text-[11px] whitespace-nowrap">
                        <div className="flex gap-2">
                          <span className={reg.logistics?.bringsLaptop ? "text-emerald-400" : "text-surface-400"}>
                            💻 {reg.logistics?.bringsLaptop ? "Laptop" : "No laptop"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCancelRegistration(reg._id)}
                          className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase text-red-300 hover:bg-red-500 hover:text-white"
                        >
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────── TAB 4: CONFIGURACIÓN FORMULARIO UNIFICADO ─────────────────── */}
      {tab === "configuracion" && config && (
        <div className="space-y-6 font-mono text-xs max-w-3xl">
          <div className="rounded-xl border-2 border-surface-600 bg-surface-900 p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b-2 border-surface-600 pb-2">
              Reglas del Formulario Unificado de Actividades
            </h3>

            {/* Switch isOpen */}
            <div className="flex items-center justify-between border-b border-surface-700/50 pb-4">
              <div>
                <span className="font-bold text-white block">Recepción de Solicitudes Abierta</span>
                <span className="text-[11px] text-surface-300">
                  Permite a los asistentes postularse a las actividades especiales en /actividades/registro-actividades.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, isOpen: !config.isOpen })}
                className={`rounded-lg px-4 py-2 font-bold uppercase text-xs border transition-all ${
                  config.isOpen
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                    : "bg-red-500/20 border-red-500 text-red-300"
                }`}
              >
                {config.isOpen ? "Abierto" : "Cerrado"}
              </button>
            </div>

            {/* maxPriorities */}
            <div className="flex items-center justify-between border-b border-surface-700/50 pb-4">
              <div>
                <span className="font-bold text-white block">Cantidad de Prioridades Obligatorias (Top Fijo)</span>
                <span className="text-[11px] text-surface-300">
                  Número de actividades que el asistente debe ordenar (por defecto: 3).
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={5}
                value={config.maxPriorities}
                onChange={(e) => setConfig({ ...config, maxPriorities: parseInt(e.target.value, 10) || 3 })}
                className="w-20 rounded border border-surface-600 bg-surface-800 px-3 py-1.5 text-center text-white"
              />
            </div>

            {/* requireLaptop */}
            <div className="flex items-center justify-between border-b border-surface-700/50 pb-4">
              <div>
                <span className="font-bold text-white block">Exigir Confirmación de Laptop Propia</span>
                <span className="text-[11px] text-surface-300">
                  Muestra la casilla obligatoria de laptop en el formulario unificado.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.requireLaptop}
                onChange={(e) => setConfig({ ...config, requireLaptop: e.target.checked })}
                className="h-4 w-4 rounded border-surface-600 text-[#C143BC]"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-3">
              <HardButton
                tone="accent"
                onClick={handleSaveUnifiedConfig}
                disabled={configSaving}
                icon={Save}
              >
                {configSaving ? "Guardando..." : "Guardar Configuración"}
              </HardButton>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── MODAL CREAR / EDITAR ACTIVIDAD ─────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border-2 border-surface-600 bg-surface-900 p-6 shadow-2xl font-mono text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-surface-600 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingActivity ? `Editar Actividad: ${editingActivity.slug}` : "Crear Nueva Actividad / Workshop"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-surface-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-surface-300 mb-1">Tipo de Dinámica *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as "workshop" | "hackathon" | "activity")}
                    className="w-full rounded border border-surface-600 bg-surface-800 px-3 py-2 text-white"
                  >
                    <option value="workshop">Workshop (Taller técnico)</option>
                    <option value="hackathon">Hackatón (Reto en equipo/indiv)</option>
                    <option value="activity">Actividad (Formulario Unificado por Prioridad)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-surface-300 mb-1">Slug Único *</label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    placeholder="workshop-amazon-bedrock"
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full rounded border border-surface-600 bg-surface-800 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-surface-300 mb-1">Título de la Actividad *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  placeholder="Construyendo Agentes con Amazon Bedrock"
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded border border-surface-600 bg-surface-800 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-surface-300 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  placeholder="Resumen del contenido y objetivos prácticos..."
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full rounded border border-surface-600 bg-surface-800 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-surface-300 mb-1">Hora Inicio (HH:mm) *</label>
                  <input
                    type="text"
                    required
                    value={formStart}
                    placeholder="11:00"
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full rounded border border-surface-600 bg-surface-800 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-surface-300 mb-1">Hora Fin (HH:mm) *</label>
                  <input
                    type="text"
                    required
                    value={formEnd}
                    placeholder="12:30"
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full rounded border border-surface-600 bg-surface-800 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-surface-300 mb-1">Cupo Máximo *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formCap}
                    onChange={(e) => setFormCap(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded border border-surface-600 bg-surface-800 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-surface-300 mb-1">Salón / Laboratorio</label>
                  <input
                    type="text"
                    value={formRoom}
                    placeholder="Lab Cloud 1"
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full rounded border border-surface-600 bg-surface-800 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-surface-300 mb-1">Speaker / Instructor</label>
                  <input
                    type="text"
                    value={formSpeaker}
                    placeholder="Nombre del instructor"
                    onChange={(e) => setFormSpeaker(e.target.value)}
                    className="w-full rounded border border-surface-600 bg-surface-800 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-surface-300 mb-1">Nivel Técnico</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full rounded border border-surface-600 bg-surface-800 px-3 py-2 text-white"
                  >
                    <option value="100">100 - Básico</option>
                    <option value="200">200 - Intermedio</option>
                    <option value="300">300 - Avanzado</option>
                    <option value="400">400 - Experto</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 border-t border-surface-700 pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-600 text-[#3DD6D0]"
                  />
                  <span>Publicado en la web</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={formOpen}
                    onChange={(e) => setFormOpen(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-600 text-[#3DD6D0]"
                  />
                  <span>Inscripciones abiertas</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={formRequireLaptop}
                    onChange={(e) => setFormRequireLaptop(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-600 text-[#3DD6D0]"
                  />
                  <span>Requiere laptop</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-surface-700 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded border border-surface-600 bg-surface-800 px-4 py-2 text-surface-200 hover:text-white"
                >
                  Cancelar
                </button>
                <HardButton tone="accent" type="submit">
                  {editingActivity ? "Actualizar Actividad" : "Crear Actividad"}
                </HardButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────── MODAL ASIGNACIÓN MANUAL ─────────────────── */}
      {assignModalOpen && assignApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-lg rounded-2xl border-2 border-surface-600 bg-surface-900 p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b-2 border-surface-600 pb-3">
              <h3 className="text-sm font-bold text-white">
                Asignación Manual: {assignApp.firstName} {assignApp.lastName}
              </h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-surface-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-surface-300 text-[11px]">
              Selecciona la actividad de tipo &quot;activity&quot; a la que deseas asignar al asistente. Se validará que no tenga conflicto de horario y se actualizará el cupo atómicamente.
            </p>

            <div>
              <label className="block text-surface-300 mb-1">Actividad Destino:</label>
              <select
                value={selectedAssignTargetId}
                onChange={(e) => setSelectedAssignTargetId(e.target.value)}
                className="w-full rounded border border-surface-600 bg-surface-800 px-3 py-2 text-white outline-none"
              >
                <option value="">-- Desasignar (devolver a pendiente) --</option>
                {activities
                  .filter((a) => a.type === "activity")
                  .map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.title} ({a.startTime}-{a.endTime}) · {a.registeredCount}/{a.maxCapacity} cupo
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-surface-300 mb-1">Notas Administrativas:</label>
              <input
                type="text"
                value={assignNotes}
                placeholder="Motivo o notas de asignación..."
                onChange={(e) => setAssignNotes(e.target.value)}
                className="w-full rounded border border-surface-600 bg-surface-800 px-3 py-2 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-surface-700 pt-3">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="rounded border border-surface-600 bg-surface-800 px-4 py-2 text-surface-200 hover:text-white"
              >
                Cancelar
              </button>
              <HardButton
                tone="accent"
                disabled={assignSubmitting}
                onClick={() => handleAssignApplication(assignApp._id, selectedAssignTargetId || null, assignNotes)}
              >
                {assignSubmitting ? "Procesando..." : selectedAssignTargetId ? "Asignar Actividad" : "Desasignar"}
              </HardButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
