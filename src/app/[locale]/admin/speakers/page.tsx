"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Download, Eye, EyeOff, MapPin, Mic2, Plus, SlidersHorizontal, Wifi } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useUrlFilters, useDebounce } from "@/hooks/use-url-filters";
import { Avatar } from "@/components/admin/avatar";
import { localePath } from "@/lib/utils";
import {
  Cards, Cargando, Empty, HardButton, HardLink, PageHead, RowCard,
  Stat, Stats, TableWrap, Tag, Th, Toolbar,
} from "@/components/admin/ui";
import {
  STATUS, speakerName, trackLabel,
  type SpeakerRow, type SpeakerStatus,
} from "./_shared";

/**
 * Speakers: una sola lista para buscar a alguien y abrir su ficha. La
 * configuración (PDF, orden en el sitio, convocatoria) vive en `ajustes`.
 */

/** Los grupos por los que se filtra, que son las etapas por las que pasa alguien. */
const GRUPOS: Record<string, SpeakerStatus[]> = {
  revisar: ["submitted", "reviewing"],
  aceptados: ["accepted", "scheduled"],
  espera: ["waitlisted"],
  rechazados: ["rejected"],
};

const FILTROS = { buscar: "", etapa: "all", publicos: "", modalidad: "all" };

function SpeakersPageInner() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const { toast } = useToast();
  const { values, set } = useUrlFilters(FILTROS);

  const [rows, setRows] = useState<SpeakerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(values.buscar);
  const debounced = useDebounce(search, 300);
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { set("buscar", debounced); }, [debounced, set]);

  useEffect(() => {
    fetch("/api/speakers")
      .then((r) => r.json())
      .then((d) => setRows(d.submissions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((s) => {
      const etapa =
        values.etapa === "all" || (GRUPOS[values.etapa] ?? []).includes(s.status);
      const publicos = !values.publicos || s.isPublic;
      const modalidad =
        values.modalidad === "all" ||
        (values.modalidad === "online" ? s.sessionType === "online" : s.sessionType !== "online");
      const texto =
        !q ||
        [speakerName(s), s.email, s.talkTitle, s.company, s.countryCity, s.role]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      return etapa && publicos && modalidad && texto;
    });
  }, [rows, search, values.etapa, values.publicos, values.modalidad]);

  const cuenta = (etapa: string) =>
    etapa === "all" ? rows.length : rows.filter((s) => GRUPOS[etapa].includes(s.status)).length;

  const publicos = rows.filter((s) => s.isPublic).length;
  const online = rows.filter((s) => s.sessionType === "online").length;
  const presencial = rows.length - online;

  /**
   * Poner o quitar un filtro.
   *
   * Volver a tocar la cifra que ya está puesta lo quita.
   */
  const etapa = (k: string) => {
    set("etapa", values.etapa === k ? "all" : k);
    set("publicos", "");
  };

  /** Alta manual: se crea con lo mínimo y se sigue en su ficha. */
  const crear = async () => {
    const name = nombre.trim();
    if (!name) return;
    setGuardando(true);
    try {
      const res = await fetch("/api/speaker-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "No se pudo crear", "error");
        return;
      }
      router.push(localePath(locale, `/admin/speakers/${data.profile.slug}`));
    } catch {
      toast("No se pudo crear", "error");
    } finally {
      setGuardando(false);
    }
  };

  /** Las etiquetas de una fila: las mismas en la tabla y en la tarjeta. */
  const etiquetas = (s: SpeakerRow) => {
    const est = STATUS[s.status];
    return (
      <>
        {/* La modalidad va primero y con color propio, igual que en
            Asistentes: acento presencial, celeste online. */}
        <Tag tone={s.sessionType === "online" ? "info" : "accent"} icon={s.sessionType === "online" ? Wifi : MapPin}>
          {s.sessionType === "online" ? "Online" : "Presencial"}
        </Tag>
        <Tag tone={est.tone} icon={est.Icon}>{est.label}</Tag>
        {s.isPublic ? <Tag tone="good" icon={Eye}>Público</Tag> : <Tag icon={EyeOff}>Oculto</Tag>}
        {s.track && s.track !== "general" && <Tag tone="accent">{trackLabel(s.track)}</Tag>}
      </>
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead
        title="speakers"
        actions={
          <>
            <HardLink icon={SlidersHorizontal} href={localePath(locale, "/admin/speakers/ajustes")}>
              Ajustes
            </HardLink>
            <HardLink icon={Download} href="/api/speakers/export" download="speakers-aws-scd.csv">
              Exportar CSV
            </HardLink>
            <HardButton icon={Plus} onClick={() => { setNombre(""); setCreando(true); }}>
              Nuevo speaker
            </HardButton>
          </>
        }
      />

      {/* Las cifras son el filtro: la etapa en la que está cada persona. */}
      <Stats cols={5}>
        <Stat value={rows.length} label="en total" active={values.etapa === "all" && !values.publicos} onClick={() => etapa("all")} />
        <Stat value={cuenta("revisar")} label="por revisar" tone="info" active={values.etapa === "revisar"} onClick={() => etapa("revisar")} />
        <Stat value={cuenta("aceptados")} label="aceptados" tone="good" active={values.etapa === "aceptados"} onClick={() => etapa("aceptados")} />
        <Stat value={cuenta("espera")} label="en espera" tone="warn" active={values.etapa === "espera"} onClick={() => etapa("espera")} />
        <Stat value={cuenta("rechazados")} label="rechazados" tone="danger" active={values.etapa === "rechazados"} onClick={() => etapa("rechazados")} />
      </Stats>

      <Toolbar>
        <SearchInput
          placeholder="Nombre, correo, charla, empresa…"
          defaultValue={values.buscar}
          onSearch={setSearch}
          className="col-span-2 sm:min-w-[280px] sm:flex-1"
        />
        {/* Presencial / online: dos botones que se apagan al volver a tocarlos.
            En el teléfono van de a dos por fila, con «sólo públicos» debajo. */}
        <HardButton
          tone={values.modalidad === "in-person" ? "accent" : "ghost"}
          icon={MapPin}
          onClick={() => set("modalidad", values.modalidad === "in-person" ? "all" : "in-person")}
        >
          Presencial ({presencial})
        </HardButton>
        <HardButton
          tone={values.modalidad === "online" ? "accent" : "ghost"}
          icon={Wifi}
          onClick={() => set("modalidad", values.modalidad === "online" ? "all" : "online")}
        >
          Online ({online})
        </HardButton>
        <HardButton
          tone={values.publicos ? "accent" : "ghost"}
          icon={values.publicos ? Eye : EyeOff}
          className="col-span-2 sm:col-span-1"
          onClick={() => set("publicos", values.publicos ? "" : "1")}
        >
          Sólo públicos ({publicos})
        </HardButton>
      </Toolbar>

      {loading ? (
        <Cargando />
      ) : filtradas.length === 0 ? (
        <Empty icon={Mic2}>
          {search || values.etapa !== "all" || values.publicos || values.modalidad !== "all"
            ? "Nadie con esos filtros."
            : "Todavía no hay postulaciones."}
        </Empty>
      ) : (
        <>
          <Cards>
            {filtradas.map((s) => (
              <RowCard
                key={s.id}
                onClick={() => router.push(localePath(locale, `/admin/speakers/${s.slug}`))}
                avatar={<Avatar seed={s.slug || s.email} name={speakerName(s)} email={s.email} photo={s.photo} size={44} />}
                title={speakerName(s)}
                subtitle={[s.role, s.company].filter(Boolean).join(" · ") || s.email}
                meta={s.talkTitle}
                tags={etiquetas(s)}
              />
            ))}
          </Cards>

          <TableWrap className="hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-surface-600">
                  <Th>Speaker</Th>
                  <Th>Modalidad</Th>
                  <Th className="hidden md:table-cell">Charla</Th>
                  <Th className="hidden lg:table-cell">Track</Th>
                  <Th>Estado</Th>
                  <Th align="center">Público</Th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((s) => {
                  const est = STATUS[s.status];
                  return (
                    <tr
                      key={s.id}
                      onClick={() => router.push(localePath(locale, `/admin/speakers/${s.slug}`))}
                      className="cursor-pointer border-b border-surface-600/60 transition-colors hover:bg-surface-700/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar seed={s.slug || s.email} name={speakerName(s)} email={s.email} photo={s.photo} size={40} />
                          <div className="min-w-0">
                            <Link
                              href={localePath(locale, `/admin/speakers/${s.slug}`)}
                              onClick={(e) => e.stopPropagation()}
                              className="block max-w-[210px] truncate font-mono text-sm font-bold text-surface-50 hover:text-aws-orange"
                            >
                              {speakerName(s)}
                            </Link>
                            <span className="block max-w-[210px] truncate font-mono text-[11px] text-surface-300">
                              {[s.role, s.company].filter(Boolean).join(" · ") || s.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Tag tone={s.sessionType === "online" ? "info" : "accent"} icon={s.sessionType === "online" ? Wifi : MapPin}>
                          {s.sessionType === "online" ? "Online" : "Presencial"}
                        </Tag>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="block max-w-[280px] truncate font-mono text-xs text-surface-200">
                          {s.talkTitle || "—"}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="font-mono text-xs text-surface-300">{trackLabel(s.track)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Tag tone={est.tone} icon={est.Icon}>{est.label}</Tag>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.isPublic ? <Tag tone="good" icon={Eye}>Sí</Tag> : <Tag icon={EyeOff}>No</Tag>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </>
      )}

      <Modal open={creando} onClose={() => setCreando(false)} title="Nuevo speaker" size="sm">
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Ana Pérez"
            autoFocus
          />
          <p className="m-0 font-mono text-xs leading-relaxed text-surface-300">
            Se crea la ficha con el nombre y se abre para completar el resto.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <HardButton tone="ghost" onClick={() => setCreando(false)}>Cancelar</HardButton>
            <HardButton onClick={crear} disabled={guardando || !nombre.trim()}>
              {guardando ? "Creando…" : "Crear y abrir"}
            </HardButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// useSearchParams requiere un <Suspense> alrededor
export default function SpeakersPage() {
  return (
    <Suspense>
      <SpeakersPageInner />
    </Suspense>
  );
}
