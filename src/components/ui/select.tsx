"use client";

import { useState, useRef, useEffect, useId } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchable = false,
  error,
  required,
  disabled,
  className,
}: SelectProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /**
   * Abrir/cerrar resetea el resaltado y el buscador. Se hace acá y no en un
   * efecto: es consecuencia directa de la interacción, no sincronización con
   * algo externo, y como efecto encadenaba un render de más.
   */
  const setOpenState = (next: boolean) => {
    setOpen(next);
    setHighlighted(0);
    if (next && searchable) setSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpenState(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlighted]) {
          onChange?.(filtered[highlighted].value);
          setOpen(false);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)} ref={ref}>
      {label && (
        <label htmlFor={id} className="font-mono text-xs font-bold uppercase tracking-wider text-[#B4B2A9]">
          {label}
          {required && <span className="ml-1 text-[#D85A30]">*</span>}
        </label>
      )}
      <div
        id={id}
        role="combobox"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        className={cn(
          "relative flex h-11 min-h-11 cursor-pointer items-center justify-between gap-2 rounded-[6px] border border-[#2C2550] bg-[#1E1838] px-4 py-2.5",
          "font-mono text-sm outline-none transition-all duration-200 hover:border-[#613BB8]/60 focus:border-[#C143BC] focus:shadow-[0_0_0_3px_rgba(193,67,188,0.20)]",
          open && "border-[#C143BC] shadow-[0_0_0_3px_rgba(193,67,188,0.20)]",
          error && "border-[#E24B4A] focus:border-[#E24B4A] focus:shadow-[0_0_0_3px_rgba(226,75,74,0.20)]",
          disabled && "cursor-not-allowed opacity-50",
        )}
        onClick={() => !disabled && setOpenState(!open)}
        onKeyDown={disabled ? undefined : handleKeyDown}
      >
        <span className={cn("truncate", selected ? "text-[#E6E4DA]" : "text-[#73726C]")}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#73726C] transition-transform",
            open && "rotate-180 text-[#C143BC]",
          )}
        />

        {open && (
          <div
            id={`${id}-list`}
            ref={listRef}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-[6px] border border-[#2C2550] bg-[#1E1838] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          >
            {searchable && (
              <div className="flex items-center gap-2 border-b border-[#2C2550] px-3 py-2">
                <Search className="h-4 w-4 text-[#73726C]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-transparent font-mono text-sm text-[#E6E4DA] outline-none placeholder:text-[#73726C]"
                  placeholder="Buscar..."
                  autoFocus
                />
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="px-4 py-3 font-mono text-sm text-[#73726C]">Sin resultados</div>
            ) : (
              filtered.map((option, i) => (
                <div
                  key={option.value}
                  className={cn(
                    "cursor-pointer px-4 py-2.5 font-mono text-sm transition-colors",
                    option.value === value
                      ? "bg-[#613BB8] font-bold text-[#E6E4DA]"
                      : "text-[#B4B2A9] hover:bg-[#2A1F5E] hover:text-[#E6E4DA]",
                    i === highlighted && option.value !== value && "bg-[#2A1F5E]",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange?.(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {error && <span className="font-mono text-xs text-[#E24B4A]">{error}</span>}
    </div>
  );
}
