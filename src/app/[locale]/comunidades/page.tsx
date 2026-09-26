import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ComunidadesScreen } from "./_screen";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn
      ? "Partner Communities | AWS Student Community Day Mexico 2026"
      : "Comunidades Aliadas | AWS Student Community Day México 2026",
    description: isEn
      ? "Apply as a partner tech community for AWS Student Community Day Mexico 2026."
      : "Postula a tu comunidad tecnológica como aliada oficial del AWS Student Community Day México 2026.",
  };
}

export default async function ComunidadesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ComunidadesScreen />;
}
