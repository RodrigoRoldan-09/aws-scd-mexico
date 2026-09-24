"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { navGroups } from "./nav-config";
import { PageHead } from "./ui";
import { localePath } from "@/lib/utils";

// Panel simple para staff (volunteer/badges): botones grandes solo a lo que su rol puede acceder.
export function StaffHub() {
  const { user } = useAuth();
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const role = user?.role ?? "";

  // Secciones e items que el rol puede ver (excluye el Dashboard, que es esta misma página)
  const groups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((it) => it.roles.includes(role) && it.href !== "/admin") }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead
        title={`hola, ${(user?.name?.split(" ")[0] || "staff").toLowerCase()}`}
      />

      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <section key={group.label}>
            <p className="dot-matrix m-0 mb-3 text-lg leading-none text-surface-300">
              {group.label.toLowerCase()}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={localePath(locale, item.href)}
                    className="group flex flex-col items-center justify-center gap-3 border-2 border-surface-600 bg-surface-800 p-5 text-center transition-all hover:-translate-y-0.5 hover:border-aws-orange hover:shadow-[4px_4px_0_0_var(--color-aws-orange-dark)] active:translate-y-0 active:shadow-none sm:p-6"
                  >
                    <span className="flex h-14 w-14 items-center justify-center border-2 border-surface-600 text-surface-200 transition-colors group-hover:border-aws-orange group-hover:bg-aws-orange group-hover:text-surface-900">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="font-mono text-sm font-bold text-surface-100">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
