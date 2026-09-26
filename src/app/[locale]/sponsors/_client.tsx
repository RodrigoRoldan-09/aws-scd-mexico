"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Mail,
  Copy,
  Check,
  Building2,
  Send,
  MapPin,
  Calendar,
  Users,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ObfuscatedEmail, mailtoOf } from "@/components/ui/obfuscated-email";
import { EVENT } from "@/lib/constants";
import { localePath } from "@/lib/utils";

export function SponsorsClient() {
  const t = useTranslations("SponsorsPage");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const emailSubject = t("template_subject");
  const emailBody = t("template_body", {
    venue: EVENT.venue.name,
    address: EVENT.venue.address,
    date: EVENT.dateLabel,
  });

  const handleCopy = async () => {
    try {
      const fullText = `${t("label_subject")}: ${emailSubject}\n\n${emailBody}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback si clipboard falla
    }
  };

  const mailtoLink = mailtoOf("sponsors", emailSubject);

  return (
    <main className="min-h-screen bg-[#0E0E1A] pt-24 pb-20 text-[#E6E4DA]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Enlace de regreso */}
        <div className="mb-8">
          <Link
            href={localePath(locale, "/#sponsors")}
            className="inline-flex min-h-11 items-center gap-2 font-mono text-xs text-[#B4B2A9] transition-colors hover:text-[#C143BC]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("back_to_event")}</span>
          </Link>
        </div>

        {/* Encabezado Principal */}
        <div className="border-b border-[#2C2550] pb-10">
          <div className="inline-flex items-center gap-2 rounded-[6px] border border-[#C143BC]/40 bg-[#1E1838] px-3.5 py-1.5">
            <span className="dot-matrix text-xs tracking-wider text-[#C143BC]">
              {t("badge")}
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[#E6E4DA] sm:text-4xl md:text-5xl">
            {t("title")}
          </h1>

          <p className="mt-4 max-w-3xl font-mono text-sm leading-relaxed text-[#B4B2A9] sm:text-base">
            {t("description")}
          </p>
        </div>

        {/* Cuadrícula de Contacto y Plantilla */}
        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          {/* Tarjeta de Información del Club */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-[12px] border border-[#2C2550] bg-[#1E1838] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-3 border-b border-[#2C2550] pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#2A1F5E] text-[#C143BC]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-[#E6E4DA]">
                    AWS Student Builder Group
                  </h2>
                  <span className="font-mono text-xs text-[#C143BC]">
                    IPN CDMX (At IPN)
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-4 font-mono text-xs leading-relaxed text-[#B4B2A9]">
                <div>
                  <span className="block text-[11px] uppercase tracking-wider text-[#73726C]">
                    {t("label_official_email")}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-[#C143BC]" />
                    <ObfuscatedEmail
                      box="sponsors"
                      subject={emailSubject}
                      className="text-sm font-bold text-[#C143BC] underline decoration-[#C143BC]/40 underline-offset-4 hover:decoration-[#C143BC]"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] uppercase tracking-wider text-[#73726C]">
                    {t("label_venue")}
                  </span>
                  <div className="mt-1 flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-[#C143BC] mt-0.5" />
                    <div>
                      <span className="text-[#E6E4DA] font-semibold">{EVENT.venue.name}</span>
                      <p className="mt-0.5 text-[11px] text-[#73726C]">{EVENT.venue.address}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] uppercase tracking-wider text-[#73726C]">
                    {t("label_date_capacity")}
                  </span>
                  <div className="mt-1 flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-[#C143BC]" />
                      {EVENT.dateShort}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-[#C143BC]" />
                      {EVENT.capacity}+ {t("attendees_label")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón directo para enviar correo */}
              <div className="mt-6 pt-5 border-t border-[#2C2550]">
                <a
                  href={mailtoLink}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[#C143BC] px-4 py-2.5 font-mono text-xs font-bold text-[#0E0E1A] transition-all hover:bg-[#D970D7] active:scale-[0.99] shadow-[0_4px_12px_rgba(193,67,188,0.3)]"
                >
                  <Send className="h-4 w-4" />
                  <span>{t("btn_send_email")}</span>
                </a>
              </div>
            </div>

            {/* Beneficios Clave para Sponsors */}
            <div className="rounded-[12px] border border-[#2C2550] bg-[#1E1838]/60 p-6">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#E6E4DA]">
                <Sparkles className="h-4 w-4 text-[#C143BC]" />
                {t("benefits_title")}
              </h3>
              <ul className="mt-3 space-y-2.5 font-mono text-xs text-[#B4B2A9]">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C143BC] mt-1.5 shrink-0" />
                  <span>{t("benefit_1")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C143BC] mt-1.5 shrink-0" />
                  <span>{t("benefit_2")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C143BC] mt-1.5 shrink-0" />
                  <span>{t("benefit_3")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C143BC] mt-1.5 shrink-0" />
                  <span>{t("benefit_4")}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Plantilla de Correo Interactiva */}
          <div className="lg:col-span-7">
            <div className="rounded-[12px] border border-[#2C2550] bg-[#0E0E1A] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              {/* Barra superior estilo terminal */}
              <div className="flex items-center justify-between border-b border-[#2C2550] bg-[#1E1838] px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#2C2550]" />
                  <div className="h-3 w-3 rounded-full bg-[#2C2550]" />
                  <div className="h-3 w-3 rounded-full bg-[#2C2550]" />
                  <span className="ml-2 font-mono text-xs text-[#B4B2A9]">
                    {t("template_card_title")}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-[6px] border border-[#2C2550] bg-[#0E0E1A] px-3.5 py-1.5 font-mono text-xs font-semibold text-[#E6E4DA] transition-all hover:border-[#C143BC] hover:text-[#C143BC]"
                  aria-label={t("btn_copy_template")}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-green-400">{t("copied_label")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{t("btn_copy_template")}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Contenido del correo */}
              <div className="p-6">
                {/* Cabecera del correo: Para y Asunto */}
                <div className="space-y-3 border-b border-[#2C2550] pb-4 font-mono text-xs">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="w-16 shrink-0 text-[#73726C]">{t("label_to")}:</span>
                    <span className="font-bold text-[#E6E4DA]">
                      <ObfuscatedEmail box="sponsors" />
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="w-16 shrink-0 text-[#73726C]">{t("label_subject")}:</span>
                    <span className="rounded bg-[#1E1838] px-2 py-0.5 font-bold text-[#C143BC]">
                      {emailSubject}
                    </span>
                  </div>
                </div>

                {/* Cuerpo del correo editable/copiable */}
                <div className="mt-5">
                  <span className="block font-mono text-[11px] uppercase tracking-wider text-[#73726C]">
                    {t("label_body")}:
                  </span>
                  <div className="mt-2 rounded-[8px] border border-[#2C2550] bg-[#161226] p-4">
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#E6E4DA] select-all">
                      {emailBody}
                    </pre>
                  </div>
                </div>

                {/* Pie de ayuda */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#2C2550] pt-4 text-xs font-mono text-[#73726C]">
                  <p>{t("template_note")}</p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex min-h-11 items-center gap-1.5 text-xs text-[#C143BC] underline underline-offset-4 hover:text-[#D970D7]"
                  >
                    {copied ? t("copied_label") : t("btn_copy_template")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
