"use client";

import { cn } from "@/lib/utils";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  className?: string;
}

export function RadioGroup({ label, options, value, onChange, required, className }: RadioGroupProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-surface-200">
          {label}
          {required && <span className="ml-1 text-aws-orange">*</span>}
        </span>
      )}
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange?.(option.value)}
            className="inline-flex items-center gap-3 text-left"
          >
            <span
              className={cn(
                // Cuadrado, no círculo: el sitio entero es de esquina viva. Lo
                // que distingue un radio de una casilla es el bloque macizo de
                // dentro frente al visto de la casilla.
                "flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-colors",
                value === option.value
                  ? "border-aws-orange bg-aws-orange/15"
                  : "border-surface-500 bg-surface-800 hover:border-surface-400",
              )}
            >
              {value === option.value && (
                <span className="h-2.5 w-2.5 bg-aws-orange" />
              )}
            </span>
            <span className="font-mono text-sm text-surface-100">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
