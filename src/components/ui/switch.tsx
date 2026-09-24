"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function Switch({ label, checked = false, onChange, className, disabled }: SwitchProps) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-3",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          // Rectángulo con borde, no una píldora: en este sitio no hay nada
          // redondo. Se lee igual —la pastilla a la izquierda o a la derecha—
          // y el encendido va en el acento, que es como se marca lo activo.
          "relative h-7 w-12 shrink-0 border-2 transition-colors",
          checked ? "border-aws-orange bg-aws-orange" : "border-surface-500 bg-surface-800",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 transition-transform",
            checked ? "translate-x-5 bg-surface-900" : "bg-surface-400",
          )}
        />
      </button>
      {label && <span className="font-mono text-sm text-surface-100">{label}</span>}
    </label>
  );
}
