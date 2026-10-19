import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { connectDB } from "@/lib/db";
import { Activity } from "@/models/activity";
import { ActivityDetailScreen } from "./_screen";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const isEn = locale === "en";

  await connectDB();
  const activity = await Activity.findOne({ slug }).lean();

  if (!activity) {
    return {
      title: isEn ? "Activity Not Found | AWS SCD" : "Actividad No Encontrada | AWS SCD",
    };
  }

  const title = (isEn && activity.titleEn ? activity.titleEn : activity.title) || activity.title;
  const description = (isEn && activity.descriptionEn ? activity.descriptionEn : activity.description) || activity.description;

  return {
    title: `${title} | AWS Student Community Day México 2026`,
    description: description.slice(0, 160),
  };
}

export default async function ActivityPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  await connectDB();
  const activityDoc = await Activity.findOne({ slug }).lean();

  if (!activityDoc) {
    notFound();
  }

  // Serializar para pasar al Client Component
  const serializedActivity = JSON.parse(JSON.stringify(activityDoc));

  return <ActivityDetailScreen initialActivity={serializedActivity} />;
}
