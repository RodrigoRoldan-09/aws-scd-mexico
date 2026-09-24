"use client";

import { useTranslations } from "next-intl";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { COUNTRIES, DEFAULT_COUNTRY, digitsOnly, findCountry, type Country } from "@/lib/normalize";
import { cn } from "@/lib/utils";

/**
 * Teléfono con indicativo de país.
 *
 * El desplegable es propio, no un `<select>` nativo: se navega con teclado
 * (flechas, Enter, Esc), se filtra escribiendo y se cierra al hacer clic fuera.
 * El campo del número sólo acepta dígitos — los espacios, guiones y paréntesis
 * se descartan al teclear, así que es imposible guardar un número con espacios.
 */
export function PhoneInput({
  countryCode,
  onCountryChange,
  value,
  onChange,
  error,
  label,
  required,
}: {
  countryCode: string;
  onCountryChange: (code: string) => void;
  /** Número local, sin indicativo. */
  value: string;
  onChange: (local: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
}) {
  const t = useTranslations("Forms");
  const country = findCountry(countryCode);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = COUNTRIES.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dial.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  // Cierra al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Al abrir, el foco va al buscador. El reset del filtro se hace en el
  // handler (`toggle`), no acá: cambiar estado dentro de un efecto encadena
  // renders de más.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const toggle = () => {
    setOpen((o) => {
      if (!o) {
        setQuery("");
        setActive(0);
      }
      return !o;
    });
  };

  const pick = (c: Country) => {
    onCountryChange(c.code);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && filtered[active]) {
      e.preventDefault();
      pick(filtered[active]);
    }
  };

  const expected = Array.isArray(country.digits)
    ? `${country.digits[0]}–${country.digits[1]}`
    : String(country.digits);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="font-mono text-sm text-hack-ink/85">
          {label}
          {required && <span className="ml-1 text-hack-deep">*</span>}
        </label>
      )}

      <div ref={boxRef} className="relative flex">
        {/* Indicativo */}
        <button
          type="button"
          onClick={toggle}
          onKeyDown={onKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex shrink-0 items-center gap-2 border-2 border-r-0 px-3 py-3 font-mono text-sm transition-colors",
            "border-hack-ink/25 bg-white/55 text-hack-ink hover:border-hack-ink",
          )}
        >
          {/* `font-flag` antepone la fuente de banderas (ver globals.css):
              sin ella Windows dibuja dos letras sueltas en vez del emoji. */}
          <span aria-hidden="true" className="font-flag text-base leading-none">
            {country.flag}
          </span>
          <span className="tabular-nums">{country.dial}</span>
          <svg viewBox="0 0 24 24" className={cn("h-3 w-3 transition-transform", open && "rotate-180")} aria-hidden="true">
            <path d="M5 9l7 7 7-7" stroke="currentColor" strokeWidth="2.5" fill="none" />
          </svg>
        </button>

        {/* Número: sólo dígitos, sin autocompletado del navegador */}
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(digitsOnly(e.target.value).slice(0, 15))}
          onPaste={(e) => {
            // Al pegar "+52 55 1234 5678" se quedan sólo los dígitos.
            e.preventDefault();
            const text = e.clipboardData.getData("text");
            onChange(digitsOnly(text).slice(0, 15));
          }}
          placeholder={"0".repeat(Array.isArray(country.digits) ? country.digits[0] : country.digits)}
          aria-label={label ?? t("phone_label")}
          className={cn(
            "w-full border-2 bg-white/55 px-4 py-3 font-mono text-sm tabular-nums text-hack-ink outline-none transition-colors",
            "placeholder:text-hack-ink/40 focus:border-hack-ink",
            error ? "border-error" : "border-hack-ink/25",
          )}
        />

        {/* Desplegable */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-30 mt-1 w-[min(20rem,100%)] border-2 border-hack-ink bg-hack-block shadow-[6px_6px_0_0_rgba(0,0,0,0.5)]"
            >
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={t("phone_search")}
                aria-label={t("phone_search_aria")}
                className="w-full border-b-2 border-hack-ink/25 bg-white/55 px-3 py-2.5 font-mono text-sm text-hack-ink outline-none placeholder:text-hack-ink/40"
              />
              <ul role="listbox" className="max-h-60 overflow-y-auto">
                {filtered.length === 0 && (
                  <li className="px-3 py-3 font-mono text-xs text-hack-ink/50">{t("phone_no_results")}</li>
                )}
                {filtered.map((c, i) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={c.code === country.code}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(c)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left font-mono text-sm transition-colors",
                        i === active ? "bg-hack-ink text-hack-block" : "text-hack-ink/85",
                      )}
                    >
                      <span aria-hidden="true" className="font-flag text-base leading-none">
                        {c.flag}
                      </span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="tabular-nums opacity-70">{c.dial}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between gap-3">
        {error ? (
          <span className="font-mono text-xs text-red-400">{error}</span>
        ) : (
          <span className="font-mono text-xs text-hack-ink/50">
            {country.name} · {expected} dígitos
          </span>
        )}
        <span className="ml-auto shrink-0 font-mono text-xs text-hack-ink/40 tabular-nums">
          {value.length}
        </span>
      </div>
    </div>
  );
}

export { DEFAULT_COUNTRY };
