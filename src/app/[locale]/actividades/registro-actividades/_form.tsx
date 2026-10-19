"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Laptop,
  MapPin,
  UserPlus,
} from "lucide-react";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import { SearchSelect, type SelectOption } from "@/components/forms/search-select";
import type { SummaryRow } from "@/components/forms/success-screen";
import { useHydrated } from "@/hooks/use-hydrated";
import type { Locale } from "@/data/attendee-form";
import type {
  ApplyActivitiesPayload,
  AttendeeLookupResult,
  PublicActivityDTO,
  UnifiedActivityFormConfig,
} from "@/types/activities";
import { apiErrorMessage } from "@/lib/activities-dto";
import { cleanWhitespace, normalizeEmail } from "@/lib/normalize";
import { cn } from "@/lib/utils";
import { activitiesCopyFor } from "../_copy";
import {
  ArcadeCheckbox,
  CustomFieldInputs,
  Field,
  GeneralProfileFields,
  buildGeneralProfilePayload,
  hasOverlap,
  inputCls,
  useGeneralProfileState,
  validateCustomFieldAnswers,
  validateGeneralProfile,
} from "../_shared";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

type Answers = Record<string, string | boolean>;

function SectionCard({
  title,
  tag,
  children,
}: {
  title: string;
  tag?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
      <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
        <span className="arcade-pixel text-xs text-[#F2A6F0]">{title}</span>
        {tag && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">{tag}</span>
        )}
      </div>
      {children}
    </div>
  );
}

export function UnifiedActivitiesForm({
  config,
  activities,
  preferSlug,
  onSubmit,
}: {
  config: UnifiedActivityFormConfig;
  /** Actividades `type: "activity"` publicadas y abiertas */
  activities: PublicActivityDTO[];
  preferSlug: string;
  onSubmit: (payload: ApplyActivitiesPayload, summaryRows: SummaryRow[]) => Promise<void>;
}) {
  const locale = (useLocale() === "en" ? "en" : "es") as Locale;
  const isEn = locale === "en";
  const localizedTitle = (slug: string, fallback: string): string => {
    const a = activities.find((x) => x.slug === slug);
    return a ? (isEn ? a.titleEn || a.title : a.title) : fallback;
  };
  const t = activitiesCopyFor(locale);

  // ── Paso 1: correo y estado híbrido ──
  const [email, setEmail] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [lookup, setLookup] = useState<AttendeeLookupResult | null>(null);
  const [lastVerifiedEmail, setLastVerifiedEmail] = useState("");

  const profile = useGeneralProfileState();

  // ── Prioridades (slug por posición); la preferida llega preseleccionada como Prioridad 1 ──
  const [priorities, setPriorities] = useState<string[]>(preferSlug ? [preferSlug] : []);

  // ── Logística y respuestas ──
  const [bringsLaptop, setBringsLaptop] = useState(false);
  const [acceptedPrerequisites, setAcceptedPrerequisites] = useState(false);
  const [globalAnswers, setGlobalAnswers] = useState<Answers>({});
  const [activityAnswers, setActivityAnswers] = useState<Record<string, Answers>>({});

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<TurnstileHandle>(null);
  const captchaMounted = useHydrated() && !!siteKey;

  const normalizedEmail = normalizeEmail(email);
  const verified = !!lookup && normalizedEmail.ok && lastVerifiedEmail === normalizedEmail.value;
  const existingApplication = verified ? lookup?.activityApplication ?? null : null;

  // ── Elegibilidad: se excluyen las actividades que chocan con workshops/hackatones inscritos ──
  const enrolled = useMemo(() => (verified ? lookup?.enrolledActivities ?? [] : []), [verified, lookup]);

  const conflictOf = (act: PublicActivityDTO) =>
    enrolled.find((e) => hasOverlap(act.startTime, act.endTime, e.startTime, e.endTime)) ?? null;

  const eligible = activities.filter((a) => !conflictOf(a));
  const conflicting = activities
    .map((a) => ({ act: a, clash: conflictOf(a) }))
    .filter((x): x is { act: PublicActivityDTO; clash: NonNullable<ReturnType<typeof conflictOf>> } => !!x.clash);

  const requiredCount = Math.min(config.maxPriorities, eligible.length);
  const eligibleKey = eligible.map((a) => a.slug).join("|");

  // Slots saneados: sin elementos no elegibles ni repetidos
  const slots = useMemo(() => {
    const valid = new Set(eligibleKey.split("|").filter(Boolean));
    const seen = new Set<string>();
    return Array.from({ length: requiredCount }, (_, i) => {
      const slug = priorities[i] ?? "";
      if (!slug || !valid.has(slug) || seen.has(slug)) return "";
      seen.add(slug);
      return slug;
    });
  }, [priorities, requiredCount, eligibleKey]);

  const chosen = slots
    .map((slug, i) => ({ slug, n: i + 1, act: activities.find((a) => a.slug === slug) }))
    .filter((x): x is { slug: string; n: number; act: PublicActivityDTO } => !!x.act);

  const setSlot = (i: number, slug: string) => {
    const next = [...slots];
    next[i] = slug;
    setPriorities(next);
    if (errors.priorities) setErrors((prev) => ({ ...prev, priorities: "" }));
  };

  const moveSlot = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slots.length) return;
    const next = [...slots];
    [next[i], next[j]] = [next[j], next[i]];
    setPriorities(next);
  };

  // ── Requisitos combinados ──
  const pickPrereqs = (c: { prerequisitesList: string[]; prerequisitesListEn: string[] }) =>
    isEn && c.prerequisitesListEn.length ? c.prerequisitesListEn : c.prerequisitesList;
  const prereqList = Array.from(
    new Set([...pickPrereqs(config), ...chosen.flatMap((x) => pickPrereqs(x.act.formConfig))]),
  );
  const needsLaptop = config.requireLaptop || chosen.some((x) => x.act.formConfig.requireLaptop);
  const showLogistics = needsLaptop || prereqList.length > 0;

  const activitiesWithQuestions = chosen.filter((x) => x.act.formConfig.customFields.length > 0);
  const showQuestions = config.globalCustomFields.length > 0 || activitiesWithQuestions.length > 0;

  const optionLabel = (a: PublicActivityDTO) =>
    `${isEn ? a.titleEn || a.title : a.title} · ${a.startTime}–${a.endTime}`;

  // ── Verificación del correo ──
  const verifyEmailAddress = async (targetEmail?: string) => {
    const checked = normalizeEmail((targetEmail ?? email).trim());
    if (!checked.ok) {
      setErrors((prev) => ({ ...prev, email: checked.reason ?? t.e_email }));
      setLookup(null);
      return;
    }
    setErrors((prev) => ({ ...prev, email: "" }));
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

  // ── Validación y envío ──
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!normalizedEmail.ok) e.email = normalizedEmail.reason ?? t.e_email;

    if (!lookup?.existsInGeneralRegistration) Object.assign(e, validateGeneralProfile(profile, t));

    if (slots.some((s) => !s)) e.priorities = t.ua_e_priorities(requiredCount);

    if (needsLaptop && !bringsLaptop) e.bringsLaptop = t.e_laptop;
    if (prereqList.length > 0 && !acceptedPrerequisites) e.acceptedPrerequisites = t.e_prereq;

    Object.assign(e, validateCustomFieldAnswers(config.globalCustomFields, globalAnswers, "global_", t));
    for (const { act, slug } of chosen) {
      Object.assign(
        e,
        validateCustomFieldAnswers(act.formConfig.customFields, activityAnswers[slug] ?? {}, `act_${slug}_`, t),
      );
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!verified || existingApplication || requiredCount === 0) return;
    if (!validate() || !normalizedEmail.ok) return;

    setSubmitting(true);
    setFormError("");

    const payload: ApplyActivitiesPayload = {
      captchaToken,
      email: normalizedEmail.value,
      ...(lookup?.existsInGeneralRegistration
        ? {}
        : { generalProfile: buildGeneralProfilePayload(profile) }),
      prioritySlugs: slots,
      logistics: { bringsLaptop, acceptedPrerequisites },
      globalCustomAnswers: globalAnswers,
      activityCustomAnswers: Object.fromEntries(chosen.map(({ slug }) => [slug, activityAnswers[slug] ?? {}])),
    };

    const participantName = lookup?.existsInGeneralRegistration
      ? [lookup.firstName, lookup.lastName].filter(Boolean).join(" ")
      : `${cleanWhitespace(profile.firstName)} ${cleanWhitespace(profile.lastName)}`.trim();

    const summaryRows: SummaryRow[] = [
      { label: t.r_participant, value: participantName },
      { label: t.r_email, value: payload.email },
      ...chosen.map(({ act, n }) => ({
        label: t.ua_r_priority(n),
        value: `${isEn ? act.titleEn || act.title : act.title} (${act.startTime} – ${act.endTime})`,
      })),
    ];

    try {
      await onSubmit(payload, summaryRows);
    } catch (err) {
      setFormError((err as Error).message);
      setCaptchaToken("");
      captchaRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    verified && !existingApplication && requiredCount > 0 && !submitting && (!captchaMounted || !!captchaToken);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {/* BARRA DE PRUEBAS RÁPIDAS EN MODO MOCK */}

      {/* 01 · VERIFICACIÓN DE CORREO */}
      <SectionCard title={t.sec_email_title} tag={t.sec_email_tag}>
        <div className="flex flex-col gap-4">
          <Field label={t.email_label} required htmlFor="ua-email" hint={t.email_hint} error={errors.email}>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                id="ua-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                  // Un correo distinto invalida la verificación previa.
                  const next = normalizeEmail(e.target.value);
                  if (!next.ok || next.value !== lastVerifiedEmail) setLookup(null);
                }}
                onBlur={() => {
                  if (email.trim() && !verified) void verifyEmailAddress();
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

          <AnimatePresence initial={false}>
            {verified && lookup && (
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
                      {t.ua_new_attendee_desc}
                    </p>
                  </div>
                )}

                {/* Solicitud existente: asignada (verde) o pendiente (informativa) */}
                {existingApplication?.status === "assigned" && existingApplication.assignedActivity && (
                  <div className="rounded-[4px] border-2 border-emerald-500/70 bg-emerald-950/30 p-3.5 font-mono text-xs text-emerald-200">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{t.ua_assigned_title}</span>
                    </div>
                    <p className="m-0 mt-1 text-[11px] text-emerald-100/90">{t.ua_assigned_desc}</p>
                    <p className="m-0 mt-2 text-sm font-bold text-[#E6E4DA]">
                      {isEn
                        ? existingApplication.assignedActivity.titleEn
                        : existingApplication.assignedActivity.title}
                    </p>
                    <p className="m-0 mt-1 flex flex-wrap items-center gap-3 text-[11px] text-emerald-100/90">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {existingApplication.assignedActivity.startTime} –{" "}
                        {existingApplication.assignedActivity.endTime}
                      </span>
                      {existingApplication.assignedActivity.roomName && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {existingApplication.assignedActivity.roomName}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {existingApplication?.status === "pending" && (
                  <div className="rounded-[4px] border-2 border-[#C143BC]/70 bg-[#C143BC]/10 p-3.5 font-mono text-xs text-[#F2A6F0]">
                    <div className="flex items-center gap-2 font-bold">
                      <Clock className="h-4 w-4 shrink-0 text-[#C143BC]" />
                      <span>{t.ua_pending_title}</span>
                    </div>
                    <p className="m-0 mt-1 text-[11px] leading-relaxed text-[#E6E4DA]">{t.ua_pending_desc}</p>
                    <p className="m-0 mt-2 font-bold">{t.ua_sent_priorities}</p>
                    <ol className="m-0 mt-1 pl-5 text-[11px] text-[#E6E4DA]">
                      {existingApplication.priorities.map((p) => (
                        <li key={p.activityId}>
                          {localizedTitle(p.activitySlug, p.activityTitle)} ({p.startTime} – {p.endTime})
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Workshops / hackatones inscritos (horarios ocupados) */}
                {!existingApplication && enrolled.length > 0 && (
                  <div className="rounded-[4px] border border-[#2C2550] bg-[#090812] p-3.5 font-mono text-xs">
                    <p className="m-0 mb-2 font-bold text-[#F2A6F0]">{t.ua_enrolled_heading}</p>
                    <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[11px] text-[#B4B2A9]">
                      {enrolled.map((e) => (
                        <li key={e.activityId} className="flex flex-wrap items-center gap-2">
                          <span className="rounded-[2px] border border-[#C143BC]/50 px-1.5 py-0.5 text-[10px] text-[#F2A6F0]">
                            {e.startTime}–{e.endTime}
                          </span>
                          {isEn ? e.titleEn : e.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!existingApplication && requiredCount === 0 && (
                  <div className="rounded-[4px] border-2 border-[#E24B4A] bg-[#E24B4A]/15 p-3.5 font-mono text-xs text-[#E24B4A]">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{t.ua_no_eligible_title}</span>
                    </div>
                    <p className="m-0 mt-1 text-[11px] leading-relaxed text-[#E6E4DA]">{t.ua_no_eligible_desc}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SectionCard>

      {/* El resto del formulario sólo aplica si no hay una solicitud activa */}
      {verified && !existingApplication && (
        <>
          {/* 01.B · PERFIL GENERAL (sólo si no existe en Registration) */}
          {!lookup?.existsInGeneralRegistration && (
            <div className="rounded-[4px] border border-[#C143BC]/50 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.08)] flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#2C2550] pb-2.5">
                <span className="arcade-pixel text-xs text-[#F2A6F0]">{t.sec_profile_title}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#F2A6F0]">
                  {t.sec_profile_tag}
                </span>
              </div>
              <GeneralProfileFields p={profile} errors={errors} locale={locale} t={t} />
            </div>
          )}

          {requiredCount > 0 && (
            <>
              {/* 02 · PRIORIDADES */}
              <SectionCard title={t.ua_sec_priorities_title} tag={t.ua_sec_priorities_tag}>
                <div className="flex flex-col gap-4">
                  <p className="m-0 font-mono text-xs text-[#B4B2A9]">{t.ua_priorities_hint(requiredCount)}</p>
                  <p className="m-0 rounded-[3px] border border-[#2C2550] bg-[#090812] px-3 py-2 font-mono text-[11px] leading-relaxed text-[#8E8EA0]">
                    ℹ️ {t.ua_priority_note}
                  </p>

                  {slots.map((slug, i) => {
                    const options: SelectOption[] = eligible
                      .filter((a) => a.slug === slug || !slots.includes(a.slug))
                      .map((a) => ({ value: a.slug, label: optionLabel(a) }));
                    const picked = activities.find((a) => a.slug === slug);
                    return (
                      <div key={i} className="flex flex-col gap-2">
                        <Field
                          label={t.ua_priority_label(i + 1)}
                          required
                          htmlFor={`ua-priority-${i}`}
                          error={i === 0 ? errors.priorities : undefined}
                        >
                          <div className="flex items-stretch gap-2">
                            <div className="min-w-0 flex-1">
                              <SearchSelect
                                id={`ua-priority-${i}`}
                                options={options}
                                value={slug}
                                onChange={(v) => setSlot(i, v)}
                                placeholder={t.ua_priority_ph}
                                searchPlaceholder={t.ua_priority_search}
                                invalid={!!errors.priorities && !slug}
                              />
                            </div>
                            {slots.length > 1 && (
                              <div className="flex shrink-0 flex-col gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveSlot(i, -1)}
                                  disabled={i === 0}
                                  aria-label="↑"
                                  className="cursor-pointer rounded-[3px] border border-[#2C2550] bg-[#090812] p-1 text-[#F2A6F0] hover:border-[#C143BC] disabled:opacity-30"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSlot(i, 1)}
                                  disabled={i === slots.length - 1}
                                  aria-label="↓"
                                  className="cursor-pointer rounded-[3px] border border-[#2C2550] bg-[#090812] p-1 text-[#F2A6F0] hover:border-[#C143BC] disabled:opacity-30"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </Field>
                        {picked?.roomName && (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#8E8EA0]">
                            <MapPin className="h-3 w-3 text-[#C143BC]" />
                            {picked.roomName}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Actividades deshabilitadas por conflicto de horario */}
                  {conflicting.length > 0 && (
                    <div className="flex flex-col gap-2 border-t border-[#2C2550] pt-4">
                      {conflicting.map(({ act, clash }) => (
                        <div
                          key={act.slug}
                          className="rounded-[3px] border border-amber-500/40 bg-amber-950/20 px-3 py-2 font-mono text-[11px] opacity-80"
                        >
                          <div className="font-bold text-[#B4B2A9]">{optionLabel(act)}</div>
                          <div className="mt-0.5 flex items-start gap-1.5 text-amber-300">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                            {t.ua_conflict_label(
                              isEn ? clash.titleEn : clash.title,
                              clash.startTime,
                              clash.endTime,
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* 03 · LOGÍSTICA Y REQUISITOS COMBINADOS */}
              {showLogistics && (
                <SectionCard title={t.ua_sec_logistics_title} tag={t.sec_logistics_tag}>
                  <div className="flex flex-col gap-4">
                    {prereqList.length > 0 && (
                      <div className="rounded-[4px] border border-[#2C2550] bg-[#090812] p-3.5">
                        <p className="m-0 mb-2 flex items-center gap-2 font-mono text-xs font-bold text-[#F2A6F0]">
                          <Laptop className="h-4 w-4 text-[#C143BC]" />
                          {t.ua_prereq_heading}
                        </p>
                        <ul className="m-0 pl-5 flex flex-col gap-1.5 font-mono text-xs text-[#B4B2A9]">
                          {prereqList.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {needsLaptop && (
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
                </SectionCard>
              )}

              {/* 04 · PREGUNTAS GLOBALES + POR ACTIVIDAD ELEGIDA */}
              {showQuestions && (
                <SectionCard title={t.ua_sec_questions_title} tag={t.ua_sec_questions_tag}>
                  <div className="flex flex-col gap-6">
                    {config.globalCustomFields.length > 0 && (
                      <div className="flex flex-col gap-4">
                        <p className="m-0 font-mono text-xs font-bold uppercase tracking-wider text-[#F2A6F0]">
                          {t.ua_global_questions}
                        </p>
                        <CustomFieldInputs
                          fields={config.globalCustomFields}
                          answers={globalAnswers}
                          onAnswer={(key, value) => {
                            setGlobalAnswers((prev) => ({ ...prev, [key]: value }));
                            setErrors((prev) =>
                              prev[`global_${key}`] ? { ...prev, [`global_${key}`]: "" } : prev,
                            );
                          }}
                          errors={errors}
                          errPrefix="global_"
                          idPrefix="gcf-"
                          isEn={isEn}
                          t={t}
                        />
                      </div>
                    )}

                    {activitiesWithQuestions.map(({ act, slug, n }) => (
                      <div key={slug} className="flex flex-col gap-4 border-t border-[#2C2550] pt-5 first:border-t-0 first:pt-0">
                        <p className="m-0 font-mono text-xs font-bold uppercase tracking-wider text-[#F2A6F0]">
                          {t.ua_activity_questions(n, isEn ? act.titleEn || act.title : act.title)}
                        </p>
                        <CustomFieldInputs
                          fields={act.formConfig.customFields}
                          answers={activityAnswers[slug] ?? {}}
                          onAnswer={(key, value) => {
                            setActivityAnswers((prev) => ({
                              ...prev,
                              [slug]: { ...(prev[slug] ?? {}), [key]: value },
                            }));
                            setErrors((prev) =>
                              prev[`act_${slug}_${key}`] ? { ...prev, [`act_${slug}_${key}`]: "" } : prev,
                            );
                          }}
                          errors={errors}
                          errPrefix={`act_${slug}_`}
                          idPrefix={`acf-${slug}-`}
                          isEn={isEn}
                          t={t}
                        />
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}
            </>
          )}
        </>
      )}

      {/* ENVÍO */}
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
          disabled={!canSubmit}
          className="w-full cursor-pointer rounded-[4px] border-2 border-[#C143BC] bg-[#C143BC] px-6 py-4 font-mono text-sm font-bold text-[#0E0E1A] shadow-[0_0_24px_rgba(193,67,188,0.45)] transition-all hover:bg-[#D970D7] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t.ua_submitting : t.ua_submit}
        </button>
      </div>
    </form>
  );
}
