function Pulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded bg-surface-700/60 ${className ?? ""}`} style={style} />;
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b-2 border-surface-600 pb-4">
        <div>
          <Pulse className="h-7 w-24 bg-surface-700" />
          <Pulse className="mt-2 h-4 w-48" />
        </div>
        <div className="flex items-center justify-center gap-2 sm:justify-end">
          <Pulse className="h-8 w-20 bg-surface-700" />
          <Pulse className="h-8 w-28 bg-surface-700" />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Pulse className="h-9 flex-1 min-w-[200px] " />
        <Pulse className="h-9 w-32 " />
      </div>

      {/* Table */}
      <div className="overflow-hidden border-2 border-surface-600 bg-surface-800">
        {/* Column headers */}
        <div className="border-b-2 border-surface-600 px-4 py-3">
          <div className="flex items-center gap-4">
            <Pulse className="h-3.5 w-3.5 shrink-0 rounded" />
            <Pulse className="h-3 w-20 shrink-0" />
            <Pulse className="hidden h-3 w-28 shrink-0 sm:block" />
            <Pulse className="h-3 w-14 shrink-0" />
            <Pulse className="h-3 w-14 shrink-0" />
            <Pulse className="ml-auto h-3 w-8 shrink-0" />
          </div>
        </div>

        {/* Rows */}
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-surface-600/60 px-4 py-3.5 last:border-0"
          >
            <Pulse className="h-4 w-4 shrink-0 rounded" style={{ animationDelay: `${i * 40}ms` }} />
            <div className="min-w-0 flex-1">
              <Pulse className="h-4 w-full max-w-[160px]" style={{ animationDelay: `${i * 40 + 10}ms` }} />
            </div>
            <Pulse className="hidden h-4 w-44 shrink-0 sm:block" style={{ animationDelay: `${i * 40 + 20}ms` }} />
            <Pulse className="h-4 w-20 shrink-0" style={{ animationDelay: `${i * 40 + 28}ms` }} />
            <Pulse className="h-5 w-20 shrink-0" style={{ animationDelay: `${i * 40 + 36}ms` }} />
            <Pulse className="h-7 w-7 shrink-0 " style={{ animationDelay: `${i * 40 + 44}ms` }} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <Pulse className="h-4 w-24" />
        <div className="flex items-center gap-1">
          <Pulse className="h-7 w-7 " />
          <Pulse className="h-4 w-14" />
          <Pulse className="h-7 w-7 " />
        </div>
      </div>
    </div>
  );
}
