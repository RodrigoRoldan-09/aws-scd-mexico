"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  showCount?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, showCount, maxLength, className, value, ...props }, ref) => {
    const id = useId();
    const length = typeof value === "string" ? value.length : 0;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="font-mono text-xs font-bold uppercase tracking-widest text-surface-200">
            {label}
            {props.required && <span className="ml-1 text-aws-orange">*</span>}
          </label>
        )}
        <input
          suppressHydrationWarning
          ref={ref}
          id={id}
          value={value}
          maxLength={maxLength}
          className={cn(
            // Caja dura: esquina viva, borde de 2px y nada de resplandores.
            // El foco engorda el borde y lo levanta un pelo, igual que en los
            // formularios públicos.
            "min-h-11 w-full border-2 border-surface-600 bg-surface-800 px-4 py-2.5",
            "font-mono text-sm text-surface-100 placeholder:text-surface-400",
            "outline-none transition-colors hover:border-surface-500 focus:border-aws-orange",
            error && "border-red-500 focus:border-red-500",
            className,
          )}
          {...props}
        />
        <div className="flex justify-between">
          {error && <span className="font-mono text-xs text-red-400">{error}</span>}
          {showCount && maxLength && (
            <span className="ml-auto font-mono text-xs text-surface-300">
              {length}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  },
);

Input.displayName = "Input";
