"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { localePath } from "@/lib/utils";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import { doTimesOverlap } from "@/lib/activity-schedule";
import {
  Terminal,
  Trophy,
  Sparkles,
  Clock,
  MapPin,
  Laptop,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Trash2,
  QrCode,
  Calendar,
  AlertCircle,
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

interface ActivityData {
  _id: string;
  slug: string;
  type: "workshop" | "hackathon" | "activity";
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  roomName?: string;
  speakerName?: string;
  level?: string;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  isOpen: boolean;
  maxCapacity: number;
  registeredCount: number;
  formConfig?: {
    requireLaptop?: boolean;
    participationMode?: "individual" | "team" | "both";
    minTeamSize?: number;
    maxTeamSize?: number;
    capacityMode?: "per_person" | "per_team";
    prerequisitesList?: string[];
    prerequisitesListEn?: string[];
    customFields?: CustomField[];
  };
}

interface TeamMember {
  firstName: string;
  lastName: string;
  email: string;
  roleInTeam: string;
}

interface LookupAttendeeResponse {
  existsInGeneralRegistration: boolean;
  generalRegistrationOpen: boolean;
  firstName?: string;
  lastName?: string;
  qrCode?: string;
  enrolledActivities?: Array<{
    activityId: string;
    slug: string;
    title: string;
    titleEn?: string;
    type: string;
    startTime: string;
    endTime: string;
    spotsConsumed: number;
  }>;
  activityApplication?: {
    applicationId: string;
    status: string;
    assignedActivity?: {
      activityId: string;
      slug: string;
      title: string;
      titleEn?: string;
      startTime: string;
      endTime: string;
      roomName?: string;
    } | null;
  };
}

export function ActivityDetailScreen({ initialActivity }: { initialActivity: ActivityData }) {
  const locale = (useLocale() === "en" ? "en" : "es") as "es" | "en";
  const isEn = locale === "en";

  const activity = initialActivity;
  const isWorkshop = activity.type === "workshop";
  const isHackathon = activity.type === "hackathon";
  const isActivity = activity.type === "activity";

  // State: email & attendee lookup
  const [email, setEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [attendeeData, setAttendeeData] = useState<LookupAttendeeResponse | null>(null);

  // General profile if new attendee
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

  // Team state
  const participationMode = activity.formConfig?.participationMode || "individual";
  const allowsTeam = participationMode === "team" || participationMode === "both";
  const [isTeam, setIsTeam] = useState(participationMode === "team");
  const [teamName, setTeamName] = useState("");
  const [roleInTeam, setRoleInTeam] = useState("Líder");
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Logistics
  const [bringsLaptop, setBringsLaptop] = useState(false);
  const [acceptedPrerequisites, setAcceptedPrerequisites] = useState(false);

  // Custom answers
  const [customAnswers, setCustomAnswers] = useState<Record<string, unknown>>({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [registeredSuccess, setRegisteredSuccess] = useState<{
    qrCode: string;
    registrationId: string;
    spotsConsumed: number;
  } | null>(null);

  // Check schedule conflict with existing enrolled activities
  const scheduleConflict = attendeeData?.enrolledActivities?.find((item) =>
    doTimesOverlap(activity.startTime, activity.endTime, item.startTime, item.endTime),
  );

  const assignedActivityConflict =
    attendeeData?.activityApplication?.status === "assigned" &&
    attendeeData.activityApplication.assignedActivity &&
    doTimesOverlap(
      activity.startTime,
      activity.endTime,
      attendeeData.activityApplication.assignedActivity.startTime,
      attendeeData.activityApplication.assignedActivity.endTime,
    )
      ? attendeeData.activityApplication.assignedActivity
      : null;

  const alreadyRegisteredInThis = attendeeData?.enrolledActivities?.some(
    (item) => item.slug === activity.slug || item.activityId === activity._id,
  );

  async function handleEmailLookup() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage(isEn ? "Please enter a valid email address." : "Por favor ingresa un correo electrónico válido.");
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
      const data: LookupAttendeeResponse = await res.json();
      setAttendeeData(data);
      setLookupDone(true);

      if (data.existsInGeneralRegistration && data.firstName) {
        setGeneralProfile((prev) => ({
          ...prev,
          firstName: data.firstName || prev.firstName,
          lastName: data.lastName || prev.lastName,
        }));
      }
    } catch {
      setErrorMessage(isEn ? "Error checking email status." : "Error al consultar estado del correo.");
    } finally {
      setLookupLoading(false);
    }
  }

  function handleAddMember() {
    const max = activity.formConfig?.maxTeamSize || 3;
    if (members.length + 1 >= max) return;
    setMembers([...members, { firstName: "", lastName: "", email: "", roleInTeam: "Desarrollador" }]);
  }

  function handleRemoveMember(idx: number) {
    setMembers(members.filter((_, i) => i !== idx));
  }

  function handleMemberChange(idx: number, field: keyof TeamMember, val: string) {
    const updated = [...members];
    updated[idx] = { ...updated[idx], [field]: val };
    setMembers(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!lookupDone) {
      await handleEmailLookup();
      return;
    }

    if (alreadyRegisteredInThis) {
      setErrorMessage(isEn ? "You are already registered for this activity." : "Ya estás registrado en esta actividad.");
      return;
    }

    if (scheduleConflict) {
      setErrorMessage(
        isEn
          ? `Schedule conflict with your enrolled session "${scheduleConflict.title}" (${scheduleConflict.startTime} - ${scheduleConflict.endTime}).`
          : `Conflicto de horario con tu sesión inscrita "${scheduleConflict.title}" (${scheduleConflict.startTime} - ${scheduleConflict.endTime}).`,
      );
      return;
    }

    if (assignedActivityConflict) {
      setErrorMessage(
        isEn
          ? `Schedule conflict with your assigned activity "${assignedActivityConflict.title}" (${assignedActivityConflict.startTime} - ${assignedActivityConflict.endTime}).`
          : `Conflicto de horario con tu actividad asignada "${assignedActivityConflict.title}" (${assignedActivityConflict.startTime} - ${assignedActivityConflict.endTime}).`,
      );
      return;
    }

    if (activity.formConfig?.requireLaptop && !bringsLaptop) {
      setErrorMessage(isEn ? "You must confirm you will bring your own laptop." : "Debes confirmar que llevarás tu laptop propia.");
      return;
    }

    if ((activity.formConfig?.prerequisitesList?.length || 0) > 0 && !acceptedPrerequisites) {
      setErrorMessage(isEn ? "You must accept the prerequisites." : "Debes confirmar que cumples con los prerrequisitos.");
      return;
    }

    // Validate required custom fields
    for (const field of activity.formConfig?.customFields || []) {
      if (field.required && !customAnswers[field.key]) {
        setErrorMessage(
          isEn
            ? `Please complete required field: ${field.labelEn || field.label}`
            : `Por favor completa el campo requerido: ${field.label}`,
        );
        return;
      }
    }

    // Validate new attendee profile if general registration doesn't exist
    if (!attendeeData?.existsInGeneralRegistration) {
      if (!generalProfile.firstName.trim() || !generalProfile.lastName.trim()) {
        setErrorMessage(isEn ? "First and last names are required." : "Nombre y apellidos son obligatorios.");
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

    // Validate team if team is active
    if (isTeam) {
      if (!teamName.trim()) {
        setErrorMessage(isEn ? "Please enter a team name." : "Por favor ingresa el nombre del equipo.");
        return;
      }
      for (const [i, m] of members.entries()) {
        if (!m.firstName.trim() || !m.lastName.trim() || !m.email.trim()) {
          setErrorMessage(
            isEn
              ? `Please complete all data for team member #${i + 2}.`
              : `Por favor completa todos los datos del integrante #${i + 2}.`,
          );
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        captchaToken,
        email: email.trim().toLowerCase(),
        generalProfile: attendeeData?.existsInGeneralRegistration ? undefined : generalProfile,
        logistics: {
          bringsLaptop,
          acceptedPrerequisites,
        },
        team: allowsTeam
          ? {
              isTeam,
              teamName: isTeam ? teamName.trim() : "",
              roleInTeam: isTeam ? roleInTeam.trim() : "",
              members: isTeam ? members : [],
            }
          : undefined,
        customAnswers,
      };

      const res = await fetch(`/api/activities/${activity.slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || resData.error || "Error al completar registro");
      }

      setRegisteredSuccess({
        qrCode: resData.registration?.qrCode || "SCD-REG",
        registrationId: resData.registration?.id,
        spotsConsumed: resData.registration?.spotsConsumed || 1,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error inesperado al registrarse");
    } finally {
      setSubmitting(false);
    }
  }

  // Redirect advice if this activity is a special activity
  if (isActivity) {
    return (
      <div className="min-h-screen bg-[#07060D] px-4 py-20 text-[#E6E4DA]">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#C143BC]/40 bg-[#0E0C1B] p-8 text-center shadow-[0_0_50px_rgba(193,67,188,0.15)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#C143BC] bg-[#C143BC]/10 text-[#C143BC]">
            <Sparkles className="h-7 w-7" />
          </div>

          <h2 className="font-mono text-xl font-bold text-white">
            {isEn ? "Special Limited-Capacity Activity" : "Actividad Especial de Cupo Limitado"}
          </h2>

          <p className="mt-3 font-mono text-xs leading-relaxed text-[#A8A7A0]">
            {isEn
              ? `"${activity.title}" is a special interactive session. To ensure equal access for all students, registration is handled through the Unified Activity Form with priority ranking.`
              : `"${activity.title}" es una dinámica especial exclusiva. Para garantizar igualdad de oportunidades a todos los asistentes, el registro se realiza a través del Formulario Unificado por orden de prioridad.`}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={localePath(locale, "/actividades/registro-actividades")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C143BC] px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(193,67,188,0.4)] transition-all hover:bg-[#a936a4]"
            >
              <span>{isEn ? "Apply via Unified Form" : "Ir al Formulario Unificado"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href={localePath(locale, "/actividades")}
              className="font-mono text-xs text-[#8E8EA0] hover:text-white"
            >
              {isEn ? "← Back to Activities Catalog" : "← Volver al catálogo de actividades"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success view
  if (registeredSuccess) {
    return (
      <div className="min-h-screen bg-[#07060D] px-4 py-16 text-[#E6E4DA]">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#3DD6D0]/50 bg-[#0E0C1B] shadow-[0_0_60px_rgba(61,214,208,0.2)]">
          <div className="border-b border-[#2C2550] bg-gradient-to-r from-[#3DD6D0]/10 via-[#0E0C1B] to-[#D85A30]/10 p-6 text-center sm:p-8">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#3DD6D0] bg-[#3DD6D0]/15 text-[#3DD6D0]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#3DD6D0]">
              {isEn ? "Registration Confirmed" : "¡Registro Confirmado!"}
            </span>
            <h2 className="mt-2 font-mono text-2xl font-black text-white sm:text-3xl">
              {activity.title}
            </h2>
            <p className="mt-2 font-mono text-xs text-[#A8A7A0]">
              {isEn
                ? "Your spot has been reserved. Keep your digital pass ready for venue check-in."
                : "Tu lugar ha quedado reservado. Presenta tu código QR el día del evento al ingresar al salón."}
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#221C3D] bg-[#090812] p-4 font-mono text-xs sm:grid-cols-2">
              <div>
                <span className="text-[#73726C]">{isEn ? "Attendee / Leader:" : "Asistente / Líder:"}</span>
                <p className="font-bold text-white mt-0.5">{email}</p>
              </div>
              <div>
                <span className="text-[#73726C]">{isEn ? "Access Code / QR:" : "Código de Pase / QR:"}</span>
                <p className="font-bold text-[#3DD6D0] mt-0.5">{registeredSuccess.qrCode}</p>
              </div>
              <div>
                <span className="text-[#73726C]">{isEn ? "Schedule:" : "Horario:"}</span>
                <p className="font-bold text-white mt-0.5">{activity.startTime} - {activity.endTime} hrs</p>
              </div>
              <div>
                <span className="text-[#73726C]">{isEn ? "Room / Venue:" : "Salón / Sede:"}</span>
                <p className="font-bold text-white mt-0.5">{activity.roomName || "IPN Casco de Santo Tomás"}</p>
              </div>
            </div>

            {isTeam && (
              <div className="rounded-xl border border-[#2C2550] bg-[#0C0A17] p-4 font-mono text-xs">
                <span className="font-bold text-[#D85A30]">
                  {isEn ? `Team: ${teamName}` : `Equipo: ${teamName}`} ({registeredSuccess.spotsConsumed} {isEn ? "spots reserved" : "lugares reservados"})
                </span>
                {members.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[#A8A7A0]">
                    {members.map((m, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{m.firstName} {m.lastName}</span>
                        <span className="text-[#73726C]">{m.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={localePath(locale, "/pasaporte")}
                className="flex-1 rounded-lg border border-[#3DD6D0] bg-[#3DD6D0] py-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-black shadow-md transition-all hover:bg-[#32b5b0]"
              >
                {isEn ? "View Digital Passport & Badge" : "Ver mi Pasaporte Digital"}
              </Link>
              <Link
                href={localePath(locale, "/actividades")}
                className="flex-1 rounded-lg border border-[#2C2550] bg-[#16122B] py-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-[#E6E4DA] transition-all hover:bg-[#201a3d]"
              >
                {isEn ? "Explore More Activities" : "Ver Más Actividades"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const spotsLeft = Math.max(0, activity.maxCapacity - activity.registeredCount);
  const isSoldOut = activity.registeredCount >= activity.maxCapacity;

  return (
    <div className="min-h-screen bg-[#07060D] text-[#E6E4DA] selection:bg-[#3DD6D0]/30 selection:text-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href={localePath(locale, "/actividades")}
            className="inline-flex items-center gap-1.5 font-mono text-xs text-[#8E8EA0] transition-colors hover:text-[#3DD6D0]"
          >
            ← {isEn ? "Back to Activities" : "Volver a Actividades y Workshops"}
          </Link>
        </div>

        {/* Activity Banner Header */}
        <div className="overflow-hidden rounded-2xl border border-[#2C2550] bg-[#0E0C1B] p-6 shadow-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`rounded-md border px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider ${
                isWorkshop
                  ? "border-[#3DD6D0]/40 bg-[#3DD6D0]/10 text-[#3DD6D0]"
                  : "border-[#D85A30]/40 bg-[#D85A30]/10 text-[#D85A30]"
              }`}
            >
              {isWorkshop ? "Workshop Práctico" : "Hackatón Cloud"}
            </span>

            {activity.level && (
              <span className="rounded-md border border-[#2C2550] bg-[#16122B] px-2.5 py-1 font-mono text-xs font-bold text-[#E6E4DA]">
                {isEn ? `Level ${activity.level}` : `Nivel ${activity.level}`}
              </span>
            )}
          </div>

          <h1 className="mt-4 font-mono text-2xl font-black text-white sm:text-4xl">
            {(isEn && activity.titleEn ? activity.titleEn : activity.title) || activity.title}
          </h1>

          {activity.speakerName && (
            <p className="mt-2 font-mono text-sm font-semibold text-[#3DD6D0]">
              {activity.speakerName}
            </p>
          )}

          <p className="mt-4 font-mono text-xs leading-relaxed text-[#A8A7A0] sm:text-sm">
            {(isEn && activity.descriptionEn ? activity.descriptionEn : activity.description) || activity.description}
          </p>

          {/* Quick info chips */}
          <div className="mt-6 grid grid-cols-1 gap-3 border-t border-[#1F1938] pt-6 font-mono text-xs sm:grid-cols-3">
            <div className="flex items-center gap-2.5 text-[#E6E4DA]">
              <Clock className="h-4 w-4 text-[#D85A30]" />
              <div>
                <span className="block text-[10px] text-[#73726C]">{isEn ? "Schedule" : "Horario"}</span>
                <span className="font-bold">{activity.startTime} - {activity.endTime} hrs</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-[#E6E4DA]">
              <MapPin className="h-4 w-4 text-[#3DD6D0]" />
              <div>
                <span className="block text-[10px] text-[#73726C]">{isEn ? "Room" : "Salón"}</span>
                <span className="font-bold truncate">{activity.roomName || "Por confirmar"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-[#E6E4DA]">
              <Users className="h-4 w-4 text-[#C143BC]" />
              <div>
                <span className="block text-[10px] text-[#73726C]">{isEn ? "Capacity" : "Cupo"}</span>
                <span className={`font-bold ${isSoldOut ? "text-red-400" : "text-[#3DD6D0]"}`}>
                  {isSoldOut ? (isEn ? "Sold out" : "Cupo agotado") : `${spotsLeft} disponibles`}
                </span>
              </div>
            </div>
          </div>

          {/* Prerequisites */}
          {((activity.formConfig?.prerequisitesList && activity.formConfig.prerequisitesList.length > 0) ||
            activity.formConfig?.requireLaptop) && (
            <div className="mt-6 rounded-xl border border-[#221C3D] bg-[#090812] p-4 font-mono text-xs">
              <h4 className="font-bold uppercase tracking-wider text-white">
                {isEn ? "Prerequisites & Requirements:" : "Prerrequisitos y requerimientos:"}
              </h4>
              <ul className="mt-2 space-y-1.5 text-[#A8A7A0]">
                {activity.formConfig?.requireLaptop && (
                  <li className="flex items-center gap-2 text-white font-medium">
                    <Laptop className="h-4 w-4 text-[#C143BC]" />
                    <span>{isEn ? "Bring your own laptop and power charger." : "Llevar laptop propia con cargador."}</span>
                  </li>
                )}
                {(activity.formConfig?.prerequisitesList || []).map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#3DD6D0]">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sold out notice */}
        {isSoldOut && (
          <div className="mt-8 rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-center text-red-300 font-mono text-xs">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-2" />
            <h3 className="text-base font-bold text-white">
              {isEn ? "This activity is sold out" : "El cupo para esta actividad está agotado"}
            </h3>
            <p className="mt-1 text-[#A8A7A0]">
              {isEn
                ? "No more spots are currently available. Check other workshops or activities!"
                : "Ya no quedan lugares disponibles. Revisa otros workshops o el formulario unificado de actividades."}
            </p>
            <Link
              href={localePath(locale, "/actividades")}
              className="mt-4 inline-block rounded-lg bg-[#2C2550] px-4 py-2 font-bold text-white hover:bg-[#3d336d]"
            >
              {isEn ? "View other activities" : "Ver otras actividades"}
            </Link>
          </div>
        )}

        {/* Interactive Registration Form */}
        {!isSoldOut && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-8 rounded-2xl border border-[#2C2550] bg-[#0C0A17] p-6 shadow-xl sm:p-8">
            <div className="border-b border-[#1F1938] pb-4">
              <h2 className="font-mono text-lg font-bold text-white">
                {isEn ? "Session Registration" : "Inscripción a la Dinámica"}
              </h2>
              <p className="font-mono text-xs text-[#8E8EA0] mt-1">
                {isEn
                  ? "Enter your email. If you already have an event ticket, your spot will be linked automatically."
                  : "Ingresa tu correo. Si ya tienes boleto general, tu lugar se vinculará automáticamente."}
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-500/10 p-4 font-mono text-xs text-red-300">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">{isEn ? "Registration Warning:" : "Atención:"}</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Step 1: Email & Attendee Check */}
            <div className="space-y-3 font-mono">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#E6E4DA]">
                {isEn ? "Your Email Address" : "Tu Correo Electrónico"} <span className="text-[#C143BC]">*</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLookupDone(false);
                    setAttendeeData(null);
                  }}
                  placeholder="ejemplo@correo.com"
                  className="w-full rounded-lg border border-[#2C2550] bg-[#090812] px-4 py-2.5 text-xs text-[#E6E4DA] outline-none transition-all focus:border-[#3DD6D0]"
                />

                <button
                  type="button"
                  onClick={handleEmailLookup}
                  disabled={lookupLoading || !email.trim()}
                  className="shrink-0 rounded-lg border border-[#3DD6D0] bg-[#3DD6D0]/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#3DD6D0] hover:bg-[#3DD6D0] hover:text-black transition-all disabled:opacity-50"
                >
                  {lookupLoading ? "..." : isEn ? "Verify" : "Verificar"}
                </button>
              </div>

              {/* Status feedback after lookup */}
              {lookupDone && attendeeData && (
                <div className="rounded-xl border border-[#2C2550] bg-[#090812] p-4 text-xs space-y-2">
                  {attendeeData.existsInGeneralRegistration ? (
                    <div className="flex items-center gap-2 text-[#3DD6D0]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>
                        {isEn
                          ? `Welcome back, ${attendeeData.firstName}! Your general pass is ready.`
                          : `¡Hola ${attendeeData.firstName}! Tu pase general (${attendeeData.qrCode}) ya está registrado.`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>
                        {isEn
                          ? "New attendee: we will create your general SCD pass and workshop ticket in one step."
                          : "Aún no tienes registro general: completaremos tus datos para darte tu gafete y lugar al mismo tiempo."}
                      </span>
                    </div>
                  )}

                  {/* Overlap warnings */}
                  {scheduleConflict && (
                    <div className="mt-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-red-300">
                      <strong>{isEn ? "Schedule Conflict Detected!" : "¡Conflicto de Horario Detectado!"}</strong>
                      <p className="mt-0.5">
                        {isEn
                          ? `You are already enrolled in "${scheduleConflict.title}" from ${scheduleConflict.startTime} to ${scheduleConflict.endTime}. Both sessions overlap.`
                          : `Ya estás inscrito en "${scheduleConflict.title}" de ${scheduleConflict.startTime} a ${scheduleConflict.endTime} hrs. Ambos horarios se empalman.`}
                      </p>
                    </div>
                  )}

                  {assignedActivityConflict && (
                    <div className="mt-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-red-300">
                      <strong>{isEn ? "Conflict with Assigned Activity!" : "¡Conflicto con tu Actividad Asignada!"}</strong>
                      <p className="mt-0.5">
                        {isEn
                          ? `You are assigned to "${assignedActivityConflict.title}" (${assignedActivityConflict.startTime} - ${assignedActivityConflict.endTime}).`
                          : `Tienes asignada la actividad "${assignedActivityConflict.title}" (${assignedActivityConflict.startTime} - ${assignedActivityConflict.endTime} hrs).`}
                      </p>
                    </div>
                  )}

                  {alreadyRegisteredInThis && (
                    <div className="mt-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-yellow-300">
                      {isEn
                        ? "You are already registered for this activity."
                        : "Ya te encuentras registrado en este taller/hackatón."}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 1.1: General Profile fields if attendee is NOT registered generally */}
            {lookupDone && attendeeData && !attendeeData.existsInGeneralRegistration && (
              <div className="rounded-xl border border-[#2C2550] bg-[#090812] p-5 font-mono text-xs space-y-4">
                <h4 className="font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-[#3DD6D0]" />
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
                      className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#3DD6D0]"
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
                      className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#3DD6D0]"
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
                      className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#3DD6D0]"
                    >
                      <option value="student_university">Estudiante Universitario / Superior</option>
                      <option value="student_highschool">Estudiante Nivel Medio Superior</option>
                      <option value="developer">Desarrollador / Profesional</option>
                      <option value="enthusiast">Entusiasta Cloud / Autoaprendizaje</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#A8A7A0] mb-1">
                      {isEn ? "Institution / School" : "Institución / Escuela"}
                    </label>
                    <input
                      type="text"
                      value={generalProfile.entityName}
                      placeholder="IPN - ESCOM, UPIITA, UNAM, etc."
                      onChange={(e) => setGeneralProfile({ ...generalProfile, entityName: e.target.value })}
                      className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#3DD6D0]"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#1F1938] pt-3 text-[11px]">
                  <label className="flex items-start gap-2.5 cursor-pointer text-[#C5C4BE]">
                    <input
                      type="checkbox"
                      checked={generalProfile.acceptCoc}
                      onChange={(e) => setGeneralProfile({ ...generalProfile, acceptCoc: e.target.checked })}
                      className="mt-0.5 rounded border-[#2C2550] bg-[#090812] text-[#3DD6D0]"
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
                      className="mt-0.5 rounded border-[#2C2550] bg-[#090812] text-[#3DD6D0]"
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

            {/* Step 2: Team Configuration (if allowed) */}
            {allowsTeam && (
              <div className="rounded-xl border border-[#2C2550] bg-[#090812] p-5 font-mono text-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#D85A30]" />
                      {isEn ? "Participation Mode" : "Modalidad de Participación"}
                    </h4>
                    <p className="text-[11px] text-[#73726C]">
                      {participationMode === "team"
                        ? isEn ? "Team participation is required." : "Esta dinámica es exclusivamente en equipo."
                        : isEn ? "You can participate individually or form a team." : "Puedes participar individualmente o en equipo."}
                    </p>
                  </div>

                  {participationMode === "both" && (
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-[#E6E4DA]">
                      <input
                        type="checkbox"
                        checked={isTeam}
                        onChange={(e) => setIsTeam(e.target.checked)}
                        className="rounded border-[#2C2550] bg-[#090812] text-[#D85A30]"
                      />
                      <span>{isEn ? "Form a Team" : "Inscribir Equipo"}</span>
                    </label>
                  )}
                </div>

                {isTeam && (
                  <div className="space-y-4 border-t border-[#1F1938] pt-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] text-[#A8A7A0] mb-1">
                          {isEn ? "Team Name" : "Nombre del Equipo"} *
                        </label>
                        <input
                          type="text"
                          required
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="Los Cloud Builders"
                          className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#D85A30]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#A8A7A0] mb-1">
                          {isEn ? "Your Role in the Team" : "Tu Rol en el Equipo"}
                        </label>
                        <input
                          type="text"
                          value={roleInTeam}
                          onChange={(e) => setRoleInTeam(e.target.value)}
                          placeholder="Líder / Arquitecto Cloud"
                          className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#D85A30]"
                        />
                      </div>
                    </div>

                    {/* Team members list */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#C5C4BE]">
                          {isEn ? "Team Members" : "Integrantes adicionales"} (Total: {members.length + 1} de máx. {activity.formConfig?.maxTeamSize || 3})
                        </span>

                        {members.length + 1 < (activity.formConfig?.maxTeamSize || 3) && (
                          <button
                            type="button"
                            onClick={handleAddMember}
                            className="inline-flex items-center gap-1 rounded border border-[#D85A30]/50 bg-[#D85A30]/10 px-2 py-1 text-[11px] font-bold text-[#D85A30] hover:bg-[#D85A30] hover:text-white transition-all"
                          >
                            + {isEn ? "Add Member" : "Añadir Integrante"}
                          </button>
                        )}
                      </div>

                      {members.map((member, idx) => (
                        <div key={idx} className="flex flex-col gap-2 rounded-lg border border-[#1F1938] bg-[#0E0C1B] p-3 sm:flex-row sm:items-center">
                          <span className="font-mono text-xs font-bold text-[#73726C] shrink-0">#{idx + 2}</span>
                          <input
                            type="text"
                            placeholder={isEn ? "First Name" : "Nombre"}
                            value={member.firstName}
                            onChange={(e) => handleMemberChange(idx, "firstName", e.target.value)}
                            className="flex-1 rounded border border-[#2C2550] bg-[#090812] px-2.5 py-1.5 text-xs text-[#E6E4DA] outline-none"
                          />
                          <input
                            type="text"
                            placeholder={isEn ? "Last Name" : "Apellidos"}
                            value={member.lastName}
                            onChange={(e) => handleMemberChange(idx, "lastName", e.target.value)}
                            className="flex-1 rounded border border-[#2C2550] bg-[#090812] px-2.5 py-1.5 text-xs text-[#E6E4DA] outline-none"
                          />
                          <input
                            type="email"
                            placeholder="correo@ipn.mx"
                            value={member.email}
                            onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                            className="flex-1 rounded border border-[#2C2550] bg-[#090812] px-2.5 py-1.5 text-xs text-[#E6E4DA] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            className="p-1 text-[#73726C] hover:text-red-400 self-end sm:self-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Custom Fields for this activity */}
            {(activity.formConfig?.customFields || []).length > 0 && (
              <div className="rounded-xl border border-[#2C2550] bg-[#090812] p-5 font-mono text-xs space-y-4">
                <h4 className="font-bold uppercase tracking-wider text-white">
                  {isEn ? "Activity Specific Questions" : "Preguntas Específicas del Taller"}
                </h4>

                <div className="space-y-3">
                  {activity.formConfig?.customFields?.map((field) => {
                    const labelText = (isEn && field.labelEn ? field.labelEn : field.label) || field.label;
                    const placeholderText = (isEn && field.placeholderEn ? field.placeholderEn : field.placeholder) || field.placeholder || "";

                    return (
                      <div key={field.key} className="space-y-1">
                        <label className="block text-[11px] text-[#A8A7A0]">
                          {labelText} {field.required && <span className="text-[#C143BC]">*</span>}
                        </label>

                        {field.type === "text" && (
                          <input
                            type="text"
                            required={field.required}
                            value={String(customAnswers[field.key] || "")}
                            placeholder={placeholderText}
                            onChange={(e) => setCustomAnswers({ ...customAnswers, [field.key]: e.target.value })}
                            className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#3DD6D0]"
                          />
                        )}

                        {field.type === "url" && (
                          <input
                            type="url"
                            required={field.required}
                            value={String(customAnswers[field.key] || "")}
                            placeholder={placeholderText || "https://..."}
                            onChange={(e) => setCustomAnswers({ ...customAnswers, [field.key]: e.target.value })}
                            className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#3DD6D0]"
                          />
                        )}

                        {field.type === "textarea" && (
                          <textarea
                            rows={3}
                            required={field.required}
                            value={String(customAnswers[field.key] || "")}
                            placeholder={placeholderText}
                            onChange={(e) => setCustomAnswers({ ...customAnswers, [field.key]: e.target.value })}
                            className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#3DD6D0]"
                          />
                        )}

                        {field.type === "select" && (
                          <select
                            required={field.required}
                            value={String(customAnswers[field.key] || "")}
                            onChange={(e) => setCustomAnswers({ ...customAnswers, [field.key]: e.target.value })}
                            className="w-full rounded-lg border border-[#2C2550] bg-[#0E0C1B] px-3 py-2 text-[#E6E4DA] outline-none focus:border-[#3DD6D0]"
                          >
                            <option value="">{isEn ? "-- Select an option --" : "-- Selecciona una opción --"}</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {isEn && opt.labelEn ? opt.labelEn : opt.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {field.type === "checkbox" && (
                          <label className="flex items-center gap-2 cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              checked={Boolean(customAnswers[field.key])}
                              onChange={(e) => setCustomAnswers({ ...customAnswers, [field.key]: e.target.checked })}
                              className="rounded border-[#2C2550] bg-[#0E0C1B] text-[#3DD6D0]"
                            />
                            <span className="text-white">{labelText}</span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Logistics & Prerequisites */}
            <div className="rounded-xl border border-[#2C2550] bg-[#090812] p-5 font-mono text-xs space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-white">
                {isEn ? "Logistics Commitment" : "Compromiso de Asistencia"}
              </h4>

              {activity.formConfig?.requireLaptop && (
                <label className="flex items-start gap-2.5 cursor-pointer text-[#E6E4DA]">
                  <input
                    type="checkbox"
                    required
                    checked={bringsLaptop}
                    onChange={(e) => setBringsLaptop(e.target.checked)}
                    className="mt-0.5 rounded border-[#2C2550] bg-[#0E0C1B] text-[#3DD6D0]"
                  />
                  <span>
                    <strong>{isEn ? "Required: " : "Obligatorio: "}</strong>
                    {isEn ? "I confirm I will bring my own laptop and charger to perform hands-on labs." : "Confirmo que asistiré con laptop propia y cargador para realizar las prácticas."}
                  </span>
                </label>
              )}

              {(activity.formConfig?.prerequisitesList || []).length > 0 && (
                <label className="flex items-start gap-2.5 cursor-pointer text-[#E6E4DA]">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedPrerequisites}
                    onChange={(e) => setAcceptedPrerequisites(e.target.checked)}
                    className="mt-0.5 rounded border-[#2C2550] bg-[#0E0C1B] text-[#3DD6D0]"
                  />
                  <span>
                    {isEn ? "I have read and agree to comply with the technical prerequisites for this session." : "He leído y cumplo con los prerrequisitos técnicos solicitados para este taller."}
                  </span>
                </label>
              )}
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

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || !!scheduleConflict || !!assignedActivityConflict || alreadyRegisteredInThis}
              className={`w-full rounded-xl py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-black shadow-lg transition-all ${
                isWorkshop
                  ? "bg-[#3DD6D0] hover:bg-[#32b5b0] hover:shadow-[0_0_20px_rgba(61,214,208,0.4)]"
                  : "bg-[#D85A30] text-white hover:bg-[#c44e26] hover:shadow-[0_0_20px_rgba(216,90,48,0.4)]"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {submitting
                ? isEn ? "Securing your spot..." : "Confirmando tu lugar..."
                : isEn ? "Confirm My Registration" : "Confirmar Mi Inscripción"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
