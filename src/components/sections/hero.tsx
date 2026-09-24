"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "motion/react";
import { useEventConfig } from "@/components/providers/event-config-provider";
import { WireGlobe } from "@/components/effects/wire-globe";
import { MarqueeStrip } from "@/components/ui/marquee-strip";
import { HardButton } from "@/components/ui/hard-button";
import { useCountdown } from "@/hooks/use-countdown";
import { EVENT, SOCIAL } from "@/lib/constants";
import { localePath } from "@/lib/utils";

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="border-2 border-hack-block/40 bg-surface-800 px-3 py-2 sm:px-4 sm:py-2.5">
        <span className="dot-matrix block text-4xl leading-none text-hack-block sm:text-5xl md:text-6xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="dot-matrix mt-2 text-[10px] text-surface-400 sm:text-xs">
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
    return <p className="dot-matrix text-2xl text-hack-block md:text-4xl">{t("post_desc")}</p>;
  }
  if (isExpired) {
    return (
      <p className="dot-matrix animate-flicker text-3xl text-hack-block md:text-5xl">
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
            className="dot-matrix text-3xl leading-none text-hack-block md:text-4xl"
          >
            méxico [26]
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease }}
            className="mt-4 font-display text-[13vw] font-medium lowercase leading-[0.85] tracking-tighter text-surface-50 sm:text-[10vw] lg:text-[6.4vw] xl:text-[86px]"
          >
            aws student
            <br />
            community day
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="mt-5 font-mono text-base text-surface-300 md:text-lg"
          >
            {t("event_date")} · {EVENT.city.toLowerCase()} · 8:00 am ·{" "}
            <span className="text-hack-block">{t("tagline_short")}</span>
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
                  <HardButton href={localePath(locale, "/registro")} pulse className="px-4">
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
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 bottom-10 top-16 rounded-full bg-hack-block/10 blur-3xl"
            />
            <WireGlobe
              marker={{ lat: 19.43, lon: -99.13 }}
              label="CDMX"
              className="relative aspect-square w-full min-h-[320px]"
            />
            <p className="dot-matrix mt-1 text-center text-[11px] text-surface-500 sm:text-xs">
              19°26′n 99°08′o · arrástralo
            </p>
          </div>
        </motion.div>
      </div>

      <div className="relative z-20">
        <MarqueeStrip text={`${t("title")} · ${t("subtitle")}`} tone="block" duration={40} />
      </div>
    </section>
  );
}
