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
        <label htmlFor={id} className="font-mono text-xs font-bold uppercase tracking-widest text-surface-200">
          {label}
          {required && <span className="ml-1 text-aws-orange">*</span>}
        </label>
      )}
      <div
        id={id}
        role="combobox"
        tabIndex={0}
        aria-expanded={open}
        className={cn(
          // Caja dura, como los campos: esquina viva, borde de 2px y el foco
          // engordando el borde en vez de un anillo difuminado alrededor.
          "relative flex min-h-11 cursor-pointer items-center justify-between gap-2 border-2 border-surface-600 bg-surface-800 px-4 py-2.5",
          "font-mono text-sm outline-none transition-colors hover:border-surface-500 focus:border-aws-orange",
          open && "border-aws-orange",
          error && "border-red-500",
          disabled && "cursor-not-allowed opacity-50",
        )}
        onClick={() => !disabled && setOpenState(!open)}
        onKeyDown={disabled ? undefined : handleKeyDown}
      >
        <span className={cn("truncate", selected ? "text-surface-100" : "text-surface-400")}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-surface-400 transition-transform",
            open && "rotate-180",
          )}
        />

        {open && (
          <div
            ref={listRef}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto border-2 border-surface-500 bg-surface-800 shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]"
          >
            {searchable && (
              <div className="flex items-center gap-2 border-b-2 border-surface-600 px-3 py-2">
                <Search className="h-4 w-4 text-surface-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-transparent font-mono text-sm text-surface-100 outline-none placeholder:text-surface-400"
                  placeholder="Buscar..."
                  autoFocus
                />
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="px-4 py-3 font-mono text-sm text-surface-300">Sin resultados</div>
            ) : (
              filtered.map((option, i) => (
                <div
                  key={option.value}
                  className={cn(
                    "cursor-pointer px-4 py-2.5 font-mono text-sm transition-colors",
                    option.value === value
                      ? "bg-aws-orange font-bold text-surface-900"
                      : "text-surface-200 hover:bg-surface-700",
                    i === highlighted && option.value !== value && "bg-surface-700",
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
      {error && <span className="font-mono text-xs text-red-400">{error}</span>}
    </div>
  );
}
