import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Tone } from "./block-section";

type Variant = "solid" | "outline" | "conversion";

/**
 * Botón rectangular, sin radio, con subtítulo opcional dentro de la caja.
 */
export function HardButton({
  href,
  onClick,
  children,
  sub,
  tone = "ink",
  variant = "solid",
  external,
  disabled,
  pulse,
  className,
}: {
  href?: string;
  /**
   * Acción en vez de destino: pinta un `<button>`.
   *
   * Está para el botón de patrocinios, que abre un correo. Si la dirección
   * fuera un `href` acabaría en el HTML servido y cualquier robot que lea la
   * página se la lleva; armándola al pulsar, en la página no hay nada que
   * recoger.
   */
  onClick?: () => void;
  children: React.ReactNode;
  sub?: string;
  tone?: Tone;
  variant?: Variant;
  external?: boolean;
  disabled?: boolean;
  /** Anillo que late alrededor del botón. Sólo en el CTA principal de cada
   *  pantalla — si laten todos, no destaca ninguno. */
  pulse?: boolean;
  className?: string;
}) {
  const base =
    "group inline-flex flex-col items-center justify-center px-8 py-4 text-center transition-all duration-200 active:translate-x-0 active:translate-y-0 active:shadow-none";

  const solid =
    tone === "block"
      ? "bg-hack-ink text-hack-block shadow-[5px_5px_0_0_rgba(14,14,26,0.45)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_rgba(14,14,26,0.45)]"
      : "bg-hack-primary text-hack-ink shadow-[5px_5px_0_0_var(--color-hack-dim)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--color-hack-dim)]";

  const outline =
    tone === "block"
      ? "border-2 border-hack-ink text-hack-ink hover:bg-hack-ink hover:text-hack-block"
      : "border-2 border-hack-block text-hack-block hover:bg-hack-block hover:text-hack-ink";

  const conversion =
    "bg-[#D85A30] text-[#0E0E1A] font-bold shadow-[5px_5px_0_0_rgba(14,14,26,0.45)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_rgba(216,90,48,0.4)]";

  const off = "cursor-not-allowed opacity-50 shadow-none hover:translate-x-0 hover:translate-y-0";

  const cls = cn(
    base,
    variant === "conversion" ? conversion : variant === "solid" ? solid : outline,
    pulse && !disabled && "animate-pulse-highlight",
    disabled && off,
    className,
  );

  const inner = (
    <>
      <span className="dot-matrix text-lg leading-none md:text-xl">{children}</span>
      {sub && (
        <span className="dot-matrix mt-1.5 text-[11px] leading-none opacity-70">
          {sub}
        </span>
      )}
    </>
  );

  if (disabled) {
    return (
      <span className={cls} aria-disabled="true">
        {inner}
      </span>
    );
  }

  if (!href) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  }

  if (external || href.startsWith("#") || href.startsWith("http")) {
    return (
      <a
        href={href}
        className={cls}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
