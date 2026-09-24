"use client";

import { useEffect } from "react";

// Al entrar con un #ancla (ej. /#organizers) o al hacer clic en un enlace de
// ancla, las imágenes/fuentes que cargan mueven el layout y el scroll del
// navegador cae en la sección equivocada. Esto reposiciona a la sección correcta
// varias veces mientras la página termina de asentar, y se detiene si el usuario
// empieza a hacer scroll por su cuenta.
export function HashScroll() {
  useEffect(() => {
    let cleanupTimers: (() => void) | null = null;

    const correctTo = (id: string) => {
      if (!id) return;
      cleanupTimers?.();

      let userMoved = false;
      const stop = () => { userMoved = true; };
      window.addEventListener("wheel", stop, { passive: true });
      window.addEventListener("touchstart", stop, { passive: true });
      window.addEventListener("keydown", stop);

      const goToTarget = () => {
        if (userMoved) return;
        const el = document.getElementById(id);
        // "instant" evita pelear con el scroll-behavior: smooth en cada reintento
        if (el) el.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
      };

      goToTarget();
      const raf = requestAnimationFrame(goToTarget);
      const timers = [100, 300, 600, 1000, 1600].map((ms) => window.setTimeout(goToTarget, ms));
      window.addEventListener("load", goToTarget);

      cleanupTimers = () => {
        cancelAnimationFrame(raf);
        timers.forEach(clearTimeout);
        window.removeEventListener("load", goToTarget);
        window.removeEventListener("wheel", stop);
        window.removeEventListener("touchstart", stop);
        window.removeEventListener("keydown", stop);
      };
    };

    // Al cargar con un hash
    correctTo(decodeURIComponent(window.location.hash.replace("#", "")));

    // Al hacer clic en un ancla (#seccion) mientras la página aún asienta
    const onHashChange = () => correctTo(decodeURIComponent(window.location.hash.replace("#", "")));
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
      cleanupTimers?.();
    };
  }, []);

  return null;
}
