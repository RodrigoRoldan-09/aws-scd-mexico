import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SponsorsClient } from "./_client";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SponsorsPage" });

  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function SponsorsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SponsorsClient />;
}
