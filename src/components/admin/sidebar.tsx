"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn, localePath } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { LogOut, Menu, X } from "lucide-react";
import { navGroups } from "./nav-config";
import { Avatar } from "./avatar";

/**
 * La navegación del panel.
 *
 * En pantalla ancha es una columna fija a la izquierda. En el teléfono es una
 * barra arriba y, al abrirla, el menú ocupa la pantalla entera con los destinos
 * en rejilla de dos.
 *
 * Ojo con las rutas: el sitio usa `localePrefix: "as-needed"`, así que el
 * español va en la raíz (`/admin/x`) y sólo el inglés lleva prefijo
 * (`/en/admin/x`). No armarlas como `/${locale}${href}`.
 */

const ROL: Record<string, string> = {
  admin: "admin",
  organizer: "organizador",
  volunteer: "voluntario",
  badges: "badges",
};

/** Alto de la barra de móvil. El contenido se aparta esto por arriba. */
export const BARRA_MOVIL = "3.5rem";

/** El distintivo, igual que en la barra del sitio. */
function Marca() {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logos/aws-logo.svg"
        alt="AWS"
        width={48}
        height={29}
        className="h-9 w-auto shrink-0"
      />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-mono text-xs font-semibold tracking-wide text-surface-50">
          Student
        </span>
        <span className="block truncate font-mono text-xs font-semibold tracking-wide text-surface-50">
          Community Day
        </span>
        <span className="block truncate font-mono text-[10px] tracking-widest text-[#D85A30]">
          México 2026
        </span>
      </span>
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [abierto, setAbierto] = useState(false);

  const locale = pathname.startsWith("/en") ? "en" : "es";

  const esActivo = (href: string, exact?: boolean) => {
    const full = localePath(locale, href);
    return exact ? pathname === full : pathname.startsWith(full);
  };

  const grupos = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !user || item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0 && (!user || group.roles.some((r) => r === user.role)));

  useScrollLock(abierto);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  /** La ficha de quien está dentro, y la salida. */
  const cuenta = (
    <div className="border-t-2 border-surface-600 px-3 py-3">
      {user && (
        <div className="mb-2 flex items-center gap-3 px-1">
          <Avatar seed={user.email} name={user.name} email={user.email} size={38} />
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate font-mono text-sm font-bold text-surface-50">{user.name}</p>
            <p className="m-0 truncate font-mono text-[11px] text-surface-300">{user.email}</p>
            <span className="mt-1 inline-block border-2 border-[#3DD6D0]/40 bg-[#3DD6D0]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#3DD6D0]">
              {ROL[user.role] ?? user.role}
            </span>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={logout}
        className="flex min-h-11 w-full items-center gap-3 border-2 border-transparent px-3 py-2 font-mono text-sm text-surface-300 transition-colors hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-300"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <>
      {/* ─── Barra de móvil ─────────────────────────────────────────────── */}
      <header
        className="fixed inset-x-0 top-0 z-30 flex items-center gap-3 border-b-2 border-surface-600 bg-surface-900 px-3 lg:hidden"
        style={{ height: BARRA_MOVIL }}
      >
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir el menú"
          aria-expanded={abierto}
          className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-surface-500 text-surface-100 transition-colors active:bg-surface-700"
        >
          <Menu className="h-5 w-5" />
        </button>

        <span className="min-w-0 flex-1 truncate font-mono text-xs font-semibold tracking-wide text-surface-200">
          Student Community Day <span className="text-[#D85A30]">· México 2026</span>
        </span>
      </header>

      {/* ─── El menú de móvil, a pantalla completa ────────────────────────
          Está siempre montado y se muestra u oculta con una clase; los
          enlaces no prefetchean para que abrir sea instantáneo. `inert` deja el menú fuera del foco y del lector de pantalla mientras
          está cerrado. */}
      <div
        inert={!abierto}
        aria-hidden={!abierto}
        className={cn(
          "fixed inset-0 z-50 flex-col overflow-y-auto overscroll-contain bg-surface-900 lg:hidden",
          abierto ? "flex" : "hidden",
        )}
      >
          <div
            className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-surface-600 px-4"
            style={{ height: BARRA_MOVIL }}
          >
            <span className="dot-matrix text-lg leading-none text-surface-50">menú</span>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar el menú"
              className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-surface-500 text-surface-100 transition-colors active:bg-surface-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-5">
            <div className="flex flex-col gap-6">
              {grupos.map((group) => (
                <div key={group.label}>
                  <p className="dot-matrix m-0 mb-2.5 text-base leading-none text-surface-300">
                    {group.label.toLowerCase()}
                  </p>
                  {/* De dos en dos: con el ancho completo caben, y así se
                      alcanzan todas sin bajar tanto. */}
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const activo = esActivo(item.href, item.exact);
                      return (
                        <Link
                          key={item.href}
                          href={localePath(locale, item.href)}
                          prefetch={false}
                          onClick={() => setAbierto(false)}
                          aria-current={activo ? "page" : undefined}
                          className={cn(
                            "flex min-h-[4.5rem] flex-col justify-between border-2 p-3 transition-colors",
                            activo
                              ? "border-[#D85A30] bg-[#D85A30]/15 text-[#D85A30] font-bold"
                              : "border-surface-600 bg-surface-800 text-surface-100 active:bg-surface-700",
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="mt-2 font-mono text-xs font-bold leading-tight">
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>{cuenta}</div>
        </div>

      {/* ─── La columna de escritorio ───────────────────────────────────── */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r-2 border-surface-600 bg-surface-900 lg:flex">
        <div className="flex h-20 shrink-0 items-center border-b-2 border-surface-600 px-4">
          <Marca />
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <div className="flex flex-col gap-5">
            {grupos.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && <div className="mb-4 border-t-2 border-surface-600" />}
                <p className="dot-matrix m-0 mb-2 px-1 text-sm leading-none text-surface-300">
                  {group.label.toLowerCase()}
                </p>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const activo = esActivo(item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        href={localePath(locale, item.href)}
                        prefetch={false}
                        aria-current={activo ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 border-2 px-3 py-2 font-mono text-sm transition-all",
                          activo
                            ? "border-[#D85A30] bg-[#D85A30]/15 font-bold text-[#D85A30]"
                            : "border-transparent text-surface-200 hover:border-surface-600 hover:bg-surface-800 hover:text-surface-50",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {cuenta}
      </aside>
    </>
  );
}
