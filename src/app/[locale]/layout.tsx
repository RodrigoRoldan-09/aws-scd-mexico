import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { pixelifySans, shareTechMono } from "@/lib/fonts";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SiteChrome } from "@/components/layout/site-chrome";
import { EventConfigProvider } from "@/components/providers/event-config-provider";
import { getPublicEventConfig, EMPTY_PUBLIC_CONFIG, isCfpOpen } from "@/lib/data/event-config";
import { EventJsonLd } from "@/components/seo/json-ld";
import { BfcacheReset } from "@/components/effects/bfcache-reset";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      template: `%s | AWS Student Community Day México 2026`,
    },
    description: t("description"),
    keywords: [
      "AWS Student Community Day",
      "AWS Student Community Day México",
      "AWS Student Community Day 2026",
      "AWS SCD México", "AWS SCD 2026",
      "student community day CDMX",
      "AWS Student Builder Groups", "AWS Student Builder Groups México",
      "AWS SBG México", "AWS Cloud Clubs México",
      "cloud clubs CDMX", "aws cloud club",
      "AWS México 2026", "AWS CDMX 2026",
      "evento AWS México", "evento AWS México gratis",
      "conferencia AWS México 2026", "aws event mexico",
      "aws summit mexico 2026",
      "cloud computing México", "cloud computing México gratis",
      "evento cloud CDMX 2026", "taller AWS gratis México",
      "AWS workshop México", "AWS certificación México",
      "inteligencia artificial México 2026",
      "DevOps México 2026", "machine learning México",
      "Amazon Web Services México",
      "evento tecnología gratis Ciudad de México",
      "networking cloud México", "comunidad AWS México",
      "AWS", "México", "2026",
    ],
    authors: [{ name: "AWS Student Builder Groups México" }],
    creator: "AWS Student Builder Groups México",
    publisher: "AWS Student Builder Groups México",
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${SITE_URL}${locale === "en" ? "/en" : ""}`,
      siteName: "AWS Student Community Day México 2026",
      locale: locale === "es" ? "es_MX" : "en_US",
      alternateLocale: locale === "es" ? ["en_US"] : ["es_MX"],
      type: "website",
      images: [
        {
          url: `${SITE_URL}/images/seo/banner.png`,
          width: 1200,
          height: 630,
          alt: "AWS Student Community Day México 2026",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`${SITE_URL}/images/seo/banner.png`],
    },
    alternates: {
      canonical: `${SITE_URL}${locale === "en" ? "/en" : ""}`,
      languages: {
        es: SITE_URL,
        en: `${SITE_URL}/en`,
        "x-default": SITE_URL,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large" as const,
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    verification: {
      google: "",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  // For unknown locale segments (e.g. /afekanfdakfna), fall back to "es"
  // so the full layout (navbar, footer, providers) still renders and
  // [locale]/not-found.tsx shows within the real site chrome.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // Config pública: 1 sola lectura (cacheada) por request, repartida por Context.
  // Si la DB falla, cae al respaldo y el sitio sigue en pie.
  const [desdeLaBase, cfpOpen] = await Promise.all([
    getPublicEventConfig().catch(() => EMPTY_PUBLIC_CONFIG),
    isCfpOpen(),
  ]);
  const eventConfig = { ...desdeLaBase, cfpOpen };

  return (
    <html
      lang={locale}
      className={`${pixelifySans.variable} ${shareTechMono.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-[var(--bg-base)] text-[var(--text-primary)] font-body">
        <BfcacheReset />
        <NextIntlClientProvider>
          <EventConfigProvider value={eventConfig}>
            <SiteChrome
              navbar={<Navbar />}
              footer={<Footer locale={locale} />}
              jsonLd={<EventJsonLd locale={locale} />}
            >
              {children}
            </SiteChrome>
          </EventConfigProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
