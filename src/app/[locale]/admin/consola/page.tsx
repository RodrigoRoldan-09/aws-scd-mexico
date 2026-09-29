"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search, ArrowRightLeft, Trash2, Loader2, ShieldAlert,
  ClipboardList, Heart, Mic2, Stamp, QrCode, Users,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { useDebounce } from "@/hooks/use-url-filters";
import { Avatar } from "@/components/admin/avatar";
import { HardButton, PageHead, Panel, SectionHead, Tag } from "@/components/admin/ui";
import { MoveDialog, MOVE_LABELS, type MoveKind, type MoveSubject } from "@/components/admin/move-dialog";
import { cn } from "@/lib/utils";
import { KIND_LABEL, movesFor, type ConsoleSummary, type PersonHit } from "./_types";
import { localePath } from "@/lib/utils";

/**
 * Consola: busca a una persona en todas las listas a la vez, muestra en cuál
 * está y la mueve con todo lo que eso arrastra (pasaporte, correo). El diálogo
 * de movimiento es el mismo que usan las tablas.
 */

const WIPES = [
  { target: "attendees", label: "Asistentes", desc: "Registros y pasaportes." },
  { target: "volunteers", label: "Voluntarios", desc: "Postulaciones y pasaportes." },
  { target: "speakers", label: "Speakers", desc: "Perfiles. La agenda queda sin ponente." },
  { target: "passports", label: "Pasaportes", desc: "Sólo las cartillas." },
] as const;

const KIND_TONE: Record<PersonHit["kind"], "accent" | "good" | "neutral"> = {
  attendee: "accent",
  volunteer: "good",
  speaker: "neutral",
};

export default function ConsolaPage() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const { user } = useAuth();
  const { toast } = useToast();

  const [summary, setSummary] = useState<ConsoleSummary | null>(null);
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);
  const [results, setResults] = useState<PersonHit[]>([]);
  const [searching, setSearching] = useState(false);

  const [subject, setSubject] = useState<MoveSubject | null>(null);
  const [move, setMove] = useState<MoveKind | null>(null);

  const [wipe, setWipe] = useState<(typeof WIPES)[number] | null>(null);
  const [wipeText, setWipeText] = useState("");
  const [wiping, setWiping] = useState(false);

  const load = useCallback(async (q: string) => {
    setSearching(!!q);
    try {
      const res = await fetch(`/api/admin/console?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = await res.json() as { summary: ConsoleSummary; results: PersonHit[] };
      setSummary(data.summary);
      setResults(data.results ?? []);
    } catch {
      toast("No se pudo consultar", "error");
    } finally {
      setSearching(false);
    }
  }, [toast]);

  useEffect(() => { void load(debounced); }, [debounced, load]);

  if (user && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-surface-300" />
        <p className="mt-4 font-mono text-sm text-surface-200">
          La consola es sólo para administradores.
        </p>
      </div>
    );
  }

  const runWipe = async () => {
    if (!wipe) return;
    setWiping(true);
    try {
      const res = await fetch("/api/admin/console/wipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: wipe.target, confirm: wipeText }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "No se pudo borrar", "error");
        return;
      }
      toast(`${data.deleted} ${data.label} eliminados${data.extra ? ` · ${data.extra}` : ""}`, "success");
      setWipe(null);
      setWipeText("");
      await load(debounced);
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setWiping(false);
    }
  };

  type Cifra = {
    icon: React.ElementType;
    value: number;
    label: string;
    hint?: string;
    href?: string;
    tone: "accent" | "good" | "ink";
  };

  const cifras: Cifra[] = summary
    ? ([
        { icon: ClipboardList, value: summary.attendees, label: "asistentes", hint: `${summary.inPerson} presencial · ${summary.online} online`, href: "registrations", tone: "accent" },
        { icon: Heart, value: summary.volunteers, label: "voluntarios", hint: `${summary.volunteersApproved} aprobados`, href: "volunteers", tone: "good" },
        { icon: Mic2, value: summary.speakers, label: "speakers", hint: `${summary.speakersAccepted} aceptados`, href: "speakers", tone: "ink" },
        { icon: Stamp, value: summary.passports, label: "pasaportes", hint: "solo presenciales", href: "pasaportes", tone: "ink" },
        { icon: QrCode, value: summary.checkedIn, label: "con check-in", hint: `${summary.confirmed} confirmaron`, tone: "ink" },
        { icon: Users, value: summary.users, label: "cuentas de staff", href: "users", tone: "ink" },
      ])
    : [];

  const frase = wipe ? `BORRAR ${wipe.label.toUpperCase()}` : "";
  const fraseOk = wipeText.trim().toUpperCase() === frase;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHead
        title="consola"
      />

      {/* Cifras */}
      <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cifras.map((c) => {
          const Icon = c.icon;
          const card = (
            <div className="group flex h-full items-start gap-3 border-2 border-surface-600 bg-surface-800 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-aws-orange hover:shadow-[4px_4px_0_0_var(--color-aws-orange-dark)]">
              <Icon className="mt-1 h-5 w-5 shrink-0 text-aws-orange" />
              <div className="min-w-0">
                <span className={cn(
                  "block font-mono text-3xl font-black leading-none tabular-nums",
                  c.tone === "accent" ? "text-aws-orange" : c.tone === "good" ? "text-emerald" : "text-surface-50",
                )}>
                  {c.value}
                </span>
                <span className="mt-2 block font-mono text-[11px] font-bold uppercase tracking-widest text-surface-200">
                  {c.label}
                </span>
                {c.hint && <span className="mt-1 block font-mono text-[11px] text-surface-300">{c.hint}</span>}
              </div>
            </div>
          );
          return c.href ? (
            <Link key={c.label} href={localePath(locale, `/admin/${c.href}`)}>{card}</Link>
          ) : (
            <div key={c.label}>{card}</div>
          );
        })}
        {!summary && (
          <div className="col-span-full flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-aws-orange" />
          </div>
        )}
      </div>

      {/* Buscar y mover */}
      <SectionHead
        title="mover a alguien"
        lead="Busca en asistentes, voluntarios y speakers a la vez."
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-300" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre, correo, documento, código…"
          className="w-full border-2 border-surface-500 bg-surface-800 py-3 pl-11 pr-4 font-mono text-sm text-surface-50 outline-none transition-colors placeholder:text-surface-400 focus:border-aws-orange"
        />
      </div>

      {query ? (
        <div className="mb-12 border-2 border-surface-600 bg-surface-800">
          {searching ? (
            <p className="m-0 px-4 py-8 text-center font-mono text-sm text-surface-300">Buscando…</p>
          ) : results.length === 0 ? (
            <p className="m-0 px-4 py-8 text-center font-mono text-sm text-surface-300">
              Nadie con eso en asistentes, voluntarios ni speakers.
            </p>
          ) : (
            results.map((hit) => (
              <div
                key={`${hit.kind}-${hit.id}`}
                className="flex flex-wrap items-center gap-3 border-b-2 border-surface-600 px-4 py-3 last:border-0"
              >
                <Avatar seed={hit.seed} name={hit.name} email={hit.email} photo={hit.photo} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 flex flex-wrap items-center gap-2">
                    <span className="truncate font-mono text-sm font-bold text-surface-50">
                      {hit.name || "Sin nombre"}
                    </span>
                    <Tag tone={KIND_TONE[hit.kind]}>{KIND_LABEL[hit.kind]}</Tag>
                  </p>
                  <p className="m-0 mt-0.5 truncate font-mono text-xs text-surface-300">
                    {hit.email} · {hit.detail}
                  </p>
                </div>
                <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                  {movesFor(hit).map((m) => (
                    <HardButton
                      key={m}
                      tone="ghost"
                      icon={ArrowRightLeft}
                      onClick={() => {
                        setSubject({ id: hit.id, name: hit.name, email: hit.email, detail: hit.detail, seed: hit.seed, photo: hit.photo });
                        setMove(m);
                      }}
                    >
                      {MOVE_LABELS[m].title}
                    </HardButton>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <p className="m-0 mb-12 flex items-center gap-2 border-2 border-dashed border-surface-600 px-4 py-8 font-mono text-xs text-surface-300">
          <Search className="h-4 w-4 shrink-0" />
          Escribe para buscar.
        </p>
      )}

      {/* Zona de peligro */}
      <SectionHead
        title="zona de peligro"
        tone="danger"
        lead="Sin deshacer. Queda en el registro de actividad."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {WIPES.map((w) => (
          <div
            key={w.target}
            className="flex flex-col gap-3 border-2 border-red-500/50 bg-red-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="m-0 font-mono text-sm font-bold text-surface-50">{w.label}</p>
              <p className="m-0 mt-0.5 font-mono text-[11px] leading-relaxed text-surface-300">{w.desc}</p>
            </div>
            <HardButton
              tone="danger"
              icon={Trash2}
              className="w-full sm:w-auto"
              onClick={() => { setWipe(w); setWipeText(""); }}
            >
              Borrar
            </HardButton>
          </div>
        ))}
      </div>

      <MoveDialog
        subject={subject}
        move={move}
        onClose={() => { setSubject(null); setMove(null); }}
        onDone={() => void load(debounced)}
      />

      {/* Borrado masivo */}
      <Modal open={!!wipe} onClose={() => setWipe(null)} title="Borrado masivo" size="md">
        {wipe && (
          <div className="flex flex-col gap-4">
            <Panel tone="danger">
              <p className="m-0 font-mono text-sm leading-relaxed text-surface-100">
                Se van a eliminar{" "}
                <strong className="font-bold text-red-300">todos los {wipe.label.toLowerCase()}</strong>.{" "}
                {wipe.desc} Esto no se puede deshacer.
              </p>
            </Panel>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-xs text-surface-200">
                Escribe <code className="font-bold text-red-300">{frase}</code> para confirmar
              </span>
              <input
                value={wipeText}
                onChange={(e) => setWipeText(e.target.value)}
                autoComplete="off"
                className={cn(
                  "w-full border-2 bg-surface-900 px-3 py-2.5 font-mono text-sm text-surface-50 outline-none transition-colors",
                  fraseOk ? "border-red-500" : "border-surface-500 focus:border-surface-400",
                )}
              />
            </label>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:justify-end">
              <HardButton tone="ghost" onClick={() => setWipe(null)}>Cancelar</HardButton>
              <HardButton tone="danger" icon={Trash2} onClick={runWipe} disabled={wiping || !fraseOk}>
                {wiping ? "Borrando…" : "Borrar definitivamente"}
              </HardButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
