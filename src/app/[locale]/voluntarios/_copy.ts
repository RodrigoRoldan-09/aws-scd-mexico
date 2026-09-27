/**
 * Textos del formulario de voluntarios, en los dos idiomas.
 *
 * Mismo patrón que `registro/_copy.ts` y que `speakers/_shared.ts`: un objeto
 * por idioma, porque son textos que sólo usa esta pantalla y al traducir
 * conviene ver la frase al lado de su original.
 */

export const COPY = {
  es: {
    firstName: "Nombre(s)",
    firstName_ph: "Tu nombre",
    lastName: "Apellido(s)",
    lastName_ph: "Tu apellido",
    email: "Correo electrónico",
    email_hint: "Ahí te contamos si quedaste en el equipo.",
    email_ph: "tu@correo.com",
    phone: "Teléfono",
    phone_hint: "Para el grupo del equipo y coordinar el día del evento.",

    docType: "Tipo de documento",
    docNumber: "Número de documento",
    docNumber_hint: "Es para el control de acceso a la sede.",
    select: "Selecciona",
    searchType: "Buscar tipo…",

    role: "¿Cuál es tu rol?",
    role_ph: "Selecciona tu rol",
    searchRole: "Buscar rol…",
    which: "¿Cuál?",
    which_ph: "Escríbelo con tus palabras",

    entity: "¿De dónde vienes?",
    entity_ph: "Universidad, empresa, colegio…",
    search: "Buscar…",
    entityName: (tipo: string) => `Nombre de tu ${tipo}`,
    entityName_ph: "Escríbelo completo",

    sbg: "¿Haces parte de un AWS Student Builder Group?",
    searchSbg: "Buscar SBG…",
    sbgOther_ph: "Nombre del grupo",

    blockDay: "el día del evento",
    blockReady: "para tenerte listo",

    availability: "¿Qué disponibilidad tienes?",
    areas: "¿En qué te gustaría apoyar?",
    areas_hint: "Puedes marcar varias. Es una preferencia, no un compromiso: el equipo rota.",
    experience: "¿Has sido voluntario antes?",
    motivation: "¿Por qué quieres ser parte del equipo?",
    motivation_hint: "Opcional, pero se lee. Cuéntanos en dos líneas.",
    motivation_ph: "Lo que te mueva a estar del otro lado del evento.",

    shirt: "Talla de camiseta",
    shirt_hint: "La del equipo, que se entrega el día del evento.",
    dietary: "¿Tienes alguna restricción alimentaria?",
    dietary_hint: "El día incluye almuerzo. Con esto el pedido no se hace a ciegas.",
    dietaryOther_ph: "Alergias, intolerancias, lo que necesitemos saber",

    emergency: "Contacto de emergencia",
    emergency_hint: "A quién llamamos si pasa algo.",
    emergency_ph: "Nombre y parentesco",
    emergencyPhone: "Teléfono del contacto de emergencia",

    coc_text: "He leído y acepto el ",
    coc_link: "Código de Conducta",
    privacy_text: "Autorizo el tratamiento de mis datos personales conforme a la ",
    privacy_link: "Política de Privacidad",

    notice1a: "Este formulario es para el ",
    notice1b: "equipo de voluntarios",
    notice1c: ". Si lo que quieres es asistir al evento, ",
    notice1link: "regístrate como asistente acá",
    notice2a: "¿Ya te registraste como asistente y quieres ser parte del equipo? No puedes estar en las dos listas: escríbenos a ",
    notice2b: " y un organizador te mueve.",

    warning_title: "Aviso importante sobre tu postulación",
    warning_participation: "El envío de este formulario o correo no confirma tu participación como voluntario/a. Tu participación solo quedará confirmada si eres contactado/a directamente por parte del equipo organizador.",

    captcha: "Comprobando que no eres un robot…",
    submit: "Postularme",
    sending: "Enviando…",

    // Resumen que se muestra en la pantalla de gracias
    r_name: "nombre",
    r_email: "correo",
    r_phone: "teléfono",
    r_doc: "documento",
    r_entity: "entidad",
    r_sbg: "sbg",
    r_availability: "disponibilidad",
    r_areas: "áreas",
    r_shirt: "talla",
    r_dietary: "alimentación",
    r_emergency: "emergencia",
    r_none: "Ninguno",

    // Errores
    e_firstName: "Escribe tu nombre.",
    e_lastName: "Escribe tu apellido.",
    e_email: "Revisa tu correo.",
    e_phone: "Necesitamos un teléfono para coordinar.",
    e_docType: "Elige el tipo de documento.",
    e_role: "Elige tu rol.",
    e_roleOther: "Cuéntanos cuál.",
    e_entityType: "Elige una opción.",
    e_entityName: "Escribe el nombre.",
    e_sbg: "Elige una opción.",
    e_sbgOther: "Escribe cuál.",
    e_availability: "Dinos cuándo puedes estar.",
    e_areas: "Elige al menos un área.",
    e_experience: "Elige una opción.",
    e_shirt: "Elige tu talla.",
    e_dietary: "Elige una opción.",
    e_dietaryOther: "Cuéntanos cuál.",
    e_emergency: "Escribe a quién llamamos.",
    e_coc: "Necesitamos que aceptes el código de conducta.",
    e_privacy: "Necesitamos tu autorización para tratar tus datos.",
  },
  en: {
    firstName: "First name(s)",
    firstName_ph: "Your first name",
    lastName: "Last name(s)",
    lastName_ph: "Your last name",
    email: "Email address",
    email_hint: "This is where we tell you if you made the team.",
    email_ph: "you@email.com",
    phone: "Phone",
    phone_hint: "For the team chat and to coordinate on the day.",

    docType: "ID type",
    docNumber: "ID number",
    docNumber_hint: "It is for venue access control.",
    select: "Select",
    searchType: "Search type…",

    role: "What is your role?",
    role_ph: "Select your role",
    searchRole: "Search role…",
    which: "Which one?",
    which_ph: "Tell us in your own words",

    entity: "Where are you coming from?",
    entity_ph: "University, company, school…",
    search: "Search…",
    entityName: (tipo: string) => `Name of your ${tipo}`,
    entityName_ph: "Write it in full",

    sbg: "Are you part of an AWS Student Builder Group?",
    searchSbg: "Search SBG…",
    sbgOther_ph: "Name of the group",

    blockDay: "on the day",
    blockReady: "to get you ready",

    availability: "What availability do you have?",
    areas: "Where would you like to help?",
    areas_hint: "Pick as many as you like. It is a preference, not a commitment: the team rotates.",
    experience: "Have you volunteered before?",
    motivation: "Why do you want to join the team?",
    motivation_hint: "Optional, but we do read it. Two lines are enough.",
    motivation_ph: "Whatever draws you to the other side of the event.",

    shirt: "T-shirt size",
    shirt_hint: "The team shirt, handed out on the day.",
    dietary: "Do you have any dietary restrictions?",
    dietary_hint: "Lunch is included. This is how the order stops being guesswork.",
    dietaryOther_ph: "Allergies, intolerances, anything we should know",

    emergency: "Emergency contact",
    emergency_hint: "Who we call if something happens.",
    emergency_ph: "Name and relationship",
    emergencyPhone: "Emergency contact phone",

    coc_text: "I have read and accept the ",
    coc_link: "Code of Conduct",
    privacy_text: "I authorise the processing of my personal data under the ",
    privacy_link: "Privacy Policy",

    notice1a: "This form is for the ",
    notice1b: "volunteer team",
    notice1c: ". If what you want is to attend the event, ",
    notice1link: "register as an attendee here",
    notice2a: "Already registered as an attendee and want to join the team? You cannot be on both lists: write to ",
    notice2b: " and an organiser will move you.",

    warning_title: "Important application notice",
    warning_participation: "Submitting this form or email does not confirm your participation as a volunteer. Your participation is only confirmed if you are contacted directly by the organizing team.",

    captcha: "Checking you are not a robot…",
    submit: "Apply to the team",
    sending: "Sending…",

    r_name: "name",
    r_email: "email",
    r_phone: "phone",
    r_doc: "id",
    r_entity: "organisation",
    r_sbg: "sbg",
    r_availability: "availability",
    r_areas: "areas",
    r_shirt: "size",
    r_dietary: "diet",
    r_emergency: "emergency",
    r_none: "None",

    e_firstName: "Enter your first name.",
    e_lastName: "Enter your last name.",
    e_email: "Check your email address.",
    e_phone: "We need a phone number to coordinate.",
    e_docType: "Choose the ID type.",
    e_role: "Choose your role.",
    e_roleOther: "Tell us which one.",
    e_entityType: "Choose an option.",
    e_entityName: "Enter the name.",
    e_sbg: "Choose an option.",
    e_sbgOther: "Type which one.",
    e_availability: "Tell us when you can be there.",
    e_areas: "Choose at least one area.",
    e_experience: "Choose an option.",
    e_shirt: "Choose your size.",
    e_dietary: "Choose an option.",
    e_dietaryOther: "Tell us which one.",
    e_emergency: "Enter who we should call.",
    e_coc: "You need to accept the code of conduct.",
    e_privacy: "We need your authorisation to process your data.",
  },
} as const;

/** El idioma de la página, acotado a los que este formulario tiene. */
export function copyFor(locale: string) {
  return COPY[locale === "en" ? "en" : "es"];
}
