/**
 * Textos del formulario de comunidades aliadas, en los dos idiomas.
 */
export const COPY = {
  es: {
    title: "Comunidades Aliadas",
    lead: "Súmate como comunidad colaboradora al AWS Student Community Day México 2026. Cuéntanos sobre su impacto y cómo les gustaría participar.",

    sec_identity: "// 01 · Identidad de la Comunidad",
    sec_reach: "// 02 · Alcance & Colaboración",
    sec_contact: "// 03 · Datos de Contacto",

    communityName: "Nombre de la comunidad",
    communityName_ph: "Ej. AWS User Group CDMX, Club de Cloud Computing, etc.",

    socialUrl: "Enlace a redes sociales o sitio web",
    socialUrl_ph: "https://meetup.com/..., https://linkedin.com/..., https://instagram.com/...",

    metrics: "Métricas y alcance de la comunidad",
    metrics_hint: "Número aproximado de integrantes activos, asistencia típica a sus reuniones o canales de difusión.",
    metrics_ph: "Ej. 800 miembros en Meetup, promedio de 40 asistentes por sesión presencial, comunidad activa en Discord con 1,200 miembros...",

    contribution: "¿Qué brindaría la comunidad a este evento?",
    contribution_hint: "Detalla cómo colaborarían (difusión, convocatoria de asistentes, apoyo logístico, dinámicas o mentoría).",
    contribution_ph: "Explica cómo su comunidad puede enriquecer la experiencia de los estudiantes y el evento...",

    contactEmail: "Correo electrónico de contacto",
    contactEmail_hint: "Correo del representante o del equipo directivo de la comunidad.",
    contactEmail_ph: "representante@comunidad.org",

    contactPhone: "Teléfono de contacto",
    contactPhone_hint: "Para coordinaciones directas vía llamada o WhatsApp.",

    notice_title: "Aviso importante de selección",
    notice_body: "El envío de este registro no garantiza automáticamente que la comunidad forme parte oficial del evento. Cada propuesta será evaluada por el equipo organizador y únicamente se contactará a las comunidades en caso de ser seleccionadas.",

    captcha: "Comprobando que no eres un robot…",
    submit: "Enviar postulación de comunidad",
    submitting: "Enviando propuesta…",

    // Resumen
    r_community: "comunidad",
    r_social: "redes / web",
    r_metrics: "métricas",
    r_contribution: "aportación",
    r_email: "correo de contacto",
    r_phone: "teléfono",

    // Errores
    e_communityName: "Escribe el nombre de la comunidad.",
    e_socialUrl: "Ingresa el enlace a sus redes o sitio web.",
    e_metrics: "Describe las métricas de tu comunidad.",
    e_contribution: "Cuéntanos qué brindaría la comunidad al evento.",
    e_contactEmail: "Revisa el correo electrónico de contacto.",
    e_contactPhone: "Revisa el teléfono de contacto.",
  },
  en: {
    title: "Partner Communities",
    lead: "Join as a partner tech community for AWS Student Community Day Mexico 2026. Tell us about your impact and how you would like to collaborate.",

    sec_identity: "// 01 · Community Identity",
    sec_reach: "// 02 · Reach & Collaboration",
    sec_contact: "// 03 · Contact Details",

    communityName: "Community name",
    communityName_ph: "e.g. AWS User Group CDMX, Cloud Computing Club, etc.",

    socialUrl: "Social media or website link",
    socialUrl_ph: "https://meetup.com/..., https://linkedin.com/..., etc.",

    metrics: "Community metrics and reach",
    metrics_hint: "Approximate number of active members, average meetup attendance, or active communication channels.",
    metrics_ph: "e.g. 800 members on Meetup, ~40 attendees per in-person session, active Discord with 1,200 members...",

    contribution: "What would your community bring to this event?",
    contribution_hint: "Detail how you plan to contribute (outreach, volunteer support, workshops, mentoring, or community challenges).",
    contribution_ph: "Explain how your community can enrich the student experience during the event...",

    contactEmail: "Contact email address",
    contactEmail_hint: "Email address of the community lead or board.",
    contactEmail_ph: "lead@community.org",

    contactPhone: "Contact phone number",
    contactPhone_hint: "For direct coordination via phone or WhatsApp.",

    notice_title: "Important Selection Notice",
    notice_body: "Submitting this form does not automatically guarantee official community partnership for the event. Each proposal will be evaluated by the organizing committee, and communities will be contacted directly if selected.",

    captcha: "Checking you are not a robot…",
    submit: "Submit community proposal",
    submitting: "Submitting proposal…",

    r_community: "community",
    r_social: "social / web",
    r_metrics: "metrics",
    r_contribution: "contribution",
    r_email: "contact email",
    r_phone: "phone",

    e_communityName: "Enter your community name.",
    e_socialUrl: "Provide a link to your social media or website.",
    e_metrics: "Describe your community metrics.",
    e_contribution: "Tell us what your community brings to the event.",
    e_contactEmail: "Check the contact email address.",
    e_contactPhone: "Check the contact phone number.",
  },
} as const;

export function copyFor(locale: string) {
  return COPY[locale === "en" ? "en" : "es"];
}
