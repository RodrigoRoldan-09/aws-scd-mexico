import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TalaveraGreca } from "@/components/effects/talavera-greca";
import { Agenda } from "@/components/sections/agenda-section";
import { Sponsors } from "@/components/sections/sponsors";
import { EVENT, SITE_URL } from "@/lib/constants";

type Props = { params: Promise<{ locale: string }> };

// Escenarios del día, en el orden en que se muestran en la cuadrícula.
const STAGES: { name: string; es: string; en: string }[] = [
  { name: "Main Stage", es: "Keynotes y charlas principales", en: "Keynotes and main talks" },
  { name: "Builders Stage", es: "Charlas técnicas y de carrera", en: "Technical and career talks" },
  { name: "Cloud Arena", es: "Workshops hands-on", en: "Hands-on workshops" },
  { name: "Kiro Zone", es: "Hackathon Build for Good + workshops", en: "Build for Good Hackathon + workshops" },
  { name: "Launch Pad · Career Zone", es: "Entrevistas, CV, LinkedIn y foto", en: "Interviews, CV, LinkedIn and headshots" },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const title = isEn ? "Official schedule" : "Agenda oficial";
  const description = isEn
    ? "Full official schedule of AWS Student Community Day Mexico 2026: Main Stage, Builders Stage, Cloud Arena, Kiro Zone and Career Zone. November 4, 2026."
    : "Agenda oficial completa del AWS Student Community Day México 2026: Main Stage, Builders Stage, Cloud Arena, Kiro Zone y Career Zone. 4 de noviembre de 2026.";
  const url = isEn ? `${SITE_URL}/en/agenda` : `${SITE_URL}/agenda`;
  return {
    title,
    description,
    alternates: { canonical: url, languages: { es: `${SITE_URL}/agenda`, en: `${SITE_URL}/en/agenda` } },
    openGraph: { title: `${title} — AWS Student Community Day México 2026`, description, url },
  };
}

export default async function AgendaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";

  return (
    <main className="bg-[#0E0E1A]">
      {/* Encabezado con logos oficiales */}
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-28 md:pt-32">
        <div className="flex flex-wrap items-center gap-5">
          <Image
            src="/images/logo_SCD-01.png"
            alt="AWS Student Community Day México 2026"
            width={88}
            height={88}
            className="h-20 w-20 rounded-2xl border-2 border-[#C143BC]/50 object-contain md:h-24 md:w-24"
            priority
          />
          <Image
            src="/images/logos/logo-sbg-cdmx.png"
            alt="AWS Student Builder Group IPN CDMX"
            width={64}
            height={64}
            className="h-14 w-14 rounded-xl object-contain md:h-16 md:w-16"
          />
          <Image
            src="/images/logos/aws-logo.svg"
            alt="Amazon Web Services"
            width={72}
            height={44}
            className="h-9 w-auto object-contain md:h-11"
          />
        </div>

        <p className="mt-8 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[#C143BC]">
          {isEn ? "// official schedule" : "// agenda oficial"}
        </p>
        <h1 className="dot-matrix mt-3 text-4xl leading-none text-[#E6E4DA] md:text-6xl">
          {isEn ? "Event schedule" : "Agenda del evento"}
        </h1>

        <div className="mt-6 flex flex-col gap-2 font-mono text-sm text-[#B4B2A9] sm:flex-row sm:gap-6">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#C143BC]" aria-hidden="true" />
            {isEn ? "Wednesday, November 4, 2026" : EVENT.dateLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#C143BC]" aria-hidden="true" />
            {EVENT.venue.name} · {EVENT.city}
          </span>
        </div>

        {/* Escenarios */}
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((s) => (
            <li key={s.name} className="border border-[#2C2550] bg-[#1E1838]/60 p-4">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#E6E4DA]">{s.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#B4B2A9]">{isEn ? s.en : s.es}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/actividades"
            className="inline-flex min-h-11 items-center gap-2 bg-[#C143BC] px-5 py-2.5 font-mono text-sm font-bold text-[#0E0E1A] transition-opacity hover:opacity-90"
          >
            {isEn ? "Register for workshops & activities" : "Regístrate a workshops y actividades"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/registro"
            className="inline-flex min-h-11 items-center gap-2 border border-[#C143BC]/60 px-5 py-2.5 font-mono text-sm font-bold text-[#E6E4DA] transition-colors hover:bg-[#C143BC]/10"
          >
            {isEn ? "Get your general pass" : "Obtén tu pase general"}
          </Link>
        </div>
      </section>

      <TalaveraGreca variant="cyan" height={20} />
      <Agenda />
      <TalaveraGreca variant="hybrid" height={20} />
      <Sponsors />
    </main>
  );
}
