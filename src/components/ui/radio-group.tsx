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
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#B4B2A9]">
          {label}
          {required && <span className="ml-1 text-[#D85A30]">*</span>}
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
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                value === option.value
                  ? "border-[#C143BC] bg-[#C143BC]/15"
                  : "border-[#2C2550] bg-[#1E1838] hover:border-[#613BB8]",
              )}
            >
              {value === option.value && (
                <span className="h-2.5 w-2.5 rounded-full bg-[#C143BC]" />
              )}
            </span>
            <span className="font-mono text-sm text-[#E6E4DA]">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
