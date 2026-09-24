"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/section-heading";
import { WireSolid } from "@/components/effects/wire-solid";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { Modal } from "@/components/ui/modal";
import { Clock, MapPin, Wifi, GitMerge, ExternalLink, X } from "lucide-react";
import type { AgendaEventDTO as AgendaEvent } from "@/lib/data/agenda";
import { TZ_LABEL } from "@/lib/constants";

const trackColors: Record<string, string> = {
  cloud:         "border-blue-500/40 bg-blue-500/10 text-blue-300",
  devops:        "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  "ai-ml":       "border-purple-500/40 bg-purple-500/10 text-purple-300",
  security:      "border-red-500/40 bg-red-500/10 text-red-300",
  "soft-skills": "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
  general:       "border-teal-500/40 bg-teal-500/10 text-teal-300",
};

const DEFAULT_TRACK_COLOR = "border-aws-orange/40 bg-aws-orange/10 text-orange-300";

const trackLabels: Record<string, string> = {
  cloud: "Cloud", devops: "DevOps", "ai-ml": "AI/ML",
  security: "Security", "soft-skills": "Soft Skills", general: "General",
};

const levelLabels: Record<string, string> = {
  "100": "100", "200": "200", "300": "300", "400": "400",
};

const languageLabels: Record<string, string> = {
  es: "Español", en: "English", bilingual: "Bilingüe",
};

/** "H:mm" / "HH:mm" → minutes since midnight (robust to non-padded hours). */
function slotMin(t: string): number {
  const [h, m] = (t || "").split(":").map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

/** Renders text with URLs turned into clickable, bold links. */
function renderWithLinks(text: string): React.ReactNode {
  const urlRe = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)\]])/gi;
  const parts = text.split(urlRe);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-aws-orange underline underline-offset-2 break-all hover:text-aws-orange/80"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function getTrackColor(track: string) { return trackColors[track] || DEFAULT_TRACK_COLOR; }
function getTrackLabel(track: string) { return trackLabels[track] || (track.charAt(0).toUpperCase() + track.slice(1)); }

function OnlineBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] text-blue-400">
      <Wifi className="h-2.5 w-2.5" /> Online
    </span>
  );
}

function EventCard({ event, onClick }: { event: AgendaEvent; onClick: () => void }) {
  const colors = getTrackColor(event.track);
  const photoUrl = event.speakerPhoto || event.imageUrl || null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group block h-full w-full text-left rounded-xl border overflow-hidden transition-all duration-200 hover:brightness-110 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-[0.99] cursor-pointer ${colors}`}
    >
      <div className="flex h-full min-h-[88px]">
        {photoUrl && (
          <div className="shrink-0 w-[72px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={event.speaker || "Speaker"}
              className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-center gap-1">
          <p className="font-mono text-[13px] font-bold leading-snug line-clamp-3">{event.title}</p>
          {event.speaker && (
            <p className="font-mono text-[11px] opacity-60 line-clamp-1">{event.speaker}</p>
          )}
          {event.sessionType === "online" && (
            <div className="mt-0.5"><OnlineBadge /></div>
          )}
        </div>
      </div>
    </button>
  );
}

function EventModal({ event, onClose }: { event: AgendaEvent; onClose: () => void }) {
  const colors = getTrackColor(event.track);
  const [cardOpen, setCardOpen] = useState(false);
  const cardUrl = event.speakerSlug ? `/api/og/speaker/${event.speakerSlug}` : (event.cardImageUrl || null);

  useEffect(() => {
    if (!cardOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopImmediatePropagation(); setCardOpen(false); }
    };
    document.addEventListener("keydown", handler, { capture: true });
    return () => document.removeEventListener("keydown", handler, { capture: true });
  }, [cardOpen]);

  return (
    <>
      <Modal open onClose={onClose} title="" size="md">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-none border px-2.5 py-0.5 font-mono text-xs ${colors}`}>
              {getTrackLabel(event.track)}
            </span>
            {event.level && (
              <span className="rounded border border-surface-600 bg-surface-700 px-2 py-0.5 font-mono text-xs text-surface-300">
                {levelLabels[event.level] || event.level}
              </span>
            )}
            {event.language && (
              <span className="rounded border border-surface-600 bg-surface-700 px-2 py-0.5 font-mono text-xs text-surface-300">
                {languageLabels[event.language] || event.language}
              </span>
            )}
            {event.sessionType === "online" && (
              <span className="inline-flex items-center gap-1 rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-mono text-xs text-blue-400">
                <Wifi className="h-3 w-3" /> Online
              </span>
            )}
            {event.sessionType === "hibrida" && (
              <span className="inline-flex items-center gap-1 rounded border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-mono text-xs text-purple-400">
                <GitMerge className="h-3 w-3" /> Híbrida
              </span>
            )}
          </div>

          <div>
            <h2 className="font-mono text-xl font-bold text-surface-50 leading-snug">{event.title}</h2>
            {event.speaker && (
              <p className="mt-1 font-mono text-sm text-surface-400">{event.speaker}</p>
            )}
          </div>

          {cardUrl && (
            <button
              type="button"
              onClick={() => setCardOpen(true)}
              className="group relative mx-auto block w-full max-w-[320px] overflow-hidden rounded-xl shadow-lg ring-1 ring-white/10 transition-all hover:ring-aws-orange/50 hover:shadow-[0_0_24px_rgba(242,166,240,0.15)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cardUrl} alt={`${event.speaker} — speaker card`} className="w-full block" loading="lazy" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                <span className="translate-y-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 font-mono text-xs font-semibold text-white bg-black/60 px-3 py-1.5 rounded-none">
                  Ver en grande →
                </span>
              </div>
            </button>
          )}

          {event.speakerSlug && (
            <a
              href={`/speakers/${event.speakerSlug}`}
              className="flex items-center justify-center gap-2 rounded-none border border-aws-orange bg-aws-orange/10 px-5 py-3 font-mono text-sm font-bold text-aws-orange transition-all hover:bg-aws-orange hover:text-surface-900 hover:shadow-[0_0_20px_rgba(242,166,240,0.3)]"
            >
              Ver perfil del ponente <ExternalLink className="h-4 w-4" />
            </a>
          )}

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-sm text-surface-400">
              <Clock className="h-4 w-4 text-aws-orange" />
              <span className="font-mono">{event.startTime} – {event.endTime} ({TZ_LABEL})</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-surface-400">
              <MapPin className="h-4 w-4 text-aws-orange" />
              <span className="font-mono">{event.room}</span>
            </div>
          </div>

          {event.description && (
            <div className="rounded-xl border border-surface-700 bg-surface-800/60 p-4">
              <p className="text-sm leading-relaxed text-surface-200 whitespace-pre-line">{renderWithLinks(event.description)}</p>
            </div>
          )}

          {event.cta && (
            <a
              href={event.cta}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-none bg-aws-orange px-5 py-2.5 font-mono text-sm font-bold text-surface-900 transition-all hover:shadow-[0_0_20px_rgba(242,166,240,0.4)]"
            >
              Más información <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {/* Close button — mobile only */}
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden w-full rounded-full border border-surface-700 py-3 font-mono text-sm text-surface-400 hover:border-surface-500 hover:text-surface-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </Modal>

      {cardOpen && cardUrl && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
          onClick={() => setCardOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardUrl}
            alt={event.speaker || "Speaker card"}
            className="max-h-full rounded-2xl shadow-2xl cursor-default"
            style={{ maxWidth: "min(100%, 560px)" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute top-4 right-4 rounded-full p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setCardOpen(false)}
          >
            <X className="h-7 w-7" />
          </button>
        </div>
      )}
    </>
  );
}

function Placeholder({ t }: { t: ReturnType<typeof useTranslations<"Agenda">> }) {
  return (
    <div className="mt-12">
      <div className="grid gap-px border-2 border-hack-block/25 bg-hack-block/10 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <ScrollReveal key={i} delay={i * 0.06} from={i % 2 ? "right" : "left"} distance={40}>
            <div className="flex h-full items-center gap-4 bg-surface-800 px-5 py-6">
              <span className="dot-matrix shrink-0 text-sm text-hack-block/50">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <div className="h-3.5 w-28 animate-pulse bg-hack-block/25" />
                <div className="mt-2.5 h-2.5 w-full max-w-[220px] animate-pulse bg-surface-700" />
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={0.2}>
        <div className="mt-10 border-2 border-hack-block/25 px-6 py-8 text-center">
          <p className="dot-matrix m-0 text-2xl text-hack-block md:text-3xl">
            {t("coming_soon")}
          </p>
          <p className="mx-auto mt-3 max-w-[46ch] font-mono text-sm leading-relaxed text-surface-400">
            {t("coming_soon_desc")}
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}

export function AgendaView({ events }: { events: AgendaEvent[] }) {
  const t = useTranslations("Agenda");
  const [selected, setSelected] = useState<AgendaEvent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll en PC: mueve la tabla de lado a lado para que se vea que hay más
  // contenido. Se pausa al pasar el mouse, se detiene si el usuario toma el control,
  // respeta reduced-motion y solo corre si el contenido se desborda.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || events.length === 0) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    let raf = 0;
    let last = 0;
    let dir = 1;
    let pos = el.scrollLeft;
    let hovering = false;
    let userTook = false;
    let started = false;
    const SPEED = 0.045; // px per ms ≈ 45px/s

    const step = (ts: number) => {
      if (!last) last = ts;
      const dt = Math.min(ts - last, 50);
      last = ts;
      const max = el.scrollWidth - el.clientWidth;
      if (max > 4 && !hovering && !userTook) {
        pos += dir * SPEED * dt;
        if (pos >= max) { pos = max; dir = -1; }
        else if (pos <= 0) { pos = 0; dir = 1; }
        el.scrollLeft = pos;
      } else {
        pos = el.scrollLeft; // mantener sincronizado mientras está pausado
        last = ts;
      }
      raf = requestAnimationFrame(step);
    };

    const onEnter = () => { hovering = true; };
    const onLeave = () => { hovering = false; last = 0; };
    const onTakeOver = () => { userTook = true; };

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !started && el.scrollWidth - el.clientWidth > 4) {
          started = true;
          raf = requestAnimationFrame(step);
        }
      }
    }, { threshold: 0.25 });
    io.observe(el);

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("wheel", onTakeOver, { passive: true });
    el.addEventListener("touchstart", onTakeOver, { passive: true });
    el.addEventListener("mousedown", onTakeOver);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("wheel", onTakeOver);
      el.removeEventListener("touchstart", onTakeOver);
      el.removeEventListener("mousedown", onTakeOver);
    };
  }, [events.length]);

  const timeSlots = events.reduce<Record<string, AgendaEvent[]>>((acc, event) => {
    const key = event.startTime;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  const rooms = [...new Set(events.map((e) => e.room))];
  const sortedSlots = Object.keys(timeSlots).sort((a, b) => slotMin(a) - slotMin(b));

  // Duración: un evento ocupa todas las franjas dentro de [inicio, fin).
  // spanByEvent[_id] = cuántas filas ocupa; covered[franja] = salas cuya celda ya
  // está tomada por un rowSpan de una fila anterior (no se renderizan).
  const spanByEvent: Record<string, number> = {};
  const covered: Record<number, Set<number>> = {};
  sortedSlots.forEach((slot, i) => {
    (timeSlots[slot] ?? []).forEach((ev) => {
      const end = slotMin(ev.endTime || ev.startTime);
      let span = 0;
      for (let k = i; k < sortedSlots.length; k++) {
        if (slotMin(sortedSlots[k]) >= end) break;
        span++;
      }
      span = Math.max(1, span);
      spanByEvent[ev._id] = span;
      const ri = rooms.indexOf(ev.room);
      for (let k = i + 1; k < i + span; k++) {
        (covered[k] ??= new Set()).add(ri);
      }
    });
  });

  // Min table width: 148px time col + 210px per room
  const tableMinWidth = 148 + rooms.length * 210;

  return (
    <section id="agenda" className="py-24 px-4 sm:px-6 bg-surface-800/50">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="flex flex-wrap items-center justify-between gap-8">
            <SectionHeading title={t("heading")} subtitle={t("subheading")} align="left" className="mb-0" />
            <WireSolid shape="cube" className="hidden h-[180px] w-[180px] shrink-0 md:block" />
          </div>
        </ScrollReveal>

        {events.length === 0 ? (
          <Placeholder t={t} />
        ) : (
          <ScrollReveal>
            {/* ── Desktop ─────────────────────────────────────── */}
            <div className="hidden md:block mt-10">
              <div className="relative rounded-2xl border border-surface-700/60 overflow-hidden">
                {/* Fade right edge to hint at scroll */}
                <div className="pointer-events-none absolute right-0 inset-y-0 w-10 bg-gradient-to-l from-surface-900/80 to-transparent z-10" />

                <div ref={scrollRef} className="overflow-x-auto">
                  <table className="border-collapse" style={{ minWidth: tableMinWidth, width: "100%" }}>
                    <thead>
                      <tr className="bg-surface-800/80 border-b border-surface-700">
                        <th className="px-5 py-3.5 text-left w-[148px] shrink-0">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-surface-500">Hora ({TZ_LABEL})</span>
                        </th>
                        {rooms.map((room) => (
                          <th key={room} className="px-4 py-3.5 text-left border-l border-surface-700/60">
                            <span className="font-mono text-xs font-bold uppercase tracking-wider text-surface-200">{room}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSlots.map((slot, i) => {
                        const slotEvents = timeSlots[slot];
                        // Varios eventos pueden compartir sala+hora → se apilan en la celda
                        const eventsByRoom: Record<string, AgendaEvent[]> = {};
                        slotEvents.forEach((e) => { (eventsByRoom[e.room] ??= []).push(e); });
                        return (
                          <tr
                            key={slot}
                            className={`border-b border-surface-800 ${i % 2 === 1 ? "bg-surface-800/20" : ""}`}
                            style={{ height: "116px" }}
                          >
                            <td className="px-5 align-middle w-[148px]">
                              <span className="font-mono text-xl font-bold text-aws-orange whitespace-nowrap">{slot}</span>
                            </td>
                            {rooms.map((room, ri) => {
                              // Celda ya tomada por un evento que se extiende desde arriba
                              if (covered[i]?.has(ri)) return null;
                              const cellEvents = eventsByRoom[room];
                              if (!cellEvents || cellEvents.length === 0) return (
                                <td key={room} className="px-3 py-3 border-l border-surface-800 align-top" />
                              );
                              // La celda ocupa tantas filas como el evento más largo del grupo
                              const span = Math.max(...cellEvents.map((e) => spanByEvent[e._id] ?? 1));
                              return (
                                <td
                                  key={room}
                                  rowSpan={span}
                                  className="p-2 border-l border-surface-800"
                                  style={{ height: "inherit" }}
                                >
                                  {cellEvents.length === 1 ? (
                                    // Un solo evento: la card llena la celda (mantiene el span por duración)
                                    <EventCard event={cellEvents[0]} onClick={() => setSelected(cellEvents[0])} />
                                  ) : (
                                    // Varios en la misma sala+hora: se apilan a su altura natural
                                    <div className="flex flex-col gap-2">
                                      {cellEvents.map((event) => (
                                        <EventCard key={event._id} event={event} onClick={() => setSelected(event)} />
                                      ))}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── Mobile ──────────────────────────────────────── */}
            <div className="md:hidden mt-8 flex flex-col gap-6">
              {sortedSlots.map((slot) => (
                <div key={slot}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-2xl font-bold text-aws-orange leading-none">{slot}</span>
                    <div className="flex-1 h-px bg-surface-700" />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {timeSlots[slot]
                      .sort((a, b) => a.room.localeCompare(b.room))
                      .map((event) => (
                        <div key={event._id}>
                          <p className="mb-1 pl-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-aws-orange/50">
                            {event.room}
                          </p>
                          <EventCard event={event} onClick={() => setSelected(event)} />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}
      </div>

      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
