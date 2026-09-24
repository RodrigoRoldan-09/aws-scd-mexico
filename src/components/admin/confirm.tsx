"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { AlertTriangle } from "lucide-react";
import { HardButton } from "@/components/admin/ui";

/**
 * Confirmación propia, en vez del `confirm()` del navegador (que no sigue el
 * estilo del panel y bloquea el hilo).
 *
 * Se usa como el nativo pero con `await`, así que cambiar cada sitio es
 * cambiar una línea:
 *
 *     const { confirm, dialog } = useConfirm();
 *     if (!(await confirm({ title: "…", message: "…" }))) return;
 *     // …y renderizar {dialog} en el JSX
 */

export type ConfirmOptions = {
  title: string;
  /** Qué va a pasar exactamente. Es el sitio para decir lo que se borra. */
  message: string;
  /** Texto del botón que confirma. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` para lo que no se puede deshacer. */
  tone?: "danger" | "accent";
};

export function useConfirm() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const answer = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpts(null);
  }, []);

  const dialog = <ConfirmDialog opts={opts} onAnswer={answer} />;

  return { confirm, dialog };
}

function ConfirmDialog({
  opts,
  onAnswer,
}: {
  opts: ConfirmOptions | null;
  onAnswer: (value: boolean) => void;
}) {
  const okRef = useRef<HTMLDivElement>(null);

  // Esc cancela y el foco entra en el diálogo, como en el nativo.
  // Suele abrirse encima de un modal, que ya tiene el fondo congelado: el
  // candado lleva cuenta de cuántos hay para no soltarlo antes de tiempo.
  useScrollLock(!!opts);

  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAnswer(false);
    };
    document.addEventListener("keydown", onKey);
    okRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [opts, onAnswer]);

  if (!opts) return null;

  const danger = opts.tone !== "accent";

  // Va por portal a `body` y por encima del Modal (z-[100]); el portal además
  // la saca de ancestros con `transform`/`filter`, que anularían el z-index.
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={opts.title}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-4"
      onClick={() => onAnswer(false)}
    >
      <div
        ref={okRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md border-2 bg-surface-800 outline-none ${
          danger ? "border-red-500 shadow-[8px_8px_0_0_rgba(239,68,68,0.35)]" : "border-aws-orange shadow-[8px_8px_0_0_var(--color-aws-orange-dark)]"
        }`}
      >
        <div className={`flex items-center gap-2 border-b-2 px-4 py-3 ${danger ? "border-red-500/60" : "border-aws-orange/60"}`}>
          <AlertTriangle className={`h-4 w-4 shrink-0 ${danger ? "text-red-400" : "text-aws-orange"}`} />
          <p className="dot-matrix m-0 text-lg leading-none text-surface-50">{opts.title}</p>
        </div>

        <p className="m-0 px-4 py-5 font-mono text-sm leading-relaxed text-surface-100">
          {opts.message}
        </p>

        <div className="grid grid-cols-2 gap-2 border-t-2 border-surface-600 px-4 py-3 sm:flex sm:justify-end">
          <HardButton tone="ghost" onClick={() => onAnswer(false)}>
            {opts.cancelLabel ?? "Cancelar"}
          </HardButton>
          <HardButton tone={danger ? "danger" : "accent"} onClick={() => onAnswer(true)}>
            {opts.confirmLabel ?? "Sí, continuar"}
          </HardButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
