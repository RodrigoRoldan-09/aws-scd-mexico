import { setRequestLocale, getTranslations } from "next-intl/server";
import { ObfuscatedEmail } from "@/components/ui/obfuscated-email";
import { LegalPage, P, NumberedList, Callout } from "@/components/legal/legal-page";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPolicy" });
  return { title: t("title") };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "PrivacyPolicy" });
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
          id: "responsable",
          title: t("controller_title"),
          body: <P>{t("controller")}</P>,
        },
        {
          id: "datos",
          title: t("data_collected_title"),
          body: (
            <>
              <P>{t("data_collected_intro")}</P>
              <NumberedList items={list("data_collected", 7)} />
            </>
          ),
        },
        {
          id: "finalidades",
          title: t("purpose_title"),
          body: (
            <>
              <P>{t("purpose_intro")}</P>
              <NumberedList items={list("purpose", 7)} />
            </>
          ),
        },
        {
          id: "patrocinadores",
          title: t("sponsors_title"),
          body: (
            <>
              {t("sponsors")
                .split("\n\n")
                .map((para, i) => (
                  <P key={i}>{para}</P>
                ))}
            </>
          ),
        },
        {
          id: "base-legal",
          title: t("legal_basis_title"),
          body: <P>{t("legal_basis")}</P>,
        },
        {
          id: "transferencias",
          title: t("transfer_title"),
          body: <P>{t("transfer")}</P>,
        },
        {
          id: "conservacion",
          title: t("retention_title"),
          body: <P>{t("retention")}</P>,
        },
        {
          id: "derechos",
          title: t("rights_title"),
          body: (
            <>
              <P>{t("rights_intro")}</P>
              <NumberedList items={list("rights", 6)} />
            </>
          ),
        },
        {
          id: "contacto",
          title: t("contact_title"),
          body: (
            <>
              <P>{t("contact")}</P>
              <Callout label={tf("legal_contact_label")}>
                <ObfuscatedEmail
                  box="privacidad"
                  className="font-mono text-sm font-bold text-hack-ink underline underline-offset-4"
                />
              </Callout>
            </>
          ),
        },
        {
          id: "cambios",
          title: t("changes_title"),
          body: <P>{t("changes")}</P>,
        },
      ]}
    />
  );
}
