"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { Avatar } from "@/components/admin/avatar";
import { Cards, HardButton, PageHead, Pager, Tag, Toolbar } from "@/components/admin/ui";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ACTIONS_BY_GROUP,
  GROUP_LABELS,
  LOG_ACTIONS,
  LOG_ROLES,
  groupOfAction,
  labelOfAction,
  type LogGroup,
} from "@/lib/log-actions";

/**
 * Registro de actividad.
 *
 * Las etiquetas, el desplegable de filtros y la lista que valida el API vienen
 * todas de `@/lib/log-actions`. Estaban escritas por separado y se habían
 * desincronizado: el filtro de login apuntaba a una acción que el código ya no
 * escribe, y lo que se añadió después salía con el código en crudo.
 */

const FILTROS = { rol: "", accion: "" };

interface LogRow {
  _id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  target: string;
  targetId: string | null;
  details: string | null;
  createdAt: string;
}

/** Cada familia de acciones tiene su color, para leer la columna de un vistazo. */
const GROUP_TONE: Record<LogGroup, "accent" | "good" | "warn" | "danger" | "neutral"> = {
  personas: "accent",
  evento: "good",
  contenido: "neutral",
  sistema: "neutral",
  peligro: "danger",
};

const ROLE_TONE: Record<string, "accent" | "good" | "warn" | "neutral"> = {
  admin: "accent",
  organizer: "good",
  volunteer: "neutral",
  badges: "warn",
  attendee: "neutral",
};

const selectCls =
  "border-2 border-surface-500 bg-surface-800 px-3 py-2.5 font-mono text-xs text-surface-50 " +
  "outline-none transition-colors focus:border-aws-orange";

function LogsAdminPageInner() {
  const { values, set } = useUrlFilters(FILTROS);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);

  // Igual que en el tablero: `loading` arranca en true y los cambios de página
  // o de filtro lo encienden desde su propio handler. Así el efecto no tiene
  // que llamar a setState de forma síncrona.
  const fetchLogs = useCallback((signal: AbortSignal) => {
    const params = new URLSearchParams();
    if (values.rol) params.set("role", values.rol);
    if (values.accion) params.set("action", values.accion);
    params.set("page", String(page));

    return fetch(`/api/logs?${params}`, { signal })
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => {
        // Petición abortada o red caída: se conserva lo último que se mostró.
      })
      .finally(() => {
        if (!signal.aborted) setLoading(false);
      });
  }, [values.rol, values.accion, page]);

  useEffect(() => {
    // Aborta la petición anterior al cambiar de página o filtro, y al
    // desmontar: antes una respuesta lenta podía pisar a una más reciente.
    const ac = new AbortController();
    void fetchLogs(ac.signal);
    return () => ac.abort();
  }, [fetchLogs]);

  const cambiarFiltro = (key: "rol" | "accion", value: string) => {
    setLoading(true);
    setPage(0);
    set(key, value);
  };

  const filtrando = !!values.rol || !!values.accion;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead
        title="actividad"
        actions={
          filtrando ? (
            <HardButton
              tone="ghost"
              onClick={() => { setLoading(true); setPage(0); set("rol", ""); set("accion", ""); }}
            >
              Quitar filtros
            </HardButton>
          ) : undefined
        }
      />

      <Toolbar>
        <select
          value={values.rol}
          aria-label="Rol"
          onChange={(e) => cambiarFiltro("rol", e.target.value)}
          className={selectCls}
        >
          <option value="">Rol: todos</option>
          {Object.entries(LOG_ROLES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Agrupado por familia. */}
        <select
          value={values.accion}
          aria-label="Acción"
          onChange={(e) => cambiarFiltro("accion", e.target.value)}
          className={cn(selectCls, "sm:max-w-[280px]")}
        >
          <option value="">Acción: todas</option>
          {ACTIONS_BY_GROUP.map(({ group, actions }) => (
            <optgroup key={group} label={GROUP_LABELS[group]}>
              {actions.map((a) => (
                <option key={a} value={a}>{LOG_ACTIONS[a].label}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <span className="col-span-2 font-mono text-xs text-surface-300 sm:col-span-1">
          {total} {total === 1 ? "acción registrada" : "acciones registradas"}
        </span>
      </Toolbar>

      {/* En el teléfono cada acción es una tarjeta. */}
      {!loading && logs.length > 0 && (
        <Cards>
          {logs.map((log) => (
            <div key={log._id} className="border-2 border-surface-600 bg-surface-800 p-3">
              <div className="flex min-w-0 items-start gap-3">
                <Avatar seed={log.userId} name={log.userName} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate font-mono text-sm font-bold text-surface-50">
                    {log.userName || "—"}
                  </p>
                  <p className="m-0 mt-0.5 font-mono text-[11px] text-surface-300">
                    {formatDateTime(log.createdAt)}
                  </p>
                </div>
                <Tag tone={ROLE_TONE[log.userRole] ?? "neutral"}>
                  {LOG_ROLES[log.userRole] ?? log.userRole}
                </Tag>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <Tag tone={GROUP_TONE[groupOfAction(log.action)]}>{labelOfAction(log.action)}</Tag>
                {log.target && <Tag>{log.target}</Tag>}
              </div>
              {log.details && (
                <p className="m-0 mt-2 break-words font-mono text-[11px] leading-relaxed text-surface-300">
                  {log.details}
                </p>
              )}
            </div>
          ))}
        </Cards>
      )}

      {/* Tabla */}
      <div className="hidden sm:block -mx-4 overflow-x-auto border-y-2 border-surface-600 bg-surface-800 sm:mx-0 sm:border-2">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-surface-600">
              {["Quién", "Acción", "Sobre", "Detalle", "Cuándo"].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest text-surface-200",
                    i === 3 && "hidden md:table-cell",
                    i === 4 && "hidden sm:table-cell",
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-aws-orange border-t-transparent" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center font-mono text-sm text-surface-300">
                  <ScrollText className="mx-auto mb-3 h-6 w-6 text-surface-400" />
                  {filtrando ? "Nada con esos filtros." : "Todavía no hay actividad."}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-b border-surface-600/60 transition-colors hover:bg-surface-700/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* La carita se siembra con el id de la cuenta: la misma
                          persona sale siempre igual en toda la tabla. */}
                      <Avatar seed={log.userId} name={log.userName} size={30} />
                      <div className="min-w-0">
                        <span className="block max-w-[150px] truncate font-mono text-sm text-surface-50">
                          {log.userName || "—"}
                        </span>
                        <span className="mt-0.5 block">
                          <Tag tone={ROLE_TONE[log.userRole] ?? "neutral"}>
                            {LOG_ROLES[log.userRole] ?? log.userRole}
                          </Tag>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Tag tone={GROUP_TONE[groupOfAction(log.action)]}>
                      {labelOfAction(log.action)}
                    </Tag>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block max-w-[200px] truncate font-mono text-sm text-surface-100">
                      {log.target || "—"}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="block max-w-[280px] truncate font-mono text-xs text-surface-300" title={log.details ?? ""}>
                      {log.details || "—"}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="whitespace-nowrap font-mono text-xs text-surface-300">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pager
        page={page}
        totalPages={totalPages}
        onPage={(p) => { setLoading(true); setPage(p); }}
        from={page * 30 + 1}
        to={Math.min((page + 1) * 30, total)}
        total={total}
      />
    </div>
  );
}

// useSearchParams requiere un <Suspense> alrededor
export default function LogsAdminPage() {
  return (
    <Suspense>
      <LogsAdminPageInner />
    </Suspense>
  );
}
