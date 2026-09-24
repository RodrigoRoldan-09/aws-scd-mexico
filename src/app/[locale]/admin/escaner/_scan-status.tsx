"use client";

import { CheckCircle2, AlertTriangle, XCircle, ArrowRight } from "lucide-react";

export type ScanOutcome = "success" | "already" | "not_found" | "error";

export type ScanResult = {
  outcome: ScanOutcome;
  primary: string;      // título grande
  name?: string;
  secondary?: string;   // línea secundaria (hora, quién registró, etc.)
  role?: string;
};

const ROLE_LABEL: Record<string, string> = {
  attendee: "Asistente",
  speaker: "Speaker",
  volunteer: "Voluntario",
  organizer: "Organizador",
};

// Card grande de resultado tras escanear / registrar manualmente.
export function ScanStatus({ result, onNext, nextLabel = "Siguiente" }: {
  result: ScanResult;
  onNext: () => void;
  nextLabel?: string;
}) {
  const { outcome, primary, name, secondary, role } = result;

  const s = outcome === "success"
    ? { border: "border-emerald-500/50", bg: "bg-emerald-500/10", iconBg: "bg-emerald-500/20", text: "text-emerald-400", Icon: CheckCircle2 }
    : outcome === "already"
    ? { border: "border-amber-500/50", bg: "bg-amber-500/10", iconBg: "bg-amber-500/20", text: "text-amber-400", Icon: AlertTriangle }
    : { border: "border-red-500/50", bg: "bg-red-500/10", iconBg: "bg-red-500/20", text: "text-red-400", Icon: XCircle };

  const Icon = s.Icon;

  return (
    <div className={`border-2 p-6 text-center sm:p-8 ${s.border} ${s.bg}`}>
      <div className={`mx-auto flex h-24 w-24 items-center justify-center ${s.iconBg}`}>
        <Icon className={`h-14 w-14 ${s.text}`} />
      </div>

      <p className={`mt-5 font-mono text-2xl font-black leading-tight sm:text-3xl ${s.text}`}>{primary}</p>
      {secondary && <p className="mt-2 font-mono text-sm text-surface-300">{secondary}</p>}

      {name && (
        <div className="mt-5 bg-surface-800 p-4">
          <p className="font-mono text-xl font-bold text-surface-50 break-words">{name}</p>
          {role && (
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-surface-400">
              {ROLE_LABEL[role] ?? role}
            </p>
          )}
        </div>
      )}

      <button
        onClick={onNext}
        className="mt-6 flex w-full items-center justify-center gap-2 bg-aws-orange px-6 py-4 font-mono text-lg font-bold text-surface-900 transition-transform active:scale-[0.98]"
      >
        {nextLabel} <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
