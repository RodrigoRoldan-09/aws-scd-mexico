"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import {
  X,
  Info,
  Users,
  Calendar,
  Terminal,
  Rocket,
  HeartHandshake,
  GraduationCap,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { LanguageToggle } from "./language-toggle";
import { EVENT } from "@/lib/constants";
import { localePath, cn } from "@/lib/utils";
import { useEventConfig } from "@/components/providers/event-config-provider";
import { useScrollLock } from "@/hooks/use-scroll-lock";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const t = useTranslations("Nav");
  const { attendeeOpen } = useEventConfig();
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

  const sections = [
    {
      group: "SCD",
      items: [
        { label: "Acerca de", href: resolveHref("#about"), icon: Info },
        { label: "Speakers", href: localePath(locale, "/directorio"), icon: Users },
        { label: "Agenda", href: resolveHref("#agenda"), icon: Calendar },
        { label: "Comunidades", href: localePath(locale, "/comunidades"), icon: Rocket },
        { label: "Sponsors & Contacto", href: localePath(locale, "/sponsors"), icon: HeartHandshake },
      ],
    },
    {
      group: "SBG",
      items: [
        { label: "Workshops", href: resolveHref("#tracks"), icon: Terminal },
        { label: "Proyectos", href: resolveHref("#about"), icon: Rocket },
        { label: "Comunidad", href: resolveHref("#about"), icon: HeartHandshake },
        { label: "Aula", href: resolveHref("#agenda"), icon: GraduationCap },
        { label: "Equipo", href: resolveHref("#organizers"), icon: ShieldCheck },
        { label: "Blog", href: resolveHref("#about"), icon: FileText },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-[#0E0E1A]"
        >
          {/* Header del menú móvil */}
          <div className="flex h-[54px] items-center justify-between border-b border-[#2C2550] px-4">
            <a
              href={resolveHref("#home")}
              onClick={onClose}
              className="flex items-center gap-2.5 outline-none"
            >
              <Image
                src="/images/logos/logo-sbg-cdmx.png"
                alt="AWS Student Builder Group IPN CDMX"
                width={32}
                height={32}
                className="h-8 w-8 object-contain rounded-[6px]"
              />
              <div className="flex flex-col text-left">
                <span className="font-display text-[11px] font-bold leading-tight text-[#E6E4DA]">
                  AWS Student Builder Group
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#C143BC] leading-tight">
                  IPN CDMX
                </span>
              </div>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-[6px] border border-[#2C2550] bg-[#1E1838] text-[#B4B2A9] transition-colors hover:border-[#613BB8] hover:text-[#C143BC]"
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Marquee de info */}
          <div
            className="overflow-hidden border-b border-[#2C2550] bg-[#1E1838]/60"
            aria-hidden="true"
          >
            <div
              className="flex w-max items-center py-1.5"
              style={{ animation: "marquee 26s linear infinite" }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className="font-mono text-xs text-[#B4B2A9] whitespace-nowrap px-4"
                >
                  <span className="text-[#C143BC]">{EVENT.city}</span> · {EVENT.dateShort} · AWS Student Builder Group ·
                </span>
              ))}
            </div>
          </div>

          {/* Navegación por grupos */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="flex items-center gap-3">
              <a
                href={resolveHref("#home")}
                onClick={onClose}
                className="font-mono text-sm font-bold text-[#E6E4DA] hover:text-[#C143BC] transition-colors"
              >
                {t("home")}
              </a>
              <span className="text-[#2C2550]">·</span>
              <a
                href={resolveHref("#faq")}
                onClick={onClose}
                className="font-mono text-sm text-[#B4B2A9] hover:text-[#C143BC] transition-colors"
              >
                Contacto
              </a>
            </div>

            {sections.map((section) => (
              <div key={section.group} className="space-y-2.5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#C143BC]">
                  {`// ${section.group}`}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={onClose}
                        className="group flex min-h-11 items-center gap-3 rounded-[8px] border border-[#2C2550] bg-[#1E1838] p-2.5 transition-colors hover:border-[#613BB8]"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[#2A1F5E] text-[#C143BC]">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-display text-sm font-bold text-[#E6E4DA] group-hover:text-white">
                          {item.label}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer del menú móvil */}
          <div className="border-t border-[#2C2550] bg-[#0E0E1A] p-4 space-y-3">
            <div className="flex justify-center">
              <LanguageToggle />
            </div>

            {attendeeOpen ? (
              <a
                href={localePath(locale, "/registro")}
                onClick={onClose}
                className={cn(
                  "flex h-11 w-full items-center justify-center rounded-[6px] bg-[#422B78] px-4 font-mono text-sm font-bold text-[#E6E4DA] transition-colors hover:bg-[#613BB8] active:scale-[0.99]",
                  "shadow-[0_4px_14px_rgba(66,43,120,0.4)]"
                )}
              >
                {t("register")}
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="flex h-11 w-full cursor-not-allowed items-center justify-center rounded-[6px] border border-[#2C2550] bg-transparent px-4 font-mono text-sm text-[#73726C]"
              >
                {t("register_closed")}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
