"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft, Check, Copy, Eye, EyeOff, Globe, Image as ImageIcon, Languages,
  Mail, MapPin, Pencil, Phone, Send, Star, Trash2, Undo2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/admin/avatar";
import { useConfirm } from "@/components/admin/confirm";
import {
  Cargando, Dato, Datos, HardButton, HardLink, Panel, SectionHead, Tag,
} from "@/components/admin/ui";
import { formatDateTime } from "@/lib/utils";
import {
  CAMINO, LANG_LABEL, LEVEL_LABEL, MOVER, SESSION_TYPE_LABEL, SOCIAL_FIELDS,
  STATUS, TRACKS, TRANSICIONES, speakerName, trackLabel,
  type SpeakerRow, type SpeakerStatus, type SpeakerType,
} from "../_shared";
import { EditarPerfil } from "./_editar";
import { localePath } from "@/lib/utils";

/**
 * La ficha de un speaker: pantalla propia (con URL para compartir) donde cada
 * acción dice qué hace y qué va a pasar después.
 */

/**
 * Por dónde va la propuesta.
 *
 * El camino normal son cuatro etapas. En espera y rechazado no son etapas sino
 * desvíos, así que en vez de meterlos en la fila se enseña el desvío y debajo
 * desde qué etapa se salió.
 */
function Recorrido({ actual }: { actual: SpeakerStatus }) {
  const fuera = actual === "waitlisted" || actual === "rejected";
  const est = STATUS[actual];

  if (fuera) {
    return (
      <div>
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 ${
            actual === "rejected"
              ? "border-red-500/60 bg-red-500/15 text-red-300"
              : "border-amber-400/60 bg-amber-400/15 text-amber-300"
          }`}>
            <est.Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="m-0 font-mono text-sm font-bold text-surface-50">{est.label}</p>
            <p className="m-0 font-mono text-xs leading-relaxed text-surface-300">{est.means}</p>
          </div>
        </div>
        <p className="m-0 mt-3 border-t-2 border-surface-600 pt-3 font-mono text-[11px] text-surface-400">
          Está fuera del camino normal. Con «deshacer» vuelve a entrar.
        </p>
      </div>
    );
  }

  const i = CAMINO.indexOf(actual);
  return (
    <div>
      <ol className="m-0 flex list-none flex-col gap-2 p-0 sm:flex-row sm:items-stretch sm:gap-0">
        {CAMINO.map((etapa, k) => {
          const hecho = k < i;
          const aqui = k === i;
          const e = STATUS[etapa];
          return (
            <li key={etapa} className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className={`flex min-w-0 flex-1 items-center gap-2 border-2 px-3 py-2 ${
                  aqui
                    ? "border-aws-orange bg-aws-orange text-surface-900"
                    : hecho
                      ? "border-surface-500 bg-surface-700/40 text-surface-200"
                      : "border-surface-600 text-surface-400"
                }`}
              >
                <e.Icon className="h-4 w-4 shrink-0" />
                <span className="truncate font-mono text-xs font-bold">{e.label}</span>
              </div>
              {k < CAMINO.length - 1 && (
                <span className="hidden shrink-0 px-1 font-mono text-surface-500 sm:inline" aria-hidden="true">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="m-0 mt-3 border-t-2 border-surface-600 pt-3 font-mono text-xs leading-relaxed text-surface-300">
        {est.means}
      </p>
    </div>
  );
}

/**
 * Una acción, con lo que hace escrito al lado.
 *
 * La fila entera se puede tocar y dice el verbo arriba y la consecuencia
 * debajo. `correo` marca las que le escriben a la persona, que es lo que no se
 * puede deshacer.
 */
function Accion({
  Icon, verbo, que, onClick, disabled, destacada, atras, correo,
}: {
  Icon: React.ElementType;
  verbo: string;
  que: string;
  onClick: () => void;
  disabled?: boolean;
  destacada?: boolean;
  atras?: boolean;
  correo?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-3 border-2 p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        destacada
          ? "border-aws-orange bg-aws-orange/10 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-aws-orange-dark)]"
          : atras
            ? "border-surface-600 bg-transparent hover:border-surface-400"
            : "border-surface-600 bg-surface-800 hover:border-aws-orange"
      }`}
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border-2 ${
          destacada ? "border-aws-orange bg-aws-orange text-surface-900" : "border-surface-600 text-surface-200"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-mono text-sm font-bold ${destacada ? "text-aws-orange" : "text-surface-50"}`}>
          {verbo}
        </span>
        <span className="mt-0.5 block font-mono text-[11px] leading-relaxed text-surface-300">{que}</span>
        {correo && (
          <span className="mt-1.5 inline-flex items-center gap-1.5 border border-amber-400/60 bg-amber-400/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
            <Send className="h-3 w-3" />
            Le llega un correo
          </span>
        )}
      </span>
    </button>
  );
}

export function FichaSpeaker({ slug }: { slug: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();

  const [s, setS] = useState<SpeakerRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [trabajando, setTrabajando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [aprobando, setAprobando] = useState(false);
  const [tipo, setTipo] = useState<SpeakerType>("local");
  const [track, setTrack] = useState("general");

  // El API sirve la lista entera; se toma de ahí la fila que toca. Es una sola
  // petición y evita un endpoint más para lo mismo.
  const cargar = useMemo(
    () => () =>
      fetch("/api/speakers")
        .then((r) => r.json())
        .then((d: { submissions?: SpeakerRow[] }) => {
          const fila = (d.submissions ?? []).find((x) => x.slug === slug) ?? null;
          setS(fila);
          if (fila) {
            setTipo(fila.speakerType ?? "local");
            setTrack(fila.track || "general");
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false)),
    [slug],
  );

  useEffect(() => { void cargar(); }, [cargar]);

  if (loading) return <Cargando className="py-24" />;

  if (!s) {
    return (
      <div className="mx-auto max-w-3xl">
        <Panel>
          <p className="m-0 font-mono text-sm text-surface-200">
            No hay ningún speaker con ese enlace.
          </p>
          <HardLink className="mt-4" icon={ArrowLeft} href={localePath(locale, "/admin/speakers")}>
            Volver a la lista
          </HardLink>
        </Panel>
      </div>
    );
  }

  const est = STATUS[s.status];
  const nombre = speakerName(s);
  const online = s.sessionType === "online";

  /** Cambia el estado del trámite. */
  const cambiarEstado = async (destino: SpeakerStatus) => {
    setTrabajando(true);
    try {
      const res = await fetch(`/api/speakers/${s.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: destino }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast(d.error || "No se pudo cambiar el estado", "error");
        return;
      }
      toast(`Ahora está en «${STATUS[destino].label}»`, "success");
      await cargar();
    } catch {
      toast("No se pudo cambiar el estado", "error");
    } finally {
      setTrabajando(false);
    }
  };

  /** Aprobar: manda el correo con la carta y deja la persona aceptada. */
  const aprobar = async () => {
    setTrabajando(true);
    try {
      const res = await fetch(`/api/speakers/${s.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speakerType: tipo, track, presentationMode: s.sessionType }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(d.error || "No se pudo aprobar", "error");
        return;
      }
      toast("Aprobado y correo enviado", "success");
      setAprobando(false);
      await cargar();
    } catch {
      toast("No se pudo aprobar", "error");
    } finally {
      setTrabajando(false);
    }
  };

  /** Publicar u ocultar del sitio. */
  const alternarPublico = async () => {
    setTrabajando(true);
    try {
      const res = await fetch(`/api/speaker-profiles/${s.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !s.isPublic }),
      });
      if (!res.ok) {
        toast("No se pudo cambiar", "error");
        return;
      }
      toast(s.isPublic ? "Oculto del sitio" : "Publicado en el sitio", "success");
      await cargar();
    } catch {
      toast("No se pudo cambiar", "error");
    } finally {
      setTrabajando(false);
    }
  };

  const eliminar = async () => {
    const ok = await confirm({
      title: "Eliminar speaker",
      message: `Se elimina la ficha de ${nombre}, su propuesta y su perfil público. No se puede deshacer.`,
      confirmLabel: "Sí, eliminar",
      tone: "danger",
    });
    if (!ok) return;
    setTrabajando(true);
    try {
      const res = await fetch(`/api/speaker-profiles/${s.slug}`, { method: "DELETE" });
      if (!res.ok) {
        toast("No se pudo eliminar", "error");
        return;
      }
      toast("Speaker eliminado", "success");
      router.push(localePath(locale, "/admin/speakers"));
    } catch {
      toast("No se pudo eliminar", "error");
    } finally {
      setTrabajando(false);
    }
  };

  const copiarTarjeta = async () => {
    const url = `${window.location.origin}/api/og/speaker/${s.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Enlace de la tarjeta copiado", "success");
    } catch {
      toast("No se pudo copiar", "error");
    }
  };

  const redes = SOCIAL_FIELDS.filter((f) => s.social[f.key]);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={localePath(locale, "/admin/speakers")}
        className="mb-4 inline-flex items-center gap-2 font-mono text-xs text-surface-300 transition-colors hover:text-aws-orange"
      >
        <ArrowLeft className="h-4 w-4" />
        Speakers
      </Link>

      {/* ── Portada ────────────────────────────────────────────────────── */}
      <div className="mb-6 border-2 border-surface-600 bg-surface-800">
        <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
          <Avatar
            seed={s.slug || s.email}
            name={nombre}
            email={s.email}
            photo={s.photo}
            size={168}
            className="mx-auto sm:mx-0"
          />

          <div className="min-w-0 flex-1">
            <h2 className="dot-matrix m-0 break-words text-2xl leading-none text-surface-50 sm:text-3xl">
              {nombre}
            </h2>
            {(s.role || s.company) && (
              <p className="m-0 mt-2 font-mono text-sm text-surface-200">
                {[s.role, s.company].filter(Boolean).join(" · ")}
              </p>
            )}
            {s.tagline && (
              <p className="m-0 mt-1 font-mono text-xs italic text-surface-300">{s.tagline}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Tag tone={est.tone} icon={est.Icon}>{est.label}</Tag>
              {s.isPublic ? <Tag tone="good" icon={Eye}>Público</Tag> : <Tag icon={EyeOff}>Oculto</Tag>}
              {s.speakerType && (
                <Tag tone={s.speakerType === "international" ? "info" : "neutral"} icon={Globe}>
                  {s.speakerType === "international" ? "Internacional" : "Local"}
                </Tag>
              )}
              {s.firstTimeSpeaker && <Tag tone="warn" icon={Star}>Primera vez</Tag>}
              <Tag tone="accent">{trackLabel(s.track)}</Tag>
            </div>

            {/* Contacto: enlaces de verdad, no texto para copiar a mano. */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs">
              {s.email && (
                <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1.5 text-surface-200 hover:text-aws-orange">
                  <Mail className="h-3.5 w-3.5" /> {s.email}
                </a>
              )}
              {s.phone && (
                <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1.5 text-surface-200 hover:text-aws-orange">
                  <Phone className="h-3.5 w-3.5" /> {s.phone}
                </a>
              )}
              {s.countryCity && (
                <span className="inline-flex items-center gap-1.5 text-surface-300">
                  <MapPin className="h-3.5 w-3.5" /> {s.countryCity}
                </span>
              )}
            </div>

            {redes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {redes.map(({ key, label, Icon }) => (
                  <a
                    key={key}
                    href={s.social[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    aria-label={label}
                    className="flex h-10 min-w-10 items-center justify-center border-2 border-surface-600 px-2.5 text-surface-200 transition-all hover:-translate-y-0.5 hover:border-aws-orange hover:text-aws-orange"
                  >
                    <Icon className="h-4 w-auto" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Qué significa el estado en el que está, dicho con palabras. */}
        <p className="m-0 border-t-2 border-surface-600 px-4 py-3 font-mono text-xs text-surface-300 sm:px-6">
          {est.means}
        </p>
      </div>

      {/* ── Dónde está y a dónde puede ir ──────────────────────────────── */}
      <SectionHead title="el estado" />
      <div className="mb-6 border-2 border-surface-600 bg-surface-800 p-4 sm:p-5">
        <Recorrido actual={s.status} />
      </div>

      <SectionHead title="qué puedes hacer ahora" />
      <div className="mb-8 flex flex-col gap-2">
        {/* Aprobar va primero y aparte: es la única que le escribe a la persona. */}
        {s.status !== "accepted" && s.status !== "scheduled" && (
          <Accion
            destacada
            Icon={Check}
            verbo={MOVER.accepted.verb}
            que={MOVER.accepted.what}
            correo
            disabled={trabajando}
            onClick={() => setAprobando(true)}
          />
        )}

        {TRANSICIONES[s.status].avanzar.map((destino) => (
          <Accion
            key={destino}
            Icon={STATUS[destino].Icon}
            verbo={MOVER[destino].verb}
            que={MOVER[destino].what}
            disabled={trabajando}
            onClick={() => cambiarEstado(destino)}
          />
        ))}

        {TRANSICIONES[s.status].volver.length > 0 && (
          <>
            <p className="m-0 mt-3 font-mono text-[11px] font-bold uppercase tracking-widest text-surface-300">
              Deshacer
            </p>
            {TRANSICIONES[s.status].volver.map((destino) => (
              <Accion
                key={destino}
                atras
                Icon={Undo2}
                verbo={MOVER[destino].verb}
                que={MOVER[destino].what}
                disabled={trabajando}
                onClick={() => cambiarEstado(destino)}
              />
            ))}
          </>
        )}
      </div>

      {/* ── El resto de cosas que se le pueden hacer ─────────────────────── */}
      <SectionHead title="su perfil público" />
      <div className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <HardButton
          tone={s.isPublic ? "ghost" : "good"}
          icon={s.isPublic ? EyeOff : Eye}
          disabled={trabajando}
          onClick={alternarPublico}
        >
          {s.isPublic ? "Ocultar del sitio" : "Publicar en el sitio"}
        </HardButton>
        <HardButton tone="ghost" icon={Pencil} onClick={() => setEditando(true)}>
          Editar la ficha
        </HardButton>
        <HardLink tone="ghost" icon={ImageIcon} href={`${localePath(locale, "/admin/speakers/canvas")}?slug=${s.slug}`}>
          Maquetar su tarjeta
        </HardLink>
        <HardButton tone="ghost" icon={Copy} onClick={copiarTarjeta}>
          Copiar enlace de tarjeta
        </HardButton>
        {s.isPublic && (
          <HardLink tone="ghost" icon={Globe} external href={localePath(locale, `/speakers/${s.slug}`)}>
            Ver perfil público
          </HardLink>
        )}
      </div>

      {/* ── La propuesta ─────────────────────────────────────────────────── */}
      <SectionHead title="la propuesta" />
      <Panel className="mb-6">
        <p className="m-0 font-mono text-lg font-bold leading-snug text-surface-50">
          {s.talkTitle || "Sin título"}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Tag tone={online ? "info" : "accent"}>
            {SESSION_TYPE_LABEL[s.sessionType] ?? s.sessionType ?? "—"}
          </Tag>
          {s.audienceLevel && <Tag>{LEVEL_LABEL[s.audienceLevel] ?? s.audienceLevel}</Tag>}
          {s.language && <Tag icon={Languages}>{LANG_LABEL[s.language] ?? s.language}</Tag>}
        </div>
        {s.talkAbstract && (
          <p className="m-0 mt-4 whitespace-pre-wrap font-mono text-sm leading-relaxed text-surface-200">
            {s.talkAbstract}
          </p>
        )}
        {(s.requirements || (online && s.preRecordingDate)) && (
          <div className="mt-4 border-t-2 border-surface-600 pt-4">
            <Datos>
              {s.requirements && <Dato label="Necesita" value={s.requirements} wide />}
              {online && s.preRecordingDate && (
                <Dato label="Puede grabar" value={s.preRecordingDate} />
              )}
            </Datos>
          </div>
        )}
      </Panel>

      {/* ── Quién es ─────────────────────────────────────────────────────── */}
      {s.bio && (
        <>
          <SectionHead title="su biografía" />
          <Panel className="mb-6">
            <p className="m-0 whitespace-pre-wrap font-mono text-sm leading-relaxed text-surface-200">
              {s.bio}
            </p>
          </Panel>
        </>
      )}

      {/* ── Acompañantes ─────────────────────────────────────────────────── */}
      {s.coSpeakers.length > 0 && (
        <>
          <SectionHead title={s.coSpeakers.length === 1 ? "va acompañado" : "va acompañada"} />
          <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {s.coSpeakers.map((c, i) => (
              <div key={i} className="flex items-center gap-3 border-2 border-surface-600 bg-surface-800 p-3">
                <Avatar seed={c.email || c.name} name={c.name} email={c.email} photo={c.photo} size={48} />
                <div className="min-w-0">
                  <p className="m-0 truncate font-mono text-sm font-bold text-surface-50">{c.name || "—"}</p>
                  <p className="m-0 truncate font-mono text-[11px] text-surface-300">
                    {[c.role, c.company].filter(Boolean).join(" · ") || c.email}
                  </p>
                  {c.countryCity && (
                    <p className="m-0 truncate font-mono text-[11px] text-surface-400">{c.countryCity}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Trámite ──────────────────────────────────────────────────────── */}
      <SectionHead title="el trámite" />
      <Panel className="mb-8">
        <Datos>
          <Dato label="Postuló" value={s.submittedAt ? formatDateTime(s.submittedAt) : undefined} />
          <Dato label="Aprobado" value={s.approvedAt ? formatDateTime(s.approvedAt) : undefined} />
          <Dato label="Agendado" value={s.scheduledAt ? formatDateTime(s.scheduledAt) : undefined} />
          <Dato label="Track" value={trackLabel(s.track)} />
          <Dato label="Empresa" value={s.company || undefined} />
          <Dato label="Tarjeta del sitio" value={s.cardApproved ? "Aprobada" : "Sin aprobar"} tone={s.cardApproved ? "good" : undefined} />
        </Datos>
      </Panel>

      {/* ── Eliminar ─────────────────────────────────────────────────────── */}
      <Panel tone="danger" label="Zona de peligro">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 font-mono text-xs leading-relaxed text-surface-300">
            Se borra la ficha, la propuesta y el perfil público. No se puede deshacer.
          </p>
          <HardButton tone="danger" icon={Trash2} disabled={trabajando} onClick={eliminar} className="w-full sm:w-auto">
            Eliminar speaker
          </HardButton>
        </div>
      </Panel>

      {/* ── Aprobación ───────────────────────────────────────────────────── */}
      <Modal open={aprobando} onClose={() => !trabajando && setAprobando(false)} title="Aprobar speaker" size="md">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 border-2 border-surface-600 bg-surface-900 p-3">
            <Avatar seed={s.slug || s.email} name={nombre} email={s.email} photo={s.photo} size={48} />
            <div className="min-w-0">
              <p className="m-0 truncate font-mono text-sm font-bold text-surface-50">{nombre}</p>
              <p className="m-0 truncate font-mono text-xs text-surface-300">{s.talkTitle || "Sin título"}</p>
            </div>
          </div>

          <div>
            <p className="m-0 mb-2 font-mono text-xs font-bold uppercase tracking-widest text-surface-200">
              ¿De dónde viaja?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["local", "Del país", `Se le manda la carta de ${"speaker"} nacional.`],
                ["international", "De fuera", "Se le manda la carta con los datos de viaje."],
              ] as const).map(([v, titulo, pie]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTipo(v)}
                  className={`border-2 p-3 text-left transition-all ${
                    tipo === v
                      ? "border-aws-orange bg-aws-orange/10"
                      : "border-surface-600 bg-surface-900 hover:border-surface-500"
                  }`}
                >
                  <span className={`block font-mono text-sm font-bold ${tipo === v ? "text-aws-orange" : "text-surface-100"}`}>
                    {titulo}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] leading-tight text-surface-300">{pie}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-surface-200">
              Track
            </span>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="min-h-11 w-full border-2 border-surface-600 bg-surface-900 px-3 py-2 font-mono text-sm text-surface-100 outline-none focus:border-aws-orange"
            >
              {TRACKS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          <p className="m-0 border-l-4 border-aws-orange bg-aws-orange/5 py-2 pl-3 font-mono text-xs leading-relaxed text-surface-200">
            Al aprobar se envía el correo con la carta en PDF y la persona queda
            como aceptada. El PDF sale de lo que haya en Ajustes.
          </p>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <HardButton tone="ghost" onClick={() => setAprobando(false)} disabled={trabajando}>
              Cancelar
            </HardButton>
            <HardButton icon={Check} onClick={aprobar} disabled={trabajando}>
              {trabajando ? "Enviando…" : "Aprobar y enviar"}
            </HardButton>
          </div>
        </div>
      </Modal>

      {/* ── Edición ──────────────────────────────────────────────────────── */}
      <Modal open={editando} onClose={() => setEditando(false)} title={`Editar: ${nombre}`} size="xl">
        <EditarPerfil
          row={s}
          onSaved={() => { setEditando(false); void cargar(); }}
          onCancel={() => setEditando(false)}
        />
      </Modal>

      {dialog}
    </div>
  );
}
