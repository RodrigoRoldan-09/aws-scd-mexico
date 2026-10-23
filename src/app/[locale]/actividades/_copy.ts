/**
 * Diccionario bilingüe (`es` / `en`) para el catálogo `/actividades`
 * y el formulario reutilizable `/actividades/[slug]`.
 */

export const ACTIVITIES_COPY = {
  es: {
    // Catálogo (/actividades)
    catalog_title: "Workshops, Hackatón & Actividades",
    catalog_lead:
      "Cupo limitado. Regístrate en los talleres prácticos, el hackatón o las actividades especiales del AWS Student Community Day México-CDMX 2026.",
    filter_all: "Todas",
    search_placeholder: "Buscar por título, ponente…",
    level_all: "Todos los niveles",
    filter_workshop: "Workshops",
    filter_hackathon: "Hackatones",
    filter_activity: "Actividades",
    type_workshop: "Workshop",
    type_hackathon: "Hackatón",
    type_activity: "Actividad",
    level_prefix: "Nivel",
    spots_available: (left: number, max: number) => `${left} / ${max} lugares disponibles`,
    last_spots: (left: number) => `¡Últimos ${left} lugares!`,
    sold_out: "Cupo agotado",
    closed: "Registro cerrado",
    cta_register: "Apartar mi lugar",
    cta_sold_out: "Sin lugares disponibles",
    cta_back_catalog: "← Volver al catálogo de actividades",
    team_badge: (max: number) => `Individual o Equipos (máx. ${max} personas · 1 lugar c/u)`,
    solo_badge: "Participación individual (1 lugar)",
    laptop_badge: "Requiere llevar laptop",
    empty_filter: "No hay actividades publicadas en esta categoría por el momento.",

    // Aviso de reglas de registro
    rules_banner_title: "IMPORTANTE: ¿CÓMO FUNCIONA EL REGISTRO?",
    rules_banner_direct_title: "Workshops y Hackatones (inscripción directa):",
    rules_banner_direct_desc:
      "Puedes inscribirte a los workshops y hackatones que desees mientras sus horarios no se empalmen.",
    rules_banner_activity_title: "Actividades (registro único por prioridad):",
    rules_banner_activity_desc:
      "Son compatibles con tus workshops y hackatones (sin empalme de horario), pero solo puedes participar en 1 Actividad. Te postulas en un formulario único ordenando tus opciones por prioridad (1ª, 2ª, 3ª).",
    unified_banner_title: "Formulario Único de Registro a Actividades",
    unified_banner_desc: "Elige tus actividades por orden de prioridad",
    unified_banner_cta: "Ir al formulario de actividades",
    cta_select_in_form: "Elegir en Formulario de Actividades",
    activity_assign_spots: (left: number, max: number) => `${left} / ${max} lugares disponibles`,

    // Banner de pruebas Mock
    mock_badge: "MODO DEMO / MOCK ACTIVO",
    mock_desc:
      "Los datos se guardan en memoria mientras el equipo de Backend conecta MongoDB. Prueba los 3 escenarios con un clic:",
    mock_btn_existing: "1. Correo ya registrado (asistente@ipn.mx)",
    mock_btn_conflict: "2. Ya inscrito en un workshop 11:00-12:30 (ocupado@ipn.mx)",
    mock_btn_new: "3. Correo nuevo — Flujo Híbrido (nuevo@ipn.mx)",

    // Paso 1: Identidad Híbrida
    sec_email_title: "// 01 · Verificación de correo y pase al evento",
    sec_email_tag: "Paso 1",
    email_label: "Correo electrónico",
    email_hint: "Si ya te registraste al evento, vincularemos tu pase automáticamente.",
    email_ph: "tu@correo.com",
    btn_verify_email: "Verificar correo",
    verifying_email: "Verificando…",

    verified_badge: "PASE GENERAL ENCONTRADO",
    verified_hello: (name: string, qr: string) =>
      `¡Hola, ${name}! Tu registro general (${qr}) ya está activo. No necesitas volver a llenar tus datos de perfil.`,
    new_attendee_badge: "NUEVO PARTICIPANTE · REGISTRO HÍBRIDO",
    new_attendee_desc:
      "Este correo aún no tiene pase general al evento. Completa tus datos abajo y te registraremos tanto al evento general como a esta actividad en un solo paso.",

    enrolled_list_title: "Actividades en las que ya estás inscrito:",
    conflict_warning_title: "CONFLICTO DE HORARIO DETECTADO",
    conflict_warning_desc: (otherTitle: string, start: string, end: string) =>
      `Ya estás inscrito en "${otherTitle}" (${start} – ${end}), cuyo horario se empalma con esta actividad.`,
    already_enrolled_title: "YA ESTÁS INSCRITO EN ESTA ACTIVIDAD",
    already_enrolled_desc:
      "Este correo ya tiene un lugar confirmado en esta actividad. No es necesario registrarte de nuevo.",

    // Campos de Perfil General (Flujo Híbrido cuando no existe en Registration)
    sec_profile_title: "// 01.B · Datos para tu pase general al evento",
    sec_profile_tag: "Registro Híbrido",
    firstName: "Nombre(s)",
    firstName_ph: "Tu nombre",
    lastName: "Apellido(s)",
    lastName_ph: "Tu apellido",
    docType: "Tipo de documento (opcional)",
    select: "Selecciona",
    searchType: "Buscar…",
    role: "¿Cuál es tu rol?",
    role_ph: "Selecciona tu rol",
    searchRole: "Buscar rol…",
    which: "¿Cuál?",
    which_ph: "Escríbelo con tus palabras",
    entity: "¿De dónde vienes?",
    entity_ph: "Universidad, empresa, preparatoria…",
    entityName: (tipo: string) => `Nombre de tu ${tipo}`,
    entityName_ph: "Escríbelo completo (ej. IPN - ESCOM)",
    fromCommunity: "¿Vienes de alguna comunidad técnica?",
    yes: "Sí",
    no: "No",
    communityName: "¿De cuál comunidad vienes?",
    communityName_ph: "Ej. AWS Cloud Club IPN, Python CDMX...",
    coc_text: "He leído y acepto el ",
    coc_link: "Código de Conducta",
    privacy_text: "Autorizo el tratamiento de mis datos personales conforme a la ",
    privacy_link: "Política de Privacidad",

    // Bloque de Equipo (Hackatón / Actividades grupales)
    sec_team_title: "// 02 · Modalidad de participación y equipo",
    sec_team_tag: "1 lugar por integrante (máx. 3)",
    mode_label: "¿Cómo vas a participar?",
    mode_solo: "Individual (1 lugar)",
    mode_team: (max: number) => `En equipo (2 a ${max} integrantes)`,
    team_spots_notice: (spots: number, available: number) =>
      `Tu registro ocupará ${spots} ${spots === 1 ? "lugar" : "lugares"} del cupo (${available} disponibles).`,
    team_name_label: "Nombre del equipo",
    team_name_ph: "Ej. Los Polimorfos Cloud",
    leader_role_label: "Tu rol dentro del equipo",
    leader_role_ph: "Ej. Cloud Architect / Backend / Pitch",
    members_heading: (currentTotal: number, max: number) =>
      `Integrantes del equipo (${currentTotal} de ${max} máx. incluyéndote)`,
    btn_add_member: "+ Agregar integrante",
    btn_remove_member: "Quitar",
    member_badge: (idx: number) => `Integrante #${idx} (ocupa 1 lugar)`,
    member_first_ph: "Nombre(s)",
    member_last_ph: "Apellido(s)",
    member_email_ph: "correo@integrante.com",
    member_role_ph: "Rol en el equipo (ej. Frontend / Data)",

    // Bloque Logístico
    sec_logistics_title: "// 03 · Requisitos logísticos y técnicos",
    sec_logistics_tag: "Indispensable",
    prereq_list_heading: "Para participar en esta actividad necesitas:",
    check_laptop:
      "Confirmo que llevaré mi propia laptop y cargador (indispensable para realizar la actividad práctica).",
    check_prereq:
      "Confirmo que revisé y cumplo con los prerrequisitos listados arriba para aprovechar la sesión.",

    // Bloque Custom Fields
    sec_custom_title: "// 04 · Información adicional de la actividad",
    sec_custom_tag: "Específico",

    // Submit & Errores
    submit_btn: (spots: number) =>
      spots > 1 ? `Confirmar registro de equipo (${spots} lugares)` : "Confirmar mi lugar en la actividad",
    submitting: "Reservando lugar…",
    captcha_wait: "Comprobando que no eres un robot…",

    // Validaciones cliente
    e_email: "Escribe un correo electrónico válido.",
    e_firstName: "Escribe tu nombre.",
    e_lastName: "Escribe tu apellido.",
    e_role: "Selecciona tu rol.",
    e_roleOther: "Indica cuál es tu rol.",
    e_entityType: "Selecciona de dónde vienes.",
    e_entityName: "Escribe el nombre de tu institución o entidad.",
    e_communityName: "Escribe el nombre de tu comunidad.",
    e_coc: "Debes aceptar el Código de Conducta.",
    e_privacy: "Debes aceptar la Política de Privacidad.",
    e_teamName: "Escribe el nombre de tu equipo.",
    e_teamMin: (min: number) => `Agrega al menos ${min - 1} integrante(s) más a tu equipo.`,
    e_memberFields: "Completa nombre, apellido y un correo válido para este integrante.",
    member_checking: "Verificando registro al evento…",
    member_registered: "Registrado al evento",
    member_missing:
      "Este correo aún no está registrado al evento. Pídele que se registre en la página de registro y vuelve a intentarlo.",
    e_laptop: "Debes confirmar que llevarás tu propia laptop.",
    e_prereq: "Debes confirmar los prerrequisitos de la actividad.",
    e_requiredField: "Este campo es obligatorio.",

    // Resumen en /gracias
    r_activity: "actividad",
    r_type: "categoría",
    r_schedule: "horario",
    r_room: "salón / zona",
    r_participant: "participante",
    r_email: "correo",
    r_qr: "código de gafete",
    r_spots: "lugares reservados",
    r_team: "equipo",
    r_members: "integrantes",

    // Aviso informativo en workshops/hackatones (postulación de actividades pendiente)
    pending_overlap_title: "AVISO: HORARIO EMPALMADO CON TU SOLICITUD DE ACTIVIDADES",
    pending_overlap_desc: (n: number, title: string) =>
      `Este horario se empalma con tu opción #${n} (${title}) del formulario de actividades. Si te inscribes a este workshop/hackatón, no podrás participar en esa actividad.`,

    // Formulario unificado de actividades (/actividades/registro-actividades)
    ua_title: "Registro a Actividades",
    ua_lead: "Ordena tus actividades por prioridad",
    ua_closed_title: "REGISTRO A ACTIVIDADES CERRADO",
    ua_closed_desc: "El formulario de actividades no está recibiendo solicitudes por el momento.",
    ua_none_title: "SIN ACTIVIDADES DISPONIBLES",
    ua_none_desc: "Aún no hay actividades abiertas para registro. Vuelve pronto.",
    ua_pending_title: "SOLICITUD RECIBIDA",
    ua_pending_desc:
      "Ya recibimos tu solicitud de actividades. Solo podrás participar en una (1) actividad. Si eres seleccionado(a), te avisaremos por correo con los detalles de tu actividad.",
    ua_assigned_title: "ACTIVIDAD CONFIRMADA",
    ua_assigned_desc: "Tu actividad confirmada es:",
    ua_sent_priorities: "Prioridades que enviaste:",
    ua_enrolled_heading: "Tus workshops / hackatones inscritos (horarios ocupados):",
    ua_no_eligible_title: "TODAS LAS ACTIVIDADES SE EMPALMAN",
    ua_no_eligible_desc:
      "Todas las actividades disponibles se empalman con tus workshops/hackatones inscritos, por lo que no puedes postularte por ahora.",
    ua_new_attendee_desc:
      "Este correo aún no tiene pase general al evento. Completa tus datos abajo y te registraremos tanto al evento general como a tu solicitud de actividades.",
    ua_sec_priorities_title: "// 02 · Elige tus actividades por prioridad",
    ua_sec_priorities_tag: "Top de prioridades",
    ua_priorities_hint: (n: number) =>
      `Ordena ${n} ${n === 1 ? "actividad" : "actividades"}: tu primera prioridad es la que más quieres.`,
    ua_priority_note:
      "Puedes incluir actividades con el mismo horario en distintas prioridades, ya que solo participarás en una (1) actividad.",
    ua_priority_label: (n: number) => (n === 1 ? "Prioridad 1 (Tu opción principal)" : `Prioridad ${n}`),
    ua_priority_ph: "Selecciona una actividad",
    ua_priority_search: "Buscar actividad…",
    ua_conflict_label: (title: string, start: string, end: string) =>
      `Conflicto de horario con tu workshop/hackatón: ${title} (${start} – ${end})`,
    ua_sec_logistics_title: "// 03 · Requisitos logísticos y técnicos",
    ua_prereq_heading: "Requisitos de las actividades que elegiste:",
    ua_sec_questions_title: "// 04 · Preguntas del registro",
    ua_sec_questions_tag: "Globales + por actividad",
    ua_global_questions: "Preguntas generales",
    ua_activity_questions: (n: number, title: string) => `Preguntas para Prioridad #${n}: ${title}`,
    ua_submit: "Enviar mi solicitud de actividades",
    ua_submitting: "Enviando solicitud…",
    ua_e_priorities: (n: number) => `Completa tus ${n} ${n === 1 ? "prioridad" : "prioridades"} de actividades.`,
    ua_status_pending: "Solicitud recibida",
    ua_thanks_title: "¡Solicitud enviada!",
    ua_thanks_lead: "Recibimos tu solicitud de actividades",
    ua_thanks_body:
      "Recibimos tus prioridades. Solo podrás participar en una (1) actividad.",
    ua_r_priority: (n: number) => `prioridad ${n}`,
    ua_r_status: "estado",

    // Pantallas /gracias
    thanks_ws_kicker: "inscripción confirmada",
    thanks_ws_heading: "nos vemos ahí",
    thanks_ws_lead:
      "Tu lugar quedó registrado. Guarda tu código QR de acceso (aparece abajo): es lo que te deja entrar el día del evento.",
    thanks_ua_kicker: "solicitud recibida",
    thanks_ua_heading: "gracias por postularte",
    thanks_ua_lead:
      "Recibimos tus prioridades de actividades. Solo podrás participar en una (1) actividad. Guarda tu código QR de acceso (aparece abajo).",
  },
  en: {
    catalog_title: "Workshops, Hackathon & Activities",
    catalog_lead:
      "Limited capacity. Register for hands-on workshops, the hackathon, or special activities at AWS Student Community Day Mexico-CDMX 2026.",
    filter_all: "All",
    search_placeholder: "Search by title, speaker...",
    level_all: "All Levels",
    filter_workshop: "Workshops",
    filter_hackathon: "Hackathons",
    filter_activity: "Activities",
    type_workshop: "Workshop",
    type_hackathon: "Hackathon",
    type_activity: "Activity",
    level_prefix: "Level",
    spots_available: (left: number, max: number) => `${left} / ${max} spots available`,
    last_spots: (left: number) => `Last ${left} spots left!`,
    sold_out: "Sold out",
    closed: "Registration closed",
    cta_register: "Reserve my spot",
    cta_sold_out: "No spots available",
    cta_back_catalog: "← Back to activities catalog",
    team_badge: (max: number) => `Solo or Teams (max ${max} members · 1 spot each)`,
    solo_badge: "Individual participation (1 spot)",
    laptop_badge: "Bring your own laptop",
    empty_filter: "No published activities in this category yet.",

    // Notice about registration rules
    rules_banner_title: "IMPORTANT: HOW DOES REGISTRATION WORK?",
    rules_banner_direct_title: "Workshops & Hackathons (direct enrollment):",
    rules_banner_direct_desc:
      "You can enroll in as many workshops and hackathons as you like as long as their schedules don't overlap.",
    rules_banner_activity_title: "Activities (single priority-based registration):",
    rules_banner_activity_desc:
      "They are compatible with your workshops and hackathons (no schedule overlap), but you can only take part in 1 Activity. You apply in a single form ranking your options by priority (1st, 2nd, 3rd).",
    unified_banner_title: "Single Activities Registration Form",
    unified_banner_desc: "Choose your activities in order of priority",
    unified_banner_cta: "Go to the activities form",
    cta_select_in_form: "Select in Activities Form",
    activity_assign_spots: (left: number, max: number) => `${left} / ${max} spots available`,

    mock_badge: "DEMO / MOCK MODE ACTIVE",
    mock_desc:
      "Data is stored in memory while the Backend team connects MongoDB. Test all 3 scenarios with one click:",
    mock_btn_existing: "1. Existing attendee (asistente@ipn.mx)",
    mock_btn_conflict: "2. Already enrolled in a workshop 11:00-12:30 (ocupado@ipn.mx)",
    mock_btn_new: "3. New attendee — Hybrid Flow (nuevo@ipn.mx)",

    sec_email_title: "// 01 · Email & Event Pass Verification",
    sec_email_tag: "Step 1",
    email_label: "Email address",
    email_hint: "If you already registered for the event, we will link your pass automatically.",
    email_ph: "you@email.com",
    btn_verify_email: "Verify email",
    verifying_email: "Verifying…",

    verified_badge: "GENERAL PASS FOUND",
    verified_hello: (name: string, qr: string) =>
      `Hi, ${name}! Your general registration (${qr}) is already active. You don't need to re-enter your profile details.`,
    new_attendee_badge: "NEW PARTICIPANT · HYBRID REGISTRATION",
    new_attendee_desc:
      "This email doesn't have a general event pass yet. Fill out your profile below and we'll register you for both the main event and this activity in a single step.",

    enrolled_list_title: "Activities you are already enrolled in:",
    conflict_warning_title: "SCHEDULE CONFLICT DETECTED",
    conflict_warning_desc: (otherTitle: string, start: string, end: string) =>
      `You are already registered for "${otherTitle}" (${start} – ${end}), which overlaps with this activity's time slot.`,
    already_enrolled_title: "ALREADY REGISTERED FOR THIS ACTIVITY",
    already_enrolled_desc:
      "This email already has a confirmed spot in this activity. No need to register again.",

    sec_profile_title: "// 01.B · Details for your general event pass",
    sec_profile_tag: "Hybrid Registration",
    firstName: "First name(s)",
    firstName_ph: "Your first name",
    lastName: "Last name(s)",
    lastName_ph: "Your last name",
    docType: "ID type (optional)",
    select: "Select",
    searchType: "Search…",
    role: "What is your role?",
    role_ph: "Select your role",
    searchRole: "Search role…",
    which: "Which one?",
    which_ph: "Tell us in your own words",
    entity: "Where are you coming from?",
    entity_ph: "University, company, high school…",
    entityName: (tipo: string) => `Name of your ${tipo}`,
    entityName_ph: "Write it in full (e.g. IPN - ESCOM)",
    fromCommunity: "Do you belong to any tech community?",
    yes: "Yes",
    no: "No",
    communityName: "Which community do you come from?",
    communityName_ph: "E.g. AWS Cloud Club IPN, Python CDMX...",
    coc_text: "I have read and accept the ",
    coc_link: "Code of Conduct",
    privacy_text: "I authorize the processing of my personal data under the ",
    privacy_link: "Privacy Policy",

    sec_team_title: "// 02 · Participation mode & team",
    sec_team_tag: "1 spot per member (max 3)",
    mode_label: "How will you participate?",
    mode_solo: "Solo (1 spot)",
    mode_team: (max: number) => `In a team (2 to ${max} members)`,
    team_spots_notice: (spots: number, available: number) =>
      `Your registration will reserve ${spots} ${spots === 1 ? "spot" : "spots"} from the capacity (${available} available).`,
    team_name_label: "Team name",
    team_name_ph: "E.g. Cloud Builders IPN",
    leader_role_label: "Your role in the team",
    leader_role_ph: "E.g. Cloud Architect / Backend / Pitch",
    members_heading: (currentTotal: number, max: number) =>
      `Team members (${currentTotal} of ${max} max including you)`,
    btn_add_member: "+ Add team member",
    btn_remove_member: "Remove",
    member_badge: (idx: number) => `Member #${idx} (takes 1 spot)`,
    member_first_ph: "First name(s)",
    member_last_ph: "Last name(s)",
    member_email_ph: "member@email.com",
    member_role_ph: "Role in team (e.g. Frontend / Data)",

    sec_logistics_title: "// 03 · Logistics & technical requirements",
    sec_logistics_tag: "Required",
    prereq_list_heading: "To participate in this activity you need:",
    check_laptop:
      "I confirm that I will bring my own laptop and charger (required for the hands-on session).",
    check_prereq:
      "I confirm that I have reviewed and meet the prerequisites listed above.",

    sec_custom_title: "// 04 · Activity-specific questions",
    sec_custom_tag: "Specific",

    submit_btn: (spots: number) =>
      spots > 1 ? `Confirm team registration (${spots} spots)` : "Confirm my spot in this activity",
    submitting: "Reserving spot…",
    captcha_wait: "Checking you are not a robot…",

    e_email: "Enter a valid email address.",
    e_firstName: "Enter your first name.",
    e_lastName: "Enter your last name.",
    e_role: "Choose your role.",
    e_roleOther: "Tell us which role.",
    e_entityType: "Choose where you are coming from.",
    e_entityName: "Enter the name of your organization.",
    e_communityName: "Enter your community name.",
    e_coc: "You must accept the Code of Conduct.",
    e_privacy: "You must accept the Privacy Policy.",
    e_teamName: "Enter your team name.",
    e_teamMin: (min: number) => `Add at least ${min - 1} more team member(s).`,
    e_memberFields: "Complete first name, last name, and a valid email for this member.",
    member_checking: "Checking event registration…",
    member_registered: "Registered for the event",
    member_missing:
      "This email is not registered for the event yet. Ask them to register on the registration page and try again.",
    e_laptop: "You must confirm that you will bring your own laptop.",
    e_prereq: "You must confirm the activity prerequisites.",
    e_requiredField: "This field is required.",

    r_activity: "activity",
    r_type: "category",
    r_schedule: "schedule",
    r_room: "room / zone",
    r_participant: "participant",
    r_email: "email",
    r_qr: "badge code",
    r_spots: "spots reserved",
    r_team: "team",
    r_members: "members",

    // Informational notice on workshops/hackathons (pending activities application)
    pending_overlap_title: "NOTICE: SCHEDULE OVERLAPS YOUR ACTIVITIES APPLICATION",
    pending_overlap_desc: (n: number, title: string) =>
      `This time slot overlaps with your option #${n} (${title}) in the activities form. If you enroll in this workshop/hackathon, you will not be able to take part in that activity.`,

    // Unified activities form (/actividades/registro-actividades)
    ua_title: "Activities Registration",
    ua_lead: "Rank your activities by priority",
    ua_closed_title: "ACTIVITIES REGISTRATION CLOSED",
    ua_closed_desc: "The activities form is not accepting applications at the moment.",
    ua_none_title: "NO ACTIVITIES AVAILABLE",
    ua_none_desc: "There are no activities open for registration yet. Check back soon.",
    ua_pending_title: "APPLICATION RECEIVED",
    ua_pending_desc:
      "We already received your activities application. You can only take part in one (1) activity. If you are selected, we will email you the details of your activity.",
    ua_assigned_title: "ACTIVITY CONFIRMED",
    ua_assigned_desc: "Your confirmed activity is:",
    ua_sent_priorities: "Priorities you submitted:",
    ua_enrolled_heading: "Your enrolled workshops / hackathons (busy time slots):",
    ua_no_eligible_title: "ALL ACTIVITIES OVERLAP",
    ua_no_eligible_desc:
      "All available activities overlap with your enrolled workshops/hackathons, so you can't apply for now.",
    ua_new_attendee_desc:
      "This email doesn't have a general event pass yet. Fill out your details below and we'll register you for the main event and your activities application.",
    ua_sec_priorities_title: "// 02 · Choose your activities by priority",
    ua_sec_priorities_tag: "Priority ranking",
    ua_priorities_hint: (n: number) =>
      `Rank ${n} ${n === 1 ? "activity" : "activities"}: your first priority is the one you want the most.`,
    ua_priority_note:
      "You can include activities with the same time slot in different priorities, since you will only take part in one (1) activity.",
    ua_priority_label: (n: number) => (n === 1 ? "Priority 1 (Your top choice)" : `Priority ${n}`),
    ua_priority_ph: "Select an activity",
    ua_priority_search: "Search activity…",
    ua_conflict_label: (title: string, start: string, end: string) =>
      `Schedule conflict with your workshop/hackathon: ${title} (${start} – ${end})`,
    ua_sec_logistics_title: "// 03 · Logistics & technical requirements",
    ua_prereq_heading: "Requirements for the activities you chose:",
    ua_sec_questions_title: "// 04 · Registration questions",
    ua_sec_questions_tag: "Global + per activity",
    ua_global_questions: "General questions",
    ua_activity_questions: (n: number, title: string) => `Questions for Priority #${n}: ${title}`,
    ua_submit: "Submit my activities application",
    ua_submitting: "Submitting application…",
    ua_e_priorities: (n: number) => `Complete your ${n} activity ${n === 1 ? "priority" : "priorities"}.`,
    ua_status_pending: "Application received",
    ua_thanks_title: "Application sent!",
    ua_thanks_lead: "We received your activities application",
    ua_thanks_body:
      "We received your priorities. You can only take part in one (1) activity.",
    ua_r_priority: (n: number) => `priority ${n}`,
    ua_r_status: "status",

    // /thanks screens
    thanks_ws_kicker: "enrollment confirmed",
    thanks_ws_heading: "see you there",
    thanks_ws_lead:
      "Your spot is registered. Keep your access QR code (shown below): it is what gets you in on the day of the event.",
    thanks_ua_kicker: "application received",
    thanks_ua_heading: "thanks for applying",
    thanks_ua_lead:
      "We received your activity priorities. You can only take part in one (1) activity. Keep your access QR code (shown below).",
  },
} as const;

export function activitiesCopyFor(locale: string) {
  return ACTIVITIES_COPY[locale === "en" ? "en" : "es"];
}
