import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AdminActividadesScreen } from "./_screen";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn
      ? "Activities & Workshops Admin | AWS SCD Mexico 2026"
      : "Panel de Actividades & Workshops | AWS SCD México 2026",
  };
}

export default async function AdminActividadesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminActividadesScreen />;
}
