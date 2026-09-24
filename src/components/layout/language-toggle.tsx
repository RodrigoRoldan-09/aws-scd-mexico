"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const activeCls = "bg-hack-block text-surface-900";

  const switchTo = (target: "es" | "en") => {
    if (target !== locale) {
      router.replace(pathname, { locale: target });
    }
  };

  return (
    <div className="flex items-center border-2 border-hack-block/40">
      <button
        onClick={() => switchTo("es")}
        className={cn(
          "px-3 py-1.5 font-mono text-xs font-bold transition-colors",
          locale === "es" ? activeCls : "text-surface-400 hover:text-surface-200"
        )}
        aria-label="Cambiar a español"
      >
        ES
      </button>
      <button
        onClick={() => switchTo("en")}
        className={cn(
          "px-3 py-1.5 font-mono text-xs font-bold transition-colors",
          locale === "en" ? activeCls : "text-surface-400 hover:text-surface-200"
        )}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
}
