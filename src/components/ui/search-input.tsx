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
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#73726C]" />
        <input
          ref={ref}
          type="search"
          className={cn(
            "h-11 min-h-11 w-full rounded-[6px] border border-[#2C2550] bg-[#1E1838] py-2.5 pl-10 pr-3",
            "font-mono text-sm text-[#E6E4DA] placeholder:text-[#73726C]",
            "outline-none transition-all duration-200 hover:border-[#613BB8]/60 focus:border-[#C143BC] focus:shadow-[0_0_0_3px_rgba(193,67,188,0.20)]",
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
