"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Eye, Undo2, UserX } from "lucide-react";
import {
  Empty,
  Select,
  Stat,
  Stats,
  TableWrap,
  Tag,
  Th,
  Toolbar,
} from "@/components/admin/ui";
import { useConfirm } from "@/components/admin/confirm";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type {
  ActivityApplicationAdminRow,
  PublicActivityDTO,
  UnifiedActivityFormConfig,
} from "@/types/activities";
import { apiErrorMessage } from "@/lib/activities-dto";
import { cn } from "@/lib/utils";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return Number.isNaN(h) || Number.isNaN(m) ? 0 : h * 60 + m;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return Math.max(toMinutes(aStart), toMinutes(bStart)) < Math.min(toMinutes(aEnd), toMinutes(bEnd));
}

const STATUS_LABEL: Record<ActivityApplicationAdminRow["status"], string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  cancelled: "Cancelado",
};

/**
 * Vista 2 de `/admin/actividades`: solicitudes del formulario unificado y asignación manual
 * por prioridades (valida horario y cupo en vivo; el backend vuelve a validar de forma atómica).
 */
export function ActivityApplicationsPanel({
  applications,
  activities,
  onRefresh,
}: {
  applications: ActivityApplicationAdminRow[];
  /** Catálogo completo (se usan las de `type: "activity"`) */
  activities: PublicActivityDTO[];
  /** Recarga solicitudes y catálogo (cupos) tras asignar/cancelar */
  onRefresh: () => Promise<void>;
}) {
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();

  const [statusFilter, setStatusFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("any");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [answersFor, setAnswersFor] = useState<ActivityApplicationAdminRow | null>(null);
  const [globalFields, setGlobalFields] = useState<UnifiedActivityFormConfig["globalCustomFields"]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/activities/unified-form");
        const data = await res.json();
        if (res.ok && !cancelled) setGlobalFields(data.config?.globalCustomFields ?? []);
      } catch {
        // Las etiquetas son opcionales: si falla se muestran las llaves.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activityOptions = useMemo(() => activities.filter((a) => a.type === "activity"), [activities]);

  const counts = useMemo(
    () => ({
      pending: applications.filter((a) => a.status === "pending").length,
      assigned: applications.filter((a) => a.status === "assigned").length,
      cancelled: applications.filter((a) => a.status === "cancelled").length,
    }),
    [applications],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (activityFilter !== "all") {
        const match = a.priorities.some(
          (p) => p.slug === activityFilter && (rankFilter === "any" || p.priority === Number(rankFilter)),
        );
        if (!match) return false;
      }
      if (!q) return true;
      return (
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.qrCode.toLowerCase().includes(q)
      );
    });
  }, [applications, statusFilter, activityFilter, rankFilter, search]);

  const assign = async (app: ActivityApplicationAdminRow, activityId: string | null) => {
    setBusyId(app.id);
    try {
      const res = await fetch(`/api/activities/applications/${app.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(apiErrorMessage(data, "No se pudo completar la asignación"), "error");
        return;
      }
      toast(activityId ? "Actividad asignada" : "Solicitud regresada a pendiente", "success");
      await onRefresh();
    } catch {
      toast("Error de red al asignar", "error");
    } finally {
      setBusyId(null);
    }
  };

  const unassign = async (app: ActivityApplicationAdminRow) => {
    const ok = await confirm({
      title: "Desasignar actividad",
      message: `${app.firstName} ${app.lastName} volverá a "Pendiente" y se liberará su lugar en "${app.assignedActivityTitle}".`,
      confirmLabel: "Desasignar",
    });
    if (ok) await assign(app, null);
  };

  const cancel = async (app: ActivityApplicationAdminRow) => {
    const ok = await confirm({
      title: "Cancelar solicitud",
      message: `Se cancelará la solicitud de ${app.firstName} ${app.lastName} (${app.email})${
        app.status === "assigned" ? " y se liberará su lugar asignado" : ""
      }. Podrá volver a postularse.`,
      confirmLabel: "Cancelar solicitud",
    });
    if (!ok) return;

    setBusyId(app.id);
    try {
      const res = await fetch(`/api/activities/applications/${app.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "No se pudo cancelar la solicitud", "error");
        return;
      }
      toast("Solicitud cancelada", "success");
      await onRefresh();
    } catch {
      toast("Error de red al cancelar", "error");
    } finally {
      setBusyId(null);
    }
  };

  /** Etiqueta legible de una pregunta (global o de una actividad). */
  const labelFor = (slug: string | null, key: string): string => {
    const fields =
      slug === null ? globalFields : activities.find((a) => a.slug === slug)?.formConfig.customFields ?? [];
    return fields.find((f) => f.key === key)?.label ?? key;
  };

  const renderAnswer = (slug: string | null, key: string, val: string | boolean) => {
    const field =
      slug === null
        ? globalFields.find((f) => f.key === key)
        : activities.find((a) => a.slug === slug)?.formConfig.customFields.find((f) => f.key === key);
    if (typeof val === "boolean") return val ? "Sí" : "No";
    const opt = field?.options?.find((o) => o.value === val);
    return opt?.label ?? (val || "—");
  };

  return (
    <div>
      <Stats cols={3}>
        <Stat
          value={counts.pending}
          label="Pendientes de asignar"
          tone="accent"
          active={statusFilter === "pending"}
          onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
        />
        <Stat
          value={counts.assigned}
          label="Asignados"
          tone="good"
          active={statusFilter === "assigned"}
          onClick={() => setStatusFilter(statusFilter === "assigned" ? "all" : "assigned")}
        />
        <Stat
          value={counts.cancelled}
          label="Cancelados"
          tone="danger"
          active={statusFilter === "cancelled"}
          onClick={() => setStatusFilter(statusFilter === "cancelled" ? "all" : "cancelled")}
        />
      </Stats>

      <Toolbar>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, correo o código QR…"
          className="col-span-2 min-h-11 flex-1 border-2 border-surface-600 bg-surface-800 px-3.5 py-2 font-mono text-xs text-surface-100 outline-none focus:border-[#D85A30]"
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          label="Filtrar por estado"
          options={[
            ["all", "Todos los estados"],
            ["pending", "Pendientes de asignar"],
            ["assigned", "Asignados"],
            ["cancelled", "Cancelados"],
          ]}
        />
        <Select
          value={activityFilter}
          onChange={setActivityFilter}
          label="Filtrar por actividad solicitada"
          options={[
            ["all", "Cualquier actividad solicitada"],
            ...activityOptions.map((a) => [a.slug, a.title] as const),
          ]}
        />
        <Select
          value={rankFilter}
          onChange={setRankFilter}
          label="Filtrar por prioridad"
          options={[
            ["any", "Cualquier prioridad"],
            ["1", "Prioridad 1"],
            ["2", "Prioridad 2"],
            ["3", "Prioridad 3"],
            ["4", "Prioridad 4"],
            ["5", "Prioridad 5"],
          ]}
        />
      </Toolbar>

      {filtered.length === 0 ? (
        <Empty icon={UserX}>No hay solicitudes que coincidan con el filtro.</Empty>
      ) : (
        <TableWrap>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-surface-600 bg-surface-900/50">
                <Th>Asistente</Th>
                <Th>Workshops / Hackatones</Th>
                <Th>Prioridades elegidas</Th>
                <Th>Estado y asignación</Th>
                <Th align="right">Acciones</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {filtered.map((app) => {
                const busy = busyId === app.id;
                const canAssign = app.status !== "cancelled";
                return (
                  <tr key={app.id} className="align-top hover:bg-surface-700/30">
                    {/* Asistente */}
                    <td className="px-3 py-3.5 sm:px-4">
                      <div className="font-mono text-xs font-bold text-surface-50 sm:text-sm">
                        {app.firstName} {app.lastName}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-surface-300">{app.email}</div>
                      <div className="mt-1 font-mono text-[11px] text-surface-400">
                        QR: <span className="text-[#3DD6D0]">{app.qrCode}</span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-surface-500">
                        {new Date(app.createdAt).toLocaleString("es-MX")}
                      </div>
                    </td>

                    {/* Workshops / hackatones inscritos */}
                    <td className="px-3 py-3.5 sm:px-4">
                      {app.enrolledWorkshopsAndHackathons.length === 0 ? (
                        <span className="font-mono text-xs text-surface-400">Ninguno</span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {app.enrolledWorkshopsAndHackathons.map((e) => (
                            <span
                              key={e.slug}
                              className="inline-flex w-fit flex-wrap items-center gap-1.5 border border-surface-500 bg-surface-900 px-2 py-0.5 font-mono text-[11px] text-surface-100"
                              title={e.title}
                            >
                              <span className="text-[#D85A30]">
                                {e.startTime}–{e.endTime}
                              </span>
                              <span className="max-w-44 truncate">{e.title}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Prioridades */}
                    <td className="px-3 py-3.5 sm:px-4">
                      <div className="flex flex-col gap-2">
                        {app.priorities.map((p) => {
                          const isAssignedHere = app.assignedActivityId === p.activityId;
                          const soldOutBlock = p.isSoldOut && !isAssignedHere;
                          const blocked = p.hasScheduleConflictWithEnrolled || soldOutBlock;
                          return (
                            <div
                              key={p.activityId}
                              className={cn(
                                "border px-2.5 py-2 font-mono text-[11px]",
                                isAssignedHere
                                  ? "border-[#3DD6D0]/70 bg-[#3DD6D0]/10"
                                  : "border-surface-600 bg-surface-900",
                              )}
                            >
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-bold text-[#D85A30]">#{p.priority}</span>
                                <span className="text-surface-50">{p.title}</span>
                                <span className="text-surface-300">
                                  {p.startTime}–{p.endTime}
                                </span>
                                <span className={cn(p.isSoldOut ? "text-red-300" : "text-surface-300")}>
                                  {p.spotsLeft}/{p.maxCapacity} disp.
                                </span>
                              </div>

                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                {isAssignedHere ? (
                                  <Tag tone="good" icon={CheckCircle2}>
                                    Asignada
                                  </Tag>
                                ) : p.hasScheduleConflictWithEnrolled ? (
                                  <span className="inline-flex items-center gap-1 text-amber-300">
                                    <AlertTriangle className="h-3 w-3" />
                                    Conflicto de horario con {p.conflictingTitle}
                                  </span>
                                ) : soldOutBlock ? (
                                  <span className="inline-flex items-center gap-1 text-red-300">
                                    <Ban className="h-3 w-3" />
                                    Cupo lleno (0 disp.)
                                  </span>
                                ) : (
                                  <span className="text-[#3DD6D0]">Disponible y compatible</span>
                                )}

                                {canAssign && !isAssignedHere && (
                                  <button
                                    type="button"
                                    disabled={blocked || busy}
                                    onClick={() => void assign(app, p.activityId)}
                                    className="cursor-pointer border border-[#3DD6D0] bg-[#3DD6D0]/15 px-2 py-0.5 font-bold text-[#3DD6D0] hover:bg-[#3DD6D0]/25 disabled:cursor-not-allowed disabled:border-surface-600 disabled:bg-transparent disabled:text-surface-500"
                                  >
                                    Asignar #{p.priority}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* Estado y actividad asignada */}
                    <td className="px-3 py-3.5 sm:px-4">
                      <div className="flex flex-col gap-2">
                        {app.status === "assigned" ? (
                          <div>
                            <Tag tone="good">Asignado a: {app.assignedActivityTitle}</Tag>
                            <div className="mt-1 font-mono text-[10px] text-surface-300">
                              {app.assignedPriorityRank
                                ? `Su prioridad #${app.assignedPriorityRank}`
                                : "Asignación libre (fuera de sus prioridades)"}
                              {app.assignedBy ? ` · por ${app.assignedBy}` : ""}
                            </div>
                          </div>
                        ) : (
                          <Tag tone={app.status === "pending" ? "warn" : "danger"}>
                            {STATUS_LABEL[app.status]}
                          </Tag>
                        )}

                        {canAssign && (
                          <select
                            aria-label="Asignar a otra actividad"
                            disabled={busy}
                            value=""
                            onChange={(e) => {
                              if (e.target.value) void assign(app, e.target.value);
                            }}
                            className="w-full min-w-44 border-2 border-surface-600 bg-surface-900 px-2 py-1.5 font-mono text-[11px] text-surface-100 outline-none focus:border-[#D85A30]"
                          >
                            <option value="">
                              {app.status === "assigned" ? "Reasignar a otra actividad…" : "Asignar a otra actividad…"}
                            </option>
                            {activityOptions
                              .filter((a) => a._id !== app.assignedActivityId)
                              .map((a) => {
                                const clash = app.enrolledWorkshopsAndHackathons.find((e) =>
                                  overlaps(a.startTime, a.endTime, e.startTime, e.endTime),
                                );
                                const full = a.spotsLeft <= 0;
                                return (
                                  <option key={a._id} value={a._id} disabled={!!clash || full}>
                                    {a.title} · {a.startTime}–{a.endTime} · {a.spotsLeft} disp.
                                    {clash ? " (conflicto)" : full ? " (lleno)" : ""}
                                  </option>
                                );
                              })}
                          </select>
                        )}

                        {app.status === "assigned" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void unassign(app)}
                            className="cursor-pointer inline-flex w-fit items-center gap-1 border border-surface-500 bg-surface-900 px-2.5 py-1 font-mono text-[11px] font-bold text-surface-100 hover:border-[#D85A30] hover:text-[#D85A30] disabled:opacity-50"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                            Desasignar (volver a pendiente)
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-3.5 text-right sm:px-4">
                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAnswersFor(app)}
                          className="cursor-pointer inline-flex items-center gap-1 border border-surface-500 bg-surface-900 px-2.5 py-1.5 font-mono text-[11px] font-bold text-surface-100 hover:border-[#3DD6D0] hover:text-[#3DD6D0]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver respuestas
                        </button>
                        {canAssign && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void cancel(app)}
                            className="cursor-pointer inline-flex items-center gap-1 border border-red-500/60 bg-red-500/10 px-2.5 py-1.5 font-mono text-[11px] font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            Cancelar solicitud
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      )}

      {/* Modal: respuestas del asistente */}
      <Modal
        open={!!answersFor}
        onClose={() => setAnswersFor(null)}
        title={answersFor ? `Respuestas de ${answersFor.firstName} ${answersFor.lastName}` : "Respuestas"}
        className="max-w-2xl"
      >
        {answersFor && (
          <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1 font-mono text-xs">
            <div className="flex flex-wrap gap-2">
              <Tag tone={answersFor.logistics.bringsLaptop ? "good" : "neutral"}>
                Laptop: {answersFor.logistics.bringsLaptop ? "sí" : "no"}
              </Tag>
              <Tag tone={answersFor.logistics.acceptedPrerequisites ? "good" : "neutral"}>
                Requisitos: {answersFor.logistics.acceptedPrerequisites ? "aceptados" : "—"}
              </Tag>
            </div>

            <section>
              <h3 className="m-0 mb-2 text-[11px] font-bold uppercase text-[#3DD6D0]">Preguntas generales</h3>
              {Object.keys(answersFor.globalCustomAnswers).length === 0 ? (
                <p className="m-0 text-surface-400">Sin respuestas generales.</p>
              ) : (
                <dl className="m-0 flex flex-col gap-1.5">
                  {Object.entries(answersFor.globalCustomAnswers).map(([k, v]) => (
                    <div key={k} className="border border-surface-600 bg-surface-900 px-3 py-2">
                      <dt className="text-surface-400">{labelFor(null, k)}</dt>
                      <dd className="m-0 mt-0.5 text-surface-50">{renderAnswer(null, k, v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>

            {answersFor.priorities.map((p) => {
              const answers = answersFor.activityCustomAnswers[p.slug] ?? {};
              return (
                <section key={p.slug}>
                  <h3 className="m-0 mb-2 text-[11px] font-bold uppercase text-[#D85A30]">
                    Prioridad #{p.priority}: {p.title}
                  </h3>
                  {Object.keys(answers).length === 0 ? (
                    <p className="m-0 text-surface-400">Esta actividad no tiene preguntas específicas.</p>
                  ) : (
                    <dl className="m-0 flex flex-col gap-1.5">
                      {Object.entries(answers).map(([k, v]) => (
                        <div key={k} className="border border-surface-600 bg-surface-900 px-3 py-2">
                          <dt className="text-surface-400">{labelFor(p.slug, k)}</dt>
                          <dd className="m-0 mt-0.5 text-surface-50">{renderAnswer(p.slug, k, v)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </Modal>

      {dialog}
    </div>
  );
}
