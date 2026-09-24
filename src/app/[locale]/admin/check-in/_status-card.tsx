"use client";

import { CheckCircle2, AlertTriangle, XCircle, Printer, BadgeCheck, ArrowRight, MonitorPlay } from "lucide-react";

export type CheckInResult = {
  outcome: "new" | "already" | "not_found" | "error";
  name?: string;
  /** Se registró en el track online: no debería estar en la puerta. */
  online?: boolean;
  confirmed?: boolean;   // escarapela lista (confirmó asistencia)
  badgeName?: string;
  checkedInAt?: string | null;
};

function hora(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// Card grande de resultado tras escanear / check-in manual. Muestra lo más
// importante: si tenemos la escarapela lista o si falta imprimirla.
export function StatusCard({ result, onNext, nextLabel = "Siguiente" }: {
  result: CheckInResult;
  onNext: () => void;
  nextLabel?: string;
}) {
  const { outcome, name, online, confirmed, badgeName, checkedInAt } = result;

  // No registrado / error → rojo
  if (outcome === "not_found" || outcome === "error") {
    const isError = outcome === "error";
    return (
      <div className="border-2 border-red-500/50 bg-red-500/10 p-6 text-center sm:p-8">
        <div className="mx-auto flex h-24 w-24 items-center justify-center bg-red-500/20">
          <XCircle className="h-14 w-14 text-red-400" />
        </div>
        <p className="mt-5 font-mono text-3xl font-black text-red-400">
          {isError ? "Error" : "No registrado"}
        </p>
        <p className="mt-2 font-mono text-sm text-surface-300">
          {isError ? "Reintenta o usa el check-in manual" : "Esta persona no está en la lista de registrados"}
        </p>
        <NextButton onNext={onNext} label={nextLabel} />
      </div>
    );
  }

  // Registrado → la escarapela es lo que define el color y la acción
  const ready = !!confirmed;
  return (
    <div className={`border-2 p-6 text-center sm:p-8 ${ready ? "border-emerald-500/50 bg-emerald-500/10" : "border-amber-500/50 bg-amber-500/10"}`}>
      {/* Resultado del check-in (secundario, arriba) */}
      <div className="mb-4 flex justify-center">
        {outcome === "new" ? (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Check-in registrado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-yellow-500/15 px-3 py-1 font-mono text-xs font-semibold text-yellow-400">
            <AlertTriangle className="h-3.5 w-3.5" /> Ya tenía check-in{checkedInAt ? ` · ${hora(checkedInAt)}` : ""}
          </span>
        )}
      </div>

      {/* Escarapela (lo principal) */}
      <div className={`mx-auto flex h-24 w-24 items-center justify-center ${ready ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
        {ready ? <BadgeCheck className="h-14 w-14 text-emerald-400" /> : <Printer className="h-14 w-14 text-amber-400" />}
      </div>
      <p className={`mt-5 font-mono text-3xl font-black leading-tight ${ready ? "text-emerald-400" : "text-amber-400"}`}>
        {ready ? "ESCARAPELA LISTA" : "FALTA ESCARAPELA"}
      </p>
      <p className="mt-2 font-mono text-sm text-surface-300">
        {ready ? "Ya está impresa — entrégala" : "Imprimir / entregar ahora"}
      </p>

      {/* Aviso de modalidad.
          Va después del resultado y antes del nombre porque cambia lo que hay
          que hacer: esta persona se inscribió para seguir la transmisión, no
          tiene pasaporte y su escarapela no está prevista. */}
      {online && (
        <div className="mt-5 border-2 border-sky-400/60 bg-sky-400/10 p-4">
          <p className="flex items-center justify-center gap-2 font-mono text-base font-black text-sky-300">
            <MonitorPlay className="h-5 w-5" /> REGISTRO ONLINE
          </p>
          <p className="mt-1.5 font-mono text-xs leading-relaxed text-surface-300">
            Se inscribió para el track online: no tiene pasaporte ni pase impreso.
            Si va a entrar, pásalo a presencial desde la consola antes de darle
            escarapela.
          </p>
        </div>
      )}

      {/* Identidad */}
      <div className="mt-5 bg-surface-800 p-4">
        <p className="font-mono text-xl font-bold text-surface-50 break-words">{name || "Asistente"}</p>
        {ready && badgeName && (
          <p className="mt-1.5 font-mono text-sm text-surface-300">
            Escarapela: <span className="font-bold uppercase text-surface-100">{badgeName}</span>
          </p>
        )}
      </div>

      <NextButton onNext={onNext} label={nextLabel} />
    </div>
  );
}

function NextButton({ onNext, label }: { onNext: () => void; label: string }) {
  return (
    <button
      onClick={onNext}
      className="mt-6 flex w-full items-center justify-center gap-2 bg-aws-orange px-6 py-4 font-mono text-lg font-bold text-surface-900 transition-transform active:scale-[0.98]"
    >
      {label} <ArrowRight className="h-5 w-5" />
    </button>
  );
}
