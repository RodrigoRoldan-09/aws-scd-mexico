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
      <div className="inline-flex items-center gap-2 font-mono text-lg md:text-xl text-surface-300">
        <span className="text-surface-400">{"// "}</span>
        <span className="animate-glow-pulse text-aws-orange">{t("coming_soon")}</span>
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
        <p className="font-mono text-base font-semibold text-surface-50">
          {t("post_desc")}
        </p>
        <p className="inline-flex items-center gap-1.5 font-mono text-sm text-surface-400">
          {t("post_sub")} <Sparkles className="h-4 w-4 text-aws-orange" />
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
        <p className="font-mono text-4xl font-bold text-aws-orange md:text-5xl [filter:drop-shadow(0_0_24px_rgba(242,166,240,0.55))]">
          {t("event_day_title")}
        </p>
        <p className="font-mono text-base text-surface-50">
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
            <div className="bg-surface-800 border border-aws-orange/30 rounded-xl px-4 py-3 min-w-[64px] shadow-[0_0_18px_rgba(242,166,240,0.12)]">
              <span className="font-mono text-3xl md:text-4xl font-bold text-aws-orange tabular-nums">
                {String(b.value).padStart(2, "0")}
              </span>
            </div>
            <span className="mt-1.5 font-mono text-xs text-surface-400 uppercase tracking-wider">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
