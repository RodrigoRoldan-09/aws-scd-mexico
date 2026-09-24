function Pulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse bg-surface-700/60 ${className ?? ""}`} style={style} />;
}

/**
 * Esqueleto de la tabla de voluntarios.
 *
 * Copia la forma real de la pantalla —cabecera, las cuatro cifras, la fila de
 * filtros y la tabla—, para que al cargar no salte el diseño.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Cabecera */}
      <div className="mb-6 flex flex-col gap-4 border-b-2 border-surface-600 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Pulse className="h-7 w-32 bg-surface-700" />
          <Pulse className="mt-2 h-4 w-40" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <Pulse className="h-8 w-32 bg-surface-700" />
          <Pulse className="h-8 w-32 bg-surface-700" />
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
        <Pulse className="h-9 w-36" />
        <Pulse className="h-9 w-32" />
        <Pulse className="h-9 w-44" />
      </div>

      {/* Tabla */}
      <div className="border-2 border-surface-600 bg-surface-800">
        <div className="border-b-2 border-surface-600 px-4 py-3">
          <div className="flex items-center gap-4">
            <Pulse className="h-3 w-20 shrink-0" />
            <Pulse className="hidden h-3 w-28 shrink-0 sm:block" />
            <Pulse className="hidden h-3 w-24 shrink-0 lg:block" />
            <Pulse className="hidden h-3 w-14 shrink-0 md:block" />
            <Pulse className="ml-auto h-3 w-16 shrink-0" />
          </div>
        </div>

        {/* 14 filas — llenan una pantalla de 1080p */}
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-surface-600/60 px-4 py-3.5 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <Pulse className="h-4 w-full max-w-[160px]" style={{ animationDelay: `${i * 35}ms` }} />
            </div>
            <Pulse className="hidden h-4 w-44 shrink-0 sm:block" style={{ animationDelay: `${i * 35 + 10}ms` }} />
            <Pulse className="hidden h-4 w-32 shrink-0 lg:block" style={{ animationDelay: `${i * 35 + 18}ms` }} />
            <Pulse className="hidden h-4 w-10 shrink-0 md:block" style={{ animationDelay: `${i * 35 + 26}ms` }} />
            <Pulse className="h-5 w-20 shrink-0" style={{ animationDelay: `${i * 35 + 34}ms` }} />
            <Pulse className="h-7 w-7 shrink-0" style={{ animationDelay: `${i * 35 + 42}ms` }} />
          </div>
        ))}
      </div>

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between">
        <Pulse className="h-4 w-24" />
        <div className="flex items-center gap-1">
          <Pulse className="h-7 w-7" />
          <Pulse className="h-4 w-14" />
          <Pulse className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}
