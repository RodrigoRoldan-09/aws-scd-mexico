"use client";

import { useSyncExternalStore } from "react";

/** Nunca hay cambios que notificar: el valor sólo depende de dónde se ejecuta. */
const subscribe = () => () => {};

/**
 * `false` durante el render del servidor y la primera pintura; `true` en cuanto
 * la página está hidratada.
 *
 * Reemplaza el patrón `useState(false)` + `useEffect(() => setMounted(true))`,
 * que encadena un render extra en cada montaje. `useSyncExternalStore` expresa
 * lo mismo sin efecto: el snapshot del servidor es `false` y el del cliente
 * `true`, y React se encarga de la transición.
 *
 * Útil para montar widgets de terceros (captcha, portales) que necesitan que el
 * DOM ya exista.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
