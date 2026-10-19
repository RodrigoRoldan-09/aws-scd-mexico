"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  Laptop,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import type { SummaryRow } from "@/components/forms/success-screen";
import { useHydrated } from "@/hooks/use-hydrated";
import type { Locale } from "@/data/attendee-form";
import type {
  AttendeeLookupResult,
  PublicActivityDTO,
  RegisterActivityPayload,
} from "@/types/activities";
import { apiErrorMessage } from "@/lib/activities-dto";
import type { ITeamMember } from "@/models/activity-registration";
import { cleanWhitespace, normalizeEmail } from "@/lib/normalize";
import { cn } from "@/lib/utils";
import { activitiesCopyFor } from "../_copy";
import {
  ArcadeCheckbox,
  CustomFieldInputs,
  Field,
  GeneralProfileFields,
  hasOverlap,
  inputCls,
  useGeneralProfileState,
  validateCustomFieldAnswers,
} from "../_shared";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

type MemberCheck = "checking" | "registered" | "missing" | "error";

export function ActivityRegistrationForm({
  activity,
  onSubmit,
}: {
  activity: PublicActivityDTO;
  onSubmit: (payload: RegisterActivityPayload, summaryRows: SummaryRow[]) => Promise<void>;
}) {
  const locale = (useLocale() === "en" ? "en" : "es") as Locale;
  const isEn = locale === "en";
  const t = activitiesCopyFor(locale);
  const { formConfig } = activity;

  // ── Paso 1: Email y Estado Híbrido ──
  const [email, setEmail] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [lookup, setLookup] = useState<AttendeeLookupResult | null>(null);
  const [lastVerifiedEmail, setLastVerifiedEmail] = useState("");

  // ── Datos de Perfil General (sólo requeridos si lookup?.existsInGeneralRegistration === false) ──
  const profile = useGeneralProfileState();
  const {
    firstName, setFirstName,
    lastName, setLastName,
    documentType,
    role, setRole,
    roleOther,
    entityType, setEntityType,
    entityName, setEntityName,
    fromCommunity,
    communityName,
    acceptCoc,
    acceptPrivacy,
  } = profile;

  // ── Bloque de Equipo (Hackatón / Actividades en equipo) ──
  const [isTeam, setIsTeam] = useState(formConfig.participationMode === "team");
  const [teamName, setTeamName] = useState("");
  const [roleInTeam, setRoleInTeam] = useState("");
  const [members, setMembers] = useState<ITeamMember[]>(() =>
    formConfig.participationMode === "team" && formConfig.minTeamSize > 1
      ? [{ firstName: "", lastName: "", email: "", roleInTeam: "" }]
      : [],
  );

  const [memberStatus, setMemberStatus] = useState<Record<string, MemberCheck>>({});

  // ── Bloque Logístico ──
  const [bringsLaptop, setBringsLaptop] = useState(false);
  const [acceptedPrerequisites, setAcceptedPrerequisites] = useState(false);

  // ── Bloque de Custom Fields ──
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | boolean>>({});

  // ── Control de UI y Captcha ──
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<TurnstileHandle>(null);
  const captchaMounted = useHydrated() && !!siteKey;

  const needsRoleOther = role === "other";
  const needsEntityName = !!entityType && entityType !== "none";

  // Máximo de integrantes adicionales sin contar al líder (por defecto 3 - 1 = 2 adicionales)
  const maxAdditionalMembers = Math.max(0, formConfig.maxTeamSize - 1);
  const currentTotalTeamMembers = isTeam ? 1 + members.length : 1;
  const spotsNeeded =
    isTeam && formConfig.capacityMode === "per_person" ? currentTotalTeamMembers : 1;

  // Detectar si el correo consultado ya está inscrito o tiene conflicto de horario
  const alreadyEnrolledInThis = useMemo(
    () => lookup?.enrolledActivities.some((a) => a.slug === activity.slug) ?? false,
    [lookup, activity.slug],
  );

  const scheduleConflict = useMemo(() => {
    if (!lookup) return null;
    return (
      lookup.enrolledActivities.find(
        (a) =>
          a.slug !== activity.slug &&
          hasOverlap(activity.startTime, activity.endTime, a.startTime, a.endTime),
      ) ?? null
    );
  }, [lookup, activity.slug, activity.startTime, activity.endTime]);

  // Aviso informativo (no bloqueante): el horario choca con una prioridad pendiente del formulario de actividades
  const pendingPriorityOverlap = useMemo(() => {
    const app = lookup?.activityApplication;
    if (!app || app.status !== "pending") return null;
    return (
      app.priorities.find((p) =>
        hasOverlap(activity.startTime, activity.endTime, p.startTime, p.endTime),
      ) ?? null
    );
  }, [lookup, activity.startTime, activity.endTime]);

  // Restaurar borrador local por actividad
  const draftKey = `scd:draft_act:${activity.slug}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastName) setLastName(parsed.lastName);
        if (parsed.role) setRole(parsed.role);
        if (parsed.entityType) setEntityType(parsed.entityType);
        if (parsed.entityName) setEntityName(parsed.entityName);
        if (parsed.teamName) setTeamName(parsed.teamName);
        if (parsed.roleInTeam) setRoleInTeam(parsed.roleInTeam);
        if (parsed.customAnswers) setCustomAnswers(parsed.customAnswers);
      }
    } catch {
      // Ignorar errores de localStorage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  const verifyEmailAddress = async (targetEmail?: string) => {
    const raw = (targetEmail ?? email).trim();
    const checked = normalizeEmail(raw);
    if (!checked.ok) {
      setErrors((prev) => ({ ...prev, email: checked.reason ?? t.e_email }));
      setLookup(null);
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.email;
      return next;
    });
    setVerifyingEmail(true);
    setFormError("");

    try {
      const res = await fetch("/api/activities/lookup-attendee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: checked.value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(apiErrorMessage(data, t.e_email));
        setLookup(null);
      } else {
        setLookup(data as AttendeeLookupResult);
        setLastVerifiedEmail(checked.value);
      }
    } catch {
      setFormError("No se pudo verificar el correo. Intenta de nuevo.");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const addTeamMember = () => {
    if (members.length >= maxAdditionalMembers) return;
    setMembers((prev) => [
      ...prev,
      { firstName: "", lastName: "", email: "", roleInTeam: "" },
    ]);
  };

  const updateTeamMember = (idx: number, key: keyof ITeamMember, val: string) => {
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, [key]: val } : m)));
    if (errors[`member_${idx}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`member_${idx}`];
        return next;
      });
    }
  };

  // Verificación de que cada integrante ya tiene registro general (y, por tanto, QR propio).
  // Solo se usa el booleano `existsInGeneralRegistration`; la validación definitiva la hace el servidor.
  const checkMember = async (rawEmail: string): Promise<MemberCheck | null> => {
    const checked = normalizeEmail(rawEmail);
    if (!checked.ok) return null;
    const key = checked.value;
    setMemberStatus((prev) => ({ ...prev, [key]: "checking" }));
    let status: MemberCheck = "error";
    try {
      const res = await fetch("/api/activities/lookup-attendee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: key }),
      });
      if (res.ok) {
        const data = (await res.json()) as AttendeeLookupResult;
        status = data.existsInGeneralRegistration ? "registered" : "missing";
      }
    } catch {
      status = "error";
    }
    setMemberStatus((prev) => ({ ...prev, [key]: status }));
    return status;
  };

  const removeTeamMember = (idx: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = (memberChecks: Record<string, MemberCheck> = memberStatus): boolean => {
    const e: Record<string, string> = {};
    const mail = normalizeEmail(email);
    if (!mail.ok) e.email = mail.reason ?? t.e_email;

    // Si el participante NO existe en Registration, validamos los campos de perfil general
    const isNewAttendee = !lookup?.existsInGeneralRegistration;
    if (isNewAttendee) {
      if (!cleanWhitespace(firstName)) e.firstName = t.e_firstName;
      if (!cleanWhitespace(lastName)) e.lastName = t.e_lastName;
      if (!role) e.role = t.e_role;
      if (needsRoleOther && !cleanWhitespace(roleOther)) e.roleOther = t.e_roleOther;
      if (!entityType) e.entityType = t.e_entityType;
      if (needsEntityName && !cleanWhitespace(entityName)) e.entityName = t.e_entityName;
      if (fromCommunity === "yes" && !cleanWhitespace(communityName)) {
        e.communityName = t.e_communityName;
      }
      if (!acceptCoc) e.coc = t.e_coc;
      if (!acceptPrivacy) e.privacy = t.e_privacy;
    }

    // Validar Bloque de Equipo
    if (isTeam && formConfig.participationMode !== "individual") {
      if (!cleanWhitespace(teamName)) e.teamName = t.e_teamName;
      const minExtra = Math.max(1, formConfig.minTeamSize - 1);
      if (members.length < minExtra) {
        e.teamMembers = t.e_teamMin( Math.max(2, formConfig.minTeamSize) );
      }
      members.forEach((m, idx) => {
        const mMail = normalizeEmail(m.email);
        if (!cleanWhitespace(m.firstName) || !cleanWhitespace(m.lastName) || !mMail.ok) {
          e[`member_${idx}`] = t.e_memberFields;
        } else if (memberChecks[mMail.value] === "missing") {
          e[`member_${idx}`] = t.member_missing;
        }
      });
    }

    // Validar Bloque Logístico
    const prereqs = isEn ? formConfig.prerequisitesListEn : formConfig.prerequisitesList;
    if (formConfig.requireLaptop && !bringsLaptop) {
      e.bringsLaptop = t.e_laptop;
    }
    if (prereqs.length > 0 && !acceptedPrerequisites) {
      e.acceptedPrerequisites = t.e_prereq;
    }

    // Validar Preguntas Dinámicas (`customFields`)
    Object.assign(e, validateCustomFieldAnswers(formConfig.customFields, customAnswers, "custom_", t));

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (alreadyEnrolledInThis || scheduleConflict) return;

    // Si aún no ha verificado su correo contra lookup, verificar primero
    const mail = normalizeEmail(email);
    if (mail.ok && lastVerifiedEmail !== mail.value) {
      await verifyEmailAddress(mail.value);
    }

    // Verificar los integrantes que aún no se han comprobado (o fallaron) antes de validar.
    let memberChecks = memberStatus;
    if (isTeam && formConfig.participationMode !== "individual") {
      const pending = members
        .map((m) => normalizeEmail(m.email))
        .filter((c) => c.ok && (memberStatus[c.value] === undefined || memberStatus[c.value] === "error"));
      if (pending.length > 0) {
        const results = await Promise.all(pending.map((c) => checkMember(c.value ?? "")));
        memberChecks = { ...memberStatus };
        pending.forEach((c, i) => {
          const r = results[i];
          if (r) memberChecks[c.value ?? ""] = r;
        });
      }
    }

    if (!validate(memberChecks)) return;

    setSubmitting(true);
    setFormError("");

    const payload: RegisterActivityPayload = {
      captchaToken,
      email: normalizeEmail(email).value,
      ...(lookup?.existsInGeneralRegistration
        ? {}
        : {
            generalProfile: {
              firstName: cleanWhitespace(firstName),
              lastName: cleanWhitespace(lastName),
              documentType: documentType || undefined,
              role,
              roleOther: needsRoleOther ? cleanWhitespace(roleOther) : "",
              entityType,
              entityName: needsEntityName ? cleanWhitespace(entityName) : "",
              fromCommunity: fromCommunity === "yes" ? "true" : "false",
              communityName: fromCommunity === "yes" ? cleanWhitespace(communityName) : "",
              acceptCoc,
              acceptPrivacy,
            },
          }),
      logistics: {
        bringsLaptop,
        acceptedPrerequisites,
      },
      team:
        isTeam && formConfig.participationMode !== "individual"
          ? {
              isTeam: true,
              teamName: cleanWhitespace(teamName),
              roleInTeam: cleanWhitespace(roleInTeam),
              members: members.map((m) => ({
                firstName: cleanWhitespace(m.firstName),
                lastName: cleanWhitespace(m.lastName),
                email: normalizeEmail(m.email).value,
                roleInTeam: cleanWhitespace(m.roleInTeam || ""),
              })),
            }
          : null,
      customAnswers,
    };

    const participantName = lookup?.existsInGeneralRegistration
      ? [lookup.firstName, lookup.lastName].filter(Boolean).join(" ")
      : `${cleanWhitespace(firstName)} ${cleanWhitespace(lastName)}`.trim();

    const summaryRows: SummaryRow[] = [
      { label: t.r_activity, value: isEn ? activity.titleEn || activity.title : activity.title },
      { label: t.r_schedule, value: `${activity.startTime} – ${activity.endTime}` },
      { label: t.r_room, value: activity.roomName },
      { label: t.r_participant, value: participantName },
      { label: t.r_email, value: payload.email },
      { label: t.r_spots, value: String(spotsNeeded) },
      ...(payload.team?.isTeam
        ? [
            { label: t.r_team, value: payload.team.teamName || "" },
            {
              label: t.r_members,
              value: [
                `${participantName} (Líder)`,
                ...payload.team.members.map((m) => `${m.firstName} ${m.lastName}`),
              ].join(", "),
            },
          ]
        : []),
    ];

    try {
      await onSubmit(payload, summaryRows);
      localStorage.removeItem(draftKey);
    } catch (err) {
      setFormError((err as Error).message);
      setCaptchaToken("");
      captchaRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  };

  const prereqList = isEn
    ? formConfig.prerequisitesListEn.length
      ? formConfig.prerequisitesListEn
      : formConfig.prerequisitesList
    : formConfig.prerequisitesList;

  const showLogisticsSection = formConfig.requireLaptop || prereqList.length > 0;
  const showTeamSection = formConfig.participationMode !== "individual";
  const showCustomSection = formConfig.customFields.length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {/* BARRA DE PRUEBAS RÁPIDAS EN MODO MOCK */}

      {/* RECUADRO 01: VERIFICACIÓN HÍBRIDA DE CORREO */}
      <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
        <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
          <span className="arcade-pixel text-xs text-[#F2A6F0]">{t.sec_email_title}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
            {t.sec_email_tag}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <Field
            label={t.email_label}
            required
            htmlFor="act-email"
            hint={t.email_hint}
            error={errors.email}
          >
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                id="act-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                onBlur={() => {
                  if (email.trim() && normalizeEmail(email).value !== lastVerifiedEmail) {
                    void verifyEmailAddress();
                  }
                }}
                placeholder={t.email_ph}
                className={cn(inputCls, "flex-1", errors.email && "border-[#E24B4A]")}
              />
              <button
                type="button"
                onClick={() => void verifyEmailAddress()}
                disabled={verifyingEmail || !email.trim()}
                className="cursor-pointer shrink-0 rounded-[4px] border border-[#C143BC] bg-[#9A3097]/30 px-4 py-2.5 font-mono text-xs font-bold text-[#F2A6F0] transition-all hover:bg-[#C143BC] hover:text-[#0E0E1A] disabled:opacity-50"
              >
                {verifyingEmail ? t.verifying_email : t.btn_verify_email}
              </button>
            </div>
          </Field>

          {/* Resultado de verificación híbrida */}
          <AnimatePresence initial={false}>
            {lookup && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col gap-3"
              >
                {lookup.existsInGeneralRegistration ? (
                  <div className="rounded-[4px] border border-emerald-500/60 bg-emerald-950/30 p-3.5 font-mono text-xs text-emerald-200">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{t.verified_badge}</span>
                    </div>
                    <p className="m-0 mt-1.5 text-[11px] leading-relaxed text-emerald-100/90">
                      {t.verified_hello(lookup.firstName ?? "", lookup.qrCode ?? "QR")}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[4px] border border-[#C143BC]/60 bg-[#C143BC]/15 p-3.5 font-mono text-xs text-[#F2A6F0]">
                    <div className="flex items-center gap-2 font-bold">
                      <UserPlus className="h-4 w-4 shrink-0 text-[#C143BC]" />
                      <span>{t.new_attendee_badge}</span>
                    </div>
                    <p className="m-0 mt-1.5 text-[11px] leading-relaxed text-[#E6E4DA]">
                      {t.new_attendee_desc}
                    </p>
                  </div>
                )}

                {/* Alerta si ya está inscrito en ESTA actividad */}
                {alreadyEnrolledInThis && (
                  <div className="rounded-[4px] border-2 border-[#E24B4A] bg-[#E24B4A]/15 p-3.5 font-mono text-xs text-[#E24B4A]">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{t.already_enrolled_title}</span>
                    </div>
                    <p className="m-0 mt-1 text-[11px] text-[#E6E4DA]">{t.already_enrolled_desc}</p>
                  </div>
                )}

                {/* Alerta si hay CONFLICTO DE HORARIO con otra actividad */}
                {!alreadyEnrolledInThis && scheduleConflict && (
                  <div className="rounded-[4px] border-2 border-[#E24B4A] bg-[#E24B4A]/15 p-3.5 font-mono text-xs text-[#E24B4A]">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{t.conflict_warning_title}</span>
                    </div>
                    <p className="m-0 mt-1 text-[11px] leading-relaxed text-[#E6E4DA]">
                      {t.conflict_warning_desc(
                        isEn ? scheduleConflict.titleEn : scheduleConflict.title,
                        scheduleConflict.startTime,
                        scheduleConflict.endTime,
                      )}
                    </p>
                  </div>
                )}
              {/* Aviso informativo: choca con una prioridad pendiente del formulario de actividades */}
                {!alreadyEnrolledInThis && !scheduleConflict && pendingPriorityOverlap && (
                  <div className="rounded-[4px] border border-amber-500/60 bg-amber-950/25 p-3.5 font-mono text-xs text-amber-200">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{t.pending_overlap_title}</span>
                    </div>
                    <p className="m-0 mt-1 text-[11px] leading-relaxed text-amber-100/90">
                      {t.pending_overlap_desc(
                        pendingPriorityOverlap.priority,
                        pendingPriorityOverlap.activityTitle,
                      )}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RECUADRO 01.B: DATOS DE REGISTRO GENERAL (SÓLO SI NO EXISTE EN REGISTRATION) */}
      <AnimatePresence initial={false}>
        {lookup && !lookup.existsInGeneralRegistration && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-[4px] border border-[#C143BC]/50 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.08)] flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#2C2550] pb-2.5">
                <span className="arcade-pixel text-xs text-[#F2A6F0]">{t.sec_profile_title}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#F2A6F0]">
                  {t.sec_profile_tag}
                </span>
              </div>

              <GeneralProfileFields p={profile} errors={errors} locale={locale} t={t} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RECUADRO 02: MODALIDAD DE PARTICIPACIÓN Y EQUIPO (HACKATÓN / GRUPAL) */}
      {showTeamSection && (
        <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
          <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
            <span className="arcade-pixel text-xs text-[#F2A6F0]">{t.sec_team_title}</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#F2A6F0]">
              {t.sec_team_tag}
            </span>
          </div>

          <div className="flex flex-col gap-5">
            {formConfig.participationMode === "both" && (
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E6E4DA]">
                  {t.mode_label}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsTeam(false)}
                    className={cn(
                      "cursor-pointer rounded-[4px] border py-3 px-4 font-mono text-xs sm:text-sm font-bold transition-all",
                      !isTeam
                        ? "border-2 border-[#C143BC] bg-[#C143BC]/20 text-[#F2A6F0] shadow-[0_0_14px_rgba(193,67,188,0.25)]"
                        : "border-[#2C2550] bg-[#090812] text-[#B4B2A9] hover:border-[#C143BC]/60",
                    )}
                  >
                    {t.mode_solo}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTeam(true);
                      if (members.length === 0) {
                        setMembers([{ firstName: "", lastName: "", email: "", roleInTeam: "" }]);
                      }
                    }}
                    disabled={activity.spotsLeft < 2}
                    className={cn(
                      "cursor-pointer rounded-[4px] border py-3 px-4 font-mono text-xs sm:text-sm font-bold transition-all disabled:opacity-40",
                      isTeam
                        ? "border-2 border-[#C143BC] bg-[#C143BC]/20 text-[#F2A6F0] shadow-[0_0_14px_rgba(193,67,188,0.25)]"
                        : "border-[#2C2550] bg-[#090812] text-[#B4B2A9] hover:border-[#C143BC]/60",
                    )}
                  >
                    {t.mode_team(formConfig.maxTeamSize)}
                  </button>
                </div>
              </div>
            )}

            {/* Aviso en vivo de cuántos lugares del cupo se descontarán */}
            <div className="flex items-center gap-2.5 rounded-[4px] border border-[#C143BC]/50 bg-[#090812] px-3.5 py-2.5 font-mono text-xs text-[#F2A6F0]">
              <Users className="h-4 w-4 shrink-0 text-[#C143BC]" />
              <span>{t.team_spots_notice(spotsNeeded, activity.spotsLeft)}</span>
            </div>

            {isTeam && (
              <div className="flex flex-col gap-5 pt-2">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label={t.team_name_label}
                    required
                    htmlFor="act-team-name"
                    error={errors.teamName}
                  >
                    <input
                      id="act-team-name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder={t.team_name_ph}
                      maxLength={80}
                      className={cn(inputCls, errors.teamName && "border-[#E24B4A]")}
                    />
                  </Field>

                  <Field label={t.leader_role_label} htmlFor="act-leader-role">
                    <input
                      id="act-leader-role"
                      value={roleInTeam}
                      onChange={(e) => setRoleInTeam(e.target.value)}
                      placeholder={t.leader_role_ph}
                      maxLength={60}
                      className={inputCls}
                    />
                  </Field>
                </div>

                {/* Lista dinámica de integrantes adicionales (máx 3 en total incluyendo al líder) */}
                <div className="flex flex-col gap-3 border-t border-[#2C2550] pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#E6E4DA]">
                      {t.members_heading(currentTotalTeamMembers, formConfig.maxTeamSize)}
                    </span>

                    {members.length < maxAdditionalMembers &&
                      currentTotalTeamMembers < activity.spotsLeft && (
                        <button
                          type="button"
                          onClick={addTeamMember}
                          className="cursor-pointer inline-flex items-center gap-1.5 rounded-[4px] border border-[#C143BC] bg-[#C143BC]/15 px-3 py-1.5 font-mono text-xs font-bold text-[#F2A6F0] hover:bg-[#C143BC] hover:text-[#0E0E1A] transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {t.btn_add_member}
                        </button>
                      )}
                  </div>

                  {errors.teamMembers && (
                    <p className="m-0 font-mono text-xs text-[#E24B4A]">{errors.teamMembers}</p>
                  )}

                  {members.map((member, idx) => (
                    <div
                      key={idx}
                      className="rounded-[4px] border border-[#2C2550] bg-[#090812]/90 p-3.5 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="arcade-pixel text-[11px] text-[#F2A6F0]">
                          {t.member_badge(idx + 2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTeamMember(idx)}
                          className="cursor-pointer inline-flex items-center gap-1 font-mono text-[11px] text-[#E24B4A] hover:underline"
                        >
                          <Trash2 className="h-3 w-3" />
                          {t.btn_remove_member}
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          value={member.firstName}
                          onChange={(e) => updateTeamMember(idx, "firstName", e.target.value)}
                          placeholder={t.member_first_ph}
                          maxLength={60}
                          className={inputCls}
                        />
                        <input
                          value={member.lastName}
                          onChange={(e) => updateTeamMember(idx, "lastName", e.target.value)}
                          placeholder={t.member_last_ph}
                          maxLength={60}
                          className={inputCls}
                        />
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) => updateTeamMember(idx, "email", e.target.value)}
                          onBlur={() => void checkMember(member.email)}
                          placeholder={t.member_email_ph}
                          className={inputCls}
                        />
                        <input
                          value={member.roleInTeam ?? ""}
                          onChange={(e) => updateTeamMember(idx, "roleInTeam", e.target.value)}
                          placeholder={t.member_role_ph}
                          maxLength={60}
                          className={inputCls}
                        />
                      </div>

                      {(() => {
                        const st = memberStatus[normalizeEmail(member.email).value ?? ""];
                        if (!st || st === "error") return null;
                        return (
                          <p
                            className={cn(
                              "m-0 font-mono text-[11px]",
                              st === "registered" && "text-emerald-300",
                              st === "checking" && "text-[#B4B2A9]",
                              st === "missing" && "text-amber-300",
                            )}
                          >
                            {st === "checking"
                              ? t.member_checking
                              : st === "registered"
                                ? t.member_registered
                                : t.member_missing}
                          </p>
                        );
                      })()}

                      {errors[`member_${idx}`] && errors[`member_${idx}`] !== t.member_missing && (
                        <p className="m-0 font-mono text-xs text-[#E24B4A]">
                          {errors[`member_${idx}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECUADRO 03: REQUISITOS LOGÍSTICOS Y PRERREQUISITOS */}
      {showLogisticsSection && (
        <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
          <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
            <span className="arcade-pixel text-xs text-[#F2A6F0]">{t.sec_logistics_title}</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
              {t.sec_logistics_tag}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {prereqList.length > 0 && (
              <div className="rounded-[4px] border border-[#2C2550] bg-[#090812] p-3.5">
                <p className="m-0 mb-2 flex items-center gap-2 font-mono text-xs font-bold text-[#F2A6F0]">
                  <Laptop className="h-4 w-4 text-[#C143BC]" />
                  {t.prereq_list_heading}
                </p>
                <ul className="m-0 pl-5 flex flex-col gap-1.5 font-mono text-xs text-[#B4B2A9]">
                  {prereqList.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {formConfig.requireLaptop && (
              <ArcadeCheckbox
                checked={bringsLaptop}
                onChange={(val) => {
                  setBringsLaptop(val);
                  if (errors.bringsLaptop) setErrors((prev) => ({ ...prev, bringsLaptop: "" }));
                }}
                error={errors.bringsLaptop}
              >
                {t.check_laptop} <span className="text-[#C143BC]">*</span>
              </ArcadeCheckbox>
            )}

            {prereqList.length > 0 && (
              <ArcadeCheckbox
                checked={acceptedPrerequisites}
                onChange={(val) => {
                  setAcceptedPrerequisites(val);
                  if (errors.acceptedPrerequisites) {
                    setErrors((prev) => ({ ...prev, acceptedPrerequisites: "" }));
                  }
                }}
                error={errors.acceptedPrerequisites}
              >
                {t.check_prereq} <span className="text-[#C143BC]">*</span>
              </ArcadeCheckbox>
            )}
          </div>
        </div>
      )}

      {/* RECUADRO 04: PREGUNTAS DINÁMICAS DE LA ACTIVIDAD (`customFields`) */}
      {showCustomSection && (
        <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
          <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
            <span className="arcade-pixel text-xs text-[#F2A6F0]">{t.sec_custom_title}</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
              {t.sec_custom_tag}
            </span>
          </div>

          <CustomFieldInputs
            fields={formConfig.customFields}
            answers={customAnswers}
            onAnswer={(key, value) => {
              setCustomAnswers((prev) => ({ ...prev, [key]: value }));
              setErrors((prev) => (prev[`custom_${key}`] ? { ...prev, [`custom_${key}`]: "" } : prev));
            }}
            errors={errors}
            errPrefix="custom_"
            idPrefix="cf-"
            isEn={isEn}
            t={t}
          />
        </div>
      )}

      {/* BOTÓN DE ENVÍO Y ERRORES GLOBALES */}
      <div className="flex flex-col gap-4">
        {captchaMounted && (
          <div className="flex items-center justify-center">
            <Turnstile
              ref={captchaRef}
              siteKey={siteKey}
              theme="dark"
              appearance="interaction-only"
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken("")}
              onError={() => setCaptchaToken("")}
            />
          </div>
        )}

        {formError && (
          <p className="m-0 rounded-[4px] border border-[#E24B4A] bg-[#E24B4A]/10 px-4 py-3 font-mono text-sm text-[#E24B4A]">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={
            submitting ||
            alreadyEnrolledInThis ||
            !!scheduleConflict ||
            activity.spotsLeft < spotsNeeded ||
            (captchaMounted && !captchaToken)
          }
          className="w-full cursor-pointer rounded-[4px] border-2 border-[#C143BC] bg-[#C143BC] px-6 py-4 font-mono text-sm font-bold text-[#0E0E1A] shadow-[0_0_24px_rgba(193,67,188,0.45)] transition-all hover:bg-[#D970D7] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t.submitting : t.submit_btn(spotsNeeded)}
        </button>
      </div>
    </form>
  );
}
