import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SITE_URL } from "@/lib/constants";
import { listPublicActivities } from "@/lib/activities-public";
import type { ActivityType } from "@/models/activity";
import { ActivitiesCatalogClient } from "./_catalog";

const ACTIVITY_TYPES: readonly ActivityType[] = ["workshop", "hackathon", "activity"];

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn
      ? "Workshops, Hackathon & Activities Registration"
      : "Registro a Workshops, Hackatón y Actividades",
    description: isEn
      ? "Reserve your spot for hands-on workshops, the hackathon, and limited-capacity activities at AWS Student Community Day Mexico-CDMX 2026."
      : "Aparta tu lugar en los workshops prácticos, el hackatón y las actividades de cupo limitado del AWS Student Community Day México-CDMX 2026.",
    openGraph: {
      title: isEn
        ? "Workshops, Hackathon & Activities — AWS SCD Mexico 2026"
        : "Workshops, Hackatón y Actividades — AWS SCD México 2026",
      url: isEn ? `${SITE_URL}/en/actividades` : `${SITE_URL}/actividades`,
    },
  };
}

export default async function ActividadesCatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { type } = await searchParams;
  setRequestLocale(locale);

  const activities = await listPublicActivities();
  const initialFilter =
    type && (ACTIVITY_TYPES as readonly string[]).includes(type)
      ? (type as ActivityType)
      : "all";

  return (
    <ActivitiesCatalogClient
      activities={activities}
      locale={locale}
      initialFilter={initialFilter}
    />
  );
}
