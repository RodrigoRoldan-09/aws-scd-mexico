"use client";

import { useRouter } from "next/navigation";
import { FormShell } from "@/components/forms/form-shell";
import type { SummaryRow } from "@/components/forms/success-screen";
import { RegistroForm, type Responses } from "./_form";

/**
 * Parte cliente del registro.
 *
 * Recibe ya resuelto si la recepción está abierta: esa consulta la hace el
 * componente de servidor, así el HTML llega con el formulario dentro en vez de
 * con un indicador de carga. La tarjeta se muestra al enviar, no al lado.
 */
export function RegistroScreen({
  isOpen,
  volunteersOpen,
  locale,
  lead,
  closedTitle,
  closedLead,
}: {
  isOpen: boolean;
  /** Si la convocatoria de voluntarios acepta postulaciones ahora mismo. */
  volunteersOpen: boolean;
  locale: string;
  lead: string;
  closedTitle: string;
  closedLead: string;
}) {
  const router = useRouter();

  const handleSubmit = async (values: Responses, captchaToken: string, resumen: SummaryRow[]) => {
    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: values, captchaToken }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }

    // El nombre y la modalidad viajan a la pantalla de gracias por
    // sessionStorage y no por la URL: la tarjeta que se descarga lleva el
    // nombre impreso, pero no hace falta que quede en el historial ni que se
    // pueda compartir un enlace con el nombre de otra persona.
    //
    // La modalidad va porque el mensaje de esa pantalla cambia entero: a quien
    // se conecta no se le manda código QR, así que prometérselo ahí sería
    // mentirle.
    try {
      const nombre = [values.firstName, values.lastName].filter(Boolean).join(" ");
      if (nombre) sessionStorage.setItem("scd:nombre", nombre);
      sessionStorage.setItem("scd:modalidad", values.attendance ?? "");
      // El repaso de lo enviado se muestra en /gracias, al final de todo.
      sessionStorage.setItem("scd:resumen", JSON.stringify(resumen));
      // El correo siembra la carita del pasaporte y la entidad va impresa en él.
      sessionStorage.setItem("scd:correo", values.email ?? "");
      sessionStorage.setItem("scd:entidad", values.entityName ?? "");
    } catch {
      // Modo privado o almacenamiento bloqueado: la tarjeta sale sin nombre.
    }

    router.push(locale === "en" ? "/en/registro/gracias" : "/registro/gracias");
  };

  return (
    <FormShell title="Registro" lead={lead} className="max-w-3xl">
      {isOpen ? (
        <RegistroForm onSubmit={handleSubmit} volunteersOpen={volunteersOpen} />
      ) : (
        <div className="py-12 text-center">
          <p className="font-mono text-sm text-hack-ink/70">{closedTitle}</p>
          <p className="mt-2 font-mono text-xs text-hack-ink/50">{closedLead}</p>
        </div>
      )}
    </FormShell>
  );
}
