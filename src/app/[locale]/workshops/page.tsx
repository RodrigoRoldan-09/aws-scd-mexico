import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import { SpeakersScreen } from "../speakers/_screen";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn ? "Call for Workshops" : "Postula tu Workshop",
    description: isEn
      ? "Submit a hands-on workshop for AWS Student Community Day México 2026. Guide students through interactive cloud experiences."
      : "Postula un workshop práctico para el AWS Student Community Day México 2026. Guía a estudiantes en experiencias prácticas de nube.",
    openGraph: {
      title: isEn
        ? "Call for Workshops — AWS Student Community Day México 2026"
        : "Postula tu Workshop — AWS Student Community Day México 2026",
      description: isEn
        ? "Submit your hands-on workshop proposal for the biggest student cloud event in Mexico."
        : "Postula tu propuesta de workshop práctico para el mayor evento cloud estudiantil de México.",
      url: isEn ? `${SITE_URL}/en/workshops` : `${SITE_URL}/workshops`,
    },
  };
}

/**
 * Convocatoria y registro de Workshops para el AWS Community Day.
 * Mismo diseño y experiencia del Call for Speakers inicializado para Workshops.
 */
export default function WorkshopsPage() {
  return <SpeakersScreen initialFormat="workshop" />;
}
