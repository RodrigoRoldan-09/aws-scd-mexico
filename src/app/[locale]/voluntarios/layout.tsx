import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn ? "Volunteer" : "Sé voluntario",
    description: isEn
      ? "Join the volunteer team at AWS Student Community Day México 2026. Help make the biggest student cloud event in Mexico a reality."
      : "Únete al equipo de voluntarios del AWS Student Community Day México 2026. Ayuda a hacer realidad el mayor evento cloud estudiantil de México.",
    openGraph: {
      title: isEn
        ? "Volunteer — AWS Student Community Day México 2026"
        : "Sé voluntario — AWS Student Community Day México 2026",
      description: isEn
        ? "Be part of the team behind the biggest student cloud event in Mexico."
        : "Sé parte del equipo detrás del mayor evento cloud estudiantil de México.",
      url: isEn
        ? `${SITE_URL}/en/voluntarios`
        : `${SITE_URL}/voluntarios`,
    },
    twitter: {
      card: "summary_large_image",
      title: isEn
        ? "Volunteer — AWS Student Community Day México 2026"
        : "Sé voluntario — AWS Student Community Day México 2026",
      description: isEn
        ? "Volunteer · November 4, 2026 · Mexico City, Mexico"
        : "Voluntario · 4 de noviembre de 2026 · Ciudad de México",
    },
    alternates: {
      canonical: isEn
        ? `${SITE_URL}/en/voluntarios`
        : `${SITE_URL}/voluntarios`,
      languages: {
        es: `${SITE_URL}/voluntarios`,
        en: `${SITE_URL}/en/voluntarios`,
      },
    },
  };
}

export default function VoluntariosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
