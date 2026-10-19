import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ActividadesScreen } from "./_screen";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn
      ? "Workshops, Hackathons & Activities | AWS Student Community Day Mexico 2026"
      : "Workshops, Hackatones y Actividades | AWS Student Community Day México 2026",
    description: isEn
      ? "Explore and register for hands-on technical workshops, cloud challenges, and exclusive interactive activities at AWS Student Community Day Mexico 2026."
      : "Explora e inscríbete a talleres técnicos prácticos, retos cloud y dinámicas exclusivas en el AWS Student Community Day México 2026.",
  };
}

export default async function ActividadesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ActividadesScreen />;
}
