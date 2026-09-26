import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero";
import { Strip } from "@/components/sections/strips";
import { About } from "@/components/sections/about";
import { WhyAttend } from "@/components/sections/why-attend";
import { Tracks } from "@/components/sections/tracks";
import { Agenda } from "@/components/sections/agenda-section";
import { Venue } from "@/components/sections/venue";
import { Sponsors } from "@/components/sections/sponsors";
import { Communities } from "@/components/sections/communities";
import { Organizers } from "@/components/sections/organizers";
import { FAQ } from "@/components/sections/faq-section";
import { RegistrationCTA } from "@/components/sections/registration-cta";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // El landing alterna dos tonos a sangre: tinta (oscuro) y bloque (acento).
  // Las cintas marcan el corte entre uno y otro.
  return (
    <main>
      <Hero />
      <About />
      <Strip k="hybrid" tone="ink" duration={34} reverse />

      <WhyAttend />
      <Tracks />

      <Strip k="event" tone="ink" duration={36} reverse />

      <Agenda />
      <Venue />
      <Sponsors />
      <Communities />
      <Organizers />
      <FAQ />

      <Strip k="date" tone="block" duration={30} />
      <RegistrationCTA />
    </main>
  );
}
