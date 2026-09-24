"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Keeps `<html data-kiro>` in sync with the current route on the client,
 * so the purple chrome (::selection, scroll progress) also applies on
 * soft navigation — not only on a hard reload of /kiro.
 */
export function KiroThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    const el = document.documentElement;
    if (pathname?.includes("/kiro")) el.dataset.kiro = "";
    else delete el.dataset.kiro;
  }, [pathname]);

  return null;
}
