"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { FormShell } from "@/components/forms/form-shell";
import { SuccessScreen, type SummaryRow } from "@/components/forms/success-screen";
import { VolunteerPreview } from "@/components/forms/previews";
import { availabilityLabelOf, interestAreasLabelOf, type Option } from "@/data/volunteer-form";
import { VoluntariosForm } from "./_form";

/**
 * Parte cliente del formulario de voluntarios.
 *
 * Recibe ya resueltos si la convocatoria está abierta y la lista de Student
 * Builder Groups: esas dos consultas las hace el componente de servidor, así el
 * HTML llega con el formulario dentro en vez de con un indicador de carga.
 */
export function VoluntariosScreen({
  isOpen,
  sbgs,
  lead,
  closedTitle,
}: {
  isOpen: boolean;
  sbgs: Option[];
  lead: string;
  closedTitle: string;
}) {
  const locale = useLocale() === "en" ? "en" : "es";
  const t = useTranslations("Forms");
  const [resumen, setResumen] = useState<SummaryRow[] | null>(null);
  // Lo enviado se guarda para armar la credencial de la pantalla de gracias.
  const [enviado, setEnviado] = useState<Record<string, unknown>>({});

  const handleSubmit = async (
    values: Record<string, unknown>,
    captchaToken: string,
    filas: SummaryRow[],
  ) => {
    const res = await fetch("/api/volunteers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: values, captchaToken }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    setEnviado(values);
    setResumen(filas);
  };

  // La pantalla de gracias reemplaza al formulario entero, con la micro y la
  // cinta. Sin tarjeta para compartir a propósito: postularse de staff no es
  // algo que se anuncie en redes hasta que hay respuesta.
  if (resumen) {
    return (
      <SuccessScreen
        kind="volunteer"
        rows={resumen}
        preview={
          <VolunteerPreview
            firstName={String(enviado.firstName ?? "")}
            lastName={String(enviado.lastName ?? "")}
            email={String(enviado.email ?? "")}
            area={interestAreasLabelOf(
              Array.isArray(enviado.interestAreas) ? enviado.interestAreas.map(String) : [],
              locale,
            )}
            availability={availabilityLabelOf(String(enviado.availability ?? ""), locale)}
          />
        }
        extra={
          <p className="font-mono text-sm text-hack-ink/70">
            {t("success_volunteer_meanwhile")}{" "}
            <Link href="/" className="font-bold underline underline-offset-4">
              {t("success_back")}
            </Link>
          </p>
        }
      />
    );
  }

  return (
    <FormShell title="Voluntarios" lead={lead} className="max-w-3xl">
      {isOpen ? (
        <VoluntariosForm sbgs={sbgs} onSubmit={handleSubmit} />
      ) : (
        <div className="py-12 text-center">
          <p className="font-mono text-sm text-hack-ink/70">{closedTitle}</p>
        </div>
      )}
    </FormShell>
  );
}
