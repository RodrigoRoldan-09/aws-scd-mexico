/**
 * Textos del formulario de asistentes, en los dos idiomas.
 *
 * Mismo patrón que `speakers/_shared.ts`: un objeto por idioma en vez de claves
 * sueltas en `messages/*.json`. Acá conviene porque son textos que sólo usa
 * esta pantalla y se leen mejor juntos — al traducir se ve la frase entera al
 * lado de su original, no una clave a cuatro archivos de distancia.
 *
 * A diferencia del de speakers, que tiene su propio selector, éste sigue el
 * idioma de la página: `/registro` y `/en/registro` ya son dos rutas.
 */

export const COPY = {
  es: {
    firstName: "Nombre(s)",
    firstName_ph: "Tu nombre",
    lastName: "Apellido(s)",
    lastName_ph: "Tu apellido",
    email: "Correo electrónico",
    email_hint: "Ahí te llega la confirmación.",
    email_ph: "tu@correo.com",

    attendance: "¿Asistirás de manera presencial o virtual?",
    inPerson: "Presencial",
    online: "Virtual",

    docType: "Tipo de documento",
    docNumber: "Número de documento",
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

    coc_text: "He leído y acepto el ",
    coc_link: "Código de Conducta",
    privacy_text: "Autorizo el tratamiento de mis datos personales conforme a la ",
    privacy_link: "Política de Privacidad",

    volunteers_q: "¿Buscabas el ",
    volunteers_strong: "equipo de voluntarios",
    volunteers_rest: "? Entonces este no es tu formulario: ",
    volunteers_link: "postúlate acá",

    captcha: "Comprobando que no eres un robot…",
    submit: "Registrarme",
    sending: "Enviando…",

    // Resumen que se muestra en la pantalla de gracias
    r_name: "nombre",
    r_email: "correo",
    r_mode: "modalidad",
    r_doc: "documento",
    r_role: "rol",
    r_entity: "entidad",

    // Errores
    e_firstName: "Escribe tu nombre.",
    e_lastName: "Escribe tu apellido.",
    e_email: "Revisa tu correo.",
    e_attendance: "Elige cómo vas a asistir.",
    e_docType: "Elige el tipo de documento.",
    e_role: "Elige tu rol.",
    e_roleOther: "Cuéntanos cuál.",
    e_entityType: "Elige una opción.",
    e_entityName: "Escribe el nombre.",
    e_coc: "Necesitamos que aceptes el código de conducta.",
    e_privacy: "Necesitamos tu autorización para tratar tus datos.",
  },
  en: {
    firstName: "First name(s)",
    firstName_ph: "Your first name",
    lastName: "Last name(s)",
    lastName_ph: "Your last name",
    email: "Email address",
    email_hint: "This is where your confirmation lands.",
    email_ph: "you@email.com",

    attendance: "Will you attend in person or online?",
    inPerson: "In person",
    online: "Online",

    docType: "ID type",
    docNumber: "ID number",
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

    coc_text: "I have read and accept the ",
    coc_link: "Code of Conduct",
    privacy_text: "I authorise the processing of my personal data under the ",
    privacy_link: "Privacy Policy",

    volunteers_q: "Were you looking for the ",
    volunteers_strong: "volunteer team",
    volunteers_rest: "? Then this is not your form: ",
    volunteers_link: "apply here",

    captcha: "Checking you are not a robot…",
    submit: "Register",
    sending: "Sending…",

    r_name: "name",
    r_email: "email",
    r_mode: "mode",
    r_doc: "id",
    r_role: "role",
    r_entity: "organisation",

    e_firstName: "Enter your first name.",
    e_lastName: "Enter your last name.",
    e_email: "Check your email address.",
    e_attendance: "Choose how you will attend.",
    e_docType: "Choose the ID type.",
    e_role: "Choose your role.",
    e_roleOther: "Tell us which one.",
    e_entityType: "Choose an option.",
    e_entityName: "Enter the name.",
    e_coc: "You need to accept the code of conduct.",
    e_privacy: "We need your authorisation to process your data.",
  },
} as const;

export type CopyLocale = keyof typeof COPY;

/** El idioma de la página, acotado a los que este formulario tiene. */
export function copyFor(locale: string) {
  return COPY[locale === "en" ? "en" : "es"];
}
