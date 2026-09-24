import { EVENT, SITE_URL } from "@/lib/constants";

const FAQ_ES = [
  { q: "¿Qué es el AWS Student Community Day?", a: "Es un evento gratuito de un día organizado por estudiantes y respaldado por AWS. Incluye charlas técnicas, talleres prácticos, sesiones de networking y oportunidades de desarrollo profesional en tecnologías cloud." },
  { q: "¿Quién puede asistir?", a: "¡Todos! El evento está abierto a estudiantes, profesionales, entusiastas de la tecnología y cualquier persona interesada en cloud computing. No se requiere experiencia previa." },
  { q: "¿Es gratuito?", a: "Sí, el evento es completamente gratuito. Solo necesitas registrarte para reservar tu lugar." },
  { q: "¿Qué debo llevar?", a: "Tu laptop (si quieres participar en los talleres prácticos), cargador, y muchas ganas de aprender. Te recomendamos crear una cuenta de AWS Free Tier antes del evento." },
  { q: "¿Habrá comida?", a: "Se proveerán snacks y bebidas durante los recesos. Los detalles del catering se confirmarán más adelante." },
  { q: "¿Cómo llego a la sede?", a: "El evento se llevará a cabo en IPN-Casco Santo Tomas, Ciudad de México. Publicaremos la dirección y cómo llegar en Metro, Metrobús o auto." },
  { q: "¿Las charlas serán en español o inglés?", a: "La mayoría de las charlas serán en español, aunque algunas pueden ser en inglés. El contenido del sitio está disponible en ambos idiomas." },
  { q: "¿Habrá una modalidad virtual?", a: "No, todas las sesiones se realizarán de manera 100% presencial en IPN-Casco Santo Tomas." },
  { q: "¿Cómo puedo ser speaker?", a: "Abriremos una convocatoria de ponentes (CFP) donde podrás postularte como speaker. ¡Mantente atento a nuestras redes sociales para el anuncio!" },
  { q: "¿Puedo ser voluntario?", a: "¡Claro que sí! Si quieres ser parte del equipo organizador o ser voluntario, contáctanos a través de nuestro correo." },
];

const FAQ_EN = [
  { q: "What is the AWS Student Community Day?", a: "It's a free one-day event organized by students and backed by AWS. It includes technical talks, hands-on workshops, networking sessions, and professional development opportunities in cloud technologies." },
  { q: "Who can attend?", a: "Everyone! The event is open to students, professionals, tech enthusiasts, and anyone interested in cloud computing. No prior experience required." },
  { q: "Is it free?", a: "Yes, the event is completely free. You just need to register to reserve your spot." },
  { q: "What should I bring?", a: "Your laptop (if you want to participate in hands-on labs), charger, and a great attitude to learn. We recommend creating an AWS Free Tier account before the event." },
  { q: "Will there be food?", a: "Snacks and beverages will be provided during breaks. Catering details will be confirmed later." },
  { q: "How do I get to the venue?", a: "The event will take place at IPN-Casco Santo Tomas, Mexico City. We will post directions and how to get there by Metro, Metrobús or car." },
  { q: "Will talks be in Spanish or English?", a: "Most talks will be in Spanish, but some may be in English. Site content is available in both languages." },
  { q: "Will there be a virtual track?", a: "No, all sessions will take place 100% in person at IPN-Casco Santo Tomas." },
  { q: "How can I become a speaker?", a: "We'll open a Call for Papers (CFP) where you can apply as a speaker. Stay tuned on our social media for the announcement!" },
  { q: "Can I volunteer?", a: "Absolutely! If you want to be part of the organizing team or volunteer, reach out to us via our contact email." },
];

export function EventJsonLd({ locale }: { locale: string }) {
  const isEs = locale === "es";
  const faqItems = isEs ? FAQ_ES : FAQ_EN;

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    "@id": `${SITE_URL}/#event`,
    name: "AWS Student Community Day México-CDMX 2026",
    description: isEs
      ? "Evento gratuito de tecnología cloud organizado por estudiantes AWS en México-CDMX. Charlas de expertos, talleres prácticos, networking y más. 4 de noviembre de 2026 en IPN-Casco Santo Tomas, Ciudad de México."
      : "Free cloud technology event organized by AWS students in Mexico-CDMX. Expert talks, hands-on workshops, networking and more. November 4, 2026 at IPN-Casco Santo Tomas, Mexico City.",
    keywords: [
      "AWS Student Community Day", "AWS Student Community Day México", "AWS SCD México",
      "AWS Cloud Clubs México", "AWS Student Builder Groups", "AWS SBG México",
      "cloud computing México", "evento cloud CDMX 2026", "AWS México 2026",
      "AWS CDMX 2026", "evento AWS gratis México", "taller AWS México",
      "student community day", "cloud clubs cdmx", "aws event mexico 2026",
    ].join(", "),
    startDate: EVENT.date,
    endDate: EVENT.endDate,
    // Presencial en IPN-Casco Santo Tomas.
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: EVENT.venue.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: EVENT.venue.address,
        addressLocality: EVENT.venue.city,
        addressRegion: EVENT.venue.region,
        postalCode: EVENT.venue.postalCode,
        addressCountry: "MX",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: EVENT.venue.coordinates.lat,
        longitude: EVENT.venue.coordinates.lng,
      },
    },
    image: [
      {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/seo/banner.png`,
        width: 1200,
        height: 630,
      },
    ],
    organizer: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "AWS Student Builder Groups México-CDMX",
      url: SITE_URL,
    },
    performer: {
      "@type": "Organization",
      name: "AWS Student Builder Groups México-CDMX",
      url: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      name: isEs ? "Entrada gratuita" : "Free admission",
      price: "0",
      priceCurrency: "MXN",
      availability: "https://schema.org/InStock",
      url: isEs
        ? `${SITE_URL}/registro`
        : `${SITE_URL}/en/registro`,
      validFrom: "2026-01-01",
    },
    isAccessibleForFree: true,
    inLanguage: ["es", "en"],
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "AWS Student Community Day México-CDMX 2026",
    description: isEs
      ? "Evento gratuito de cloud computing organizado por AWS Student Builder Groups de México-CDMX."
      : "Free cloud computing event organized by AWS Student Builder Groups of Mexico-CDMX.",
    inLanguage: ["es", "en"],
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
    </>
  );
}
