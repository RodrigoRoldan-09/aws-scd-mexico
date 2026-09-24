"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps {
  label?: string;
  labelNode?: React.ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function Checkbox({ label, labelNode, checked = false, onChange, className, disabled }: CheckboxProps) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex cursor-pointer items-start gap-3",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <button
        id={id}
        role="checkbox"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          checked
            ? "border-[#C143BC] bg-[#C143BC] text-[#0E0E1A]"
            : "border-[#2C2550] bg-[#1E1838] hover:border-[#C143BC]",
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
      {labelNode
        ? <span className="font-mono text-sm leading-relaxed text-[#B4B2A9]">{labelNode}</span>
        : label && <span className="font-mono text-sm leading-relaxed text-[#B4B2A9]">{label}</span>
      }
    </label>
  );
}
