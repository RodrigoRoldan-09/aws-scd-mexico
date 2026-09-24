import { getTranslations, setRequestLocale } from "next-intl/server";
import { connectDB } from "@/lib/db";
import { Form } from "@/models/form";
import { Setting } from "@/models/setting";
import { countryCodeOf } from "@/data/attendee-form";
import { DEFAULT_SBGS, SBG_SETTING_KEY, parseSbgList } from "@/data/volunteer-form";
import { EVENT } from "@/lib/constants";
import { VoluntariosScreen } from "./_screen";

type Props = { params: Promise<{ locale: string }> };

/**
 * Postulación de voluntarios.
 *
 * Las preguntas están escritas en `_form.tsx`; de la base sólo salen dos cosas,
 * y se leen **en el servidor**: si la convocatoria está abierta y la lista de
 * Student Builder Groups, que es lo único del formulario que se administra
 * desde el panel porque cambia con cada edición y con cada país.
 */
export default async function VoluntariosPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Forms" });

  let isOpen = false;
  let sbgSetting = "";
  try {
    await connectDB();
    const [form, setting] = await Promise.all([
      Form.findOne({ formType: "volunteer" }).select("isOpen").lean<{ isOpen?: boolean }>(),
      Setting.findOne({ key: SBG_SETTING_KEY }).select("value").lean<{ value?: string }>(),
    ]);
    isOpen = !!form?.isOpen;
    sbgSetting = setting?.value ?? "";
  } catch {
    // Si la base no responde, se muestra cerrado en prod: en desarrollo
    // se deja abierto para poder probar la interfaz visual.
    isOpen = process.env.NODE_ENV === "development";
  }

  const sbgs = parseSbgList(sbgSetting, DEFAULT_SBGS[countryCodeOf(EVENT.country)]);

  return (
    <VoluntariosScreen
      isOpen={isOpen}
      sbgs={sbgs}
      lead={t("volunteers_lead")}
      closedTitle={t("unavailable_volunteers")}
    />
  );
}
