"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Tipos del API de Turnstile (render explícito)
interface TurnstileRenderOptions {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "flexible";
  appearance?: "always" | "execute" | "interaction-only";
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: TurnstileRenderOptions) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

// Carga el script de Turnstile una sola vez.
function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("turnstile load error")));
      if (window.turnstile) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.dataset.turnstile = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile load error"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export interface TurnstileHandle {
  reset: () => void;
}

interface TurnstileProps {
  siteKey: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "flexible";
  /**
   * Cuándo se ve el widget.
   *
   * `always` es el comportamiento por defecto: la caja de verificación está
   * siempre. `interaction-only` la deja invisible y sólo la muestra si
   * Cloudflare sospecha del visitante — la comprobación ocurre igual y el
   * token se emite igual, lo que cambia es que una persona normal no ve nada.
   *
   * Ojo con el alto: en ese modo el widget no ocupa lugar hasta que aparece,
   * así que quien lo use decide si reserva espacio o acepta que el formulario
   * crezca en el caso raro en que haya desafío.
   */
  appearance?: "always" | "execute" | "interaction-only";
  onVerify?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

// Widget de Turnstile. Expone ref.reset() y los callbacks onVerify / onError / onExpire.
export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(function Turnstile(
  { siteKey, theme = "dark", size = "normal", appearance = "always", onVerify, onError, onExpire },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // Para usar siempre los callbacks más recientes sin re-renderizar el widget.
  const cbs = useRef({ onVerify, onError, onExpire });
  cbs.current = { onVerify, onError, onExpire };

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }), []);

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || widgetId.current || !containerRef.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size,
          appearance,
          callback: (token) => cbs.current.onVerify?.(token),
          "error-callback": () => cbs.current.onError?.(),
          "expired-callback": () => cbs.current.onExpire?.(),
        });
      })
      .catch(() => cbs.current.onError?.());

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch { /* ya no existe */ }
        widgetId.current = null;
      }
    };
    // Solo re-renderiza si cambia la site key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  return <div ref={containerRef} />;
});
