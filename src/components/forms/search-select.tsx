"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Desplegable con buscador, hecho a mano.
 *
 * No usa `<select>` nativo por dos razones: en el móvil el nativo abre una
 * rueda del sistema que no se puede filtrar —y con veinte roles agrupados eso
 * es desplazarse a ciegas—, y su apariencia la decide el sistema operativo,
 * así que rompería el bloque morado.
 *
 * Se puede manejar entero con el teclado: flechas para moverse, Enter para
 * elegir, Escape para cerrar. Al abrir, el foco va al buscador.
 */

export type SelectOption = {
  value: string;
  label: string;
  /** Encabezado bajo el que se agrupa. Sin esto, la lista va plana. */
  group?: string;
};

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Selecciona una opción",
  searchPlaceholder = "Buscar…",
  emptyLabel = "Sin resultados",
  id,
  invalid,
  className,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  id?: string;
  invalid?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // Se busca sin tildes: quien escribe "tecnico" espera encontrar "técnico".
    const strip = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const nq = strip(q);
    return options.filter((o) => strip(o.label).includes(nq) || strip(o.group ?? "").includes(nq));
  }, [options, query]);

  // Cierra al hacer clic fuera.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // El efecto sólo mueve el foco. Reiniciar el buscador desde acá seria
  // cambiar estado como reaccion a estado, que encadena un render de mas; se
  // hace en el manejador que abre, que es donde de verdad ocurre el evento.
  useEffect(() => {
    if (!open) return;
    // Se espera un cuadro: el desplegable acaba de entrar en el DOM.
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const toggle = () => {
    setOpen((wasOpen) => {
      if (!wasOpen) {
        setQuery("");
        setActive(0);
      }
      return !wasOpen;
    });
  };

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[active];
      if (opt) pick(opt.value);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  /**
   * Cada opción con el encabezado que le toca, o null si sigue en el mismo
   * grupo que la anterior.
   *
   * Se calcula de una vez y no mutando una variable dentro del `map`: React
   * puede volver a renderizar el mismo árbol, y una variable acumulada durante
   * el render arrastra el valor de la pasada anterior. Se mantiene el orden de
   * `filtered` para que el índice del teclado y lo que se ve en pantalla no se
   * puedan desincronizar.
   */
  const rows = useMemo(
    () =>
      filtered.map((o, i) => ({
        option: o,
        header: o.group && o.group !== filtered[i - 1]?.group ? o.group : null,
      })),
    [filtered],
  );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-2 border-2 bg-white/55 px-4 py-3 text-left font-mono text-sm transition-all",
          "hover:border-hack-ink focus:border-hack-ink focus:outline-none",
          invalid ? "border-error" : "border-hack-ink/35",
          selected ? "text-hack-ink" : "text-hack-ink/45",
        )}
      >
        <span className="min-w-0 truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-30 mt-1 border-2 border-hack-ink bg-hack-block shadow-[6px_6px_0_0_rgba(0,0,0,0.35)]"
          >
            <div className="relative border-b-2 border-hack-ink/25">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-hack-ink/50"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full border-0 bg-white/55 py-2.5 pl-9 pr-3 font-mono text-sm text-hack-ink outline-none placeholder:text-hack-ink/40"
              />
            </div>

            <ul role="listbox" className="m-0 max-h-64 list-none overflow-y-auto p-0">
              {filtered.length === 0 && (
                <li className="px-3 py-3 font-mono text-xs text-hack-ink/50">{emptyLabel}</li>
              )}
              {rows.map(({ option: o, header }, i) => (
                  <li key={o.value}>
                    {header && (
                      <p className="dot-matrix m-0 border-b border-hack-ink/15 bg-hack-ink/5 px-3 py-1.5 text-sm leading-none text-hack-deep">
                        {header}
                      </p>
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={o.value === value}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(o.value)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left font-mono text-sm transition-colors",
                        i === active ? "bg-hack-ink text-hack-block" : "text-hack-ink",
                      )}
                    >
                      <span className="min-w-0">{o.label}</span>
                      {o.value === value && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
