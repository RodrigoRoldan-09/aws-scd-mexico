"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion, type Variants } from "motion/react";
import { useEventConfig } from "@/components/providers/event-config-provider";
import  CoinLogo  from "@/components/effects/coin-logo";
import { MarqueeStrip } from "@/components/ui/marquee-strip";
import { HardButton } from "@/components/ui/hard-button";
import { useCountdown } from "@/hooks/use-countdown";
import { EVENT, SOCIAL } from "@/lib/constants";
import { localePath } from "@/lib/utils";

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-[6px] border border-[#2C2550] bg-[#1E1838] px-3 py-2 sm:px-4 sm:py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <span className="font-display block text-4xl font-bold leading-none text-[#E6E4DA] sm:text-5xl md:text-6xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="font-mono mt-2 text-[10px] text-surface-400 sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function HeroCountdown() {
  const t = useTranslations("Hero");
  const { days, hours, minutes, seconds, isExpired, isPostEvent, isActive } =
    useCountdown(EVENT.date);

  // Reserva la altura hasta el primer tick para que el hero no salte.
  if (!isActive) return <div className="h-[112px] md:h-[132px]" aria-hidden="true" />;

  if (isPostEvent) {
    return <p className="font-display text-2xl text-[#E6E4DA] md:text-4xl">{t("post_desc")}</p>;
  }
  if (isExpired) {
    return (
      <p className="font-display animate-flicker text-3xl text-[#C143BC] md:text-5xl">
        {t("event_day_title")}
      </p>
    );
  }

  return (
    <div className="flex items-start gap-2 sm:gap-3">
      <Digit value={days} label={t("days")} />
      <Digit value={hours} label={t("hours")} />
      <Digit value={minutes} label={t("minutes")} />
      <Digit value={seconds} label={t("seconds")} />
    </div>
  );
}

const ease = [0.22, 1, 0.36, 1] as const;

const titleWordVariants: Variants = {
  rest: {},
  hover: {
    transition: {
      staggerChildren: 0.028,
    },
  },
};

const titleLetterVariants: Variants = {
  rest: {
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
  hover: {
    y: [0, -8, 0],
    transition: {
      duration: 0.38,
      ease,
    },
  },
};

function BouncyWord({ word }: { word: string }) {
  return (
    <motion.span
      className="inline-block whitespace-nowrap"
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={titleWordVariants}
    >
      {word.split("").map((char, i) => (
        <motion.span
          key={i}
          variants={titleLetterVariants}
          className="inline-block cursor-default select-none transition-colors duration-150 hover:text-[#C143BC]"
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

export function Hero() {
  const t = useTranslations("Hero");
  const locale = useLocale();
  const { isExpired, isPostEvent } = useCountdown(EVENT.date);
  const {
    trackVirtualUrl, photosUrl, recordingsUrl, notify2027Url,
    showSpeakerCta, attendeeOpen, volunteerOpen, cfpOpen,
  } = useEventConfig();

  return (
    <section
      id="home"
      className="relative flex min-h-screen flex-col overflow-hidden bg-surface-900"
    >
      <div className="relative z-10 mx-auto grid w-full max-w-[1240px] flex-1 grid-cols-1 items-center gap-8 px-6 pb-10 pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-4">
        <div className="order-2 lg:order-1">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="font-mono text-sm tracking-widest text-[#C143BC] uppercase md:text-base"
          >
            méxico-cdmx [26]
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease }}
            className="mt-3 font-display text-[13vw] font-bold leading-[0.85] tracking-tighter text-[#E6E4DA] sm:text-[10vw] lg:text-[6.4vw] xl:text-[86px]"
          >
            <BouncyWord word="AWS" />{" "}
            <BouncyWord word="Student" />
            <br />
            <BouncyWord word="Community" />{" "}
            <BouncyWord word="Day" />
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease }}
            className="mt-3 font-display text-[28px] font-bold leading-tight text-[#D85A30] sm:text-[34px] md:text-[40px]"
          >
            IPN CDMX
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="mt-5 font-mono text-base text-surface-300 md:text-lg"
          >
            {t("event_date")} · {EVENT.city.toLowerCase()} · 8:00 am ·{" "}
            <span className="text-[#C143BC]">{t("tagline_short")}</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32, ease }}
            className="mt-8"
          >
            <HeroCountdown />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.44, ease }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            {isPostEvent ? (
              <>
                {photosUrl && (
                  <HardButton href={photosUrl} external pulse>
                    {t("cta_photos")}
                  </HardButton>
                )}
                {recordingsUrl && (
                  <HardButton href={recordingsUrl} variant="outline" external>
                    {t("cta_recordings")}
                  </HardButton>
                )}
                {SOCIAL.instagram && (
                  <HardButton href={SOCIAL.instagram} variant="outline" external>
                    {t("cta_instagram")}
                  </HardButton>
                )}
                {notify2027Url && (
                  <HardButton href={notify2027Url} variant="outline" external>
                    {t("cta_notify")}
                  </HardButton>
                )}
              </>
            ) : isExpired ? (
              <>
                <HardButton href={localePath(locale, "/directorio")} pulse>
                  {t("cta_agenda")}
                </HardButton>
                <HardButton
                  href={trackVirtualUrl || "#"}
                  variant="outline"
                  external={!!trackVirtualUrl}
                >
                  {t("cta_virtual")}
                </HardButton>
              </>
            ) : (
              // El registro se muestra siempre (apagado si está cerrado);
              // speakers y voluntarios sólo mientras su convocatoria esté
              // abierta. En la rejilla de tres cada celda mide ~166px de texto
              // como mucho, por eso las etiquetas son cortas y el relleno px-4.
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                {attendeeOpen ? (
                  <HardButton href={localePath(locale, "/registro")} variant="conversion" pulse className="px-4">
                    {t("cta_register")}
                  </HardButton>
                ) : (
                  <HardButton
                    href={localePath(locale, "/registro")}
                    disabled
                    className="px-4"
                    sub={t("cta_register_closed_sub")}
                  >
                    {t("cta_register_closed")}
                  </HardButton>
                )}

                {showSpeakerCta && cfpOpen && (
                  <HardButton href={localePath(locale, "/speakers")} variant="outline" className="px-4">
                    {t("cta_speaker")}
                  </HardButton>
                )}

                {volunteerOpen && (
                  <HardButton href={localePath(locale, "/voluntarios")} variant="outline" className="px-4">
                    {t("cta_volunteer")}
                  </HardButton>
                )}
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.15, ease }}
          className="order-1 lg:order-2"
        >
          <div className="relative mx-auto w-full max-w-[560px]">
            {/* Resplandor de fondo detrás de la moneda */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 bottom-10 top-16 rounded-full bg-[#C143BC]/15 blur-[80px]"
            />
            
            <CoinLogo />

            {/* Sombra 3D de la moneda en el suelo */}
            <motion.div 
              className="mx-auto -mt-4 mb-4 h-[12px] w-[50%] max-w-[220px] rounded-[100%] bg-[#C143BC]/40 blur-[10px] pointer-events-none"
              animate={{
                scale: [1, 0.85, 1], // Se encoge cuando la moneda sube
                opacity: [0.6, 0.3, 0.6], // Se desvanece cuando la moneda sube
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>

      <div className="relative z-20">
        <MarqueeStrip text={`${t("title")} · ${t("subtitle")}`} tone="block" duration={40} />
      </div>
    </section>
  );
}
