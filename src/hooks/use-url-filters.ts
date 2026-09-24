"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Sincroniza filtros (strings) con la URL: lee de useSearchParams y escribe sin
// recargar con router.replace. Omite de la URL los valores iguales al default.
// OJO: `defaults` debe ser un objeto estable (constante a nivel de módulo).
// Como usa useSearchParams, la página debe ir dentro de un <Suspense>.
export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const values = useMemo(() => {
    const v = { ...defaults };
    (Object.keys(defaults) as (keyof T)[]).forEach((k) => {
      const p = searchParams.get(k as string);
      if (p !== null) v[k] = p as T[keyof T];
    });
    return v;
  }, [searchParams, defaults]);

  const set = useCallback((key: keyof T, value: string) => {
    const sp = new URLSearchParams(window.location.search);
    if (value && value !== defaults[key]) sp.set(key as string, value);
    else sp.delete(key as string);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, defaults]);

  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);

  return { values, set, reset };
}

// Devuelve el valor con retraso, para no escribir en la URL en cada tecla.
export function useDebounce<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
