/**
 * Datos del evento. Todo lo que diga "POR CONFIRMAR" es un placeholder que el
 * equipo de México debe reemplazar; el resto del sitio lee de aquí.
 */

// Dominio público. Se sobreescribe con NEXT_PUBLIC_APP_URL en el .env.
// POR CONFIRMAR: cambiar el fallback cuando exista el dominio definitivo.
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://scd-mexico.example";
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

// Zona horaria y formato regional. CDMX no tiene horario de verano desde 2022:
// es UTC-6 todo el año.
export const EVENT_TIMEZONE = "America/Mexico_City";
export const DATE_LOCALE = "es-MX";
export const TZ_LABEL = "CST";

export const EVENT = {
  name: "AWS Student Community Day",
  year: 2026,
  city: "Ciudad de México",
  country: "México-CDMX",
  venue: {
    name: 'Centro Histórico y Cultural "Juan de Dios Bátiz"',
    shortName: "At IPN",
    address: "Manuel Carpio, Agricultura, Miguel Hidalgo, 11360 Ciudad de México, CDMX",
    city: "Ciudad de México",
    country: "México-CDMX",
    region: "Ciudad de México",
    postalCode: "11360",
    coordinates: { lat: 19.4520, lng: -99.1718 },
    mapsUrl: "https://maps.google.com/?q=Centro+Hist%C3%B3rico+y+Cultural+Juan+de+Dios+B%C3%A1tiz+Manuel+Carpio+Agricultura+Miguel+Hidalgo+11360+CDMX",
  },
  // Miércoles 4 de noviembre de 2026, 10:00 AM CDMX (UTC-6) = 16:00 UTC.
  date: "2026-11-04T16:00:00.000Z",
  // 18:00 CDMX.
  endDate: "2026-11-05T00:00:00.000Z",
  // Textos de fecha y hora que usan correos, PDFs e imágenes.
  dateLabel: "Miércoles 4 de noviembre, 2026",
  dateShort: "04.11.2026",
  timeLabel: "10:00 AM (CST)",
  dateConfirmed: true,
  registrationUrl: null as string | null,
  registrationOpen: false,
  capacity: 800,
  // El correo de contacto NO va acá: este archivo lo importan componentes de
  // cliente, así que cualquier dirección escrita aquí termina en el paquete
  // que descarga el navegador. Vive codificado en <ObfuscatedEmail>.
} as const;

// Cierre de confirmación de asistencia: 4 de noviembre, 6:00 AM CDMX.
export const CONFIRMATION_DEADLINE = "2026-11-04T12:00:00.000Z";

// Fechas de logística que usan los correos y el panel de recordatorios.
// POR CONFIRMAR: montaje, reunión de voluntarios y entrega de escarapelas.
export const EVENT_OPS = {
  weekday: "miércoles",
  confirmDeadline: "miércoles 4 de noviembre, 6:00 AM",
  confirmDeadlineShort: "4 Nov (6 AM)",
  slidesDeadline: "28 de octubre",
  setup: "Martes 3 de noviembre · 3:00 PM",
  setupShort: "Mar 3 Nov · 3 PM",
  badgePickup: "Hoy, martes 3 de noviembre · 3:00 a 5:00 PM",
  badgePickupShort: "Mar 3 Nov · 3–5 PM",
  volunteerMeeting: "Jueves 22 de octubre · 6:00 PM (CST)",
  volunteerMeetingShort: "22 Oct · 6 PM CST",
} as const;

// POR CONFIRMAR: redes de SCD México. Las vacías no se muestran.
export const SOCIAL = {
  instagram: "",
  twitter: "",
  linkedin: "",
  discord: "",
} as const;

export const EXTERNAL_LINKS = {
  awsFreeTier: "https://aws.amazon.com/free/",
  awsSkillBuilder: "https://skillbuilder.aws/",
  awsCertification: "https://aws.amazon.com/certification/",
  awsCloudClubs: "https://community.aws/students",
  awsDocs: "https://docs.aws.amazon.com/",
  awsCodeOfConduct: "https://aws.amazon.com/codeofconduct/",
} as const;
