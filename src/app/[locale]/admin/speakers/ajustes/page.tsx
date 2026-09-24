"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, FileText, RotateCw, Upload,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import {
  Aviso, Cargando, Empty, HardButton, PageHead, Panel, SectionHead,
} from "@/components/admin/ui";
import { CFP_DEADLINE } from "@/data/cfp";
import { EVENT } from "@/lib/constants";
import { SORT_OPTIONS, type SortMode } from "../_shared";
import { localePath } from "@/lib/utils";

/**
 * Ajustes de speakers: la carta en PDF que se manda al aprobar, el orden en
 * que salen en el sitio y el estado de la convocatoria.
 */

const DEADLINE = new Date(CFP_DEADLINE);
const FECHA = DEADLINE.toLocaleDateString("es-MX", {
  day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City",
});

type ClavePdf = "pdf_local" | "pdf_international";

/** Las dos cartas: nacional e internacional. */
const PDFS: { key: ClavePdf; titulo: string; para: string }[] = [
  {
    key: "pdf_local",
    titulo: `Carta nacional`,
    para: `Para quien ya está en ${EVENT.country}.`,
  },
  {
    key: "pdf_international",
    titulo: "Carta internacional",
    para: `Para quien viaja a ${EVENT.country}. Lleva los datos que piden en migración.`,
  },
];

type PublicSpeaker = { _id: string; name: string; sortOrder: number; speakerType: string };

export default function AjustesSpeakersPage() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const { toast } = useToast();

  // ── Convocatoria ────────────────────────────────────────────────────────
  // El reloj es del navegador, no del render: comparar la hora al pintar haría
  // que el HTML del servidor y el del cliente puedan discrepar.
  const abierta = useSyncExternalStore(
    () => () => {},
    () => Date.now() <= DEADLINE.getTime(),
    () => null,
  );

  // ── Cartas en PDF ───────────────────────────────────────────────────────
  const [pdfs, setPdfs] = useState<Record<ClavePdf, string>>({ pdf_local: "", pdf_international: "" });
  const [subiendo, setSubiendo] = useState<ClavePdf | null>(null);

  const cargarPdfs = useCallback(async () => {
    try {
      const res = await fetch("/api/settings?keys=pdf_local,pdf_international");
      const d = (await res.json()) as Partial<Record<ClavePdf, string>>;
      setPdfs({ pdf_local: d.pdf_local ?? "", pdf_international: d.pdf_international ?? "" });
    } catch { /* se queda con lo que había */ }
  }, []);

  const subirPdf = async (key: ClavePdf, file: File) => {
    if (file.type !== "application/pdf") { toast("Tiene que ser un PDF", "error"); return; }
    if (file.size > 20 * 1024 * 1024) { toast("El PDF no puede pasar de 20 MB", "error"); return; }
    setSubiendo(key);
    try {
      const res = await fetch("/api/upload/pdf-presign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) throw new Error("No se pudo preparar la subida");
      const { uploadUrl, publicUrl } = (await res.json()) as { uploadUrl: string; publicUrl: string };
      const put = await fetch(uploadUrl, {
        method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file,
      });
      if (!put.ok) throw new Error("No se pudo subir el archivo");
      await fetch("/api/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: publicUrl }),
      });
      setPdfs((p) => ({ ...p, [key]: publicUrl }));
      toast("Carta actualizada", "success");
    } catch (e) {
      toast((e as Error).message || "No se pudo subir", "error");
    } finally {
      setSubiendo(null);
    }
  };

  // ── Varias postulaciones por correo ─────────────────────────────────────
  // Viene encendido: lo normal es que alguien mande dos charlas distintas.
  const [varias, setVarias] = useState(true);
  const [guardandoVarias, setGuardandoVarias] = useState(false);

  const cargarVarias = useCallback(async () => {
    try {
      const res = await fetch("/api/settings?keys=speaker_multi_submit");
      const d = (await res.json()) as { speaker_multi_submit?: string };
      // Sin ajuste guardado = encendido. Sólo el "0" explícito lo apaga.
      setVarias(d.speaker_multi_submit !== "0");
    } catch { /* se queda encendido, que es el valor por defecto */ }
  }, []);

  const guardarVarias = async (valor: boolean) => {
    const antes = varias;
    setVarias(valor);
    setGuardandoVarias(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "speaker_multi_submit", value: valor ? "1" : "0" }),
      });
      if (!res.ok) throw new Error();
      toast(valor ? "Se permiten varias postulaciones" : "Una postulación por correo", "success");
    } catch {
      setVarias(antes);
      toast("No se pudo guardar", "error");
    } finally {
      setGuardandoVarias(false);
    }
  };

  // ── Orden en el sitio ───────────────────────────────────────────────────
  const [orden, setOrden] = useState<SortMode>("approval_date");
  const [guardandoOrden, setGuardandoOrden] = useState(false);
  const [publicos, setPublicos] = useState<PublicSpeaker[]>([]);
  const [cargandoPublicos, setCargandoPublicos] = useState(false);

  const cargarOrden = useCallback(async () => {
    try {
      const res = await fetch("/api/settings?keys=speaker_sort");
      const d = (await res.json()) as { speaker_sort?: string };
      if (d.speaker_sort) setOrden(d.speaker_sort as SortMode);
    } catch { /* se queda con el valor por defecto */ }
  }, []);

  const cargarPublicos = useCallback(async () => {
    setCargandoPublicos(true);
    try {
      const res = await fetch("/api/speaker-profiles");
      const d = (await res.json()) as { profiles?: PublicSpeaker[] };
      setPublicos(d.profiles ?? []);
    } catch { /* ignore */ } finally { setCargandoPublicos(false); }
  }, []);

  const guardarOrden = async (modo: SortMode) => {
    setOrden(modo);
    setGuardandoOrden(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "speaker_sort", value: modo }),
      });
      toast("Orden guardado", "success");
      if (modo === "custom") void cargarPublicos();
    } catch {
      toast("No se pudo guardar el orden", "error");
    } finally {
      setGuardandoOrden(false);
    }
  };

  const mover = async (i: number, hacia: "up" | "down") => {
    const lista = [...publicos];
    const j = hacia === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    const nuevo = lista.map((s, k) => ({ ...s, sortOrder: k }));
    setPublicos(nuevo);
    try {
      await fetch("/api/speaker-profiles/reorder", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: nuevo.map((s) => ({ id: s._id, sortOrder: s.sortOrder })) }),
      });
    } catch {
      toast("No se pudo guardar el orden", "error");
    }
  };

  useEffect(() => {
    void cargarPdfs();
    void cargarOrden();
    void cargarVarias();
  }, [cargarPdfs, cargarOrden, cargarVarias]);

  useEffect(() => {
    if (orden === "custom" && publicos.length === 0) void cargarPublicos();
  }, [orden, publicos.length, cargarPublicos]);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={localePath(locale, "/admin/speakers")}
        className="mb-4 inline-flex items-center gap-2 font-mono text-xs text-surface-300 transition-colors hover:text-aws-orange"
      >
        <ArrowLeft className="h-4 w-4" />
        Speakers
      </Link>

      <PageHead title="ajustes de speakers" />

      {/* ── Convocatoria ─────────────────────────────────────────────────── */}
      <SectionHead title="la convocatoria" />
      <Panel className="mb-8">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 shrink-0 ${abierta ? "animate-pulse bg-emerald" : "bg-surface-500"}`}
            aria-hidden="true"
          />
          <p className="m-0 font-mono text-sm text-surface-100">
            {abierta === null
              ? "Comprobando…"
              : abierta
                ? `Abierta. Cierra el ${FECHA}.`
                : `Cerrada desde el ${FECHA}.`}
          </p>
        </div>
        <p className="m-0 mt-3 font-mono text-xs leading-relaxed text-surface-300">
          Se cierra sola ese día. No hay nada que apretar acá.
        </p>
      </Panel>

      {/* ── Varias postulaciones ─────────────────────────────────────────── */}
      <SectionHead title="postular varias veces" />
      <Panel className="mb-8">
        <Switch
          label="Una misma persona puede enviar varias propuestas"
          checked={varias}
          disabled={guardandoVarias}
          onChange={(v) => void guardarVarias(v)}
        />
        <p className="m-0 mt-3 max-w-[70ch] font-mono text-xs leading-relaxed text-surface-300">
          {varias
            ? "Con esto encendido, el mismo correo puede mandar más de una charla. Cada propuesta llega como una postulación aparte y se aprueba o descarta por separado."
            : "Apagado: el segundo envío con un correo que ya postuló se rechaza. Quien quiera cambiar su propuesta tendrá que escribirte."}
        </p>
      </Panel>

      {/* ── Cartas ───────────────────────────────────────────────────────── */}
      <SectionHead title="la carta de aprobación" />
      <p className="m-0 mb-4 max-w-[70ch] font-mono text-xs leading-relaxed text-surface-300">
        El PDF que se adjunta al correo cuando apruebas a alguien. Si no subes
        ninguno se genera uno automáticamente con los datos del evento; súbelo
        sólo si quieres una carta firmada o con membrete.
      </p>
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        {PDFS.map(({ key, titulo, para }) => {
          const actual = pdfs[key];
          return (
            <Panel key={key} label={titulo}>
              <p className="m-0 font-mono text-xs leading-relaxed text-surface-300">{para}</p>

              {actual ? (
                <a
                  href={actual}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 border-2 border-emerald/50 bg-emerald/10 px-3 py-2 font-mono text-xs text-emerald hover:bg-emerald/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Carta subida — ver el archivo
                </a>
              ) : (
                <p className="m-0 mt-3 flex items-center gap-2 border-2 border-surface-600 px-3 py-2 font-mono text-xs text-surface-300">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  Sin carta propia: se genera automáticamente.
                </p>
              )}

              <label
                className={`mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 border-2 border-dashed px-4 py-3 font-mono text-xs font-bold transition-colors ${
                  subiendo === key
                    ? "pointer-events-none border-surface-600 opacity-60"
                    : "border-surface-500 text-surface-200 hover:border-aws-orange hover:text-aws-orange"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                {subiendo === key ? "Subiendo…" : actual ? "Reemplazar" : "Subir PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void subirPdf(key, f);
                    e.target.value = "";
                  }}
                />
              </label>
            </Panel>
          );
        })}
      </div>

      {/* ── Orden en el sitio ────────────────────────────────────────────── */}
      <SectionHead title="en qué orden salen en el sitio" />
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SORT_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => guardarOrden(o.value)}
            disabled={guardandoOrden}
            className={`border-2 p-3 text-left transition-all disabled:opacity-60 ${
              orden === o.value
                ? "border-aws-orange bg-aws-orange/10 shadow-[4px_4px_0_0_var(--color-aws-orange-dark)]"
                : "border-surface-600 bg-surface-800 hover:border-surface-500"
            }`}
          >
            <span className={`block font-mono text-xs font-bold ${orden === o.value ? "text-aws-orange" : "text-surface-100"}`}>
              {o.label}
            </span>
            <span className="mt-0.5 block font-mono text-[10px] leading-tight text-surface-300">{o.desc}</span>
          </button>
        ))}
      </div>

      {orden === "custom" && (
        <Panel
          label="El orden, a mano"
          className="mb-8"
          actions={
            <HardButton tone="ghost" icon={RotateCw} onClick={() => void cargarPublicos()}>
              Recargar
            </HardButton>
          }
        >
          {cargandoPublicos ? (
            <Cargando />
          ) : publicos.length === 0 ? (
            <Empty>Todavía no hay speakers públicos que ordenar.</Empty>
          ) : (
            <div className="flex flex-col gap-2">
              {publicos.map((s, i) => (
                <div key={s._id} className="flex items-center gap-3 border-2 border-surface-600 bg-surface-900 p-2">
                  <span className="w-6 shrink-0 text-center font-mono text-xs font-bold tabular-nums text-surface-300">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-surface-100">{s.name}</span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => void mover(i, "up")}
                      disabled={i === 0}
                      aria-label="Subir"
                      className="flex h-9 w-9 items-center justify-center border-2 border-surface-600 text-surface-200 transition-colors hover:border-aws-orange hover:text-aws-orange disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void mover(i, "down")}
                      disabled={i === publicos.length - 1}
                      aria-label="Bajar"
                      className="flex h-9 w-9 items-center justify-center border-2 border-surface-600 text-surface-200 transition-colors hover:border-aws-orange hover:text-aws-orange disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      <Aviso tone="info">
        El orden se aplica al home y al directorio público. Sólo entran los
        speakers marcados como públicos en su ficha.
      </Aviso>
    </div>
  );
}
