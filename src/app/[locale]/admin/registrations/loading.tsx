function Pulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse bg-surface-700/60 ${className ?? ""}`} style={style} />;
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Cabecera */}
      <div className="mb-6 flex flex-col gap-4 border-b-2 border-surface-600 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Pulse className="h-7 w-28 bg-surface-700" />
          <Pulse className="mt-2 h-4 w-64" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <Pulse className="h-8 w-32 bg-surface-700" />
          <Pulse className="h-8 w-32 bg-surface-700" />
          <Pulse className="h-8 w-28 bg-surface-700" />
        </div>
      </div>

      {/* Cifras */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-2 border-surface-600 bg-surface-800 px-4 py-3">
            <Pulse className="h-7 w-12" style={{ animationDelay: `${i * 60}ms` }} />
            <Pulse className="mt-2 h-3 w-24" style={{ animationDelay: `${i * 60 + 20}ms` }} />
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Pulse className="h-9 min-w-[240px] flex-1" />
        <Pulse className="h-9 w-36" />
        <Pulse className="h-9 w-40" />
        <Pulse className="h-9 w-36" />
        <Pulse className="h-9 w-36" />
      </div>

      {/* Tabla */}
      <div className="border-2 border-surface-600 bg-surface-800">
        <div className="border-b-2 border-surface-600 px-4 py-3">
          <div className="flex items-center gap-4">
            <Pulse className="h-3 w-20 shrink-0" />
            <Pulse className="hidden h-3 w-28 shrink-0 sm:block" />
            <Pulse className="h-3 w-16 shrink-0" />
            <Pulse className="h-3 w-16 shrink-0" />
            <Pulse className="hidden h-3 w-14 shrink-0 md:block" />
            <Pulse className="ml-auto h-3 w-8 shrink-0" />
          </div>
        </div>

        {/* 14 filas — llenan una pantalla de 1080p */}
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-surface-600/60 px-4 py-3.5 last:border-0"
            style={{ animationDelay: `${i * 35}ms` }}
          >
            {/* Nombre */}
            <div className="min-w-0 flex-1">
              <Pulse className="h-4 w-full max-w-[160px]" style={{ animationDelay: `${i * 35}ms` }} />
            </div>
            {/* Email — hidden on mobile */}
            <Pulse className="hidden h-4 w-44 shrink-0 sm:block" style={{ animationDelay: `${i * 35 + 10}ms` }} />
            {/* Fecha */}
            <Pulse className="h-4 w-20 shrink-0" style={{ animationDelay: `${i * 35 + 18}ms` }} />
            {/* Check-in badge */}
            <Pulse className="h-5 w-14 shrink-0" style={{ animationDelay: `${i * 35 + 26}ms` }} />
            {/* Correo badge — hidden on mobile/sm */}
            <Pulse className="hidden h-5 w-16 shrink-0 md:block" style={{ animationDelay: `${i * 35 + 34}ms` }} />
            {/* Ver button */}
            <Pulse className="h-7 w-7 shrink-0" style={{ animationDelay: `${i * 35 + 42}ms` }} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <Pulse className="h-4 w-28" />
        <div className="flex items-center gap-1">
          <Pulse className="h-7 w-7" />
          <Pulse className="h-4 w-16" />
          <Pulse className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}
