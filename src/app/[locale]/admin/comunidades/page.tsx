"use client";

import { Suspense, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { formatDate } from "@/lib/utils";
import { useUrlFilters, useDebounce } from "@/hooks/use-url-filters";
import { Download, Eye, Network } from "lucide-react";
import {
  Aviso, Cards, Cargando, Empty, HardButton, PageHead, Pager, RowCard,
  Select, Stat, Stats, TableWrap, Tag, Th, Toolbar,
} from "@/components/admin/ui";
import { communitiesToCsv, shortUrl, type CommunityRow } from "./_types";
import { CommunityDetail, SocialLink, StatusBadge } from "./_components";

const PAGE_SIZE = 30;

/** Filtros que viven en la URL, con sus valores por defecto. */
const FILTROS = {
  buscar: "",
  estado: "all",
};

function ComunidadesAdminPageInner() {
  const { values, set } = useUrlFilters(FILTROS);
  const [communities, setCommunities] = useState<CommunityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // El texto filtra al instante con estado local y se sincroniza a la URL con
  // debounce, como en voluntarios.
  const [search, setSearch] = useState(values.buscar);
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(0);

  useEffect(() => { set("buscar", debouncedSearch); }, [debouncedSearch, set]);

  const [selected, setSelected] = useState<CommunityRow | null>(null);

  useEffect(() => {
    fetch("/api/communities")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data) => setCommunities((data.submissions || []) as CommunityRow[]))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = communities.filter((c) => {
    const matchSearch = !q ||
      [c.communityName, c.contactEmail, c.contactPhone].filter(Boolean).join(" ").toLowerCase().includes(q);
    const matchEstado = values.estado === "all" || c.status === values.estado;
    return matchSearch && matchEstado;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Un filtro puede dejar menos páginas de las que había.
  const current = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const totalPending = communities.filter((c) => c.status === "pending").length;
  const totalApproved = communities.filter((c) => c.status === "approved").length;
  const totalRejected = communities.filter((c) => c.status === "rejected").length;

  /** Poner o quitar el filtro de estado: volver a tocar la cifra lo quita. */
  const filtrar = (valor: string) => {
    set("estado", values.estado === valor ? "all" : valor);
    setPage(0);
  };

  /** Descarga lo que está en pantalla con los filtros puestos, no sólo la página. */
  const exportCsv = () => {
    const blob = new Blob([communitiesToCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "comunidades-aws-scd.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead
        title="Comunidades"
        actions={
          <HardButton tone="ghost" icon={Download} onClick={exportCsv} disabled={filtered.length === 0}>
            Exportar CSV
          </HardButton>
        }
      />

      {/* Cifras. Cada una es también un filtro. */}
      <Stats>
        <Stat
          value={communities.length}
          label="postulaciones"
          active={values.estado === "all"}
          onClick={() => { set("estado", "all"); setPage(0); }}
        />
        <Stat
          value={totalPending}
          label="pendientes"
          tone="accent"
          active={values.estado === "pending"}
          onClick={() => filtrar("pending")}
        />
        <Stat
          value={totalApproved}
          label="aprobadas"
          tone="good"
          active={values.estado === "approved"}
          onClick={() => filtrar("approved")}
        />
        <Stat
          value={totalRejected}
          label="rechazadas"
          tone="danger"
          active={values.estado === "rejected"}
          onClick={() => filtrar("rejected")}
        />
      </Stats>

      <Toolbar>
        <SearchInput
          placeholder="Comunidad, correo, teléfono…"
          defaultValue={values.buscar}
          onSearch={(v) => { setSearch(v); setPage(0); }}
          className="col-span-2 sm:min-w-[240px] sm:flex-1"
        />
        <Select
          label="Estado"
          wide
          value={values.estado}
          onChange={(v) => { set("estado", v); setPage(0); }}
          options={[
            ["all", "Estado: todos"],
            ["pending", "Pendientes"],
            ["approved", "Aprobadas"],
            ["rejected", "Rechazadas"],
          ]}
        />
      </Toolbar>

      {failed && (
        <Aviso tone="danger">No se pudieron cargar las comunidades. Recarga la página para reintentar.</Aviso>
      )}

      {loading ? (
        <Cargando />
      ) : failed ? null : paginated.length === 0 ? (
        <Empty icon={Network}>
          {q || values.estado !== "all" ? "Ninguna comunidad con esos filtros." : "Todavía no hay postulaciones."}
        </Empty>
      ) : (
        <>
          {/* En el teléfono cada postulación es una tarjeta. */}
          <Cards>
            {paginated.map((c) => (
              <RowCard
                key={c._id}
                onClick={() => setSelected(c)}
                title={c.communityName}
                subtitle={c.contactEmail}
                meta={[c.contactPhone, shortUrl(c.socialUrl)].filter(Boolean).join(" · ")}
                tags={
                  <>
                    <StatusBadge status={c.status} />
                    <Tag>{formatDate(c.submittedAt)}</Tag>
                  </>
                }
              />
            ))}
          </Cards>

          <TableWrap className="hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-surface-600">
                  <Th>Comunidad</Th>
                  <Th className="hidden lg:table-cell">Redes</Th>
                  <Th>Correo</Th>
                  <Th className="hidden md:table-cell">Teléfono</Th>
                  <Th align="center">Estado</Th>
                  <Th align="center">Postuló</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => setSelected(c)}
                    className="cursor-pointer border-b border-surface-600/60 transition-colors hover:bg-surface-700/40"
                  >
                    <td className="px-4 py-3">
                      <span className="block max-w-[220px] truncate font-mono text-sm text-surface-50">
                        {c.communityName}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <SocialLink
                        url={c.socialUrl}
                        className="block max-w-[200px] truncate font-mono text-xs text-surface-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="block max-w-[220px] truncate font-mono text-xs text-surface-300">
                        {c.contactEmail || "—"}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="whitespace-nowrap font-mono text-xs text-surface-300">
                        {c.contactPhone || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-center">
                      <span className="whitespace-nowrap font-mono text-xs text-surface-300">
                        {formatDate(c.submittedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                        aria-label="Ver detalle"
                        className="p-1.5 text-surface-400 transition-colors hover:text-aws-orange"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </>
      )}

      <Pager
        page={current}
        totalPages={totalPages}
        onPage={setPage}
        from={current * PAGE_SIZE + 1}
        to={Math.min((current + 1) * PAGE_SIZE, filtered.length)}
        total={filtered.length}
      />

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle de la comunidad" size="lg">
        {selected && <CommunityDetail community={selected} />}
      </Modal>
    </div>
  );
}

// useSearchParams requiere un <Suspense> alrededor
export default function ComunidadesAdminPage() {
  return (
    <Suspense>
      <ComunidadesAdminPageInner />
    </Suspense>
  );
}
