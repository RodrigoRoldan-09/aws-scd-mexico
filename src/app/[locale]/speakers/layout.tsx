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
    title: isEn ? "Call for Speakers" : "Postúlate como Speaker",
    description: isEn
      ? "Apply to speak at AWS Student Community Day México 2026. Share your cloud expertise with hundreds of students in Mexico City."
      : "Postúlate para hablar en el AWS Student Community Day México 2026. Comparte tu conocimiento cloud con cientos de estudiantes en la Ciudad de México.",
    openGraph: {
      title: isEn
        ? "Call for Speakers — AWS Student Community Day México 2026"
        : "Postúlate como Speaker — AWS Student Community Day México 2026",
      description: isEn
        ? "Share your AWS & cloud expertise. Apply now for the biggest student cloud event in Mexico."
        : "Comparte tu expertise en AWS y cloud. Postúlate ahora al mayor evento cloud estudiantil de México.",
      url: isEn
        ? `${SITE_URL}/en/speakers`
        : `${SITE_URL}/speakers`,
    },
    twitter: {
      card: "summary_large_image",
      title: isEn
        ? "Call for Speakers — AWS Student Community Day México 2026"
        : "Call for Speakers — AWS Student Community Day México 2026",
      description: isEn
        ? "Apply to speak · November 4, 2026 · Mexico City, Mexico"
        : "Postúlate como speaker · 4 de noviembre de 2026 · Ciudad de México",
    },
    alternates: {
      canonical: isEn
        ? `${SITE_URL}/en/speakers`
        : `${SITE_URL}/speakers`,
      languages: {
        es: `${SITE_URL}/speakers`,
        en: `${SITE_URL}/en/speakers`,
      },
    },
  };
}

export default function SpeakersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
