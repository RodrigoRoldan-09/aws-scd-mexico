"use client";

import { ChevronLeft, ChevronRight, ChevronRight as Flecha } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Piezas del panel, con el mismo lenguaje que el sitio público: esquinas
 * duras, borde de 2px, sombra dura desplazada, títulos de matriz de puntos y el
 * acento de marca. `surface-300` es el gris más oscuro que se usa para texto.
 *
 * Todo va pensado para el teléfono primero. Dos reglas que se repiten:
 *
 * - Lo que se toca mide 44px de alto (`min-h-11`).
 * - En móvil los botones y los desplegables ocupan el ancho o van de dos en
 *   dos, nunca en una fila que se sale.
 */

/* ─────────────────────────────── Cabeceras ─────────────────────────────── */

/**
 * Cabecera de pantalla: el letrero y las acciones a la derecha. Sin bajada a
 * propósito.
 */
export function PageHead({
  title,
  actions,
}: {
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 border-b-2 border-surface-600 pb-4 sm:mb-6 sm:pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {/* Letrero de puntos, liso y sin animación: en una pantalla de trabajo
            tiene que leerse de un vistazo. */}
        <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
          {title}
        </h1>
      </div>
      {actions && (
        // En móvil las acciones van de dos en dos y ocupan el ancho; desde `sm`
        // vuelven a ser botones sueltos alineados a la derecha.
        <div
          className={cn(
            "grid grid-cols-2 gap-2",
            // Si son impares, el último ocupa la fila entera. Con tres botones
            // quedaba uno suelto a media anchura y la cabecera se veía torcida.
            "[&>*:last-child:nth-child(odd)]:col-span-2",
            "sm:flex sm:flex-wrap sm:items-center lg:justify-end",
            "[&>*]:w-full sm:[&>*]:w-auto sm:[&>*:last-child:nth-child(odd)]:col-span-1",
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

/** Título de sección dentro de una pantalla. */
export function SectionHead({
  title,
  lead,
  tone = "ink",
  actions,
}: {
  title: string;
  lead?: string;
  tone?: "ink" | "danger";
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2
          className={cn(
            "dot-matrix m-0 text-lg leading-none sm:text-xl",
            tone === "danger" ? "text-red-400" : "text-[#E6E4DA]",
          )}
        >
          {title}
        </h2>
        {lead && (
          <p className="m-0 mt-1.5 max-w-[72ch] font-mono text-xs leading-relaxed text-[#B4B2A9]">
            {lead}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ──────────────────────────────── Cifras ───────────────────────────────── */

/** Rejilla de cifras: de dos en dos en el teléfono, en fila en el escritorio. */
export function Stats({
  children,
  cols = 4,
  className,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  const anchas = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4", 5: "sm:grid-cols-3 lg:grid-cols-5" }[cols];
  return (
    <div
      className={cn(
        "mb-5 grid grid-cols-2 gap-2 sm:gap-3",
        // Igual que en la cabecera: con cinco cifras, la última no se queda
        // sola a media anchura.
        "[&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1",
        anchas,
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Una cifra.
 *
 * Cuando lleva `onClick` es además un filtro: el día del evento lo que se hace
 * es mirar un número y querer ver quiénes son.
 */
export function Stat({
  value,
  label,
  hint,
  tone = "ink",
  onClick,
  active,
}: {
  value: number | string;
  label: string;
  hint?: string;
  tone?: "ink" | "accent" | "good" | "warn" | "info" | "danger";
  onClick?: () => void;
  /** Si esta cifra es el filtro que está puesto ahora mismo. */
  active?: boolean;
}) {
  const color = {
    ink: "text-surface-50",
    accent: "text-[#D85A30]",
    good: "text-[#3DD6D0]",
    warn: "text-amber-400",
    info: "text-[#378ADD]",
    danger: "text-red-400",
  }[tone];

  const inner = (
    <>
      <span className={cn("block font-mono text-2xl font-black leading-none tabular-nums sm:text-3xl", color)}>
        {value}
      </span>
      <span className="mt-1.5 block font-mono text-[10px] font-bold uppercase leading-tight tracking-widest text-surface-200 sm:text-[11px]">
        {label}
      </span>
      {hint && <span className="mt-1 block font-mono text-[10px] text-surface-300">{hint}</span>}
    </>
  );

  const base =
    "border-2 bg-surface-800 px-3 py-3 text-left transition-all sm:px-4 sm:py-4";

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        base,
        active
          ? "border-[#D85A30] shadow-[4px_4px_0_0_rgba(216,90,48,0.35)]"
          : "border-surface-600 hover:-translate-y-0.5 hover:border-[#D85A30] hover:shadow-[4px_4px_0_0_rgba(216,90,48,0.35)]",
      )}
    >
      {inner}
    </button>
  ) : (
    <div className={cn(base, "border-surface-600")}>{inner}</div>
  );
}

/* ──────────────────────────────── Bloques ──────────────────────────────── */

/** Bloque con borde duro y sombra desplazada. */
export function Panel({
  label,
  children,
  tone = "ink",
  className,
  bodyClassName,
  actions,
}: {
  label?: string;
  children: React.ReactNode;
  tone?: "ink" | "danger" | "good" | "warn";
  className?: string;
  bodyClassName?: string;
  actions?: React.ReactNode;
}) {
  const border = {
    ink: "border-surface-600",
    danger: "border-red-500/60",
    good: "border-emerald/60",
    warn: "border-amber-400/60",
  }[tone];

  return (
    <div className={cn("border-2 bg-surface-800", border, className)}>
      {(label || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-inherit px-3 py-2 sm:px-4">
          {label && (
            <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-widest text-surface-200">
              {label}
            </p>
          )}
          {actions}
        </div>
      )}
      <div className={cn("p-3 sm:p-4", bodyClassName)}>{children}</div>
    </div>
  );
}

/**
 * Un dato: etiqueta arriba, valor abajo.
 */
export function Dato({
  label,
  value,
  wide,
  tone,
}: {
  label: string;
  value?: React.ReactNode;
  wide?: boolean;
  tone?: "good" | "warn" | "danger";
}) {
  const color = tone
    ? { good: "text-emerald", warn: "text-amber-400", danger: "text-red-400" }[tone]
    : "text-surface-50";

  return (
    <div className={cn("min-w-0 border-l-2 border-surface-600 pl-3", wide && "sm:col-span-2")}>
      <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-widest text-surface-300">
        {label}
      </p>
      <div className={cn("m-0 mt-1 break-words whitespace-pre-wrap font-mono text-sm", color)}>
        {value === undefined || value === null || value === "" ? (
          <span className="text-surface-400">—</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

/** Rejilla de datos a dos columnas. */
export function Datos({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>{children}</div>;
}

/** Etiqueta de estado. */
export function Tag({
  children,
  tone = "neutral",
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "danger" | "accent" | "info";
  icon?: React.ElementType;
  className?: string;
}) {
  const styles = {
    neutral: "border-surface-500 bg-surface-700 text-surface-100",
    good: "border-[#3DD6D0]/60 bg-[#3DD6D0]/15 text-[#3DD6D0]",
    warn: "border-amber-400/60 bg-amber-400/15 text-amber-300",
    danger: "border-red-500/60 bg-red-500/15 text-red-300",
    accent: "border-[#D85A30]/60 bg-[#D85A30]/15 text-[#D85A30]",
    info: "border-[#378ADD]/60 bg-[#378ADD]/15 text-[#378ADD]",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
        styles,
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {children}
    </span>
  );
}

/* ──────────────────────────────── Botones ──────────────────────────────── */

/** Botón duro, el mismo del sitio público pero en oscuro. */
export function HardButton({
  children,
  onClick,
  disabled,
  tone = "accent",
  type = "button",
  icon: Icon,
  className,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "accent" | "ghost" | "danger" | "good";
  type?: "button" | "submit";
  icon?: React.ElementType;
  className?: string;
  title?: string;
}) {
  const styles = {
    accent:
      "border-[#D85A30] bg-[#D85A30] text-[#0E0E1A] hover:shadow-[4px_4px_0_0_rgba(216,90,48,0.4)]",
    ghost:
      "border-surface-500 bg-transparent text-surface-100 hover:border-[#D85A30] hover:text-[#D85A30]",
    danger:
      "border-red-500 bg-red-500/15 text-red-300 hover:bg-red-500/25 hover:shadow-[4px_4px_0_0_rgba(239,68,68,0.4)]",
    good:
      "border-[#3DD6D0] bg-[#3DD6D0]/15 text-[#3DD6D0] hover:bg-[#3DD6D0]/25 hover:shadow-[4px_4px_0_0_rgba(61,214,208,0.4)]",
  }[tone];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 border-2 px-4 py-2.5 text-center font-mono text-xs font-bold transition-all",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none",
        styles,
        className,
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </button>
  );
}

/** El mismo botón, pero como enlace. */
export function HardLink({
  children,
  href,
  download,
  tone = "ghost",
  icon: Icon,
  className,
  external,
}: {
  children: React.ReactNode;
  href: string;
  download?: string;
  tone?: "accent" | "ghost" | "danger";
  icon?: React.ElementType;
  className?: string;
  external?: boolean;
}) {
  const styles = {
    accent:
      "border-[#D85A30] bg-[#D85A30] text-[#0E0E1A] hover:shadow-[4px_4px_0_0_rgba(216,90,48,0.4)]",
    ghost:
      "border-surface-500 bg-transparent text-surface-100 hover:border-[#D85A30] hover:text-[#D85A30]",
    danger:
      "border-red-500 bg-red-500/15 text-red-300 hover:bg-red-500/25",
  }[tone];

  return (
    <a
      href={href}
      download={download}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 border-2 px-4 py-2.5 text-center font-mono text-xs font-bold transition-all",
        styles,
        className,
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </a>
  );
}

/* ──────────────────────────────── Filtros ──────────────────────────────── */

/**
 * La fila de filtros. En el teléfono los desplegables van de dos en dos y el
 * buscador ocupa el ancho entero.
 */
export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

const selectBase =
  "min-h-11 w-full border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-100 " +
  "outline-none transition-colors focus:border-[#D85A30] sm:w-auto";

/** Desplegable de filtro, con el mismo borde duro que todo lo demás. */
export function Select({
  value,
  onChange,
  options,
  className,
  wide,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly (readonly [string, string])[];
  className?: string;
  /** Que ocupe las dos columnas en el teléfono. */
  wide?: boolean;
  label?: string;
}) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className={cn(selectBase, wide && "col-span-2", className)}
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

export { selectBase };

/** Un aviso en línea: el borde grueso a la izquierda y el color del tono. */
export function Aviso({
  children,
  tone = "warn",
  className,
}: {
  children: React.ReactNode;
  tone?: "warn" | "danger" | "good" | "info";
  className?: string;
}) {
  const styles = {
    warn: "border-amber-400 bg-amber-400/5 text-amber-300",
    danger: "border-red-500 bg-red-500/5 text-red-300",
    good: "border-[#3DD6D0] bg-[#3DD6D0]/5 text-[#3DD6D0]",
    info: "border-[#378ADD] bg-[#378ADD]/5 text-[#378ADD]",
  }[tone];

  return (
    <div
      className={cn(
        "mb-4 border-l-4 px-3 py-2.5 font-mono text-xs leading-relaxed",
        styles,
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────── Listados ──────────────────────────────── */

/**
 * La caja de una tabla.
 *
 * En el teléfono se sale a los bordes de la pantalla: una tabla con margen a
 * los lados pierde 32px de los 360 que hay, que es una columna entera.
 */
export function TableWrap({
  children,
  className,
  bleed = true,
}: {
  children: React.ReactNode;
  className?: string;
  bleed?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto border-y-2 border-surface-600 bg-surface-800 sm:border-2",
        bleed && "-mx-4 sm:mx-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Encabezado de tabla, para no repetir las mismas nueve clases en cada una. */
export function Th({
  children,
  align = "left",
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-3 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-surface-200 sm:px-4",
        { left: "text-left", center: "text-center", right: "text-right" }[align],
        className,
      )}
    >
      {children}
    </th>
  );
}

/**
 * Una fila del listado, en el teléfono: cada persona es una tarjeta que se
 * puede tocar entera, con la carita, el nombre, el correo y sus etiquetas.
 */
export function RowCard({
  avatar,
  title,
  subtitle,
  tags,
  meta,
  onClick,
  right,
}: {
  avatar?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tags?: React.ReactNode;
  meta?: React.ReactNode;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  const inner = (
    <>
      <div className="flex min-w-0 items-start gap-3">
        {avatar}
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate font-mono text-sm font-bold text-surface-50">{title}</p>
          {subtitle && (
            <p className="m-0 mt-0.5 truncate font-mono text-[11px] text-surface-300">{subtitle}</p>
          )}
          {meta && (
            <p className="m-0 mt-0.5 truncate font-mono text-[11px] text-surface-400">{meta}</p>
          )}
        </div>
        {right ?? (onClick && <Flecha className="mt-1 h-4 w-4 shrink-0 text-surface-400" />)}
      </div>
      {tags && <div className="mt-2.5 flex flex-wrap items-center gap-1.5">{tags}</div>}
    </>
  );

  const base = "block w-full min-w-0 border-2 border-surface-600 bg-surface-800 p-3 text-left transition-colors";

  return onClick ? (
    <button type="button" onClick={onClick} className={cn(base, "active:bg-surface-700 hover:border-[#D85A30]")}>
      {inner}
    </button>
  ) : (
    <div className={base}>{inner}</div>
  );
}

/** El contenedor de las tarjetas de móvil. Se esconde desde `sm`. */
export function Cards({ children, className }: { children: React.ReactNode; className?: string }) {
  // `grid-cols-1` (minmax(0, 1fr)) y no `grid` a secas: con la pista `auto`
  // la columna se ensancha hasta el texto más largo y el `truncate` no corta.
  return <div className={cn("grid grid-cols-1 gap-2 sm:hidden", className)}>{children}</div>;
}

/** Cuando no hay nada que mostrar. */
export function Empty({
  icon: Icon,
  children,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="border-2 border-dashed border-surface-600 px-4 py-12 text-center">
      {Icon && <Icon className="mx-auto mb-3 h-6 w-6 text-surface-400" />}
      <p className="m-0 font-mono text-sm text-surface-300">{children}</p>
    </div>
  );
}

/** La rueda de "cargando", centrada. */
export function Cargando({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center py-12", className)}>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#D85A30] border-t-transparent" />
    </div>
  );
}

/* ─────────────────────────────── Paginación ────────────────────────────── */

/** Paginador. Los botones miden 44px: en el teléfono se fallaban los de 28px. */
export function Pager({
  page,
  totalPages,
  onPage,
  from,
  to,
  total,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  from: number;
  to: number;
  total: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <span className="font-mono text-[11px] text-surface-300 sm:text-xs">
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(Math.max(0, page - 1))}
          disabled={page === 0}
          aria-label="Página anterior"
          className="flex h-11 w-11 items-center justify-center border-2 border-surface-600 text-surface-200 transition-colors hover:border-[#D85A30] hover:text-[#D85A30] disabled:opacity-30 disabled:hover:border-surface-600 disabled:hover:text-surface-200"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[4.5rem] px-2 text-center font-mono text-xs text-surface-200 tabular-nums">
          {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          aria-label="Página siguiente"
          className="flex h-11 w-11 items-center justify-center border-2 border-surface-600 text-surface-200 transition-colors hover:border-[#D85A30] hover:text-[#D85A30] disabled:opacity-30 disabled:hover:border-surface-600 disabled:hover:text-surface-200"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
