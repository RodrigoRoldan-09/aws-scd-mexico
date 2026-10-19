import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { UnifiedActivityScreen } from "./_screen";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn
      ? "Unified Activities Priority Registration | AWS SCD México 2026"
      : "Registro Unificado de Actividades por Prioridad | AWS SCD México 2026",
    description: isEn
      ? "Apply for exclusive limited-capacity activities (CV review, mock interviews, mini-jam, speed mentoring) by setting your top priority preferences."
      : "Postúlate a las actividades especiales de cupo limitado (CV review, mock interviews, mini-jam, speed mentoring) ordenando tus preferencias de prioridad.",
  };
}

export default async function RegistroActividadesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UnifiedActivityScreen />;
}
