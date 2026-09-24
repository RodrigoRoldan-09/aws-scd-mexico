"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn, basePath, localePath } from "@/lib/utils";
import { useEventConfig } from "@/components/providers/event-config-provider";
import { navItems } from "@/data/navigation";
import { LanguageToggle } from "./language-toggle";
import { MobileNav } from "./mobile-nav";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";

function ScrambleLink({ text, href, kiro }: { text: string; href: string; kiro?: boolean }) {
  const [display, setDisplay] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const handleEnter = useCallback(() => {
    let iteration = 0;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDisplay(
        text.split("").map((char, i) => (i < iteration ? char : CHARS[Math.floor(Math.random() * CHARS.length)])).join("")
      );
      iteration += 1 / 2;
      if (iteration >= text.length) {
        clearInterval(intervalRef.current);
        setDisplay(text);
      }
    }, 30);
  }, [text]);

  const handleLeave = () => {
    clearInterval(intervalRef.current);
    setDisplay(text);
  };

  return (
    <a
      href={href}
      className={cn(
        "font-mono text-sm text-surface-200 transition-colors",
        kiro ? "hover:text-kiro-purple-light" : "hover:text-aws-orange"
      )}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {display}
    </a>
  );
}

export function Navbar() {
  const t = useTranslations("Nav");
  const { attendeeOpen } = useEventConfig();
  const locale = useLocale();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const openingRef = useRef(false);

  const handleOpenMenu = () => {
    if (openingRef.current) return;
    openingRef.current = true;
    setMobileOpen(true);
    setTimeout(() => { openingRef.current = false; }, 600);
  };

  const home = localePath(locale);
  const isHome = pathname === home || pathname === home + "/";
  const isKiro = pathname.includes("/kiro");
  const localeBase = locale === "es" ? "" : `/${locale}`;
  const resolveHref = (href: string) => {
    if (href.startsWith("/")) return localePath(locale, href);
    return isHome ? href : `${localeBase}/${href}`;
  };


  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 border-b-2 bg-surface-900 transition-colors duration-300",
          scrolled ? "border-hack-block/40" : "border-hack-block/15",
        )}
      >
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <a href={resolveHref("#home")} className="mt-1 flex min-w-0 items-center gap-2">
            <img
              src={`${basePath}/images/logos/aws-logo.svg`}
              alt="AWS"
              loading="eager"
              className="h-9 w-auto shrink-0"
            />
            {/* En pantallas muy angostas el lockup se reduce a la marca: lo que
                no puede pasar es que empuje al botón de menú fuera del borde. */}
            <div className="hidden min-w-0 leading-tight xs:block">
              <p className="truncate font-mono text-xs font-semibold tracking-wide text-surface-50">Student</p>
              <p className="truncate font-mono text-xs font-semibold tracking-wide text-surface-50">Community Day</p>
              <p className="truncate font-mono text-[10px] tracking-widest text-hack-block">México 2026</p>
            </div>
          </a>

          <div className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <ScrambleLink key={item.href} text={t(item.labelKey)} href={resolveHref(item.href)} kiro={isKiro} />
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageToggle />
            {/* Con el registro cerrado deja de ser un enlace. */}
            {attendeeOpen ? (
              <a
                href={localePath(locale, "/registro")}
                className={cn(
                  "hidden items-center bg-hack-block px-6 py-2.5 text-surface-900 transition-all duration-200 sm:inline-flex",
                  "shadow-[4px_4px_0_0_var(--color-hack-dim)]",
                  "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-hack-dim)]",
                  "active:translate-x-0 active:translate-y-0 active:shadow-none",
                )}
              >
                <span className="dot-matrix text-sm leading-none">{t("register")}</span>
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="hidden cursor-not-allowed items-center border-2 border-hack-block/40 px-6 py-2 text-hack-block/50 sm:inline-flex"
              >
                <span className="dot-matrix text-sm leading-none">{t("register_closed")}</span>
              </span>
            )}
            <button
              onClick={handleOpenMenu}
              style={{ touchAction: "manipulation" }}
              className="flex h-10 w-10 items-center justify-center border-2 border-hack-block text-hack-block transition-colors hover:bg-hack-block hover:text-hack-ink lg:hidden"
              aria-label="Abrir menú"
            >
              {/* Tres trazos rectos: mismo lenguaje que el aspa del menú */}
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M4 7h16 M4 12h16 M4 17h16" stroke="currentColor" strokeWidth="2.4" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
