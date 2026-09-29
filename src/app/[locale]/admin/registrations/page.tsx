"use client";

import { Suspense, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";
import { useUrlFilters, useDebounce } from "@/hooks/use-url-filters";
import { Settings, Eye, Plus, Download, Users, Mail } from "lucide-react";
import {
  Aviso, Cards, Cargando, Empty, HardButton, HardLink, PageHead, Pager, RowCard,
  Select, Stat, Stats, TableWrap, Tag, Th, Toolbar,
} from "@/components/admin/ui";
import { rowName, type RegistrationRow } from "./_types";
import {
  EmailBadge, CheckInBadge, ConfirmedBadge, ManualRegistrationForm,
} from "./_components";
import { RegistrationDetail } from "./_detail";
import { Avatar } from "@/components/admin/avatar";
import { useConfirm } from "@/components/admin/confirm";
import { localePath } from "@/lib/utils";

const PAGE_SIZE = 30;

// Filtros que viven en la URL (con sus valores por defecto). Están en la URL a
// propósito: el día del evento se comparte un enlace ya filtrado.
const FILTROS = {
  buscar: "",
  confirmado: "all",
  checkin: "all",
  correo: "all",
  modalidad: "all",
  entidad: "all",
};

function RegistrationsAdminPageInner() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const { user } = useAuth();
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();

  const { values, set } = useUrlFilters(FILTROS);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  // El texto se filtra al instante con estado local y se sincroniza a la URL con debounce
  const [search, setSearch] = useState(values.buscar);
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(0);

  useEffect(() => { set("buscar", debouncedSearch); }, [debouncedSearch, set]);
  const [selected, setSelected] = useState<RegistrationRow | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bulkResending, setBulkResending] = useState(false);

  useEffect(() => {
    fetch("/api/registrations")
      .then((r) => r.json())
      .then((data) =>
        setRegistrations(
          (data.registrations || []).map((r: Record<string, unknown>) => ({
            ...r,
            id: (r._id as string) || "",
          })) as RegistrationRow[],
        ),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // La entidad sale del catálogo del formulario estático.
  const entidadOptions = Array.from(
    new Set(registrations.map((r) => r.entityName).filter(Boolean) as string[]),
  ).sort();

  const filtered = registrations.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !search || [r.firstName, r.lastName, r.email, r.documentNumber, r.entityName, r.qrCode].filter(Boolean).join(" ").toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    const matchCheckIn = values.checkin === "all" || (values.checkin === "yes" ? r.checkedIn : !r.checkedIn);
    const matchEmail = values.correo === "all" || r.emailStatus === values.correo;
    const esVirtual = r.attendance === "online";
    const matchModalidad =
      values.modalidad === "all" || (values.modalidad === "virtual" ? esVirtual : !esVirtual);
    const matchEntidad = values.entidad === "all" || r.entityName === values.entidad;
    const isConfirmed = !!r.confirmation?.confirmed;
    const matchConfirmed = values.confirmado === "all" || (values.confirmado === "yes" ? isConfirmed : !isConfirmed);
    return matchSearch && matchCheckIn && matchEmail && matchModalidad && matchEntidad && matchConfirmed;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const totalCheckedIn = registrations.filter((r) => r.checkedIn).length;
  const emailsFailed = registrations.filter((r) => r.emailStatus === "failed").length;
  const totalVirtual = registrations.filter((r) => r.attendance === "online").length;
  const totalPresencial = registrations.length - totalVirtual;

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Eliminar registro",
      message: "Se elimina el registro y su pasaporte, con los sellos, comidas y asistencia a sesiones. No se puede deshacer.",
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/registrations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Error al eliminar", "error");
        return;
      }
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      setSelected(null);
      toast("Registro eliminado", "success");
    } catch {
      toast("Error al eliminar", "error");
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Un movimiento sacó a esta persona de la lista.
   *
   * El diálogo ya hizo el trabajo —y ya pidió lo que faltaba—; acá sólo se
   * quita la fila.
   */
  const handleMoved = (id: string) => {
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
    setSelected(null);
  };

  const handleManualCreated = (reg: RegistrationRow) => {
    setRegistrations((prev) => [reg, ...prev]);
    setShowManual(false);
    toast("Registro creado", "success");
  };

  /**
   * Poner o quitar un filtro.
   *
   * Volver a tocar la cifra que ya está puesta lo quita.
   */
  const filtrar = (clave: "modalidad" | "checkin" | "confirmado", valor: string) => {
    set(clave, values[clave] === valor ? "all" : valor);
    setPage(0);
  };

  const handleBulkResend = async () => {
    const ok = await confirm({
      title: "Reenviar confirmación a todos",
      message: `Se enviará el correo oficial de confirmación (con el diseño actualizado de México y su pase PDF con QR) a los ${registrations.length} asistentes registrados. ¿Deseas continuar?`,
      confirmLabel: "Sí, reenviar a todos",
    });
    if (!ok) return;

    setBulkResending(true);
    toast("Iniciando reenvío de correos...", "info");
    try {
      const res = await fetch("/api/admin/registrations/bulk-resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Error en el reenvío masivo", "error");
        return;
      }
      toast(`Reenvío completado: ${data.sent} enviados con éxito`, "success");
      setRegistrations((prev) =>
        prev.map((r) => {
          const match = data.results?.find((x: { email: string }) => x.email === r.email);
          if (!match) return r;
          return {
            ...r,
            emailStatus: match.status === "sent" ? "sent" : "failed",
            emailError: match.error || null,
          };
        }),
      );
    } catch {
      toast("Error al procesar el reenvío masivo", "error");
    } finally {
      setBulkResending(false);
    }
  };

  const puedeCrear = user?.role === "admin" || user?.role === "organizer" || user?.role === "volunteer";
  const puedeExportar = user?.role === "admin" || user?.role === "organizer";
  const sinFiltrar = values.modalidad === "all" && values.checkin === "all" && values.confirmado === "all";

  /** Las etiquetas de una fila: las mismas en la tabla y en la tarjeta. */
  const etiquetas = (r: RegistrationRow) => (
    <>
      <Tag tone={r.attendance === "online" ? "info" : "accent"}>
        {r.attendance === "online" ? "Online" : "Presencial"}
      </Tag>
      <ConfirmedBadge confirmation={r.confirmation} />
      <CheckInBadge checkedIn={r.checkedIn} checkedInAt={r.checkedInAt} />
      <EmailBadge status={r.emailStatus} error={r.emailError} />
    </>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead
        title="asistentes"
        actions={
          <>
            {puedeCrear && (
              <HardButton icon={Plus} onClick={() => setShowManual(true)}>
                Nuevo registro
              </HardButton>
            )}
            {puedeExportar && (
              <HardButton
                icon={Mail}
                tone="ghost"
                disabled={bulkResending}
                onClick={handleBulkResend}
              >
                {bulkResending ? "Reenviando correos..." : "Reenviar a todos"}
              </HardButton>
            )}
            {puedeExportar && (
              <HardLink
                icon={Download}
                href="/api/registrations/export"
                download="registros-aws-scd.csv"
              >
                Exportar CSV
              </HardLink>
            )}
            <HardLink icon={Settings} href={localePath(locale, "/admin/registrations/recepcion")}>
              Recepción
            </HardLink>
          </>
        }
      />

      {/* Cifras.
          Cada una es también un filtro: el día del evento lo que se hace es
          mirar un número y querer ver quiénes son. */}
      <Stats>
        <Stat
          value={registrations.length}
          label="registrados"
          active={sinFiltrar}
          onClick={() => { set("modalidad", "all"); set("checkin", "all"); set("confirmado", "all"); setPage(0); }}
        />
        <Stat
          value={totalPresencial}
          label="presencial"
          tone="accent"
          active={values.modalidad === "presencial"}
          onClick={() => filtrar("modalidad", "presencial")}
        />
        <Stat
          value={totalVirtual}
          label="online"
          tone="info"
          active={values.modalidad === "virtual"}
          onClick={() => filtrar("modalidad", "virtual")}
        />
        <Stat
          value={totalCheckedIn}
          label="con check-in"
          tone="good"
          active={values.checkin === "yes"}
          onClick={() => filtrar("checkin", "yes")}
        />
      </Stats>

      {emailsFailed > 0 && (
        <Aviso tone="danger">
          {emailsFailed} {emailsFailed === 1 ? "correo falló" : "correos fallaron"} al enviarse.
          <button
            type="button"
            onClick={() => { set("correo", "failed"); setPage(0); }}
            className="ml-2 underline underline-offset-2"
          >
            Ver cuáles
          </button>
        </Aviso>
      )}

      <Toolbar>
        <SearchInput
          placeholder="Nombre, correo, documento, QR…"
          defaultValue={values.buscar}
          onSearch={(q) => { setSearch(q); setPage(0); }}
          className="col-span-2 sm:min-w-[240px] sm:flex-1"
        />
        <Select
          label="Modalidad"
          value={values.modalidad}
          onChange={(v) => { set("modalidad", v); setPage(0); }}
          options={[["all", "Modalidad: todas"], ["presencial", "Presencial"], ["virtual", "Online"]]}
        />
        <Select
          label="Confirmación"
          value={values.confirmado}
          onChange={(v) => { set("confirmado", v); setPage(0); }}
          options={[["all", "Confirmación: todos"], ["yes", "Confirmados"], ["no", "Sin confirmar"]]}
        />
        <Select
          label="Check-in"
          value={values.checkin}
          onChange={(v) => { set("checkin", v); setPage(0); }}
          options={[["all", "Check-in: todos"], ["yes", "Con check-in"], ["no", "Sin check-in"]]}
        />
        <Select
          label="Correo"
          value={values.correo}
          onChange={(v) => { set("correo", v); setPage(0); }}
          options={[["all", "Correo: todos"], ["sent", "Enviado"], ["failed", "Fallido"], ["pending", "Pendiente"], ["skipped", "Sin correo"]]}
        />
        {entidadOptions.length > 0 && (
          <Select
            label="Entidad"
            wide
            value={values.entidad}
            onChange={(v) => { set("entidad", v); setPage(0); }}
            options={[["all", "Entidad: todas"], ...entidadOptions.map((e) => [e, e] as const)]}
            className="sm:max-w-[220px]"
          />
        )}
      </Toolbar>

      {loading ? (
        <Cargando />
      ) : paginated.length === 0 ? (
        <Empty icon={Users}>
          {search || !sinFiltrar ? "Nadie con esos filtros." : "Todavía no hay registros."}
        </Empty>
      ) : (
        <>
          {/* En el teléfono cada persona es una tarjeta que se toca entera. */}
          <Cards>
            {paginated.map((r) => (
              <RowCard
                key={r.id}
                onClick={() => setSelected(r)}
                avatar={<Avatar seed={r.qrCode} name={rowName(r)} email={r.email} size={38} />}
                title={rowName(r)}
                subtitle={r.email}
                meta={r.entityName}
                tags={etiquetas(r)}
              />
            ))}
          </Cards>

          <TableWrap className="hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-surface-600">
                  <Th>Nombre</Th>
                  <Th>Correo</Th>
                  <Th>Modalidad</Th>
                  <Th className="hidden lg:table-cell">Entidad</Th>
                  <Th align="center">Confirmado</Th>
                  <Th align="center">Check-in</Th>
                  <Th align="center" className="hidden md:table-cell">Correo</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="cursor-pointer border-b border-surface-600/60 transition-colors hover:bg-surface-700/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* La misma carita que la persona ve en su pasaporte: la
                            semilla es el `qrCode`, que es su `shortId`. */}
                        <Avatar seed={r.qrCode} name={rowName(r)} email={r.email} size={34} />
                        <span className="block max-w-[200px] truncate font-mono text-sm text-surface-50">
                          {rowName(r)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block max-w-[220px] truncate font-mono text-xs text-surface-300">
                        {r.email || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Tag tone={r.attendance === "online" ? "info" : "accent"}>
                        {r.attendance === "online" ? "Online" : "Presencial"}
                      </Tag>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="block max-w-[180px] truncate font-mono text-xs text-surface-300">
                        {r.entityName || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center"><ConfirmedBadge confirmation={r.confirmation} /></td>
                    <td className="px-4 py-3 text-center"><CheckInBadge checkedIn={r.checkedIn} checkedInAt={r.checkedInAt} /></td>
                    <td className="hidden px-4 py-3 text-center md:table-cell"><EmailBadge status={r.emailStatus} error={r.emailError} /></td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelected(r); }}
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

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle del registro" size="xl">
        {selected && (
          <RegistrationDetail
            reg={selected}
            isAdmin={user?.role === "admin"}
            onDelete={handleDelete}
            deleting={deleting}
            onMoved={handleMoved}
            onEmailResent={(id, status, sentAt) => {
              setRegistrations((prev) => prev.map((r) =>
                r.id === id ? { ...r, emailStatus: status as RegistrationRow["emailStatus"], emailSentAt: sentAt, emailError: null } : r
              ));
              setSelected((prev) => prev?.id === id ? { ...prev, emailStatus: status as RegistrationRow["emailStatus"], emailSentAt: sentAt, emailError: null } : prev);
            }}
          />
        )}
      </Modal>

      <Modal open={showManual} onClose={() => setShowManual(false)} title="Nuevo registro manual" size="xl">
        <ManualRegistrationForm onCreated={handleManualCreated} onCancel={() => setShowManual(false)} />
      </Modal>

      {/* Confirmaciones propias, no el popup del navegador. */}
      {dialog}

    </div>
  );
}

// useSearchParams requiere un <Suspense> alrededor
export default function RegistrationsAdminPage() {
  return (
    <Suspense>
      <RegistrationsAdminPageInner />
    </Suspense>
  );
}

