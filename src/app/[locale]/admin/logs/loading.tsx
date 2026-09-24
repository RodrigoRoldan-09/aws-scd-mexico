function Pulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded bg-surface-700/60 ${className ?? ""}`} style={style} />;
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b-2 border-surface-600 pb-4">
        <div>
          <Pulse className="h-7 w-16 bg-surface-700" />
          <Pulse className="mt-2 h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Pulse className="h-8 w-32 " />
          <Pulse className="h-8 w-24 " />
        </div>
      </div>

      {/* Table — Fecha | Usuario | Rol | Acción | Objetivo | Detalles(md) */}
      <div className="overflow-hidden border-2 border-surface-600 bg-surface-800">
        {/* Column headers */}
        <div className="border-b-2 border-surface-600 px-4 py-3">
          <div className="flex items-center gap-4">
            <Pulse className="h-3 w-28 shrink-0" />
            <Pulse className="h-3 w-20 shrink-0" />
            <Pulse className="h-3 w-12 shrink-0" />
            <Pulse className="h-3 w-20 shrink-0" />
            <Pulse className="h-3 flex-1" />
            <Pulse className="hidden h-3 w-20 shrink-0 md:block" />
          </div>
        </div>

        {/* Rows — logs have more rows per page */}
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-surface-600/60 px-4 py-3 last:border-0"
          >
            {/* Fecha */}
            <Pulse className="h-3.5 w-32 shrink-0" style={{ animationDelay: `${i * 28}ms` }} />
            {/* Usuario */}
            <Pulse className="h-4 w-24 shrink-0" style={{ animationDelay: `${i * 28 + 8}ms` }} />
            {/* Rol badge */}
            <Pulse className="h-5 w-16 shrink-0" style={{ animationDelay: `${i * 28 + 14}ms` }} />
            {/* Acción badge */}
            <Pulse className="h-5 w-24 shrink-0" style={{ animationDelay: `${i * 28 + 20}ms` }} />
            {/* Objetivo */}
            <div className="min-w-0 flex-1">
              <Pulse className="h-3.5 w-full max-w-[180px]" style={{ animationDelay: `${i * 28 + 26}ms` }} />
            </div>
            {/* Detalles — hidden mobile */}
            <Pulse className="hidden h-3.5 w-32 shrink-0 md:block" style={{ animationDelay: `${i * 28 + 32}ms` }} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <Pulse className="h-4 w-28" />
        <div className="flex items-center gap-1">
          <Pulse className="h-7 w-7 " />
          <Pulse className="h-4 w-14" />
          <Pulse className="h-7 w-7 " />
        </div>
      </div>
    </div>
  );
}
