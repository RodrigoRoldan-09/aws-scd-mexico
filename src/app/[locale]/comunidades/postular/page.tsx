import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ComunidadesScreen } from "../_screen";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn
      ? "Apply as a Partner Community | AWS Student Community Day Mexico 2026"
      : "Registro de comunidades aliadas | AWS Student Community Day México 2026",
    description: isEn
      ? "Apply as a partner tech community for AWS Student Community Day Mexico 2026."
      : "Postula a tu comunidad tecnológica como aliada del AWS Student Community Day México 2026.",
  };
}

/** Sólo el formulario, sin la convocatoria arriba. */
export default async function PostularComunidadPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ComunidadesScreen />;
}
