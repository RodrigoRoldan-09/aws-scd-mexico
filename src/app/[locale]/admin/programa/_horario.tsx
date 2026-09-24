"use client";

import { CalendarDays, Mic2, Pencil, Trash2 } from "lucide-react";
import { Cards, Empty, RowCard, TableWrap, Tag, Th } from "@/components/admin/ui";
import { trackColor, trackLabel } from "@/data/session-tracks";
import { MODALIDAD, porHora, type BloqueAgenda } from "./_shared";

/**
 * El horario del día: los bloques ordenados por hora. En el teléfono cada
 * bloque es una tarjeta.
 */
export function Horario({
  bloques,
  onEdit,
  onDelete,
}: {
  bloques: BloqueAgenda[];
  onEdit: (b: BloqueAgenda) => void;
  onDelete: (b: BloqueAgenda) => void;
}) {
  const ordenados = [...bloques].sort(porHora);

  if (ordenados.length === 0) {
    return <Empty icon={CalendarDays}>Todavía no hay nada en el programa.</Empty>;
  }

  const etiquetas = (b: BloqueAgenda) => {
    const m = MODALIDAD[b.sessionType] ?? MODALIDAD.presencial;
    return (
      <>
        <span className={`inline-flex border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${trackColor(b.track)}`}>
          {trackLabel(b.track)}
        </span>
        <Tag icon={m.Icon}>{m.label}</Tag>
        {b.level && <Tag>{b.level}</Tag>}
        {b.speakerId ? <Tag tone="accent" icon={Mic2}>Sesión</Tag> : <Tag>Libre</Tag>}
      </>
    );
  };

  return (
    <>
      <Cards>
        {ordenados.map((b) => (
          <RowCard
            key={b._id}
            onClick={() => onEdit(b)}
            title={b.title}
            subtitle={`${b.startTime}–${b.endTime} · ${b.room || "sin sala"}`}
            meta={b.speaker}
            tags={etiquetas(b)}
          />
        ))}
      </Cards>

      <TableWrap className="hidden sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-surface-600">
              <Th>Hora</Th>
              <Th>Sala</Th>
              <Th className="hidden lg:table-cell">Track</Th>
              <Th>Título</Th>
              <Th className="hidden md:table-cell">Quién</Th>
              <Th align="center" className="hidden lg:table-cell">Tipo</Th>
              <Th align="center">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((b) => {
              const m = MODALIDAD[b.sessionType] ?? MODALIDAD.presencial;
              return (
                <tr key={b._id} className="border-b border-surface-600/60 transition-colors hover:bg-surface-700/40">
                  <td className="px-4 py-3">
                    <span className="whitespace-nowrap font-mono text-sm tabular-nums text-surface-50">
                      {b.startTime}–{b.endTime}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-surface-200">{b.room || "—"}</span>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className={`inline-flex border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${trackColor(b.track)}`}>
                      {trackLabel(b.track)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="block max-w-[240px] truncate font-mono text-sm text-surface-50">{b.title}</span>
                      {b.sessionType !== "presencial" && (
                        <m.Icon className="h-3.5 w-3.5 shrink-0 text-surface-300" />
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="block max-w-[170px] truncate font-mono text-xs text-surface-300">
                      {b.speaker || "—"}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-center lg:table-cell">
                    {b.speakerId ? <Tag tone="accent" icon={Mic2}>Sesión</Tag> : <Tag>Libre</Tag>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(b)}
                        aria-label={`Editar ${b.title}`}
                        className="p-1.5 text-surface-400 transition-colors hover:text-aws-orange"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(b)}
                        aria-label={`Eliminar ${b.title}`}
                        className="p-1.5 text-surface-400 transition-colors hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
