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
    title: isEn ? "Free Registration" : "Regístrate Gratis",
    description: isEn
      ? "Register for free at AWS Student Community Day México 2026. Talks, workshops, and networking in Mexico City. Limited spots."
      : "Regístrate gratis al AWS Student Community Day México 2026. Charlas, talleres y networking en la Ciudad de México. Cupos limitados.",
    openGraph: {
      title: isEn
        ? "Register — AWS Student Community Day México 2026"
        : "Regístrate — AWS Student Community Day México 2026",
      description: isEn
        ? "Secure your free spot at the biggest cloud event for students in Mexico."
        : "Asegura tu lugar gratuito en el mayor evento cloud para estudiantes de México.",
      url: isEn
        ? `${SITE_URL}/en/registro`
        : `${SITE_URL}/registro`,
    },
    twitter: {
      card: "summary_large_image",
      title: isEn
        ? "Register — AWS Student Community Day México 2026"
        : "Regístrate — AWS Student Community Day México 2026",
      description: isEn
        ? "Free event · November 4, 2026 · Mexico City, Mexico"
        : "Evento gratuito · 4 de noviembre, 2026 · Ciudad de México",
    },
    alternates: {
      canonical: isEn
        ? `${SITE_URL}/en/registro`
        : `${SITE_URL}/registro`,
      languages: {
        es: `${SITE_URL}/registro`,
        en: `${SITE_URL}/en/registro`,
      },
    },
  };
}

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
