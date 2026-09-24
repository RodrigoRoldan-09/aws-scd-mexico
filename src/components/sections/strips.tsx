import { getTranslations } from "next-intl/server";
import { MarqueeStrip } from "@/components/ui/marquee-strip";

/**
 * Cintas que separan las secciones del landing. Cada una toma su texto de
 * i18n y su tono del bloque contra el que va, para que la alternancia
 * bloque ↔ tinta se lea como un ritmo y no como un parche.
 */
export async function Strip({
  k,
  ...props
}: {
  k: "event" | "date" | "cfp" | "hybrid";
} & Omit<React.ComponentProps<typeof MarqueeStrip>, "text">) {
  const t = await getTranslations("Strip");
  return <MarqueeStrip text={t(k)} {...props} />;
}
