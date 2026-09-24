"use client";

import { forwardRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Campo de búsqueda del panel.
 *
 * Borde duro de 2px como el resto, y 44px de alto para poder tocarlo. El texto
 * de sugerencia va en `surface-400`: `surface-500` no tiene contraste suficiente.
 */

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, onChange, ...props }, ref) => {
    return (
      <div className={cn("relative", className)}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
        <input
          ref={ref}
          type="search"
          className={cn(
            "min-h-11 w-full border-2 border-surface-600 bg-surface-800 py-2.5 pl-10 pr-3",
            "font-mono text-sm text-surface-100 placeholder:text-surface-400",
            "outline-none transition-colors focus:border-aws-orange",
          )}
          onChange={(e) => {
            onChange?.(e);
            onSearch?.(e.target.value);
          }}
          {...props}
        />
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
