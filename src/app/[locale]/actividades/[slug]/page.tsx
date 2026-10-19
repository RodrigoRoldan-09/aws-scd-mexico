import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SITE_URL } from "@/lib/constants";
import { getPublicActivityBySlug } from "@/lib/activities-public";
import { ActivityRegistrationScreen } from "./_screen";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const isEn = locale === "en";
  const activity = await getPublicActivityBySlug(slug);

  if (!activity) {
    return {
      title: isEn ? "Activity Not Found" : "Actividad no encontrada",
    };
  }

  const title = isEn ? activity.titleEn || activity.title : activity.title;
  const description = isEn
    ? activity.descriptionEn || activity.description
    : activity.description;

  return {
    title,
    description,
    openGraph: {
      title: `${title} — AWS Student Community Day México 2026`,
      description,
      url: isEn
        ? `${SITE_URL}/en/actividades/${activity.slug}`
        : `${SITE_URL}/actividades/${activity.slug}`,
    },
  };
}

export default async function ActivitySlugPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const activity = await getPublicActivityBySlug(slug);
  if (!activity) {
    notFound();
  }

  // Las actividades (`type: "activity"`) se registran en el formulario unificado por prioridad.
  if (activity.type === "activity") {
    redirect(
      `${locale === "en" ? "/en" : ""}/actividades/registro-actividades?prefer=${activity.slug}`,
    );
  }

  return (
    <ActivityRegistrationScreen
      activity={activity}
      locale={locale}
    />
  );
}
