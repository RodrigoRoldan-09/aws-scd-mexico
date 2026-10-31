import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SITE_URL } from "@/lib/constants";
import { getUnifiedFormPublicData } from "@/lib/activities-public";
import { UnifiedActivitiesScreen } from "./_screen";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ prefer?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn ? "Activities Registration" : "Registro a Actividades",
    description: isEn
      ? "Rank your preferred activities by priority at AWS Student Community Day Mexico-CDMX 2026."
      : "Ordena tus actividades favoritas por prioridad en el AWS Student Community Day México-CDMX 2026.",
    openGraph: {
      title: isEn
        ? "Activities Registration — AWS SCD Mexico 2026"
        : "Registro a Actividades — AWS SCD México 2026",
      url: isEn
        ? `${SITE_URL}/en/actividades/registro-actividades`
        : `${SITE_URL}/actividades/registro-actividades`,
    },
  };
}

export default async function RegistroActividadesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { prefer } = await searchParams;
  setRequestLocale(locale);

  const { config, activities } = await getUnifiedFormPublicData();

  return (
    <UnifiedActivitiesScreen
      config={config}
      activities={activities}
      locale={locale}
      preferSlug={prefer?.trim().toLowerCase() ?? ""}
    />
  );
}
