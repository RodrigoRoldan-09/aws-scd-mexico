"use client";

import { usePathname } from "next/navigation";

/**
 * Renders exactly ONE footer based on the current route.
 * Both footers are server components rendered upstream and passed in as props;
 * this client switch picks one and updates on soft navigation too.
 */
export function FooterSwitch({
  defaultFooter,
  kiroFooter,
}: {
  defaultFooter: React.ReactNode;
  kiroFooter: React.ReactNode;
}) {
  const pathname = usePathname();
  return <>{pathname?.includes("/kiro") ? kiroFooter : defaultFooter}</>;
}
