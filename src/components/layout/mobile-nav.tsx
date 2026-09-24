"use client";

import { motion, AnimatePresence } from "motion/react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { navItems } from "@/data/navigation";
import { LanguageToggle } from "./language-toggle";
import { EVENT } from "@/lib/constants";
import { basePath, localePath } from "@/lib/utils";
import { useEventConfig } from "@/components/providers/event-config-provider";
import { useScrollLock } from "@/hooks/use-scroll-lock";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const t = useTranslations("Nav");
  const { attendeeOpen } = useEventConfig();
  const tKiro = useTranslations("Kiro");
  const locale = useLocale();
  const pathname = usePathname();
  const home = localePath(locale);
  const isHome = pathname === home || pathname === home + "/";
  const localeBase = locale === "es" ? "" : `/${locale}`;
  const resolveHref = (href: string) => {
    if (href.startsWith("/")) return localePath(locale, href);
    return isHome ? href : `${localeBase}/${href}`;
  };

  useScrollLock(isOpen);

  // Todos los destinos en una sola lista: los del navbar más /kiro, que sólo
  // aparece acá.
  const links = [
    ...navItems.map((i) => ({ href: resolveHref(i.href), label: t(i.labelKey) })),
    { href: localePath(locale, "/kiro"), label: tKiro("banner_title") },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-surface-900"
        >
          <div className="flex items-center justify-between border-b-2 border-hack-block/25 px-5 py-4">
            <a href={resolveHref("#about")} onClick={onClose} className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${basePath}/images/logos/aws-logo.svg`}
                alt="AWS"
                loading="eager"
                className="h-8 w-auto shrink-0"
              />
              <div className="leading-tight">
                <p className="font-mono text-xs font-semibold tracking-wide text-surface-50">Student</p>
                <p className="font-mono text-xs font-semibold tracking-wide text-surface-50">Community Day</p>
                <p className="font-mono text-[10px] tracking-widest text-hack-block">México 2026</p>
              </div>
            </a>

            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center border-2 border-hack-block text-hack-block transition-colors hover:bg-hack-block hover:text-hack-ink"
              aria-label="Cerrar menú"
            >
              {/* Aspa dibujada a mano: dos trazos rectos, sin icono redondeado */}
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" strokeWidth="2.4" />
              </svg>
            </button>
          </div>

          <div className="overflow-hidden border-b-2 border-hack-block/25" aria-hidden="true">
            <div
              className="flex w-max items-center"
              style={{ animation: "marquee 26s linear infinite" }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className={`dot-matrix whitespace-nowrap px-5 py-2 text-sm leading-none ${
                    i % 2 === 1 ? "bg-hack-block text-hack-ink" : "text-hack-block"
                  }`}
                >
                  {EVENT.city} · {EVENT.dateShort} ·
                </span>
              ))}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-5 py-4">
            {links.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={onClose}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.04 + i * 0.035, ease }}
                className="group flex items-baseline gap-4 border-b border-hack-block/20 py-3.5 transition-colors hover:bg-hack-block/10"
              >
                <span className="dot-matrix w-7 shrink-0 text-xs text-hack-block/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-2xl font-medium lowercase tracking-tight text-surface-50 transition-colors group-hover:text-hack-block">
                  {link.label}
                </span>
              </motion.a>
            ))}
          </nav>

          <div className="space-y-4 border-t-2 border-hack-block/25 px-5 pb-8 pt-5">
            <div className="flex justify-center">
              <LanguageToggle />
            </div>
            {attendeeOpen ? (
              <a
                href={localePath(locale, "/registro")}
                onClick={onClose}
                className="flex w-full items-center justify-center bg-hack-block px-6 py-4 text-surface-900 shadow-[5px_5px_0_0_var(--color-hack-dim)] transition-all duration-200 active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_0_var(--color-hack-dim)]"
              >
                <span className="dot-matrix text-lg leading-none">{t("register")}</span>
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="flex w-full cursor-not-allowed items-center justify-center border-2 border-hack-block/40 px-6 py-4 text-hack-block/50"
              >
                <span className="dot-matrix text-lg leading-none">{t("register_closed")}</span>
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
