"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, MapPin, Users, Lock } from "lucide-react";
import { FormShell } from "@/components/forms/form-shell";
import type { SummaryRow } from "@/components/forms/success-screen";
import type {
  PublicActivityDTO,
  RegisterActivityPayload,
  RegisterActivityResponse,
} from "@/types/activities";
import { apiErrorMessage } from "@/lib/activities-dto";
import { cn } from "@/lib/utils";
import { activitiesCopyFor } from "../_copy";
import { ActivityRegistrationForm } from "./_form";

export function ActivityRegistrationScreen({
  activity,
  locale,
}: {
  activity: PublicActivityDTO;
  locale: string;
}) {
  const router = useRouter();
  const isEn = locale === "en";
  const t = activitiesCopyFor(locale);

  const title = isEn ? activity.titleEn || activity.title : activity.title;
  const desc = isEn ? activity.descriptionEn || activity.description : activity.description;
  const catalogHref = isEn ? "/en/actividades" : "/actividades";

  const typeLabel =
    activity.type === "workshop"
      ? t.type_workshop
      : activity.type === "hackathon"
        ? t.type_hackathon
        : t.type_activity;

  const pct = Math.min(100, Math.round((activity.registeredCount / activity.maxCapacity) * 100));

  const handleSubmit = async (payload: RegisterActivityPayload, summaryRows: SummaryRow[]) => {
    const res = await fetch(`/api/activities/${activity.slug}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(apiErrorMessage(data, "No se pudo completar el registro."));
    }

    const okData = data as RegisterActivityResponse;

    try {
      const fullName = `${okData.registration.firstName} ${okData.registration.lastName}`.trim();
      sessionStorage.setItem("scd:nombre", fullName);
      sessionStorage.setItem("scd:correo", okData.registration.email);
      sessionStorage.setItem("scd:entidad", title);
      sessionStorage.setItem(
        "scd:resumen",
        JSON.stringify([
          { label: t.r_qr, value: okData.registration.qrCode },
          ...summaryRows,
        ]),
      );
    } catch {
      // Ignorar fallos de sessionStorage
    }

    router.push(
      isEn
        ? `/en/actividades/${activity.slug}/gracias`
        : `/actividades/${activity.slug}/gracias`,
    );
  };

  return (
    <FormShell
      title={typeLabel}
      lead={title}
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
      {/* Resumen de la Actividad y Barra de Cupo */}
      <div className="mb-6 rounded-[4px] border border-[#C143BC]/50 bg-[#120E22]/95 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <span className="rounded-[2px] border border-[#C143BC] bg-[#9A3097]/30 px-2.5 py-0.5 arcade-pixel text-[11px] font-bold uppercase text-[#F2A6F0]">
            {typeLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#F2A6F0]">
            <Clock className="h-3.5 w-3.5 text-[#C143BC]" />
            {activity.startTime} – {activity.endTime}
          </span>
        </div>

        <h2 className="m-0 font-mono text-base sm:text-lg font-bold text-[#E6E4DA]">{title}</h2>
        <p className="mt-1.5 mb-4 font-mono text-xs leading-relaxed text-[#B4B2A9]">{desc}</p>

        <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[#B4B2A9] mb-4">
          {activity.roomName && (
            <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2C2550] bg-[#090812] px-2.5 py-1">
              <MapPin className="h-3 w-3 text-[#C143BC]" />
              {activity.roomName}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2C2550] bg-[#090812] px-2.5 py-1">
            <Users className="h-3 w-3 text-[#C143BC]" />
            {activity.formConfig.participationMode === "individual"
              ? t.solo_badge
              : t.team_badge(activity.formConfig.maxTeamSize)}
          </span>
        </div>

        {/* Nota explicativa de regla */}
        <div className="mb-4 rounded-[3px] border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-[11px] font-mono leading-relaxed text-emerald-200">
          {t.rules_banner_direct_desc}
        </div>

        <div className="border-t border-[#2C2550] pt-3">
          <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
            <span
              className={cn(
                "font-bold",
                activity.isSoldOut ? "text-[#E24B4A]" : "text-[#F2A6F0]",
              )}
            >
              {activity.isSoldOut
                ? t.sold_out
                : t.spots_available(activity.spotsLeft, activity.maxCapacity)}
            </span>
            <span className="text-[11px] text-[#73726C]">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#090812] border border-[#2C2550]">
            <div
              className={cn(
                "h-full transition-all duration-500",
                activity.isSoldOut ? "bg-[#E24B4A]" : "bg-[#C143BC]",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Formulario o Estado Agotado */}
      {activity.isSoldOut ? (
        <div className="py-10 text-center flex flex-col items-center justify-center gap-4">
          <div className="border border-[#E24B4A]/60 bg-[#16102A]/80 px-8 py-6 text-center rounded-[4px] max-w-md w-full">
            <Lock className="mx-auto mb-2 h-6 w-6 text-[#E24B4A]" />
            <span className="arcade-pixel text-base font-bold text-[#E24B4A] block">
              {activity.isOpen ? t.sold_out : t.closed}
            </span>
            <span className="font-mono mt-2 text-xs text-[#B4B2A9] block leading-relaxed">
              {t.cta_sold_out}
            </span>
          </div>
          <Link
            href={catalogHref}
            className="font-mono text-xs font-bold text-[#F2A6F0] underline underline-offset-4"
          >
            {t.cta_back_catalog}
          </Link>
        </div>
      ) : (
        <ActivityRegistrationForm
          activity={activity}
          onSubmit={handleSubmit}
        />
      )}
    </FormShell>
  );
}
