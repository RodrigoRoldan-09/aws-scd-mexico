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
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors",
          checked
            ? "border-aws-orange bg-aws-orange text-surface-900"
            : "border-surface-500 bg-surface-800 hover:border-aws-orange",
        )}
      >
        {checked && <Check className="h-4 w-4" strokeWidth={3} />}
      </button>
      {labelNode
        ? <span className="font-mono text-sm leading-relaxed text-surface-200">{labelNode}</span>
        : label && <span className="font-mono text-sm leading-relaxed text-surface-200">{label}</span>
      }
    </label>
  );
}
