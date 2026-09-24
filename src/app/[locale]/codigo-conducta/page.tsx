import { setRequestLocale, getTranslations } from "next-intl/server";
import { LegalPage, P, NumberedList, Callout } from "@/components/legal/legal-page";
import { EXTERNAL_LINKS } from "@/lib/constants";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CodeOfConduct" });
  return { title: t("title") };
}

export default async function CodeOfConductPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "CodeOfConduct" });
  const tf = await getTranslations({ locale, namespace: "Forms" });

  const list = (prefix: string, n: number) =>
    Array.from({ length: n }, (_, i) => t(`${prefix}_${i + 1}`));

  return (
    <LegalPage
      title={t("title")}
      updated={t("last_updated")}
      intro={<P>{t("intro")}</P>}
      sections={[
        {
          id: "proposito",
          title: t("purpose_title"),
          body: <P>{t("purpose")}</P>,
        },
        {
          id: "esperado",
          title: t("expected_title"),
          body: <NumberedList items={list("expected", 6)} />,
        },
        {
          id: "inaceptable",
          title: t("unacceptable_title"),
          body: <NumberedList items={list("unacceptable", 11)} />,
        },
        {
          id: "reporte",
          title: t("reporting_title"),
          body: <P>{t("reporting")}</P>,
        },
        {
          id: "consecuencias",
          title: t("consequences_title"),
          body: <P>{t("consequences")}</P>,
        },
        {
          id: "alcance",
          title: t("scope_title"),
          body: (
            <>
              <P>{t("scope")}</P>
              <Callout label={tf("legal_source_label")}>
                <P>{t("aws_reference")}</P>
                <a
                  href={EXTERNAL_LINKS.awsCodeOfConduct}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm font-bold text-hack-ink underline underline-offset-4"
                >
                  {t("aws_reference_link")} &rarr;
                </a>
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
