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
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked ? "border-[#C143BC] bg-[#C143BC]" : "border-[#2C2550] bg-[#1E1838]",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full transition-transform",
            checked ? "translate-x-5 bg-[#0E0E1A]" : "bg-[#73726C]",
          )}
        />
      </button>
      {label && <span className="font-mono text-sm text-[#E6E4DA]">{label}</span>}
    </label>
  );
}
