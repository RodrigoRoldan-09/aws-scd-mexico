"use client";

import { useEffect } from "react";

/**
 * Forces a full page reload only on real browser back/forward navigation.
 *
 * Next.js App Router internally dispatches popstate events (isTrusted: false)
 * during client-side routing. We must ignore those — only native browser
 * back/forward events (isTrusted: true) should trigger a reload, so that
 * useEffect hooks and data fetches always run fresh after history navigation.
 */
export function BfcacheReset() {
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.isTrusted) {
        window.location.reload();
      }
    };
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return null;
}
