"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { SuccessScreen, type SummaryRow } from "@/components/forms/success-screen";
import { activitiesCopyFor } from "../../_copy";

const subscribe = () => () => {};

function read(key: string) {
  try {
    return sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

const readName = () => read("scd:nombre");
const readSummary = () => read("scd:resumen");

export default function RegistroActividadesGraciasPage() {
  const t = useTranslations("Forms");
  const locale = useLocale();
  const isEn = locale === "en";
  const copy = activitiesCopyFor(locale);

  const name = useSyncExternalStore(subscribe, readName, () => "");
  const crudo = useSyncExternalStore(subscribe, readSummary, () => "");

  let rows: SummaryRow[] | undefined;
  try {
    const parsed = crudo ? (JSON.parse(crudo) as SummaryRow[]) : null;
    rows = Array.isArray(parsed) && parsed.length ? parsed : undefined;
  } catch {
    rows = undefined;
  }

  return (
    <SuccessScreen
      kind="attendee"
      attendance="in-person"
      name={name}
      rows={rows}
      tone="soft"
      copyOverride={{
        kicker: copy.thanks_ua_kicker,
        heading: copy.thanks_ua_heading,
        lead: copy.thanks_ua_lead,
      }}
      extra={
        <div className="flex flex-col items-center gap-2 font-mono text-sm text-hack-ink/75">
          <div className="flex flex-wrap justify-center gap-4 mt-1">
            <Link
              href={isEn ? "/en/actividades" : "/actividades"}
              className="font-bold underline underline-offset-4"
            >
              {isEn ? "← Explore more activities" : "← Ver más actividades"}
            </Link>
            <Link href={isEn ? "/en" : "/"} className="font-bold underline underline-offset-4">
              {t("success_back")}
            </Link>
          </div>
        </div>
      }
    />
  );
}
