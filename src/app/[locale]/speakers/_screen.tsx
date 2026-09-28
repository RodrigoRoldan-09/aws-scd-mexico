"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import { CallForSpeakers } from "@/components/sections/call-for-speakers";
import { PhoneInput } from "@/components/forms/phone-input";
import { SpeakerPreview } from "@/components/forms/previews";
import { SuccessScreen, type SummaryRow } from "@/components/forms/success-screen";
import { useCountdown } from "@/hooks/use-countdown";
import { DotHeading } from "@/components/ui/dot-heading";
import { FormShell } from "@/components/forms/form-shell";
import { localePath } from "@/lib/utils";
import { SITE_HOST } from "@/lib/constants";
import { CFP_DEADLINE, CFP_ONLINE_SPEAKERS } from "@/data/cfp";
import {
  cleanWhitespace, findCountry, normalizeEmail, normalizePhone, DEFAULT_COUNTRY,
} from "@/lib/normalize";
import {
  Wifi, MapPin,
  GraduationCap, BookOpen, Layers, Cpu,
  ChevronRight, ChevronLeft, CheckCircle2,
  Globe, Calendar, Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { normalizeLink } from "@/lib/normalize";
import {
  toSlug, emptyCoSpeaker, T, type Lang, type CoSpeaker,
} from "./_shared";
import {
  LinkedInIcon, XTwitterIcon, InstagramIcon, GithubIcon, BuilderCenterIcon,
  Field, TextInput, Textarea, PhotoUpload, CardSelector,
} from "./_components";

// ── Main component ────────────────────────────────────────────────────────────
/**
 * Pantalla del Call for Speakers.
 *
 * La usan dos rutas: `/speakers`, que muestra las bases, y `/speakers/postular`,
 * que muestra sólo el formulario.
 */
export function SpeakersScreen({ formOnly = false }: { formOnly?: boolean }) {
  const tf = useTranslations("Forms");
  const locale = useLocale();
  const [lang, setLang] = useState<Lang>("es");
  const t = T[lang];
  const [step, setStep] = useState(0);
  // Indicativo del teléfono; el número se guarda sin él y se une al enviar.
  const [dialCode, setDialCode] = useState(DEFAULT_COUNTRY.code);
  const [emailHint, setEmailHint] = useState("");
  const [dir, setDir] = useState(1); // 1=forward, -1=back

  // Estado del Call for Speakers: lo manda el plazo de CFP_DEADLINE y nada mas.
  // Este formulario es estatico (las preguntas estan escritas mas abajo, no
  // salen de un builder), asi que no hay nada que abrir ni cerrar a mano.
  //
  // `isActive` del hook es false hasta que corre el efecto, o sea hasta despues
  // de hidratar. Se aprovecha para dejar cfsOpen en null mientras no se sabe:
  // la pagina es prerenderizada, y si se calculara la fecha durante el render
  // quedaria horneada la respuesta del momento del build.
  //
  // El cierre de verdad lo aplica el servidor en POST /api/speakers; esto es
  // solo lo que ve el visitante.
  const { isExpired, isActive } = useCountdown(CFP_DEADLINE);
  // Antes de hidratar se calcula directo para que el servidor entregue el
  // formulario y no sólo un spinner. La fecha es fija, así que servidor y
  // cliente coinciden salvo en los segundos exactos del cierre.
  const cfsOpen = isActive
    ? !isExpired
    : Date.now() <= new Date(CFP_DEADLINE).getTime();

  // Form data
  const [form, setForm] = useState({
    // Con online apagado sólo queda presencial: va elegido de entrada para no
    // pedir un clic en la única tarjeta que se puede tocar.
    talkTitle: "", talkAbstract: "", sessionType: (CFP_ONLINE_SPEAKERS ? "" : "in-person") as string,
    preRecordingDate: "",
    audienceLevel: "" as string, language: "es", requirements: "",
    firstName: "", lastName: "", tagline: "", email: "", bio: "", photo: "",
    countryCity: "", phone: "", firstTimeSpeaker: null as boolean | null,
    social: { builderCenter: "", linkedin: "", twitter: "", instagram: "", github: "", blog: "" },
    coSpeakers: [] as CoSpeaker[], consent: false, codeOfConduct: false,
  });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const setSocial = (k: string, v: string) => setForm((f) => ({ ...f, social: { ...f.social, [k]: v } }));

  // Errores de las casillas de redes, por clave. Se comprueban al salir del
  // campo: avisar mientras se escribe una URL es ruido, porque hasta el ultimo
  // caracter esta incompleta.
  const [socialErrors, setSocialErrors] = useState<Record<string, string>>({});

  /**
   * Valida una red del co-speaker al salir del campo.
   *
   * Va contra el mismo `errors` que el resto del paso —con clave
   * `cs_<indice>_<red>`— para que un enlace roto de un co-speaker frene el
   * envio igual que cualquier otro campo obligatorio.
   */
  const checkCoSpeakerSocial = (i: number, key: "linkedin" | "twitter" | "instagram") => {
    const raw = form.coSpeakers[i]?.social[key] ?? "";
    const r = normalizeLink(raw, key);
    const k = `cs_${i}_${key}`;
    if (r.ok) {
      clearErr(k);
      if (r.value !== raw) updateCoSpeakerSocial(i, key, r.value);
    } else {
      err(k, r.reason);
    }
  };

  const checkSocial = (key: string) => {
    const raw = form.social[key as keyof typeof form.social] ?? "";
    const r = normalizeLink(raw, key);
    setSocialErrors((prev) => {
      const next = { ...prev };
      if (r.ok) {
        delete next[key];
        // Se guarda ya normalizado (https, sin barra final, sin arroba): asi
        // lo que se envia es lo mismo que se valido.
        if (r.value !== raw) setSocial(key, r.value);
      } else {
        next[key] = r.reason;
      }
      return next;
    });
  };
  const updateCoSpeaker = (i: number, patch: Partial<CoSpeaker>) =>
    setForm((f) => {
      const arr = [...f.coSpeakers];
      arr[i] = { ...arr[i], ...patch };
      return { ...f, coSpeakers: arr };
    });
  const updateCoSpeakerSocial = (i: number, k: keyof CoSpeaker["social"], v: string) =>
    setForm((f) => {
      const arr = [...f.coSpeakers];
      arr[i] = { ...arr[i], social: { ...arr[i].social, [k]: v } };
      return { ...f, coSpeakers: arr };
    });

  // Turnstile
  const captchaRef = useRef<TurnstileHandle>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaMounted, setCaptchaMounted] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const hasCaptcha = !!(siteKey && siteKey !== "xxx");
  useEffect(() => { if (hasCaptcha) setCaptchaMounted(true); }, [hasCaptcha]);

  // Compute slug from all speakers' names
  const computedSlug = useMemo(() => {
    const mainSlug = toSlug(`${form.firstName} ${form.lastName}`);
    if (!mainSlug) return "";
    const coSlugs = form.coSpeakers
      .filter((cs) => cs.firstName || cs.lastName)
      .map((cs) => toSlug(`${cs.firstName} ${cs.lastName}`))
      .filter(Boolean);
    const all = [mainSlug, ...coSlugs];
    if (all.length === 1) return all[0];
    const last = all[all.length - 1];
    return all.slice(0, -1).join("-") + "-y-" + last;
  }, [form.firstName, form.lastName, form.coSpeakers]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const err = (k: string, msg: string) => setErrors((e) => ({ ...e, [k]: msg }));
  const clearErr = (k: string) => setErrors((e) => { const n = { ...e }; delete n[k]; return n; });

  const validate = (s: number): boolean => {
    const errs: Record<string, string> = {};

    // Las redes se revisan en cualquier paso donde haya alguna escrita: son
    // opcionales, pero si hay algo puesto tiene que ser un enlace utilizable.
    const socialProblems: Record<string, string> = {};
    for (const [k, v] of Object.entries(form.social)) {
      if (!v) continue;
      const r = normalizeLink(v, k);
      if (!r.ok) socialProblems[k] = r.reason;
    }

    // Las de los co-speakers van al mismo saco de errores del paso.
    form.coSpeakers.forEach((cs, i) => {
      (["linkedin", "twitter", "instagram"] as const).forEach((k) => {
        const v = cs.social[k];
        if (!v) return;
        const r = normalizeLink(v, k);
        if (!r.ok) errs[`cs_${i}_${k}`] = r.reason;
      });
    });
    if (Object.keys(socialProblems).length > 0) {
      setSocialErrors(socialProblems);
      if (s === 1) return false;
    }
    if (s === 0) {
      if (!cleanWhitespace(form.talkTitle))    errs.talkTitle    = t.req;
      if (!cleanWhitespace(form.talkAbstract)) errs.talkAbstract = t.req;
      if (!form.sessionType)                  errs.sessionType  = t.req;
      if (form.sessionType === "online" && !cleanWhitespace(form.preRecordingDate)) errs.preRecordingDate = t.req;
      if (!form.audienceLevel)                errs.audienceLevel = t.req;
    }
    if (s === 1) {
      if (!cleanWhitespace(form.firstName))     errs.firstName = t.req;
      if (!cleanWhitespace(form.lastName))      errs.lastName  = t.req;
      if (!cleanWhitespace(form.tagline))       errs.tagline   = t.req;
      if (!cleanWhitespace(form.email)) {
        errs.email = t.req;
      } else {
        const check = normalizeEmail(form.email);
        if (!check.ok) errs.email = check.reason ?? t.inv_email;
      }
      if (!cleanWhitespace(form.bio))           errs.bio       = t.req;
      if (!form.photo)                          errs.photo     = t.req;
      if (!cleanWhitespace(form.countryCity))   errs.countryCity = t.req;
      if (!cleanWhitespace(form.phone)) {
        errs.phone = t.req;
      } else {
        const check = normalizePhone(form.phone, findCountry(dialCode));
        if (!check.ok) errs.phone = check.reason;
      }
      if (form.firstTimeSpeaker === null) errs.firstTimeSpeaker = t.req;
    }
    if (s === 2) {
      if (!form.codeOfConduct) errs.codeOfConduct = t.req;
      if (!form.consent)       errs.consent       = t.req;
      form.coSpeakers.forEach((cs, i) => {
        if (!cleanWhitespace(cs.firstName)) errs[`cs_${i}_firstName`] = t.req;
        if (!cleanWhitespace(cs.lastName))  errs[`cs_${i}_lastName`]  = t.req;
        if (!cleanWhitespace(cs.email)) {
          errs[`cs_${i}_email`] = t.req;
        } else {
          const check = normalizeEmail(cs.email);
          if (!check.ok) errs[`cs_${i}_email`] = check.reason ?? t.inv_email;
        }
        if (!cs.photo)            errs[`cs_${i}_photo`]    = t.req;
      });
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /**
   * Lleva la vista al inicio del formulario al cambiar de paso o al haber errores.
   */
  const scrollToForm = () => {
    const el = document.getElementById("postular") || document.querySelector("main");
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const goNext = () => {
    if (!validate(step)) {
      scrollToForm();
      return;
    }
    setDir(1);
    setStep((s) => s + 1);
    scrollToForm();
  };
  const goBack = () => {
    setDir(-1);
    setStep((s) => s - 1);
    scrollToForm();
  };

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ slug: string } | null>(null);

  const previewCard = (
    <SpeakerPreview
      firstName={form.firstName}
      lastName={form.lastName}
      tagline={form.tagline}
      talkTitle={form.talkTitle}
      photo={form.photo}
      level={form.audienceLevel}
      sessionType={form.sessionType}
      language={form.language}
    />
  );

  const summaryRows: SummaryRow[] = [
    { label: "charla", value: form.talkTitle },
    { label: "modalidad", value: form.sessionType === "online" ? "Online" : "Presencial" },
    { label: "nivel", value: form.audienceLevel },
    { label: "idioma", value: form.language === "en" ? "English" : "Español" },
    { label: "nombre", value: `${form.firstName} ${form.lastName}`.trim() },
    { label: "cargo", value: form.tagline },
    { label: "correo", value: form.email },
    { label: "teléfono", value: `${findCountry(dialCode).dial} ${form.phone}`.trim() },
    { label: "ciudad", value: form.countryCity },
    { label: "co-speakers", value: String(form.coSpeakers.length) },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      goNext();
      return;
    }
    const ok0 = validate(0);
    if (!ok0) {
      setDir(-1);
      setStep(0);
      scrollToForm();
      return;
    }
    const ok1 = validate(1);
    if (!ok1) {
      setDir(-1);
      setStep(1);
      scrollToForm();
      return;
    }
    const ok2 = validate(2);
    if (!ok2) {
      scrollToForm();
      return;
    }
    if (hasCaptcha && !captchaToken) {
      err("submit", t.captcha_required);
      return;
    }
    // Se manda de una; el repaso queda en la pantalla de gracias.
    void send();
  };

  const send = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/speakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName, lastName: form.lastName,
          email: normalizeEmail(form.email).value, tagline: form.tagline, bio: form.bio,
          photo: form.photo, talkTitle: form.talkTitle, talkAbstract: form.talkAbstract,
          sessionType: form.sessionType, audienceLevel: form.audienceLevel,
          preRecordingDate: form.sessionType === "online" ? form.preRecordingDate : undefined,
          language: form.language, requirements: form.requirements,
          countryCity: form.countryCity,
          // Se manda con indicativo y sin separadores.
          phone: normalizePhone(form.phone, findCountry(dialCode)).value,
          firstTimeSpeaker: form.firstTimeSpeaker,
          social: form.social,
          coSpeakers: form.coSpeakers,
          captchaToken: captchaToken ?? "",
        }),
      });
      const data = await res.json() as { id?: string; slug?: string; error?: string };
      if (!res.ok) {
        err("submit", data.error ?? "Error al enviar");
        captchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }
      setSubmitted({ slug: data.slug ?? "" });
    } catch {
      err("submit", "Error de conexión");
      captchaRef.current?.reset();
      setCaptchaToken(null);
    }
    finally { setSubmitting(false); }
  };

  // ── Variants ────────────────────────────────────────────────────────────────
  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  // ── Session type options ─────────────────────────────────────────────────────
  // Online se muestra pero no se puede elegir mientras CFP_ONLINE_SPEAKERS
  // esté apagado: se ve que la modalidad existe y que por ahora no va.
  const sessionTypeOpts = [
    { value: "online",    label: t.type_online,    desc: CFP_ONLINE_SPEAKERS ? t.type_online_desc : t.type_online_off,    icon: <Wifi className="h-5 w-5" />, disabled: !CFP_ONLINE_SPEAKERS },
    { value: "in-person", label: t.type_inperson,  desc: t.type_inperson_desc,  icon: <MapPin className="h-5 w-5" /> },
  ];

  const audienceLevelOpts = [
    { value: "100", label: t.level_100, desc: t.level_100_desc, icon: <GraduationCap className="h-5 w-5" /> },
    { value: "200", label: t.level_200, desc: t.level_200_desc, icon: <BookOpen className="h-5 w-5" /> },
    { value: "300", label: t.level_300, desc: t.level_300_desc, icon: <Layers className="h-5 w-5" /> },
    { value: "400", label: t.level_400, desc: t.level_400_desc, icon: <Cpu className="h-5 w-5" /> },
  ];

  // ── Estado del Call for Speakers (controlado desde el admin) ────────────────
  if (cfsOpen === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0E0E1A]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C143BC]" />
      </main>
    );
  }
  if (cfsOpen === false) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0E0E1A] px-6 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(193,67,188,0.1),transparent)]" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-xl text-center"
        >
          <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-[#C143BC]">
            AWS Student Community Day México 2026
          </p>
          <h1 className="font-display text-4xl font-bold text-[#E6E4DA] md:text-5xl leading-tight">
            La convocatoria cerró
          </h1>
          <p className="mt-6 font-mono text-base leading-relaxed text-[#E6E4DA]/70">
            El Call for Speakers no está abierto en este momento.
            Los speakers seleccionados serán notificados directamente.
          </p>
          <p className="mt-4 font-mono text-sm leading-relaxed text-[#E6E4DA]/60">
            El evento más grande de la comunidad AWS en México se realiza el{" "}
            <strong className="text-[#E6E4DA]">4 de noviembre de 2026</strong> en la Ciudad de México.
            Entrada completamente gratuita — aún puedes ser parte.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 rounded-[4px] border-2 border-[#C143BC] bg-[#C143BC] px-8 py-3.5 font-mono text-sm font-bold text-[#0E0E1A] shadow-[0_0_20px_rgba(193,67,188,0.4)] transition-all hover:-translate-y-0.5 hover:bg-[#F2A6F0] hover:shadow-[0_0_25px_rgba(193,67,188,0.6)] active:translate-y-0"
            >
              Regístrate como participante
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/directorio"
              className="inline-flex items-center gap-2 rounded-[4px] border border-[#C143BC]/40 bg-[#C143BC]/10 px-6 py-3 font-mono text-sm font-semibold text-[#F2A6F0] transition-all hover:bg-[#C143BC] hover:text-[#0E0E1A]"
            >
              Ver speakers confirmados
            </Link>
          </div>
          <p className="mt-8 font-mono text-xs text-[#E6E4DA]/40">
            Ciudad de México · 4 de noviembre · Gratuito
          </p>
        </motion.div>
      </main>
    );
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SuccessScreen
        kind="speaker"
        name={`${form.firstName} ${form.lastName}`}
        rows={summaryRows}
        extra={
          <p className="mx-auto max-w-[52ch] font-mono text-sm leading-relaxed text-hack-ink/70">
            {t.success_desc}
          </p>
        }
      />
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────
  // ── Main form ────────────────────────────────────────────────────────────────
  if (formOnly) {
    return (
      <FormShell
        title={t.step_apply}
        lead={t.apply_lead}
        className="max-w-3xl"
        aside={
          <div className="flex items-center gap-4">
            <Link
              href={localePath(locale, "/speakers")}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#F2A6F0] underline underline-offset-4 hover:text-[#E6E4DA]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t.apply_back}
            </Link>
            <div className="inline-flex items-center rounded-[4px] border border-[#2C2550] bg-[#090812] p-0.5">
              {(["es", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={cn(
                    "rounded-[2px] px-3.5 py-1.5 font-mono text-xs font-bold transition-colors",
                    lang === l
                      ? "bg-[#C143BC] text-[#0E0E1A]"
                      : "text-[#B4B2A9] hover:text-[#E6E4DA]",
                  )}
                >
                  {l === "es" ? "ES" : "EN"}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {/* Pasos de postulación */}
        <div className="relative mb-8">
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-[#2C2550]" aria-hidden="true">
            <div
              className="h-full bg-[#C143BC] transition-[width] duration-500 shadow-[0_0_8px_#C143BC]"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>

          <ol className="relative flex items-start justify-between gap-2">
            {[t.step1, t.step2, t.step3].map((label, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <li key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 font-mono text-xs font-bold transition-all",
                      done || current
                        ? "border-[#C143BC] bg-[#C143BC] text-[#0E0E1A] shadow-[0_0_12px_rgba(193,67,188,0.5)]"
                        : "border-[#2C2550] bg-[#090812] text-[#73726C]",
                    )}
                    aria-current={current ? "step" : undefined}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "hidden text-center font-mono text-[10px] leading-tight sm:block",
                      current ? "font-bold text-[#F2A6F0]" : "text-[#73726C]",
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Recuadro del paso actual */}
        <div id="postular" className="rounded-[4px] border border-[#C143BC]/40 bg-[#120E22]/90 p-3.5 sm:p-6 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
          <div className="mb-4 flex items-center justify-between border-b border-[#2C2550] pb-2.5">
            <span className="arcade-pixel text-xs text-[#F2A6F0]">
              // 0{step + 1} · {step === 0 ? t.step1 : step === 1 ? t.step2 : t.step3}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#73726C]">
              Paso {step + 1} / 3
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex flex-col gap-5"
              >
                {/* ── Step 0: Session ── */}
                {step === 0 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="font-mono text-base font-bold text-surface-50 uppercase tracking-wide">{t.step1}</h2>
                      <p className="font-mono text-xs text-[#8E8EA0]">{t.step1_desc}</p>
                    </div>

                    <Field label={t.talkTitle} error={errors.talkTitle} required>
                      <TextInput value={form.talkTitle} hasError={!!errors.talkTitle} onChange={(v) => { set("talkTitle", v); clearErr("talkTitle"); }} placeholder={t.talkTitle_ph} maxLength={80} />
                    </Field>

                    <Field label={t.description} error={errors.talkAbstract} required>
                      <Textarea value={form.talkAbstract} hasError={!!errors.talkAbstract} onChange={(v) => { set("talkAbstract", v); clearErr("talkAbstract"); }} placeholder={t.description_ph} maxLength={1000} rows={5} />
                    </Field>

                    <Field label={t.sessionType} error={errors.sessionType} required>
                      <CardSelector
                        options={sessionTypeOpts}
                        value={form.sessionType as never}
                        hasError={!!errors.sessionType}
                        onChange={(v) => { set("sessionType", v); clearErr("sessionType"); if (v !== "online") { set("preRecordingDate", ""); clearErr("preRecordingDate"); } }}
                      />
                    </Field>

                    {form.sessionType === "online" && (
                      <Field label={t.preRecordingDate} error={errors.preRecordingDate} required>
                        <div className="relative">
                          <Calendar className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#73726C]" />
                          <TextInput
                            value={form.preRecordingDate}
                            hasError={!!errors.preRecordingDate}
                            onChange={(v) => { set("preRecordingDate", v); clearErr("preRecordingDate"); }}
                            placeholder={t.preRecordingDate_ph}
                            maxLength={100}
                            className="pl-10"
                          />
                        </div>
                      </Field>
                    )}

                    <Field label={t.audienceLevel} error={errors.audienceLevel} required>
                      <CardSelector
                        options={audienceLevelOpts}
                        value={form.audienceLevel as never}
                        hasError={!!errors.audienceLevel}
                        onChange={(v) => { set("audienceLevel", v); clearErr("audienceLevel"); }}
                      />
                    </Field>

                    <Field label={t.lang_label} required>
                      <div className="flex gap-3">
                        {([["es", t.lang_es], ["en", t.lang_en]] as const).map(([val, lbl]) => (
                          <button key={val} type="button" onClick={() => set("language", val)}
                            className={cn(
                              "flex-1 rounded-[4px] border py-3 px-2 min-h-11 flex items-center justify-center font-mono text-xs font-bold transition-all",
                              form.language === val
                                ? "border-[#C143BC] bg-[#C143BC]/15 text-[#E6E4DA] shadow-[0_0_16px_rgba(193,67,188,0.25)] ring-1 ring-[#C143BC]/40"
                                : "border-[#2C2550] bg-[#090812] text-[#B4B2A9] hover:border-[#C143BC]/60 hover:text-[#E6E4DA]",
                            )}
                          >{lbl}</button>
                        ))}
                      </div>
                    </Field>

                    <Field label={t.requirements}>
                      <Textarea value={form.requirements} onChange={(v) => set("requirements", v)} placeholder={t.requirements_ph} maxLength={300} rows={2} />
                    </Field>
                  </div>
                )}

                {/* ── Step 1: Speaker ── */}
                {step === 1 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="font-mono text-base font-bold text-surface-50 uppercase tracking-wide">{t.step2}</h2>
                      <p className="font-mono text-xs text-[#8E8EA0]">{t.step2_desc}</p>
                    </div>

                    {/* Photo upload — full width, compact horizontal layout */}
                    <Field label={t.photo} error={errors.photo} required>
                      <div className="flex items-center gap-4">
                        <PhotoUpload
                          value={form.photo}
                          hasError={!!errors.photo}
                          onChange={(v) => { set("photo", v); clearErr("photo"); }}
                          className="aspect-square h-24 w-24 shrink-0"
                        />
                        <div className="flex min-w-0 flex-col gap-1 text-[#8E8EA0]">
                          <p className="font-mono text-xs leading-relaxed">{t.photo_hint}</p>
                          <p className="font-mono text-[10px] text-[#73726C]">JPG · PNG · WEBP · máx 8 MB</p>
                        </div>
                      </div>

                      <AnimatePresence>
                        {!form.photo && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 rounded-[4px] border-l-4 border-[#C143BC] bg-[#16102A] py-3 pl-4 pr-3">
                              <p className="dot-matrix m-0 mb-2 text-sm leading-none text-[#F2A6F0]">
                                {t.photo_tips_title}
                              </p>
                              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                                {[t.photo_tip_1, t.photo_tip_2, t.photo_tip_3, t.photo_tip_4].map((tip, i) => (
                                  <li key={i} className="flex gap-2 font-mono text-[11px] leading-relaxed text-[#B4B2A9]">
                                    <span className="shrink-0 font-bold text-[#C143BC]">·</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={t.firstName} error={errors.firstName} required>
                        <TextInput value={form.firstName} hasError={!!errors.firstName} onChange={(v) => { set("firstName", v); clearErr("firstName"); }} placeholder={t.firstName_ph} maxLength={80} />
                      </Field>
                      <Field label={t.lastName} error={errors.lastName} required>
                        <TextInput value={form.lastName} hasError={!!errors.lastName} onChange={(v) => { set("lastName", v); clearErr("lastName"); }} placeholder={t.lastName_ph} maxLength={80} />
                      </Field>
                    </div>

                    <Field label={t.tagline} error={errors.tagline} required>
                      <TextInput value={form.tagline} hasError={!!errors.tagline} onChange={(v) => { set("tagline", v); clearErr("tagline"); }} placeholder={t.tagline_ph} maxLength={120} />
                    </Field>

                    <Field label={t.email} error={errors.email} required>
                      <TextInput
                        value={form.email}
                        hasError={!!errors.email}
                        onChange={(v) => {
                          set("email", v);
                          clearErr("email");
                          setEmailHint(normalizeEmail(v).suggestion ?? "");
                        }}
                        onBlur={() => set("email", cleanWhitespace(form.email))}
                        placeholder="tu@email.com"
                      />
                      {emailHint && !errors.email && (
                        <button type="button"
                          onClick={() => { set("email", emailHint); setEmailHint(""); }}
                          className="mt-1 font-mono text-xs text-[#F2A6F0] underline underline-offset-2">
                          ¿Quisiste decir {emailHint}?
                        </button>
                      )}
                    </Field>

                    <Field label={t.bio} error={errors.bio} required>
                      <Textarea value={form.bio} hasError={!!errors.bio} onChange={(v) => { set("bio", v); clearErr("bio"); }} placeholder={t.bio_ph} maxLength={700} rows={5} />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={t.countryCity} error={errors.countryCity} required>
                        <TextInput value={form.countryCity} hasError={!!errors.countryCity} onChange={(v) => { set("countryCity", v); clearErr("countryCity"); }} placeholder={t.countryCity_ph} maxLength={80} />
                      </Field>
                      <Field label="" error={undefined}>
                        <PhoneInput
                          label={t.phone}
                          required
                          countryCode={dialCode}
                          onCountryChange={setDialCode}
                          value={form.phone}
                          onChange={(local) => { set("phone", local); clearErr("phone"); }}
                          error={errors.phone}
                        />
                      </Field>
                    </div>

                    <Field label={t.firstTime} error={errors.firstTimeSpeaker} required>
                      <div className="flex gap-3">
                        {([true, false] as const).map((val) => (
                          <button key={String(val)} type="button" onClick={() => { set("firstTimeSpeaker", val); clearErr("firstTimeSpeaker"); }}
                            className={cn(
                              "flex-1 rounded-[4px] border py-3 px-2 min-h-11 flex items-center justify-center font-mono text-sm font-bold transition-all",
                              form.firstTimeSpeaker === val
                                ? "border-[#C143BC] bg-[#C143BC]/15 text-[#E6E4DA] shadow-[0_0_16px_rgba(193,67,188,0.25)] ring-1 ring-[#C143BC]/40"
                                : errors.firstTimeSpeaker && form.firstTimeSpeaker === null
                                  ? "border-[#E24B4A] bg-[#090812] text-[#B4B2A9] hover:border-[#E24B4A]"
                                  : "border-[#2C2550] bg-[#090812] text-[#B4B2A9] hover:border-[#C143BC]/60 hover:text-[#E6E4DA]",
                            )}
                          >
                            {val ? t.yes_opt : t.no_opt}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <div className="flex flex-col gap-2">
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E6E4DA]">{t.socials}</span>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {([
                          ["builderCenter", <BuilderCenterIcon key="bc" className="h-3.5 w-3.5" />, "AWS Builder Center"],
                          ["linkedin",  <LinkedInIcon  key="li" className="h-3.5 w-3.5" />, "LinkedIn"],
                          ["github",    <GithubIcon    key="gh" className="h-3.5 w-3.5" />, "GitHub"],
                          ["twitter",   <XTwitterIcon  key="tw" className="h-3.5 w-3.5" />, "X / Twitter"],
                          ["instagram", <InstagramIcon key="ig" className="h-3.5 w-3.5" />, "Instagram"],
                          ["blog",      <Globe         key="bl" className="h-3.5 w-3.5" />, "Blog / Web"],
                        ] as const).map(([key, icon, label]) => (
                          <div key={key} className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#8E8EA0]">
                              {icon}
                            </span>
                            <input
                              value={form.social[key as keyof typeof form.social]}
                              onChange={(e) => setSocial(key, e.target.value)}
                              onBlur={() => checkSocial(key)}
                              placeholder={label}
                              inputMode="url"
                              aria-label={label}
                              className={cn(
                                "w-full rounded-[4px] border border-[#2C2550] bg-[#090812] py-2.5 min-h-11 pl-10 pr-3 font-mono text-xs sm:text-sm text-[#E6E4DA] placeholder:text-[#73726C] outline-none transition-all focus:border-[#C143BC] focus:shadow-[0_0_12px_rgba(193,67,188,0.25)] focus:ring-1 focus:ring-[#C143BC]/40",
                                socialErrors[key] && "border-[#E24B4A]",
                              )}
                            />
                            {socialErrors[key] && (
                              <p className="m-0 mt-1 font-mono text-[11px] text-[#E24B4A]">
                                {socialErrors[key]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Details + Submit ── */}
                {step === 2 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="font-mono text-base font-bold text-surface-50 uppercase tracking-wide">{t.step3}</h2>
                      <p className="font-mono text-xs text-[#8E8EA0]">{t.step3_desc}</p>
                    </div>

                    {/* Slug preview */}
                    <div className="rounded-[4px] border-l-4 border-[#C143BC] bg-[#16102A] py-3 pl-4 pr-3">
                      <p className="dot-matrix m-0 mb-1.5 text-sm leading-none text-[#F2A6F0]">{t.slug_preview}</p>
                      <p className="m-0 break-all font-mono text-xs sm:text-sm text-[#B4B2A9]">
                        {SITE_HOST}/speakers/<span className="font-bold text-[#E6E4DA]">{computedSlug || "..."}</span>
                      </p>
                    </div>

                    {/* Co-speakers */}
                    <div className="flex flex-col gap-3">
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E6E4DA]">{t.coSpeakers}</span>
                      {form.coSpeakers.map((cs, i) => (
                        <div key={i} className="rounded-[4px] border border-[#C143BC]/30 bg-[#16102A]/80 p-4 shadow-[0_0_15px_rgba(193,67,188,0.06)]">
                          <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#2C2550] pb-3">
                            <span className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] border border-[#C143BC]/50 bg-[#090812] font-mono text-[11px] font-bold tabular-nums text-[#F2A6F0]">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <span className="font-mono text-xs font-bold text-[#E6E4DA]">{t.coSpeaker_label}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, coSpeakers: f.coSpeakers.filter((_, j) => j !== i) }))}
                              className="shrink-0 min-h-8 px-2.5 py-1 flex items-center justify-center rounded-[2px] border border-red-500/40 font-mono text-[10px] font-bold text-red-400 transition-colors hover:bg-red-500/20"
                            >
                              {t.coSpeaker_remove}
                            </button>
                          </div>

                          {/* Photo */}
                          <div className="mb-3">
                            <span className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-[#E6E4DA]">
                              {t.coSpeaker_photo} <span className="text-[#C143BC]">*</span>
                            </span>
                            <div className="flex items-center gap-3">
                              <PhotoUpload
                                value={cs.photo}
                                hasError={!!errors[`cs_${i}_photo`]}
                                onChange={(v) => { updateCoSpeaker(i, { photo: v }); clearErr(`cs_${i}_photo`); }}
                                className="aspect-square h-16 w-16 shrink-0"
                              />
                              <p className="font-mono text-[10px] text-[#8E8EA0] leading-relaxed">{t.photo_hint}</p>
                            </div>
                            {errors[`cs_${i}_photo`] && <p className="mt-1 font-mono text-xs text-[#E24B4A]">{errors[`cs_${i}_photo`]}</p>}
                          </div>

                          {/* Name row */}
                          <div className="mb-3 grid gap-3 sm:grid-cols-2">
                            <div className="flex flex-col gap-1">
                              <input value={cs.firstName} onChange={(e) => { updateCoSpeaker(i, { firstName: e.target.value }); clearErr(`cs_${i}_firstName`); }}
                                placeholder={t.coSpeaker_firstName_ph} maxLength={80}
                                className={cn(
                                  "w-full min-h-11 rounded-[4px] border bg-[#090812] px-3.5 py-2.5 font-mono text-xs sm:text-sm text-[#E6E4DA] placeholder:text-[#73726C] outline-none transition-all",
                                  errors[`cs_${i}_firstName`]
                                    ? "border-[#E24B4A] shadow-[0_0_10px_rgba(226,75,74,0.25)] focus:border-[#E24B4A]"
                                    : "border-[#2C2550] focus:border-[#C143BC] focus:ring-1 focus:ring-[#C143BC]/40",
                                )}
                              />
                              {errors[`cs_${i}_firstName`] && <p className="font-mono text-xs text-[#E24B4A]">{errors[`cs_${i}_firstName`]}</p>}
                            </div>
                            <div className="flex flex-col gap-1">
                              <input value={cs.lastName} onChange={(e) => { updateCoSpeaker(i, { lastName: e.target.value }); clearErr(`cs_${i}_lastName`); }}
                                placeholder={t.coSpeaker_lastName_ph} maxLength={80}
                                className={cn(
                                  "w-full min-h-11 rounded-[4px] border bg-[#090812] px-3.5 py-2.5 font-mono text-xs sm:text-sm text-[#E6E4DA] placeholder:text-[#73726C] outline-none transition-all",
                                  errors[`cs_${i}_lastName`]
                                    ? "border-[#E24B4A] shadow-[0_0_10px_rgba(226,75,74,0.25)] focus:border-[#E24B4A]"
                                    : "border-[#2C2550] focus:border-[#C143BC] focus:ring-1 focus:ring-[#C143BC]/40",
                                )}
                              />
                              {errors[`cs_${i}_lastName`] && <p className="font-mono text-xs text-[#E24B4A]">{errors[`cs_${i}_lastName`]}</p>}
                            </div>
                          </div>

                          {/* Email */}
                          <div className="mb-3 flex flex-col gap-1">
                            <input value={cs.email}
                              onChange={(e) => { updateCoSpeaker(i, { email: e.target.value }); clearErr(`cs_${i}_email`); }}
                              onBlur={(e) => updateCoSpeaker(i, { email: cleanWhitespace(e.target.value).toLowerCase() })}
                              placeholder={t.coSpeaker_email_ph}
                              type="text" inputMode="email" autoComplete="off" spellCheck={false}
                              maxLength={200}
                              className={cn(
                                "w-full min-h-11 rounded-[4px] border bg-[#090812] px-3.5 py-2.5 font-mono text-xs sm:text-sm text-[#E6E4DA] placeholder:text-[#73726C] outline-none transition-all",
                                errors[`cs_${i}_email`]
                                  ? "border-[#E24B4A] shadow-[0_0_10px_rgba(226,75,74,0.25)] focus:border-[#E24B4A]"
                                  : "border-[#2C2550] focus:border-[#C143BC] focus:ring-1 focus:ring-[#C143BC]/40",
                              )}
                            />
                            {errors[`cs_${i}_email`] && <p className="font-mono text-xs text-[#E24B4A]">{errors[`cs_${i}_email`]}</p>}
                          </div>

                          {/* Bio */}
                          <div className="mb-3 relative">
                            <textarea value={cs.bio} onChange={(e) => updateCoSpeaker(i, { bio: e.target.value })}
                              placeholder={t.coSpeaker_bio_ph} maxLength={400} rows={3}
                              className="w-full resize-none rounded-[4px] border border-[#2C2550] bg-[#090812] px-3.5 py-2.5 font-mono text-xs sm:text-sm text-[#E6E4DA] placeholder:text-[#73726C] focus:border-[#C143BC] focus:outline-none focus:ring-1 focus:ring-[#C143BC]/40 transition-all" />
                            <span className={cn("absolute right-3 bottom-2.5 font-mono text-[10px]", cs.bio.length > 360 ? "text-[#E24B4A]" : "text-[#73726C]")}>
                              {cs.bio.length}/400
                            </span>
                          </div>

                          {/* Social */}
                          <div className="flex flex-col gap-2">
                            <span className="font-mono text-xs font-semibold text-[#8E8EA0]">{t.coSpeaker_socials}</span>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                              {([
                                ["linkedin",  <LinkedInIcon  key="li" className="h-3.5 w-3.5" />, "LinkedIn"],
                                ["twitter",   <XTwitterIcon  key="tw" className="h-3.5 w-3.5" />, "X / Twitter"],
                                ["instagram", <InstagramIcon key="ig" className="h-3.5 w-3.5" />, "Instagram"],
                              ] as const).map(([key, icon, label]) => (
                                <div key={key} className="relative">
                                  <span className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-[#73726C]">
                                    {icon}
                                  </span>
                                  <input
                                    value={cs.social[key]}
                                    onChange={(e) => updateCoSpeakerSocial(i, key, e.target.value)}
                                    onBlur={() => checkCoSpeakerSocial(i, key)}
                                    placeholder={label}
                                    inputMode="url"
                                    aria-label={`${label} — ${t.coSpeaker_label} ${i + 1}`}
                                    className={cn(
                                      "w-full min-h-10 rounded-[4px] border border-[#2C2550] bg-[#090812] py-2 pl-8 pr-2.5 font-mono text-xs text-[#E6E4DA] placeholder:text-[#73726C] focus:border-[#C143BC] focus:outline-none focus:ring-1 focus:ring-[#C143BC]/40 transition-all",
                                      errors[`cs_${i}_${key}`] && "border-[#E24B4A]",
                                    )}
                                  />
                                  {errors[`cs_${i}_${key}`] && (
                                    <p className="m-0 mt-1 font-mono text-[10px] text-[#E24B4A]">
                                      {errors[`cs_${i}_${key}`]}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      {form.coSpeakers.length < 3 && (
                        <button type="button" onClick={() => setForm((f) => ({ ...f, coSpeakers: [...f.coSpeakers, emptyCoSpeaker()] }))}
                          className="flex w-full min-h-11 items-center justify-center gap-2 rounded-[4px] border-2 border-dashed border-[#2C2550] bg-[#090812] py-3.5 font-mono text-xs font-bold text-[#B4B2A9] transition-all hover:border-[#C143BC] hover:text-[#F2A6F0]">
                          {t.coSpeaker_add}
                        </button>
                      )}
                    </div>

                    {/* Legal agreements */}
                    <div className="flex flex-col gap-3">
                      {/* Code of conduct */}
                      <label className="flex cursor-pointer items-start gap-3 py-1">
                        <input
                          type="checkbox"
                          checked={form.codeOfConduct}
                          onChange={(e) => { set("codeOfConduct", e.target.checked); clearErr("codeOfConduct"); }}
                          className="mt-0.5 h-5 w-5 min-h-5 min-w-5 shrink-0 rounded-[2px] border-[#2C2550] bg-[#090812] text-[#C143BC] accent-[#C143BC] focus:ring-1 focus:ring-[#C143BC]/40"
                        />
                        <span className="font-mono text-xs text-[#B4B2A9] leading-relaxed">
                          {t.consent_conduct}{" "}
                          <Link href="/codigo-conducta" target="_blank" className="font-bold text-[#F2A6F0] hover:text-[#E6E4DA] underline underline-offset-4">{t.conduct_link}</Link>
                          . <span className="text-[#C143BC]">*</span>
                        </span>
                      </label>
                      {errors.codeOfConduct && <p className="m-0 pl-7 font-mono text-xs text-[#E24B4A]">{errors.codeOfConduct}</p>}

                      {/* Privacy */}
                      <label className="flex cursor-pointer items-start gap-3 py-1">
                        <input
                          type="checkbox"
                          checked={form.consent}
                          onChange={(e) => { set("consent", e.target.checked); clearErr("consent"); }}
                          className="mt-0.5 h-5 w-5 min-h-5 min-w-5 shrink-0 rounded-[2px] border-[#2C2550] bg-[#090812] text-[#C143BC] accent-[#C143BC] focus:ring-1 focus:ring-[#C143BC]/40"
                        />
                        <span className="font-mono text-xs text-[#B4B2A9] leading-relaxed">
                          {t.consent_privacy}{" "}
                          <Link href="/privacidad" target="_blank" className="font-bold text-[#F2A6F0] hover:text-[#E6E4DA] underline underline-offset-4">{t.privacy}</Link>
                          . <span className="text-[#C143BC]">*</span>
                        </span>
                      </label>
                      {errors.consent && <p className="m-0 pl-7 font-mono text-xs text-[#E24B4A]">{errors.consent}</p>}
                    </div>

                    {/* Turnstile */}
                    {hasCaptcha && (
                      <div className="flex items-center justify-center py-2">
                        {captchaMounted ? (
                          <Turnstile
                            ref={captchaRef}
                            siteKey={siteKey!}
                            theme="dark"
                            appearance="interaction-only"
                            onVerify={(token) => { setCaptchaToken(token); clearErr("submit"); }}
                            onExpire={() => { setCaptchaToken(null); captchaRef.current?.reset(); }}
                            onError={() => { setCaptchaToken(null); captchaRef.current?.reset(); }}
                          />
                        ) : null}
                      </div>
                    )}

                    {hasCaptcha && !captchaToken && !errors.submit && (
                      <p className="m-0 text-center font-mono text-xs text-[#73726C]">
                        {tf("captcha_checking")}
                      </p>
                    )}

                    {errors.submit && <p className="rounded-[4px] border border-[#E24B4A] bg-[#E24B4A]/10 px-4 py-3 font-mono text-sm text-[#E24B4A]">{errors.submit}</p>}

                    {/* Preview al final, lo último que se ve antes de enviar. */}
                    <div className="mt-2 border-t-2 border-dashed border-[#2C2550] pt-6">
                      <p className="dot-matrix mb-4 text-base leading-none text-[#F2A6F0]">
                        así se verá tu tarjeta en el directorio
                      </p>
                      <div className="mx-auto w-full max-w-[360px]">{previewCard}</div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Nav buttons */}
            <div className={cn("mt-6 flex items-center gap-3 border-t border-[#2C2550] pt-5", step === 0 ? "justify-end" : "justify-between")}>
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-[4px] border border-[#2C2550] bg-[#090812] px-5 py-2.5 font-mono text-sm font-semibold text-[#B4B2A9] hover:border-[#C143BC]/60 hover:text-[#E6E4DA] transition-all"
                >
                  <ChevronLeft className="h-4 w-4" /> {t.back}
                </button>
              )}
              {step < 2 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-[4px] border-2 border-[#C143BC] bg-[#C143BC] px-6 py-2.5 font-mono text-sm font-bold text-[#0E0E1A] shadow-[0_0_20px_rgba(193,67,188,0.4)] transition-all hover:-translate-y-0.5 hover:bg-[#F2A6F0] hover:shadow-[0_0_25px_rgba(193,67,188,0.6)] active:translate-y-0"
                >
                  {t.next} <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || (hasCaptcha && !captchaToken)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-[4px] border-2 border-[#C143BC] bg-[#C143BC] px-6 py-2.5 font-mono text-sm font-bold text-[#0E0E1A] shadow-[0_0_20px_rgba(193,67,188,0.4)] transition-all hover:-translate-y-0.5 hover:bg-[#F2A6F0] hover:shadow-[0_0_25px_rgba(193,67,188,0.6)] active:translate-y-0 disabled:opacity-50"
                >
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> {t.submitting}</> : t.submit}
                </button>
              )}
            </div>
          </form>
        </div>
      </FormShell>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E1A] pt-8 md:pt-0">
      <CallForSpeakers />
    </div>
  );
}
