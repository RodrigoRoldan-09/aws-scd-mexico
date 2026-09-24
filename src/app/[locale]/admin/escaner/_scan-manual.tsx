"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2, UserCheck, ChevronLeft, AlertTriangle } from "lucide-react";
import { ScanStatus, type ScanResult } from "./_scan-status";

type Hit = { shortId: string; firstName: string; lastName: string; role: string };

const ROLE_LABEL: Record<string, string> = {
  attendee: "Asistente",
  speaker: "Speaker",
  volunteer: "Voluntario",
  organizer: "Organizador",
};

// Flujo de respaldo genérico: busca un pasaporte por nombre, lo selecciona y
// confirma la acción (registrar asistencia / entregar comida) con un botón grande.
export function ScanManual({ actionLabel, confirm, disabled, disabledHint }: {
  actionLabel: string;
  confirm: (shortId: string) => Promise<ScanResult>;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Hit | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/scanner/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const doConfirm = async (hit: Hit) => {
    setProcessing(true);
    try {
      setResult(await confirm(hit.shortId));
    } catch {
      setResult({ outcome: "error", primary: "Error de conexión" });
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setSelected(null);
    setQuery("");
    setResults([]);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Acción no disponible (p. ej. salas sin sesión seleccionada)
  if (disabled) {
    return (
      <div className="border border-amber-500/30 bg-amber-500/5 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
        <p className="mt-3 font-mono text-sm text-amber-300">{disabledHint || "Acción no disponible"}</p>
      </div>
    );
  }

  // 1) Resultado
  if (result) {
    return <ScanStatus result={result} onNext={reset} nextLabel="Buscar otro" />;
  }

  // 2) Seleccionado → botón gigante
  if (selected) {
    const fullName = `${selected.firstName} ${selected.lastName}`.trim() || "Sin nombre";
    return (
      <div className="border-2 border-surface-600 bg-surface-800 p-6 text-center sm:p-8">
        <p className="font-mono text-2xl font-black text-surface-50 break-words">{fullName}</p>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-surface-400">
          {ROLE_LABEL[selected.role] ?? selected.role}
        </p>

        <button
          onClick={() => doConfirm(selected)}
          disabled={processing}
          className="mt-6 flex w-full items-center justify-center gap-2.5 bg-emerald-500 px-6 py-6 font-mono text-xl font-black text-surface-900 transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {processing ? <Loader2 className="h-7 w-7 animate-spin" /> : <UserCheck className="h-7 w-7" />}
          {actionLabel}
        </button>

        <button
          onClick={() => setSelected(null)}
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-sm text-surface-400 transition-colors hover:text-surface-200"
        >
          <ChevronLeft className="h-4 w-4" /> Volver a la búsqueda
        </button>
      </div>
    );
  }

  // 3) Búsqueda
  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-300" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          inputMode="search"
          autoFocus
          placeholder="Buscar por nombre o documento..."
          className="w-full border-2 border-surface-600 bg-surface-800 py-4 pl-12 pr-11 font-mono text-base text-surface-100 placeholder:text-surface-400 focus:border-aws-orange focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-surface-400 hover:bg-surface-700 hover:text-surface-200">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {searching && (
        <div className="flex items-center justify-center gap-2 py-8 font-mono text-sm text-surface-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
        </div>
      )}

      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <p className="py-8 text-center font-mono text-sm text-surface-300">Sin resultados para “{query.trim()}”</p>
      )}

      {!searching && query.trim().length < 2 && (
        <p className="py-8 text-center font-mono text-sm text-surface-300">Escribe al menos 2 caracteres para buscar</p>
      )}

      <div className="flex flex-col gap-2">
        {results.map((hit) => (
          <button
            key={hit.shortId}
            onClick={() => setSelected(hit)}
            className="flex items-center justify-between gap-3 border-2 border-surface-600 bg-surface-700/40 p-4 text-left transition-colors hover:border-aws-orange hover:bg-surface-800 active:scale-[0.99]"
          >
            <p className="font-mono text-base font-bold text-surface-50 truncate">
              {`${hit.firstName} ${hit.lastName}`.trim() || "Sin nombre"}
            </p>
            <span className="shrink-0 bg-surface-700 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-surface-300">
              {ROLE_LABEL[hit.role] ?? hit.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
