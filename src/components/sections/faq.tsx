"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { DotHeading } from "@/components/ui/dot-heading";
import { WireSolid } from "@/components/effects/wire-solid";
import { Accordion } from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { faqItems } from "@/data/faq";
import type { FaqDTO } from "@/lib/data/faq";

export function FAQView({ faqs }: { faqs: FaqDTO[] }) {
  const t = useTranslations("FAQ");
  const locale = useLocale();

  // Si hay FAQs en la DB se usan; si no, cae al contenido estático traducido.
  const items =
    faqs.length > 0
      ? faqs.map((faq) => ({
          id: faq._id,
          question: locale === "en" ? faq.questionEn : faq.questionEs,
          answer: locale === "en" ? faq.answerEn : faq.answerEs,
          buttons: (faq.buttons || []).map((btn) => ({
            label: locale === "en" ? btn.labelEn : btn.labelEs,
            url: btn.url,
          })),
        }))
      : faqItems.map((item) => ({
          id: item.id,
          question: t(item.questionKey),
          answer: t(item.answerKey),
        }));

  return (
    <section id="faq" className="relative overflow-hidden border-y-2 border-hack-block/25 bg-surface-800 px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        {/* Columna izquierda: se queda fija mientras el acordeón corre al lado */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <ScrollReveal from="left" distance={60}>
            <DotHeading variant="inverted">{t("heading")}</DotHeading>
          </ScrollReveal>
          <ScrollReveal delay={0.12}>
            <p className="mt-6 max-w-[30ch] font-mono text-sm leading-relaxed text-surface-400">
              {t("lead")}
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.18} from="scale">
            <WireSolid shape="icosa" className="mt-6 hidden h-[240px] w-full lg:block" />
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.1} from="right" distance={60}>
          <Accordion items={items} />
        </ScrollReveal>
      </div>
    </section>
  );
}
