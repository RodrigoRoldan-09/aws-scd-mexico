"use client";

import { usePathname } from "next/navigation";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { HashScroll } from "@/components/layout/hash-scroll";
import { ScrollProgress } from "@/components/ui/scroll-progress";

/**
 * Decide qué envoltorio del sitio se muestra, según la ruta.
 *
 * Va en un componente de cliente con `usePathname()` y no en el layout del
 * idioma: el layout no se vuelve a renderizar al navegar entre rutas hermanas
 * (p. ej. de `/admin/login` a `/admin`) y se quedaría con la decisión vieja.
 *
 * La barra y el pie llegan ya renderizados desde el servidor (el pie es un
 * componente de servidor y traduce con `getTranslations`). Se pasan como props
 * en vez de montarlos acá: así siguen siendo servidor y este archivo sólo
 * decide si se pintan.
 */

/** Rutas que van sin el envoltorio del sitio. */
function modoDe(pathname: string) {
  // El login del panel es la excepción dentro de `/admin`: es una pantalla
  // pública a la que se llega desde el sitio, y sin barra no hay cómo volver.
  const esAdmin = pathname.includes("/admin") && !pathname.includes("/admin/login");
  // Pasaporte y confirmación son pantallas a pantalla completa.
  const esInmersiva = pathname.includes("/pasaporte") || pathname.includes("/confirmar");
  return { esAdmin, esInmersiva };
}

export function SiteChrome({
  navbar,
  footer,
  jsonLd,
  children,
}: {
  navbar: React.ReactNode;
  footer: React.ReactNode;
  jsonLd: React.ReactNode;
  children: React.ReactNode;
}) {
  const { esAdmin, esInmersiva } = modoDe(usePathname() ?? "");
  const pelada = esAdmin || esInmersiva;

  return (
    <>
      {!pelada && <ScrollProgress />}
      {!pelada && <HashScroll />}
      {!pelada && navbar}
      {children}
      {!pelada && footer}
      {!pelada && <ScrollToTop />}
      {!pelada && jsonLd}
    </>
  );
}
