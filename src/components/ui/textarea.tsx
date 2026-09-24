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
          <label htmlFor={id} className="font-mono text-xs font-bold uppercase tracking-widest text-surface-200">
            {label}
            {props.required && <span className="ml-1 text-aws-orange">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          value={value}
          maxLength={maxLength}
          className={cn(
            "min-h-[100px] w-full resize-y border-2 border-surface-600 bg-surface-800 px-4 py-3",
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

Textarea.displayName = "Textarea";
