"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/admin/confirm";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { Cargando, HardButton, PageHead, Stat, Stats } from "@/components/admin/ui";
import { EventoForm } from "./_evento-form";
import { Horario } from "./_horario";
import { PorAgendar } from "./_por-agendar";
import { Salones } from "./_salones";
import {
  VISTAS,
  type BloqueAgenda, type Salon, type SpeakerAceptado, type Vista,
} from "./_shared";

/**
 * El programa del día.
 *
 * Junta lo que eran tres pantallas —Agenda, Sesiones y Salones—, que en realidad
 * son un solo trabajo: armar el horario. «Sesiones» ni siquiera tenía acciones
 * propias (publicar ya estaba en la ficha del speaker, y su «Agendar» sólo te
 * mandaba a la agenda con la persona por volver a buscar); los salones existen
 * únicamente para que un bloque tenga de dónde elegir sala.
 *
 * Los datos se cargan una vez acá y se reparten a las tres vistas: son las
 * mismas tres colecciones para todas, y antes cada pantalla las pedía por su
 * cuenta.
 */

const FILTROS = { vista: "horario" };

function ProgramaPageInner() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const { values, set } = useUrlFilters(FILTROS);

  const [bloques, setBloques] = useState<BloqueAgenda[]>([]);
  const [salones, setSalones] = useState<Salon[]>([]);
  const [speakers, setSpeakers] = useState<SpeakerAceptado[]>([]);
  const [loading, setLoading] = useState(true);

  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<BloqueAgenda | null>(null);
  const [preseleccion, setPreseleccion] = useState<SpeakerAceptado | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [agRes, salRes, spRes] = await Promise.all([
        fetch("/api/agenda"),
        fetch("/api/rooms"),
        fetch("/api/speakers"),
      ]);
      const [ag, sal, sp] = await Promise.all([agRes.json(), salRes.json(), spRes.json()]);

      setBloques(ag.events || []);

      setSalones(
        ((sal.rooms || []) as Record<string, unknown>[])
          .map((r) => ({
            id: (r._id ?? r.id) as string,
            name: r.name as string,
            capacity: r.capacity as number | undefined,
            virtualLink: r.virtualLink as string | undefined,
            track: r.track as string | undefined,
            order: (r.order as number) ?? 0,
          }))
          .sort((a, b) => a.order - b.order),
      );

      // Mismo endpoint que usa la pantalla de speakers.
      setSpeakers(
        ((sp.submissions || []) as Record<string, unknown>[])
          .filter((p) => p.status === "accepted" || p.status === "scheduled")
          .map((p) => ({
            id: p.id as string,
            name: p.name as string,
            slug: p.slug as string,
            photo: (p.photo as string) || "",
            talkTitle: (p.talkTitle as string) || "",
            talkAbstract: (p.talkAbstract as string) || "",
            track: (p.track as string) || "general",
            audienceLevel: (p.audienceLevel as string) || "",
            language: (p.language as string) || "es",
            status: p.status as string,
          })),
      );
    } catch {
      toast("No se pudo cargar el programa", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void cargar(); }, [cargar]);

  /** Quién está aceptado pero todavía no tiene bloque. */
  const porAgendar = useMemo(() => {
    const agendados = new Set(bloques.map((b) => b.speakerId).filter(Boolean));
    return speakers.filter((s) => !agendados.has(s.id));
  }, [bloques, speakers]);

  /** Los que sólo se pueden elegir al crear una sesión: los que faltan. */
  const vista = (VISTAS.some((v) => v.key === values.vista) ? values.vista : "horario") as Vista;

  const abrirNuevo = () => {
    setEditando(null);
    setPreseleccion(null);
    setFormAbierto(true);
  };

  const abrirEditar = (b: BloqueAgenda) => {
    setEditando(b);
    setPreseleccion(null);
    setFormAbierto(true);
  };

  const abrirAgendar = (sp: SpeakerAceptado) => {
    setEditando(null);
    setPreseleccion(sp);
    setFormAbierto(true);
  };

  const borrar = async (b: BloqueAgenda) => {
    const ok = await confirm({
      title: "Quitar del programa",
      message: b.speakerId
        ? `Se quita «${b.title}». El speaker vuelve a quedar aceptado y sin hora.`
        : `Se quita «${b.title}» del programa.`,
      confirmLabel: "Sí, quitar",
      tone: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/agenda/${b._id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast(d.error || "No se pudo quitar", "error");
        return;
      }
      toast("Quitado del programa", "success");
      void cargar();
    } catch {
      toast("No se pudo quitar", "error");
    }
  };

  const sesiones = bloques.filter((b) => b.speakerId).length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead
        title="programa"
        actions={
          <HardButton icon={Plus} onClick={abrirNuevo}>
            Nuevo bloque
          </HardButton>
        }
      />

      {/* Las cifras son también la navegación: cada una lleva a su vista. */}
      <Stats cols={4}>
        <Stat
          value={bloques.length}
          label="bloques"
          active={vista === "horario"}
          onClick={() => set("vista", "horario")}
        />
        <Stat value={sesiones} label="son sesiones" tone="accent" />
        <Stat
          value={porAgendar.length}
          label="por agendar"
          tone={porAgendar.length > 0 ? "warn" : "good"}
          active={vista === "agendar"}
          onClick={() => set("vista", "agendar")}
        />
        <Stat
          value={salones.length}
          label="salones"
          tone="info"
          active={vista === "salones"}
          onClick={() => set("vista", "salones")}
        />
      </Stats>

      {/* Las tres vistas. En el teléfono se desplazan a lo ancho. */}
      <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-1.5 border-2 border-surface-600 bg-surface-800 p-1.5 sm:w-auto">
          {VISTAS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => set("vista", key)}
              aria-current={vista === key ? "page" : undefined}
              className={`flex min-h-10 shrink-0 items-center gap-1.5 border-2 px-3 py-2 font-mono text-xs transition-all ${
                vista === key
                  ? "border-aws-orange bg-aws-orange font-bold text-surface-900"
                  : "border-transparent text-surface-200 hover:border-surface-600 hover:bg-surface-700/40 hover:text-surface-50"
              }`}
            >
              {label}
              {key === "agendar" && porAgendar.length > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  vista === key ? "bg-surface-900/25 text-surface-900" : "bg-amber-400/20 text-amber-300"
                }`}>
                  {porAgendar.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Cargando />
      ) : vista === "horario" ? (
        <Horario bloques={bloques} onEdit={abrirEditar} onDelete={borrar} />
      ) : vista === "agendar" ? (
        <PorAgendar speakers={porAgendar} locale={locale} onAgendar={abrirAgendar} />
      ) : (
        <Salones salones={salones} onChange={() => void cargar()} />
      )}

      <EventoForm
        abierto={formAbierto}
        editando={editando}
        preseleccion={preseleccion}
        salones={salones}
        speakers={preseleccion ? speakers : porAgendar}
        onClose={() => setFormAbierto(false)}
        onSaved={() => { setFormAbierto(false); void cargar(); }}
      />

      {dialog}
    </div>
  );
}

// useSearchParams requiere un <Suspense> alrededor
export default function ProgramaPage() {
  return (
    <Suspense>
      <ProgramaPageInner />
    </Suspense>
  );
}
