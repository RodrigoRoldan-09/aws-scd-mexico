"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, showCount, maxLength, className, value, ...props }, ref) => {
    const id = useId();
    const length = typeof value === "string" ? value.length : 0;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="font-mono text-xs font-bold uppercase tracking-wider text-[#B4B2A9]">
            {label}
            {props.required && <span className="ml-1 text-[#D85A30]">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          value={value}
          maxLength={maxLength}
          className={cn(
            "min-h-[100px] w-full resize-y rounded-[6px] border border-[#2C2550] bg-[#1E1838] px-4 py-3",
            "font-mono text-sm text-[#E6E4DA] placeholder:text-[#73726C]",
            "outline-none transition-all duration-200 hover:border-[#613BB8]/60 focus:border-[#C143BC] focus:shadow-[0_0_0_3px_rgba(193,67,188,0.20)]",
            error && "border-[#E24B4A] focus:border-[#E24B4A] focus:shadow-[0_0_0_3px_rgba(226,75,74,0.20)]",
            className,
          )}
          {...props}
        />
        <div className="flex justify-between">
          {error && <span className="font-mono text-xs text-[#E24B4A]">{error}</span>}
          {showCount && maxLength && (
            <span className="ml-auto font-mono text-xs text-[#73726C]">
              {length}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
