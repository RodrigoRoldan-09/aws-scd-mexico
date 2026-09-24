"use client";

import { useCallback, useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Lee la preferencia de movimiento reducido del sistema.
 *
 * Va con `useSyncExternalStore` en vez de `useState` + `useEffect`: es la API
 * hecha para leer una fuente externa (acá, una media query). Evita el render
 * extra que provocaba el `setState` dentro del efecto, y el snapshot del
 * servidor es explícito — en SSR no existe `window`.
 */
export function useReducedMotion() {
  const subscribe = useCallback((onChange: () => void) => {
    const mql = window.matchMedia(QUERY);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false, // en el servidor se asume que no hay preferencia
  );
}
