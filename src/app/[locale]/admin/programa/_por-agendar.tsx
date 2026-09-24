"use client";

import Link from "next/link";
import { CalendarPlus, CheckCircle2, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/admin/avatar";
import { Empty, HardButton, Tag } from "@/components/admin/ui";
import { trackColor, trackLabel } from "@/data/session-tracks";
import type { SpeakerAceptado } from "./_shared";
import { localePath } from "@/lib/utils";

/**
 * Los aceptados que todavía no tienen hueco en el programa. El botón abre el
 * formulario ya relleno con su charla.
 */
export function PorAgendar({
  speakers,
  locale,
  onAgendar,
}: {
  speakers: SpeakerAceptado[];
  locale: string;
  onAgendar: (sp: SpeakerAceptado) => void;
}) {
  if (speakers.length === 0) {
    return (
      <Empty icon={CheckCircle2}>
        No falta nadie por agendar. Todos los aceptados tienen su hueco.
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      {speakers.map((sp) => (
        <div key={sp.id} className="flex flex-col gap-3 border-2 border-surface-600 bg-surface-800 p-3">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar seed={sp.slug} name={sp.name} photo={sp.photo} size={44} />
            <div className="min-w-0 flex-1">
              <Link
                href={localePath(locale, `/admin/speakers/${sp.slug}`)}
                className="flex items-center gap-1.5 font-mono text-sm font-bold text-surface-50 hover:text-aws-orange"
              >
                <span className="truncate">{sp.name}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
              </Link>
              <p className="m-0 mt-0.5 line-clamp-2 font-mono text-[11px] leading-relaxed text-surface-300">
                {sp.talkTitle || "Sin título"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${trackColor(sp.track)}`}>
                  {trackLabel(sp.track)}
                </span>
                {sp.audienceLevel && <Tag>{sp.audienceLevel}</Tag>}
              </div>
            </div>
          </div>

          <HardButton icon={CalendarPlus} onClick={() => onAgendar(sp)} className="w-full">
            Darle hora y sala
          </HardButton>
        </div>
      ))}
    </div>
  );
}
