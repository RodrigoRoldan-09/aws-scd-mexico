"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { localePath } from "@/lib/utils";
import { Turnstile } from "@/components/ui/turnstile";
import { doTimesOverlap } from "@/lib/activity-schedule";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Clock,
  MapPin,
  Laptop,
  Check,
  UserPlus,
  AlertCircle,
  HelpCircle,
  QrCode,
  Calendar,
} from "lucide-react";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

interface CustomFieldOption {
  value: string;
  label: string;
  labelEn?: string;
}

interface CustomField {
  key: string;
  label: string;
  labelEn?: string;
  type: "text" | "textarea" | "select" | "checkbox" | "url";
  required?: boolean;
  placeholder?: string;
  placeholderEn?: string;
  options?: CustomFieldOption[];
}

interface ActivityItem {
  _id: string;
  slug: string;
  type: string;
  title: string;
  titleEn?: string;
  startTime: string;
  endTime: string;
  roomName?: string;
  maxCapacity: number;
  registeredCount: number;
  spotsLeft: number;
  isOpen: boolean;
  formConfig?: {
    requireLaptop?: boolean;
    prerequisitesList?: string[];
    prerequisitesListEn?: string[];
    customFields?: CustomField[];
  };
}

interface UnifiedFormConfig {
  isOpen: boolean;
  maxPriorities: number;
  requireLaptop: boolean;
  prerequisitesList: string[];
  prerequisitesListEn: string[];
  globalCustomFields: CustomField[];
}

interface EnrolledItem {
  activityId: string;
  slug: string;
  title: string;
  startTime: string;
  endTime: string;
  type: string;
}

interface AttendeeLookupData {
  existsInGeneralRegistration: boolean;
  firstName?: string;
  lastName?: string;
  qrCode?: string;
  enrolledActivities?: EnrolledItem[];
  activityApplication?: {
    applicationId: string;
    status: string;
    priorities?: Array<{
      priority: number;
      activityId: string;
      slug: string;
      title: string;
      startTime: string;
      endTime: string;
    }>;
    assignedActivity?: {
      activityId: string;
      slug: string;
      title: string;
      startTime: string;
      endTime: string;
      roomName?: string;
    } | null;
  } | null;
}

export function UnifiedActivityScreen() {
  const locale = (useLocale() === "en" ? "en" : "es") as "es" | "en";
  const isEn = locale === "en";

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<UnifiedFormConfig | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Email & Lookup state
  const [email, setEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [attendee, setAttendee] = useState<AttendeeLookupData | null>(null);

  // New attendee general profile
  const [generalProfile, setGeneralProfile] = useState({
    firstName: "",
    lastName: "",
    role: "student_university",
    roleOther: "",
    entityType: "university",
    entityName: "",
    fromCommunity: "no",
    communityName: "",
    documentType: "CURP",
    documentNumber: "",
    acceptCoc: false,
    acceptPrivacy: false,
  });

  // Selected priorities in order: array of slugs
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  // Logistics
  const [bringsLaptop, setBringsLaptop] = useState(false);
  const [acceptedPrerequisites, setAcceptedPrerequisites] = useState(false);

  // Global & Activity answers
  const [globalAnswers, setGlobalAnswers] = useState<Record<string, unknown>>({});
  const [activityAnswers, setActivityAnswers] = useState<Record<string, Record<string, unknown>>>({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [applicationSuccess, setApplicationSuccess] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    async function loadForm() {
      try {
        setLoading(true);
        const res = await fetch("/api/activities/unified-form");
        if (!res.ok) throw new Error("No se pudo cargar la configuración de actividades");
        const data = await res.json();
        setConfig(data.config);
        setActivities(data.activities || []);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Error al cargar formulario");
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, []);

  async function handleEmailLookup() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage(isEn ? "Please enter a valid email." : "Ingresa un correo electrónico válido.");
      return;
    }

    setLookupLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/activities/lookup-attendee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data: AttendeeLookupData = await res.json();
      setAttendee(data);
      setLookupDone(true);

      if (data.existsInGeneralRegistration && data.firstName) {
        setGeneralProfile((prev) => ({
          ...prev,
          firstName: data.firstName || prev.firstName,
          lastName: data.lastName || prev.lastName,
        }));
      }
    } catch {
      setErrorMessage(isEn ? "Error looking up your email." : "Error al consultar estado del correo.");
    } finally {
      setLookupLoading(false);
    }
  }

  // Conflict helper for an activity against enrolled workshops
  const enrolledItems = attendee?.enrolledActivities || [];
  function getConflict(act: ActivityItem) {
    return enrolledItems.find((w) => doTimesOverlap(act.startTime, act.endTime, w.startTime, w.endTime));
  }

  // Activities eligible without schedule conflict
  const eligibleActivities = useMemo(() => {
    return activities.filter((act) => !getConflict(act));
  }, [activities, enrolledItems]);

  const maxAllowedPriorities = config?.maxPriorities || 3;
  const requiredCount = Math.min(maxAllowedPriorities, eligibleActivities.length);

  function toggleSlugPriority(slug: string) {
    if (selectedSlugs.includes(slug)) {
      setSelectedSlugs(selectedSlugs.filter((s) => s !== slug));
    } else {
      if (selectedSlugs.length >= maxAllowedPriorities) return;
      setSelectedSlugs([...selectedSlugs, slug]);
    }
  }

  function movePriority(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedSlugs.length) return;
    const copy = [...selectedSlugs];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setSelectedSlugs(copy);
  }

  function handleActivityAnswerChange(slug: string, fieldKey: string, val: unknown) {
    setActivityAnswers((prev) => ({
      ...prev,
      [slug]: {
        ...(prev[slug] || {}),
        [fieldKey]: val,
      },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!lookupDone) {
      await handleEmailLookup();
      return;
    }

    if (attendee?.activityApplication && attendee.activityApplication.status !== "cancelled") {
      setErrorMessage(
        isEn
          ? "You have already submitted an activity application."
          : "Ya has enviado tu solicitud unificada para actividades.",
      );
      return;
    }

    if (selectedSlugs.length < requiredCount) {
      setErrorMessage(
        isEn
          ? `Please select exactly ${requiredCount} prioritized activities (currently ${selectedSlugs.length} chosen).`
          : `Debes ordenar exactamente ${requiredCount} actividades de tu preferencia (llevas ${selectedSlugs.length}).`,
      );
      return;
    }

    // Check that none of the chosen slugs conflict with enrolled workshops
    for (const slug of selectedSlugs) {
      const act = activities.find((a) => a.slug === slug);
      if (act) {
        const conf = getConflict(act);
        if (conf) {
          setErrorMessage(
            isEn
              ? `Conflict: "${act.title}" overlaps with your enrolled session "${conf.title}".`
              : `Conflicto de horario: "${act.title}" se empalma con "${conf.title}".`,
          );
          return;
        }
      }
    }

    // Validate global custom fields
    for (const field of config?.globalCustomFields || []) {
      if (field.required && !globalAnswers[field.key]) {
        setErrorMessage(
          isEn
            ? `Please fill in required field: ${field.labelEn || field.label}`
            : `Por favor completa el campo requerido: ${field.label}`,
        );
        return;
      }
    }

    // Validate activity custom fields for chosen priorities
    for (const slug of selectedSlugs) {
      const act = activities.find((a) => a.slug === slug);
      for (const field of act?.formConfig?.customFields || []) {
        if (field.required && !activityAnswers[slug]?.[field.key]) {
          setErrorMessage(
            isEn
              ? `Please answer required question in "${act?.title}": ${field.labelEn || field.label}`
              : `Por favor responde la pregunta obligatoria en "${act?.title}": ${field.label}`,
          );
          return;
        }
      }
    }

    // Validate general registration profile if new
    if (!attendee?.existsInGeneralRegistration) {
      if (!generalProfile.firstName.trim() || !generalProfile.lastName.trim()) {
        setErrorMessage(isEn ? "First and last name are required." : "Nombre y apellidos son obligatorios.");
        return;
      }
      if (!generalProfile.acceptCoc || !generalProfile.acceptPrivacy) {
        setErrorMessage(
          isEn
            ? "You must accept the Code of Conduct and Privacy Policy."
            : "Debes aceptar el Código de Conducta y la Política de Privacidad.",
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        captchaToken,
        email: email.trim().toLowerCase(),
        generalProfile: attendee?.existsInGeneralRegistration ? undefined : generalProfile,
        prioritySlugs: selectedSlugs,
        logistics: {
          bringsLaptop,
          acceptedPrerequisites,
        },
        globalCustomAnswers: globalAnswers,
        activityCustomAnswers: activityAnswers,
      };

      const res = await fetch("/api/activities/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || resData.error || "Error al enviar solicitud");
      }

      setApplicationSuccess(resData.application);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error inesperado al enviar postulación");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07060D] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#C143BC] border-t-transparent" />
          <span className="font-mono text-xs uppercase tracking-wider text-[#A8A7A0]">
            {isEn ? "Loading form..." : "Cargando formulario unificado..."}
          </span>
        </div>
      </div>
    );
  }

  // Already applied state
  const existingApp = attendee?.activityApplication;
  if (lookupDone && existingApp && existingApp.status !== "cancelled" && !applicationSuccess) {
    const isAssigned = existingApp.status === "assigned";

    return (
      <div className="min-h-screen bg-[#07060D] px-4 py-16 text-[#E6E4DA]">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#C143BC]/40 bg-[#0E0C1B] p-6 shadow-2xl sm:p-8">
          <div className="text-center">
            <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 ${isAssigned ? "border-[#3DD6D0] bg-[#3DD6D0]/10 text-[#3DD6D0]" : "border-[#C143BC] bg-[#C143BC]/10 text-[#C143BC]"}`}>
              {isAssigned ? <CheckCircle2 className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
            </div>

            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#C143BC]">
              {isAssigned ? (isEn ? "Assigned Activity" : "Actividad Asignada") : (isEn ? "Application Under Review" : "Solicitud en Revisión")}
            </span>

            <h2 className="mt-2 font-mono text-2xl font-black text-white sm:text-3xl">
              {isAssigned
                ? isEn ? "Your Special Activity is Confirmed!" : "¡Tu Actividad Especial está Asignada!"
                : isEn ? "We Received Your Priorities" : "Ya recibimos tu lista de prioridades"}
            </h2>

            <p className="mt-2 font-mono text-xs text-[#A8A7A0]">
              {isAssigned
                ? isEn
                  ? "You have been assigned to an exclusive activity by the organizing team."
                  : "El equipo organizador te ha asignado a una de las actividades exclusivas."
                : isEn
                  ? "Your request is in status 'pending'. The organizing team is reviewing applications to ensure equal distribution."
                  : "Tu postulación está en estado 'pendiente'. El equipo de coordinación asignará los lugares garantizando que la mayor cantidad de asistentes participe en al menos una dinámica."}
            </p>
          </div>

          {/* Assigned activity card */}
          {isAssigned && existingApp.assignedActivity && (
            <div className="mt-6 rounded-xl border border-[#3DD6D0]/50 bg-[#090812] p-5 font-mono text-xs space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-[#3DD6D0] font-bold">
                {isEn ? "Assigned Session:" : "Dinámica Asignada:"}
              </span>
              <h3 className="text-base font-bold text-white">
                {existingApp.assignedActivity.title}
              </h3>
              <div className="flex flex-wrap gap-4 pt-1 text-[#A8A7A0]">
                <span>{existingApp.assignedActivity.startTime} - {existingApp.assignedActivity.endTime} hrs</span>
                {existingApp.assignedActivity.roomName && <span>· {existingApp.assignedActivity.roomName}</span>}
              </div>
            </div>
          )}

          {/* Submitted priorities list */}
          {existingApp.priorities && existingApp.priorities.length > 0 && (
            <div className="mt-6 rounded-xl border border-[#221C3D] bg-[#090812] p-4 font-mono text-xs">
              <h4 className="font-bold uppercase tracking-wider text-white mb-3">
                {isEn ? "Your Submitted Preferences:" : "Tus Preferencias Enviadas:"}
              </h4>
              <ul className="space-y-2">
                {existingApp.priorities.map((p) => (
                  <li key={p.priority} className="flex items-center justify-between rounded-lg border border-[#1F1938] bg-[#0E0C1B] p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C143BC]/20 text-[10px] font-bold text-[#C143BC]">
                        {p.priority}
                      </span>
                      <span className="font-semibold text-white">{p.title}</span>
                    </div>
                    <span className="text-[#73726C]">{p.startTime} - {p.endTime} hrs</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={localePath(locale, "/pasaporte")}
              className="flex-1 rounded-lg border border-[#3DD6D0] bg-[#3DD6D0] py-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-black shadow-md hover:bg-[#32b5b0]"
            >
              {isEn ? "View Digital Passport" : "Ver mi Pasaporte Digital"}
            </Link>
            <Link
              href={localePath(locale, "/actividades")}
              className="flex-1 rounded-lg border border-[#2C2550] bg-[#16122B] py-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-[#E6E4DA] hover:bg-[#201a3d]"
            >
              {isEn ? "Browse Other Sessions" : "Ver Otras Actividades"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success view right after submitting
  if (applicationSuccess) {
    return (
      <div className="min-h-screen bg-[#07060D] px-4 py-16 text-[#E6E4DA]">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#C143BC]/50 bg-[#0E0C1B] p-6 shadow-[0_0_60px_rgba(193,67,188,0.2)] sm:p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#C143BC] bg-[#C143BC]/15 text-[#C143BC]">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#C143BC]">
            {isEn ? "Application Submitted Successfully" : "¡Postulación Recibida con Éxito!"}
          </span>

          <h2 className="mt-2 font-mono text-2xl font-black text-white sm:text-3xl">
            {isEn ? "Your Priorities Are Registered" : "Tus Preferencias Fueron Guardadas"}
          </h2>

          <p className="mt-3 font-mono text-xs leading-relaxed text-[#A8A7A0]">
            {isEn
              ? "The organizing team will assign participants based on availability and priority orders to ensure as many people as possible receive an activity. You will receive an email once assigned."
              : "El equipo organizador asignará los lugares en base a disponibilidad y orden de prioridad para que la mayor cantidad de asistentes tenga acceso a al menos 1 actividad. Te notificaremos por correo electrónico."}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={localePath(locale, "/pasaporte")}
              className="flex-1 rounded-lg border border-[#3DD6D0] bg-[#3DD6D0] py-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-black shadow-md hover:bg-[#32b5b0]"
            >
              {isEn ? "Go to Digital Passport" : "Ir a mi Pasaporte Digital"}
            </Link>
            <Link
              href={localePath(locale, "/actividades")}
              className="flex-1 rounded-lg border border-[#2C2550] bg-[#16122B] py-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-[#E6E4DA] hover:bg-[#201a3d]"
            >
              {isEn ? "Back to Activities" : "Volver a Actividades"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Closed form state
  if (config && !config.isOpen) {
    return (
      <div className="min-h-screen bg-[#07060D] px-4 py-20 text-[#E6E4DA]">
        <div className="mx-auto max-w-lg rounded-2xl border border-[#2C2550] bg-[#0E0C1B] p-8 text-center shadow-xl">
          <AlertTriangle className="mx-auto h-10 w-10 text-yellow-400 mb-3" />
          <h2 className="font-mono text-xl font-bold text-white">
            {isEn ? "Unified Activity Form is Closed" : "Recepción de Actividades Cerrada"}
          </h2>
          <p className="mt-2 font-mono text-xs text-[#A8A7A0]">
            {isEn
              ? "The priority application window for special activities is currently closed. You can still register for hands-on workshops and hackathons."
              : "El periodo de recepción de prioridades para actividades especiales se encuentra cerrado por el momento. Aún puedes inscribirte a los workshops y hackatones."}
          </p>
          <Link
            href={localePath(locale, "/actividades")}
            className="mt-6 inline-block rounded-lg bg-[#3DD6D0] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-black hover:bg-[#32b5b0]"
          >
            {isEn ? "View Available Workshops" : "Ver Workshops Disponibles"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07060D] text-[#E6E4DA] selection:bg-[#C143BC]/30 selection:text-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href={localePath(locale, "/actividades")}
            className="inline-flex items-center gap-1.5 font-mono text-xs text-[#8E8EA0] transition-colors hover:text-[#C143BC]"
          >
            ← {isEn ? "Back to Activities Catalog" : "Volver al Catálogo de Actividades"}
          </Link>
        </div>

        {/* Header */}
        <div className="overflow-hidden rounded-2xl border border-[#C143BC]/40 bg-[#0E0C1B] p-6 shadow-xl sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C143BC]/40 bg-[#C143BC]/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#C143BC]">
            <Sparkles className="h-3.5 w-3.5" />
            {isEn ? "Priority Ranking Application" : "Selección por Orden de Prioridad"}
          </div>

          <h1 className="mt-4 font-mono text-2xl font-black text-white sm:text-4xl">
            {isEn ? "Unified Form for Special Activities" : "Formulario Unificado de Actividades Especiales"}
          </h1>

          <p className="mt-3 font-mono text-xs leading-relaxed text-[#A8A7A0] sm:text-sm">
            {isEn
              ? `Select and order your Top ${requiredCount} preferred activities (CV review, mock interviews, mini-jam, speed mentoring). Each participant will be assigned to 1 exclusive activity by the organizing committee to maximize participation.`
              : `Selecciona y ordena tu Top ${requiredCount} de actividades favoritas (CV review, mock interviews, mini-jam, speed mentoring). Cada participante recibirá 1 actividad asignada por el comité organizador para garantizar que todos aprovechen al máximo el evento.`}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#1F1938] pt-5 font-mono text-xs text-[#C5C4BE]">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#3DD6D0]" />
              <span>{isEn ? `Choose exactly ${requiredCount} priorities` : `Elige exactamente ${requiredCount} prioridades`}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#C143BC]" />
              <span>{isEn ? "No spot deducted until assigned" : "No descuenta cupo hasta ser asignado"}</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-8 rounded-2xl border border-[#2C2550] bg-[#0C0A17] p-6 shadow-xl sm:p-8">
          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-500/10 p-4 font-mono text-xs text-red-300">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">{isEn ? "Application Warning:" : "Atención:"}</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Section 1: Attendee Email Check */}
          <div className="space-y-3 font-mono">
            <div className="border-b border-[#1F1938] pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                1. {isEn ? "Attendee Identification" : "Identificación del Asistente"}
              </h3>
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLookupDone(false);
                  setAttendee(null);
                }}
                placeholder="asistente@ipn.mx"
                className="w-full rounded-lg border border-[#2C2550] bg-[#090812] px-4 py-2.5 text-xs text-[#E6E4DA] outline-none transition-all focus:border-[#C143BC]"
              />

              <button
                type="button"
                onClick={handleEmailLookup}
                disabled={lookupLoading || !email.trim()}
                className="shrink-0 rounded-lg border border-[#C143BC] bg-[#C143BC]/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#C143BC] hover:bg-[#C143BC] hover:text-white transition-all disabled:opacity-50"
              >
                {lookupLoading ? "..." : isEn ? "Verify" : "Verificar"}
              </button>
            </div>

            {lookupDone && attendee && (
              <div className="rounded-xl border border-[#2C2550] bg-[#090812] p-4 text-xs space-y-2">
                {attendee.existsInGeneralRegistration ? (
                  <div className="flex items-center gap-2 text-[#3DD6D0]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      {isEn
                        ? `Welcome back, ${attendee.firstName}! Your pass (${attendee.qrCode}) is verified.`
                        : `¡Hola ${attendee.firstName}! Tu registro general (${attendee.qrCode}) está confirmado.`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      {isEn
                        ? "New registration: we'll create your general ticket and activity application simultaneously."
                        : "Aún no tienes registro general: completaremos tus datos para crear tu pase general y postulación."}
                    </span>
                  </div>
                )}

                {/* Show currently enrolled workshops */}
                {enrolledItems.length > 0 && (
                  <div className="mt-2 border-t border-[#1F1938] pt-2 text-[11px] text-[#A8A7A0]">
                    <span className="font-bold text-white">
                      {isEn ? "Your Enrolled Workshops / Hackathons:" : "Tus Workshops o Hackatones Inscritos:"}
                    </span>
                    <ul className="mt-1 space-y-1">
                      {enrolledItems.map((w, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span className="text-[#3DD6D0]">• {w.title}</span>
                          <span>{w.startTime} - {w.endTime} hrs</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 1.1: New attendee fields if general registration doesn't exist */}
          {lookupDone && attendee && !attendee.existsInGeneralRegistration && (
            <div className="rounded-xl border border-[#2C2550] bg-[#090812] p-5 font-mono text-xs space-y-4">
              <h4 className="font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#C143BC]" />
                {isEn ? "General Pass Registration Data" : "Datos para tu Pase General"}
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] text-[#A8A7A0] mb-1">
                    {isEn ? "First Name" : "Nombre(s)"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={generalProfile.firstName}
                    onChange={(e) => setGeneralProfile({ ...generalProfile, firstName: e.target.value })}
                    className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#C143BC]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A8A7A0] mb-1">
                    {isEn ? "Last Name" : "Apellidos"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={generalProfile.lastName}
                    onChange={(e) => setGeneralProfile({ ...generalProfile, lastName: e.target.value })}
                    className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#C143BC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] text-[#A8A7A0] mb-1">
                    {isEn ? "Role" : "Rol / Perfil"}
                  </label>
                  <select
                    value={generalProfile.role}
                    onChange={(e) => setGeneralProfile({ ...generalProfile, role: e.target.value })}
                    className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#C143BC]"
                  >
                    <option value="student_university">Estudiante Universitario / Superior</option>
                    <option value="student_highschool">Estudiante Nivel Medio Superior</option>
                    <option value="developer">Desarrollador / Profesional</option>
                    <option value="enthusiast">Entusiasta Cloud / Autoaprendizaje</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#A8A7A0] mb-1">
                    {isEn ? "School / Institution" : "Institución / Escuela"}
                  </label>
                  <input
                    type="text"
                    value={generalProfile.entityName}
                    placeholder="IPN - ESCOM, UPIITA, UNAM, etc."
                    onChange={(e) => setGeneralProfile({ ...generalProfile, entityName: e.target.value })}
                    className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#C143BC]"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-[#1F1938] pt-3 text-[11px]">
                <label className="flex items-start gap-2.5 cursor-pointer text-[#C5C4BE]">
                  <input
                    type="checkbox"
                    checked={generalProfile.acceptCoc}
                    onChange={(e) => setGeneralProfile({ ...generalProfile, acceptCoc: e.target.checked })}
                    className="mt-0.5 rounded border-[#2C2550] bg-[#090812] text-[#C143BC]"
                  />
                  <span>
                    {isEn ? "I accept the " : "Acepto el "}
                    <Link href={localePath(locale, "/codigo-conducta")} target="_blank" className="text-[#3DD6D0] underline">
                      {isEn ? "Code of Conduct" : "Código de Conducta"}
                    </Link>
                    .
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-[#C5C4BE]">
                  <input
                    type="checkbox"
                    checked={generalProfile.acceptPrivacy}
                    onChange={(e) => setGeneralProfile({ ...generalProfile, acceptPrivacy: e.target.checked })}
                    className="mt-0.5 rounded border-[#2C2550] bg-[#090812] text-[#C143BC]"
                  />
                  <span>
                    {isEn ? "I accept the " : "Acepto el "}
                    <Link href={localePath(locale, "/privacidad")} target="_blank" className="text-[#3DD6D0] underline">
                      {isEn ? "Privacy Policy" : "Aviso de Privacidad"}
                    </Link>
                    .
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Section 2: Priority Selection (Top ranking) */}
          <div className="space-y-4 font-mono">
            <div className="border-b border-[#1F1938] pb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                2. {isEn ? "Select & Rank Your Priorities" : "Selecciona y Ordena tus Prioridades"}
              </h3>
              <span className="text-xs text-[#C143BC] font-bold">
                {selectedSlugs.length} / {requiredCount} {isEn ? "chosen" : "seleccionadas"}
              </span>
            </div>

            <p className="text-xs text-[#A8A7A0]">
              {isEn
                ? "Click an activity to add it to your ranking. Use the arrows to reorder your 1st, 2nd, and 3rd choices."
                : "Haz clic en una actividad para agregarla a tu ranking. Usa las flechas para ordenar cuál es tu 1ª, 2ª o 3ª preferencia."}
            </p>

            {/* Currently Ordered Ranking Preview */}
            {selectedSlugs.length > 0 && (
              <div className="rounded-xl border border-[#C143BC]/40 bg-[#090812] p-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white block">
                  {isEn ? "Your Current Ranking:" : "Tu Orden de Preferencias Actual:"}
                </span>

                <div className="space-y-2">
                  {selectedSlugs.map((slug, idx) => {
                    const act = activities.find((a) => a.slug === slug);
                    if (!act) return null;

                    return (
                      <div
                        key={slug}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[#2C2550] bg-[#0E0C1B] p-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C143BC] text-xs font-bold text-white shadow-md">
                            {idx + 1}º
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{act.title}</p>
                            <span className="text-[10px] text-[#73726C]">{act.startTime} - {act.endTime} hrs · {act.roomName || "IPN"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => movePriority(idx, "up")}
                            className="p-1 rounded text-[#A8A7A0] hover:bg-[#1F1938] hover:text-white disabled:opacity-20"
                            title={isEn ? "Move up" : "Subir prioridad"}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === selectedSlugs.length - 1}
                            onClick={() => movePriority(idx, "down")}
                            className="p-1 rounded text-[#A8A7A0] hover:bg-[#1F1938] hover:text-white disabled:opacity-20"
                            title={isEn ? "Move down" : "Bajar prioridad"}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSlugPriority(slug)}
                            className="ml-1 p-1 text-red-400 hover:text-red-300 text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List of Available Activities */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {activities.map((act) => {
                const isSelected = selectedSlugs.includes(act.slug);
                const priorityIndex = selectedSlugs.indexOf(act.slug);
                const conflict = getConflict(act);

                return (
                  <div
                    key={act._id}
                    onClick={() => {
                      if (!conflict) toggleSlugPriority(act.slug);
                    }}
                    className={`relative rounded-xl border p-4 text-xs transition-all ${
                      conflict
                        ? "cursor-not-allowed border-red-500/30 bg-red-500/5 opacity-60"
                        : isSelected
                        ? "cursor-pointer border-[#C143BC] bg-[#C143BC]/10 shadow-[0_0_15px_rgba(193,67,188,0.2)]"
                        : "cursor-pointer border-[#2C2550] bg-[#090812] hover:border-[#C143BC]/50 hover:bg-[#0E0C1B]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-white line-clamp-1">{act.title}</h4>

                      {isSelected ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C143BC] text-[10px] font-bold text-white">
                          #{priorityIndex + 1}
                        </span>
                      ) : conflict ? (
                        <span className="text-[10px] text-red-400 font-bold shrink-0">Empalme</span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-[11px] text-[#A8A7A0]">
                      <Clock className="h-3.5 w-3.5 text-[#D85A30]" />
                      <span>{act.startTime} - {act.endTime} hrs</span>
                    </div>

                    {act.roomName && (
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[#73726C]">
                        <MapPin className="h-3.5 w-3.5 text-[#3DD6D0]" />
                        <span className="truncate">{act.roomName}</span>
                      </div>
                    )}

                    {conflict && (
                      <p className="mt-2 text-[10px] text-red-300 border-t border-red-500/20 pt-1.5">
                        {isEn
                          ? `Conflicts with "${conflict.title}"`
                          : `Se empalma con "${conflict.title}" (${conflict.startTime}-${conflict.endTime})`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Global Custom Questions */}
          {(config?.globalCustomFields || []).length > 0 && (
            <div className="rounded-xl border border-[#2C2550] bg-[#090812] p-5 font-mono text-xs space-y-4">
              <h4 className="font-bold uppercase tracking-wider text-white">
                3. {isEn ? "General Activity Questions" : "Preguntas Generales de Actividades"}
              </h4>

              <div className="space-y-3">
                {config?.globalCustomFields.map((field) => {
                  const labelText = (isEn && field.labelEn ? field.labelEn : field.label) || field.label;
                  const placeholderText = (isEn && field.placeholderEn ? field.placeholderEn : field.placeholder) || "";

                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="block text-[11px] text-[#A8A7A0]">
                        {labelText} {field.required && <span className="text-[#C143BC]">*</span>}
                      </label>

                      {field.type === "textarea" ? (
                        <textarea
                          rows={3}
                          required={field.required}
                          value={String(globalAnswers[field.key] || "")}
                          placeholder={placeholderText}
                          onChange={(e) => setGlobalAnswers({ ...globalAnswers, [field.key]: e.target.value })}
                          className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#C143BC]"
                        />
                      ) : field.type === "select" ? (
                        <select
                          required={field.required}
                          value={String(globalAnswers[field.key] || "")}
                          onChange={(e) => setGlobalAnswers({ ...globalAnswers, [field.key]: e.target.value })}
                          className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#C143BC]"
                        >
                          <option value="">{isEn ? "-- Select --" : "-- Selecciona --"}</option>
                          {(field.options || []).map((o) => (
                            <option key={o.value} value={o.value}>{isEn && o.labelEn ? o.labelEn : o.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === "url" ? "url" : "text"}
                          required={field.required}
                          value={String(globalAnswers[field.key] || "")}
                          placeholder={placeholderText}
                          onChange={(e) => setGlobalAnswers({ ...globalAnswers, [field.key]: e.target.value })}
                          className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#C143BC]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4: Specific Questions for each chosen priority activity */}
          {selectedSlugs.map((slug) => {
            const act = activities.find((a) => a.slug === slug);
            const customFields = act?.formConfig?.customFields || [];
            if (customFields.length === 0) return null;

            return (
              <div key={slug} className="rounded-xl border border-[#2C2550] bg-[#090812] p-5 font-mono text-xs space-y-4">
                <h4 className="font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C143BC] text-[10px] text-white">
                    #{selectedSlugs.indexOf(slug) + 1}
                  </span>
                  {act?.title}
                </h4>

                <div className="space-y-3">
                  {customFields.map((field) => {
                    const labelText = (isEn && field.labelEn ? field.labelEn : field.label) || field.label;
                    const placeholderText = (isEn && field.placeholderEn ? field.placeholderEn : field.placeholder) || "";
                    const val = activityAnswers[slug]?.[field.key];

                    return (
                      <div key={field.key} className="space-y-1">
                        <label className="block text-[11px] text-[#A8A7A0]">
                          {labelText} {field.required && <span className="text-[#C143BC]">*</span>}
                        </label>

                        {field.type === "textarea" ? (
                          <textarea
                            rows={3}
                            required={field.required}
                            value={String(val || "")}
                            placeholder={placeholderText}
                            onChange={(e) => handleActivityAnswerChange(slug, field.key, e.target.value)}
                            className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#C143BC]"
                          />
                        ) : field.type === "select" ? (
                          <select
                            required={field.required}
                            value={String(val || "")}
                            onChange={(e) => handleActivityAnswerChange(slug, field.key, e.target.value)}
                            className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#C143BC]"
                          >
                            <option value="">{isEn ? "-- Select --" : "-- Selecciona --"}</option>
                            {(field.options || []).map((o) => (
                              <option key={o.value} value={o.value}>{isEn && o.labelEn ? o.labelEn : o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === "url" ? "url" : "text"}
                            required={field.required}
                            value={String(val || "")}
                            placeholder={placeholderText}
                            onChange={(e) => handleActivityAnswerChange(slug, field.key, e.target.value)}
                            className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#C143BC]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Section 5: Logistics */}
          <div className="rounded-xl border border-[#2C2550] bg-[#090812] p-5 font-mono text-xs space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-white">
              {isEn ? "Logistics Commitment" : "Compromiso de Asistencia"}
            </h4>

            {config?.requireLaptop && (
              <label className="flex items-start gap-2.5 cursor-pointer text-[#E6E4DA]">
                <input
                  type="checkbox"
                  required
                  checked={bringsLaptop}
                  onChange={(e) => setBringsLaptop(e.target.checked)}
                  className="mt-0.5 rounded border-[#2C2550] bg-[#0E0C1B] text-[#C143BC]"
                />
                <span>
                  {isEn ? "I agree to bring my laptop if assigned to a hands-on activity." : "Me comprometo a llevar laptop si soy asignado a una actividad técnica."}
                </span>
              </label>
            )}

            <label className="flex items-start gap-2.5 cursor-pointer text-[#E6E4DA]">
              <input
                type="checkbox"
                required
                checked={acceptedPrerequisites}
                onChange={(e) => setAcceptedPrerequisites(e.target.checked)}
                className="mt-0.5 rounded border-[#2C2550] bg-[#0E0C1B] text-[#C143BC]"
              />
              <span>
                {isEn ? "I commit to attending the activity on time if assigned." : "Me comprometo a asistir puntualmente a la actividad si el comité me asigna lugar."}
              </span>
            </label>
          </div>

          {/* Captcha */}
          {siteKey && (
            <div className="flex justify-center">
              <Turnstile
                siteKey={siteKey}
                onVerify={(token: string) => setCaptchaToken(token)}
                onError={() => setCaptchaToken("")}
                onExpire={() => setCaptchaToken("")}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || selectedSlugs.length < requiredCount}
            className="w-full rounded-xl bg-[#C143BC] py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(193,67,188,0.4)] transition-all hover:bg-[#a936a4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? isEn ? "Submitting application..." : "Enviando postulación..."
              : isEn ? `Submit Top ${requiredCount} Priorities` : `Enviar mi Top ${requiredCount} de Prioridades`}
          </button>
        </form>
      </div>
    </div>
  );
}
