"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { FormShell } from "@/components/forms/form-shell";
import type { SummaryRow } from "@/components/forms/success-screen";
import type {
  ApplyActivitiesPayload,
  ApplyActivitiesResponse,
  PublicActivityDTO,
  UnifiedActivityFormConfig,
} from "@/types/activities";
import { apiErrorMessage } from "@/lib/activities-dto";
import { activitiesCopyFor } from "../_copy";
import { UnifiedActivitiesForm } from "./_form";

export function UnifiedActivitiesScreen({
  config,
  activities,
  locale,
  preferSlug,
}: {
  config: UnifiedActivityFormConfig;
  activities: PublicActivityDTO[];
  locale: string;
  preferSlug: string;
}) {
  const router = useRouter();
  const isEn = locale === "en";
  const t = activitiesCopyFor(locale);
  const catalogHref = isEn ? "/en/actividades?type=activity" : "/actividades?type=activity";

  const openActivities = activities.filter((a) => a.isOpen);

  const handleSubmit = async (payload: ApplyActivitiesPayload, summaryRows: SummaryRow[]) => {
    const res = await fetch("/api/activities/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(apiErrorMessage(data, "No se pudo enviar la solicitud."));
    }

    const { application } = data as ApplyActivitiesResponse;

    try {
      sessionStorage.setItem("scd:nombre", `${application.firstName} ${application.lastName}`.trim());
      sessionStorage.setItem("scd:correo", application.email);
      sessionStorage.setItem("scd:entidad", t.ua_title);
      sessionStorage.setItem(
        "scd:resumen",
        JSON.stringify([
          { label: t.r_qr, value: application.qrCode },
          ...summaryRows,
          { label: t.ua_r_status, value: t.ua_status_pending },
        ]),
      );
    } catch {
      // Ignorar fallos de sessionStorage
    }

    router.push(
      isEn
        ? "/en/actividades/registro-actividades/gracias"
        : "/actividades/registro-actividades/gracias",
    );
  };

  const blocked =
    !config.isOpen
      ? { title: t.ua_closed_title, desc: t.ua_closed_desc }
      : openActivities.length === 0
        ? { title: t.ua_none_title, desc: t.ua_none_desc }
        : null;

  return (
    <FormShell
      title={t.ua_title}
      lead={t.ua_lead}
      className="max-w-3xl"
      aside={
        <Link
          href={catalogHref}
          className="rounded-[4px] border border-[#2C2550] bg-[#120E22] px-3.5 py-2 font-mono text-xs text-[#F2A6F0] hover:border-[#C143BC] transition-all"
        >
          {t.cta_back_catalog}
        </Link>
      }
    >
      {blocked ? (
        <div className="py-10 text-center flex flex-col items-center justify-center gap-4">
          <div className="border border-[#E24B4A]/60 bg-[#16102A]/80 px-8 py-6 text-center rounded-[4px] max-w-md w-full">
            <Lock className="mx-auto mb-2 h-6 w-6 text-[#E24B4A]" />
            <span className="arcade-pixel text-base font-bold text-[#E24B4A] block">{blocked.title}</span>
            <span className="font-mono mt-2 text-xs text-[#B4B2A9] block leading-relaxed">{blocked.desc}</span>
          </div>
          <Link
            href={catalogHref}
            className="font-mono text-xs font-bold text-[#F2A6F0] underline underline-offset-4"
          >
            {t.cta_back_catalog}
          </Link>
        </div>
      ) : (
        <UnifiedActivitiesForm
          config={config}
          activities={openActivities}
          preferSlug={preferSlug}
          onSubmit={handleSubmit}
        />
      )}
    </FormShell>
  );
}
