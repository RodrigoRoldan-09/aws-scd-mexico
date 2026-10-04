import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ComunidadesIntro } from "./_intro";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn
      ? "Call for Partner Communities | AWS Student Community Day Mexico 2026"
      : "Convocatoria para comunidades aliadas | AWS Student Community Day México 2026",
    description: isEn
      ? "Read the call and apply as a partner tech community for AWS Student Community Day Mexico 2026."
      : "Lee la convocatoria y postula a tu comunidad tecnológica como aliada del AWS Student Community Day México 2026.",
  };
}

/** Convocatoria (bases, calendario y cronómetro). El formulario va en /postular. */
export default async function ComunidadesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ComunidadesIntro />;
}
