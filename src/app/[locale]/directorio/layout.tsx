import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Directorio de speakers — AWS Student Community Day México 2026",
  description:
    "Conoce a todos los speakers confirmados del AWS Student Community Day México 2026. Charlas de Cloud, DevOps, AI/ML, Seguridad, Serverless y más.",
  openGraph: {
    title: "Directorio de speakers — AWS Student Community Day México 2026",
    description:
      "Conoce a todos los speakers confirmados del AWS Student Community Day México 2026.",
    images: ["/images/seo/banner.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Directorio de speakers — AWS SCD México 2026",
    images: ["/images/seo/banner.png"],
  },
};

export default function DirectorioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
