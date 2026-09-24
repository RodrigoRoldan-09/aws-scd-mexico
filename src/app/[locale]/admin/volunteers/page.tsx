"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { formatDate } from "@/lib/utils";
import { useUrlFilters, useDebounce } from "@/hooks/use-url-filters";
import { Settings, Eye, Download, Heart } from "lucide-react";
import {
  Cards, Cargando, Empty, HardLink, PageHead, Pager, RowCard,
  Select, Stat, Stats, TableWrap, Tag, Th, Toolbar,
} from "@/components/admin/ui";
import {
  interestAreasLabelOf,
  sbgLabelOf,
  shirtSizeLabelOf,
  DIETARY,
  INTEREST_AREAS,
  SHIRT_SIZES,
} from "@/data/volunteer-form";
import { volunteerName, type VolunteerRow } from "./_types";
import { ApprovedBadge, VolunteerDetail } from "./_components";
import { Avatar } from "@/components/admin/avatar";
import { useConfirm } from "@/components/admin/confirm";
import { localePath } from "@/lib/utils";

const PAGE_SIZE = 30;

/**
 * Filtros que viven en la URL, con sus valores por defecto.
 *
 * Están en la URL a propósito: el pedido de camisetas y el de alimentación se
 * arman filtrando y compartiendo el enlace ya filtrado con quien cotiza.
 */
const FILTROS = {
  buscar: "",
  estado: "all",
  sbg: "all",
  area: "all",
  talla: "all",
  dieta: "all",
};

function VolunteersAdminPageInner() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { values, set } = useUrlFilters(FILTROS);
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [loading, setLoading] = useState(true);
  // El texto filtra al instante con estado local y se sincroniza a la URL con
  // debounce, como en registros.
  const [search, setSearch] = useState(values.buscar);
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(0);

  useEffect(() => { set("buscar", debouncedSearch); }, [debouncedSearch, set]);

  const [selected, setSelected] = useState<VolunteerRow | null>(null);
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/volunteers")
      .then((r) => r.json())
      .then((data) =>
        setVolunteers(
          (data.submissions || []).map((s: Record<string, unknown>) => ({
            ...s,
            id: (s._id as string) || "",
          })) as VolunteerRow[],
        ),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Los SBG del desplegable salen de lo que la gente respondió, no de una lista
  // escrita a mano: la lista es editable desde la convocatoria, y una copia acá
  // se quedaría desactualizada en silencio.
  const sbgOptions = useMemo(
    () => Array.from(new Set(volunteers.map((v) => v.sbg).filter((s) => s && s !== "none"))).sort(),
    [volunteers],
  );

  const filtered = volunteers.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = !search || [
      v.firstName, v.lastName, v.email, v.documentNumber, v.entityName, v.sbg, v.phone,
    ].filter(Boolean).join(" ").toLowerCase().includes(q) || v.id.toLowerCase().includes(q);
    const matchEstado =
      values.estado === "all" || (values.estado === "approved" ? v.approved : !v.approved);
    const matchSbg =
      values.sbg === "all" ||
      (values.sbg === "none" ? !v.sbg || v.sbg === "none" : v.sbg === values.sbg);
    const matchArea = values.area === "all" || (v.interestAreas ?? []).includes(values.area);
    const matchTalla = values.talla === "all" || v.shirtSize === values.talla;
    const matchDieta =
      values.dieta === "all" ||
      (values.dieta === "special" ? v.dietary && v.dietary !== "none" : v.dietary === values.dieta);
    return matchSearch && matchEstado && matchSbg && matchArea && matchTalla && matchDieta;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const totalApproved = volunteers.filter((v) => v.approved).length;
  const totalPending = volunteers.length - totalApproved;
  const totalSpecialDiet = volunteers.filter((v) => v.dietary && v.dietary !== "none").length;

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Eliminar postulación",
      message: "Se elimina la postulación de voluntario y su pasaporte, si lo tenía. No se puede deshacer.",
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/volunteers/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast(data.error || "Error al eliminar", "error"); return; }
      setVolunteers((prev) => prev.filter((v) => v.id !== id));
      setSelected(null);
      toast("Voluntario eliminado", "success");
    } catch {
      toast("Error al eliminar", "error");
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Un movimiento sacó a esta persona de la lista.
   *
   * El diálogo ya hizo el trabajo y ya preguntó lo que faltaba —acá, si asiste
   * presencial o en línea—; esto sólo quita la fila.
   */
  const handleMoved = (id: string) => {
    setVolunteers((prev) => prev.filter((v) => v.id !== id));
    setSelected(null);
  };

  const handleApprove = async (id: string) => {
    setApproving(true);
    try {
      const res = await fetch(`/api/volunteers/${id}/approve`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Error al aprobar", "error");
        return;
      }
      const approvedAt = new Date().toISOString();
      setVolunteers((prev) => prev.map((v) => (v.id === id ? { ...v, approved: true, approvedAt } : v)));
      setSelected((prev) => (prev?.id === id ? { ...prev, approved: true, approvedAt } : prev));
      toast("Aprobación enviada", "success");
    } catch {
      toast("Error al aprobar", "error");
    } finally {
      setApproving(false);
    }
  };

  const sinFiltrar = values.estado === "all" && values.dieta === "all";

  /**
   * Poner o quitar un filtro.
   *
   * Volver a tocar la cifra que ya está puesta lo quita.
   */
  const filtrar = (clave: "estado" | "dieta", valor: string) => {
    set(clave, values[clave] === valor ? "all" : valor);
    setPage(0);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead
        title="voluntarios"
        actions={
          <>
            <HardLink icon={Download} href="/api/volunteers/export" download="voluntarios-aws-scd.csv">
              Exportar CSV
            </HardLink>
            <HardLink icon={Settings} href={localePath(locale, "/admin/volunteers/convocatoria")}>
              Convocatoria
            </HardLink>
          </>
        }
      />

      {/* Cifras. Cada una es también un filtro: se mira un número y lo que se
          quiere es ver quiénes son. */}
      <Stats>
        <Stat
          value={volunteers.length}
          label="postulaciones"
          active={sinFiltrar}
          onClick={() => { set("estado", "all"); set("dieta", "all"); setPage(0); }}
        />
        <Stat
          value={totalApproved}
          label="aprobados"
          tone="good"
          active={values.estado === "approved"}
          onClick={() => filtrar("estado", "approved")}
        />
        <Stat
          value={totalPending}
          label="pendientes"
          tone="accent"
          active={values.estado === "pending"}
          onClick={() => filtrar("estado", "pending")}
        />
        <Stat
          value={totalSpecialDiet}
          label="dieta especial"
          tone="info"
          active={values.dieta === "special"}
          onClick={() => filtrar("dieta", "special")}
        />
      </Stats>

      <Toolbar>
        <SearchInput
          placeholder="Nombre, correo, documento, SBG…"
          defaultValue={values.buscar}
          onSearch={(q) => { setSearch(q); setPage(0); }}
          className="col-span-2 sm:min-w-[240px] sm:flex-1"
        />
        <Select
          label="Estado"
          value={values.estado}
          onChange={(v) => { set("estado", v); setPage(0); }}
          options={[["all", "Estado: todos"], ["approved", "Aprobados"], ["pending", "Pendientes"]]}
        />
        <Select
          label="Área"
          value={values.area}
          onChange={(v) => { set("area", v); setPage(0); }}
          options={[["all", "Área: todas"], ...INTEREST_AREAS.map((a) => [a.value, a.label] as const)]}
        />
        <Select
          label="Talla"
          value={values.talla}
          onChange={(v) => { set("talla", v); setPage(0); }}
          options={[["all", "Talla: todas"], ...SHIRT_SIZES.map((t) => [t.value, t.label] as const)]}
        />
        <Select
          label="Alimentación"
          value={values.dieta}
          onChange={(v) => { set("dieta", v); setPage(0); }}
          options={[
            ["all", "Alimentación: todas"],
            ["special", "Con restricción"],
            ...DIETARY.map((d) => [d.value, d.label] as const),
          ]}
        />
        {sbgOptions.length > 0 && (
          <Select
            label="SBG"
            wide
            value={values.sbg}
            onChange={(v) => { set("sbg", v); setPage(0); }}
            options={[
              ["all", "SBG: todos"],
              ["none", "Sin SBG"],
              ...sbgOptions.map((sb) => [sb, sb] as const),
            ]}
            className="sm:max-w-[220px]"
          />
        )}
      </Toolbar>

      {loading ? (
        <Cargando />
      ) : paginated.length === 0 ? (
        <Empty icon={Heart}>
          {search || !sinFiltrar ? "Nadie con esos filtros." : "Todavía no hay postulaciones."}
        </Empty>
      ) : (
        <>
          {/* En el teléfono cada postulación es una tarjeta. */}
          <Cards>
            {paginated.map((v) => (
              <RowCard
                key={v.id}
                onClick={() => setSelected(v)}
                avatar={<Avatar seed={v.email} name={volunteerName(v)} email={v.email} size={38} />}
                title={volunteerName(v)}
                subtitle={v.email}
                meta={sbgLabelOf(v.sbg)}
                tags={
                  <>
                    <ApprovedBadge approved={v.approved} />
                    {v.shirtSize && <Tag>Talla {shirtSizeLabelOf(v.shirtSize)}</Tag>}
                    {v.dietary && v.dietary !== "none" && <Tag tone="info">Dieta especial</Tag>}
                    <Tag>{formatDate(v.submittedAt)}</Tag>
                  </>
                }
              />
            ))}
          </Cards>

          <TableWrap className="hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-surface-600">
                  <Th>Nombre</Th>
                  <Th>Correo</Th>
                  <Th className="hidden lg:table-cell">SBG</Th>
                  <Th className="hidden xl:table-cell">Áreas</Th>
                  <Th align="center" className="hidden md:table-cell">Talla</Th>
                  <Th align="center">Postuló</Th>
                  <Th align="center">Estado</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {paginated.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelected(v)}
                    className="cursor-pointer border-b border-surface-600/60 transition-colors hover:bg-surface-700/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar seed={v.email} name={volunteerName(v)} email={v.email} size={34} />
                        <span className="block max-w-[200px] truncate font-mono text-sm text-surface-50">
                          {volunteerName(v)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block max-w-[220px] truncate font-mono text-xs text-surface-300">
                        {v.email || "—"}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="block max-w-[160px] truncate font-mono text-xs text-surface-300">
                        {sbgLabelOf(v.sbg)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 xl:table-cell">
                      <span className="block max-w-[200px] truncate font-mono text-xs text-surface-300">
                        {interestAreasLabelOf(v.interestAreas ?? []) || "—"}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-center md:table-cell">
                      <span className="font-mono text-xs font-bold text-surface-200">
                        {shirtSizeLabelOf(v.shirtSize) || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="whitespace-nowrap font-mono text-xs text-surface-300">
                        {formatDate(v.submittedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center"><ApprovedBadge approved={v.approved} /></td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelected(v); }}
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
        page={page}
        totalPages={totalPages}
        onPage={setPage}
        from={page * PAGE_SIZE + 1}
        to={Math.min((page + 1) * PAGE_SIZE, filtered.length)}
        total={filtered.length}
      />

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle de la postulación" size="xl">
        {selected && (
          <VolunteerDetail
            volunteer={selected}
            onApprove={() => handleApprove(selected.id)}
            approving={approving}
            isAdmin={isAdmin}
            onDelete={() => handleDelete(selected.id)}
            deleting={deleting}
            onMoved={handleMoved}
          />
        )}
      </Modal>

      {/* Confirmaciones propias, no el popup del navegador. */}
      {dialog}
    </div>
  );
}

// useSearchParams requiere un <Suspense> alrededor
export default function VolunteersAdminPage() {
  return (
    <Suspense>
      <VolunteersAdminPageInner />
    </Suspense>
  );
}
