/**
 * Textos de la convocatoria para comunidades aliadas (vista previa del
 * formulario), en los dos idiomas.
 */
/** Etiqueta del campo tal como se ve en el formulario, en los dos idiomas. */
export const CONTRIBUTION_FIELD = {
  es: "¿Qué brindaría la comunidad a este evento?",
  en: "What would your community bring to this event?",
} as const;

export const INTRO_COPY = {
  es: {
    eyebrow: "Student Community Day",
    heading: "Convocatoria para Comunidades Aliadas",
    read_first: "Lee la convocatoria antes de registrarte",
    intro_1:
      "El Student Community Day reúne a estudiantes de distintas áreas y niveles para descubrir tecnología, aprender, construir y conectar con nuevas oportunidades.",
    intro_2:
      "Buscamos comunidades que quieran aportar algo significativo a los asistentes y crear conexiones que continúen más allá del evento.",

    countdown_label: "El registro cierra en",
    days: "días",
    hours: "hrs",
    minutes: "min",
    seconds: "seg",
    closed_note: "El registro cerró el 12 de octubre de 2026 a las 23:59 CST.",
    cta_apply: "Registrar mi comunidad",
    cta_closed: "El registro está cerrado",

    seek_heading: "¿Qué buscamos?",
    seek_lead_1: "No buscamos únicamente presencia, difusión o material promocional.",
    seek_lead_2:
      "Queremos que quienes visiten tu comunidad se lleven algo de valor. Puede ser, por ejemplo:",
    seek_items: [
      "Una dinámica o mini actividad.",
      "Una oportunidad de mentoría o networking.",
      "Una invitación a un próximo evento o programa de tu comunidad.",
      "Acceso a proyectos, retos u oportunidades para participar.",
      "Vacantes, programas, voluntariados o colaboraciones disponibles dentro de tu comunidad.",
      "Recursos, herramientas o experiencias que puedan ser útiles para los estudiantes.",
      "Una propuesta diferente que ayude a conectar genuinamente con ellos.",
    ],
    seek_outro_1:
      "Lo importante es que exista una experiencia, conexión u oportunidad que el estudiante pueda aprovechar.",
    seek_field_tag: "Campo del formulario",
    seek_outro_pre: "En el formulario encontrarás el espacio:",
    seek_outro_2:
      "Queremos que nos cuentes ahí qué experiencia te gustaría llevar al evento.",

    get_heading: "¿Qué recibirán las comunidades seleccionadas?",
    get_1:
      "Las comunidades seleccionadas contarán con un espacio asignado dentro del venue para interactuar con los asistentes y presentar su propuesta.",
    get_2:
      "Una vez seleccionadas, recibirán información adicional sobre el espacio, montaje, horarios y dinámica de participación.",
    limited_title: "Cupo limitado",
    limited_body:
      "Contamos con un número limitado de espacios para comunidades, así que no todas las propuestas podrán ser seleccionadas.",

    rules_heading: "Lineamientos de participación",
    rules_lead: "Para participar, las comunidades deberán:",
    rules_items: [
      "Respetar el Código de Conducta del evento.",
      "Mantener un ambiente respetuoso, inclusivo y seguro.",
      "No utilizar lenguaje, imágenes o materiales obscenos, ofensivos o discriminatorios.",
      "No realizar venta de productos o servicios dentro del evento.",
      "Utilizar su espacio para actividades de comunidad, networking, aprendizaje y generación de oportunidades.",
    ],
    conduct_link: "Consulta el Código de Conducta",

    dates_heading: "Calendario",
    milestones: [
      { date: "5 oct", title: "Publicación del call for communities y contacto con comunidades", highlight: false },
      { date: "12 oct · 23:59 CST", title: "Cierre de registro", highlight: true },
      { date: "12 – 16 oct", title: "Revisión de postulaciones", highlight: false },
      { date: "18 oct", title: "Envío de correos de aceptación", highlight: false },
      { date: "21 oct", title: "Junta con comunidades", highlight: false },
      { date: "Semana del 26 oct", title: "Colchón para dudas generales y retoque de detalles", highlight: false },
    ],

    join_heading: "¿Quieres participar?",
    join_1:
      "Cuéntanos sobre tu comunidad y, especialmente, qué te gustaría ofrecer a los estudiantes durante el Student Community Day.",
    join_2:
      "Las propuestas serán revisadas de acuerdo con su relevancia, aporte a los asistentes y capacidad de generar conexiones significativas.",
  },
  en: {
    eyebrow: "Student Community Day",
    heading: "Call for Partner Communities",
    read_first: "Read the call before you apply",
    intro_1:
      "Student Community Day brings together students from different fields and levels to discover technology, learn, build, and connect with new opportunities.",
    intro_2:
      "We are looking for communities that want to contribute something meaningful to attendees and create connections that last beyond the event.",

    countdown_label: "Applications close in",
    days: "days",
    hours: "hrs",
    minutes: "min",
    seconds: "sec",
    closed_note: "Applications closed on October 12, 2026 at 11:59 PM CST.",
    cta_apply: "Register my community",
    cta_closed: "Applications are closed",

    seek_heading: "What are we looking for?",
    seek_lead_1: "We are not looking only for presence, outreach, or promotional material.",
    seek_lead_2:
      "We want everyone who visits your community to take away something of value. For example:",
    seek_items: [
      "A group activity or mini challenge.",
      "A mentoring or networking opportunity.",
      "An invitation to an upcoming event or program from your community.",
      "Access to projects, challenges, or opportunities to take part in.",
      "Openings, programs, volunteering, or collaborations available within your community.",
      "Resources, tools, or experiences that can be useful to students.",
      "A different proposal that helps connect genuinely with them.",
    ],
    seek_outro_1:
      "What matters is that there is an experience, connection, or opportunity students can take advantage of.",
    seek_field_tag: "Form field",
    seek_outro_pre: "In the form you will find the field:",
    seek_outro_2:
      "Tell us there what experience you would like to bring to the event.",

    get_heading: "What will selected communities receive?",
    get_1:
      "Selected communities will have an assigned space inside the venue to interact with attendees and present their proposal.",
    get_2:
      "Once selected, they will receive additional information about the space, setup, schedules, and how participation works.",
    limited_title: "Limited capacity",
    limited_body:
      "We have a limited number of spaces for communities, so not every proposal will be able to be selected.",

    rules_heading: "Participation guidelines",
    rules_lead: "To participate, communities must:",
    rules_items: [
      "Respect the event's Code of Conduct.",
      "Maintain a respectful, inclusive, and safe environment.",
      "Not use obscene, offensive, or discriminatory language, images, or materials.",
      "Not sell products or services at the event.",
      "Use their space for community activities, networking, learning, and creating opportunities.",
    ],
    conduct_link: "Read the Code of Conduct",

    dates_heading: "Calendar",
    milestones: [
      { date: "Oct 5", title: "Call for communities published and communities contacted", highlight: false },
      { date: "Oct 12 · 11:59 PM CST", title: "Applications close", highlight: true },
      { date: "Oct 12 – 16", title: "Application review", highlight: false },
      { date: "Oct 18", title: "Acceptance emails sent", highlight: false },
      { date: "Oct 21", title: "Meeting with communities", highlight: false },
      { date: "Week of Oct 26", title: "Buffer for general questions and final details", highlight: false },
    ],

    join_heading: "Want to participate?",
    join_1:
      "Tell us about your community and, above all, what you would like to offer students during Student Community Day.",
    join_2:
      "Proposals will be reviewed based on their relevance, value to attendees, and ability to create meaningful connections.",
  },
} as const;

export function introCopyFor(locale: string) {
  return INTRO_COPY[locale === "en" ? "en" : "es"];
}