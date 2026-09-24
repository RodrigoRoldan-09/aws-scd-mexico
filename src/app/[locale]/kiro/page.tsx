import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { KiroContent } from "@/components/kiro/kiro-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Kiro" });
  return {
    title: t("banner_title"),
    description: t("meta_desc"),
    // Favicon propio sólo en /kiro; el resto del sitio usa el ícono por defecto.
    icons: { icon: [{ url: "/kiro-icon.svg", type: "image/svg+xml" }] },
  };
}

export default async function KiroPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <KiroContent />;
}
