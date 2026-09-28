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
      localStorage.removeItem("scd:draft_registro");
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
        <div className="py-10 text-center flex flex-col items-center justify-center">
          <div className="border border-[#C143BC]/60 bg-[#16102A]/80 px-10 py-6 text-center shadow-[inset_0_0_15px_rgba(193,67,188,0.15)] rounded-[4px] max-w-md w-full">
            <span className="arcade-pixel text-lg font-bold text-[#F2A6F0] block">
              {closedTitle}
            </span>
            <span className="font-mono mt-2 text-xs text-[#8E8EA0] block leading-relaxed">
              {closedLead}
            </span>
          </div>
        </div>
      )}
    </FormShell>
  );
}
