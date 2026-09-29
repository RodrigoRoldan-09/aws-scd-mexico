"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
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
import { cn, localePath } from "@/lib/utils";
import { useEventConfig } from "@/components/providers/event-config-provider";
import { LanguageToggle } from "./language-toggle";
import { MobileNav } from "./mobile-nav";

interface DropdownItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

export function Navbar() {
  const t = useTranslations("Nav");
  const { attendeeOpen } = useEventConfig();
  const locale = useLocale();
  const pathname = usePathname();

  const [activeDropdown, setActiveDropdown] = useState<"scd" | "sbg" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const home = localePath(locale);
  const isHome = pathname === home || pathname === home + "/";
  const localeBase = locale === "es" ? "" : `/${locale}`;

  const resolveHref = (href: string) => {
    if (href.startsWith("/")) return localePath(locale, href);
    return isHome ? href : `${localeBase}/${href}`;
  };

  // Cierra los dropdowns al hacer clic fuera
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Ítems del Mega-Menú por grupo
  const scdItems: DropdownItem[] = [
    {
      title: "Acerca de",
      description: "El evento cloud para estudiantes",
      href: resolveHref("#about"),
      icon: Info,
    },
    {
      title: "Speakers",
      description: "Líderes y expertos de la industria",
      href: localePath(locale, "/directorio"),
      icon: Users,
    },
    {
      title: "Agenda",
      description: "Horarios y tracks presenciales en el IPN",
      href: resolveHref("#agenda"),
      icon: Calendar,
    },
    {
      title: "Sponsors & Club",
      description: "Patrocinios y contacto con SBG IPN",
      href: localePath(locale, "/sponsors"),
      icon: HeartHandshake,
      fullWidth: true,
    },
  ];

  const sbgItems: DropdownItem[] = [
    {
      title: "Workshops",
      description: "Hands-on labs y arquitectura",
      href: resolveHref("#tracks"),
      icon: Terminal,
    },
    {
      title: "Proyectos",
      description: "Iniciativas open-source de estudiantes",
      href: resolveHref("#about"),
      icon: Rocket,
    },
    {
      title: "Comunidad",
      description: "Builders, mentores y networking",
      href: resolveHref("#communities"),
      icon: HeartHandshake,
    },
    {
      title: "Aula",
      description: "Cursos y rutas de certificación",
      href: resolveHref("#agenda"),
      icon: GraduationCap,
    },
    {
      title: "Equipo",
      description: "Leads y voluntarios organizadores",
      href: resolveHref("#organizers"),
      icon: ShieldCheck,
    },
    {
      title: "Blog",
      description: "Artículos técnicos y experiencias",
      href: resolveHref("#about"),
      icon: FileText,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 h-[54px] border-b border-[#2C2550] bg-[#0E0E1A]/95 shadow-[0_2px_12px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <nav
          ref={navRef}
          aria-label="Principal"
          className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
        >
          {/* Logo SBG oficial (izquierda) */}
          <a
            href={resolveHref("#home")}
            className="group flex items-center gap-2.5 outline-none"
            aria-label="AWS Student Builder Group IPN CDMX"
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

          {/* Navegación Desktop agrupada (Mega-Menu) */}
          <div className="hidden items-center gap-1.5 md:flex">
            {/* Inicio (standalone) */}
            <a
              href={resolveHref("#home")}
              className="rounded-[6px] px-2.5 py-1 font-mono text-xs text-[#B4B2A9] transition-colors hover:text-[#E6E4DA]"
            >
              {t("home")}
            </a>

            {/* SCD Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(activeDropdown === "scd" ? null : "scd")
                }
                aria-expanded={activeDropdown === "scd"}
                className={cn(
                  "inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-1 font-mono text-xs transition-colors",
                  activeDropdown === "scd"
                    ? "border-[#C143BC] bg-[#1E1838] text-[#E6E4DA]"
                    : "border-transparent text-[#B4B2A9] hover:text-[#E6E4DA]"
                )}
              >
                <span>SCD</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    activeDropdown === "scd"
                      ? "rotate-180 text-[#C143BC]"
                      : "text-[#73726C]"
                  )}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {activeDropdown === "scd" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 top-[calc(100%+8px)] z-50 w-[520px] rounded-[12px] border border-[#2C2550] bg-[#1E1838] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                  >
                    <div className="grid grid-cols-2 gap-2.5">
                      {scdItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <a
                            key={item.title}
                            href={item.href}
                            onClick={() => setActiveDropdown(null)}
                            className={cn(
                              "group flex items-start gap-2.5 rounded-[8px] border border-[#2C2550] bg-[#0E0E1A] p-2.5 text-left transition-colors hover:border-[#613BB8]",
                              item.fullWidth && "col-span-2"
                            )}
                          >
                            <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[6px] bg-[#2A1F5E] text-[#C143BC] transition-transform group-hover:scale-105">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <span className="font-display text-xs font-bold leading-tight text-[#E6E4DA] group-hover:text-white">
                                {item.title}
                              </span>
                              <span className="font-mono text-[11px] leading-snug text-[#73726C] group-hover:text-[#B4B2A9]">
                                {item.description}
                              </span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SBG Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(activeDropdown === "sbg" ? null : "sbg")
                }
                aria-expanded={activeDropdown === "sbg"}
                className={cn(
                  "inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-1 font-mono text-xs transition-colors",
                  activeDropdown === "sbg"
                    ? "border-[#C143BC] bg-[#1E1838] text-[#E6E4DA]"
                    : "border-transparent text-[#B4B2A9] hover:text-[#E6E4DA]"
                )}
              >
                <span>SBG</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    activeDropdown === "sbg"
                      ? "rotate-180 text-[#C143BC]"
                      : "text-[#73726C]"
                  )}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {activeDropdown === "sbg" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 top-[calc(100%+8px)] z-50 w-[560px] rounded-[12px] border border-[#2C2550] bg-[#1E1838] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                  >
                    <div className="grid grid-cols-2 gap-2.5">
                      {sbgItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.title}
                            className="group flex items-start gap-2.5 rounded-[8px] border border-[#2C2550] bg-[#0E0E1A]/60 p-2.5 text-left opacity-80 cursor-not-allowed"
                          >
                            <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[6px] bg-[#2A1F5E]/60 text-[#C143BC]/70">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-display text-xs font-bold leading-tight text-[#E6E4DA]">
                                  {item.title}
                                </span>
                                <span className="rounded-[4px] border border-[#C143BC]/40 bg-[#C143BC]/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#F2A6F0]">
                                  {t("coming_soon")}
                                </span>
                              </div>
                              <span className="font-mono text-[11px] leading-snug text-[#73726C]">
                                {item.description}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sponsors (pestaña dedicada) */}
            <a
              href={localePath(locale, "/sponsors")}
              className="rounded-[6px] px-2.5 py-1 font-mono text-xs text-[#B4B2A9] transition-colors hover:text-[#C143BC]"
            >
              Sponsors
            </a>

            {/* Contacto (standalone) */}
            <a
              href={resolveHref("#faq")}
              className="rounded-[6px] px-2.5 py-1 font-mono text-xs text-[#B4B2A9] transition-colors hover:text-[#E6E4DA]"
            >
              Contacto
            </a>
          </div>

          {/* Acciones del Header (derecha) */}
          <div className="flex shrink-0 items-center gap-2.5">
            <LanguageToggle />

            {/* Botón "Regístrate" variante primary */}
            {attendeeOpen ? (
              <a
                href={localePath(locale, "/registro")}
                className="hidden h-9 items-center justify-center rounded-[6px] border border-transparent bg-[#422B78] px-4 py-2 font-mono text-xs font-bold text-[#E6E4DA] transition-colors hover:bg-[#613BB8] active:scale-[0.98] sm:inline-flex"
              >
                {t("register")}
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="hidden h-9 cursor-not-allowed items-center justify-center rounded-[6px] border border-[#2C2550] bg-transparent px-4 py-2 font-mono text-xs text-[#73726C] sm:inline-flex"
              >
                {t("register_closed")}
              </span>
            )}

            {/* Botón hamburguesa móvil */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-[6px] border border-[#2C2550] bg-[#1E1838] text-[#B4B2A9] transition-colors hover:border-[#613BB8] hover:text-[#C143BC] md:hidden"
              aria-label="Abrir menú"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M4 7h16 M4 12h16 M4 17h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
