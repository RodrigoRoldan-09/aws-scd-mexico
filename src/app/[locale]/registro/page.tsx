import { getTranslations, setRequestLocale } from "next-intl/server";
import { connectDB } from "@/lib/db";
import { Form } from "@/models/form";
import { RegistroScreen } from "./_screen";

type Props = { params: Promise<{ locale: string }> };

/**
 * Registro de asistentes. Las preguntas están en `_form.tsx`; lo único que se
 * consulta, en el servidor, es si la recepción está abierta.
 */
export default async function RegistroPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Forms" });

  let isOpen = false;
  // Si la convocatoria de voluntarios está abierta, el formulario ofrece esa
  // puerta a quien va presencial. Se consulta acá y no en el navegador para no
  // pintar un aviso que apunta a un formulario cerrado.
  let volunteersOpen = false;
  try {
    await connectDB();
    const [form, volunteerForm] = await Promise.all([
      Form.findOne({ formType: "attendee" }).select("isOpen").lean<{ isOpen?: boolean }>(),
      Form.findOne({ formType: "volunteer" }).select("isOpen").lean<{ isOpen?: boolean }>(),
    ]);
    isOpen = false;
    volunteersOpen = volunteerForm ? !!volunteerForm.isOpen : (process.env.NODE_ENV === "development");
  } catch {
    isOpen = false;
    volunteersOpen = false;
  }

  return (
    <RegistroScreen
      isOpen={isOpen}
      volunteersOpen={volunteersOpen}
      locale={locale}
      lead={t("registration_lead")}
      closedTitle={t("unavailable_registration")}
      closedLead={t("unavailable_follow")}
    />
  );
}
