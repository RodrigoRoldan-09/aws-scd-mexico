"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";
import { EVENT } from "@/lib/constants";

export function Countdown() {
  const t = useTranslations("Hero");
  const { days, hours, minutes, seconds, isExpired, isPostEvent } = useCountdown(EVENT.date);

  if (!EVENT.dateConfirmed) {
    return (
      <div className="inline-flex items-center gap-2 font-mono text-lg text-[#B4B2A9] md:text-xl">
        <span className="text-[#73726C]">{"// "}</span>
        <span className="animate-glow-pulse text-[#C143BC]">{t("coming_soon")}</span>
      </div>
    );
  }

  // Post-event (day after)
  if (isPostEvent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-1.5 text-center"
      >
        <p className="font-mono text-base font-semibold text-[#E6E4DA]">
          {t("post_desc")}
        </p>
        <p className="inline-flex items-center gap-1.5 font-mono text-sm text-[#73726C]">
          {t("post_sub")} <Sparkles className="h-4 w-4 text-[#C143BC]" />
        </p>
      </motion.div>
    );
  }

  // Event has started
  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-2 text-center"
      >
        <p className="font-display text-4xl font-bold text-[#C143BC] md:text-5xl [filter:drop-shadow(0_0_24px_rgba(193,67,188,0.55))]">
          {t("event_day_title")}
        </p>
        <p className="font-mono text-base text-[#E6E4DA]">
          {t("event_day_desc")}
        </p>
      </motion.div>
    );
  }

  const blocks = [
    { value: days,    label: t("days") },
    { value: hours,   label: t("hours") },
    { value: minutes, label: t("minutes") },
    { value: seconds, label: t("seconds") },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3">
        {blocks.map((b) => (
          <div key={b.label} className="flex flex-col items-center">
            <div className="min-w-[64px] rounded-[12px] border border-[#C143BC]/30 bg-[#1E1838] px-4 py-3 shadow-[0_0_18px_rgba(193,67,188,0.15)]">
              <span className="font-display text-3xl font-bold text-[#E6E4DA] tabular-nums md:text-4xl">
                {String(b.value).padStart(2, "0")}
              </span>
            </div>
            <span className="mt-1.5 font-mono text-xs uppercase tracking-wider text-[#B4B2A9]">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
