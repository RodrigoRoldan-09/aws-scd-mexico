"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Plane } from "@/components/effects/plane";
import { DotHeading } from "@/components/ui/dot-heading";
import { useShareCard, type ShareKind } from "@/components/forms/share-card";
import { EVENT, SITE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Pantalla de confirmación de los formularios públicos.
 *
 * El momento de enviar es el único en que la persona está segura de querer
 * contar lo que hizo, así que acá se le da algo que compartir en vez de un
 * cartel de "listo": una tarjeta cuadrada con su nombre, descargable.
 *
 * Voluntarios no lleva tarjeta a propósito — postularse de staff no es algo
 * que se anuncie en redes hasta que hay respuesta, así que ahí sólo va el
 * mensaje.
 */

/* Iconos de marca. lucide-react dejó de incluirlos, así que van a mano, igual
   que en la sección de organizadores. */
function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23z" />
    </svg>
  );
}

function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SITE = SITE_URL;

/** Una fila del resumen de lo enviado. */
export type SummaryRow = { label: string; value: string };

export function SuccessScreen({
  kind,
  attendance,
  name,
  extra,
  rows,
  preview,
}: {
  kind: ShareKind | "volunteer";
  /** Modalidad, sólo para asistentes: a quien va en línea no se le promete QR. */
  attendance?: "in-person" | "online";
  /** Nombre completo, para la tarjeta. */
  name?: string;
  /** Contenido extra bajo el mensaje (enlaces, avisos). */
  extra?: React.ReactNode;
  /** Lo que la persona envió, para que lo pueda repasar después de enviar. */
  rows?: SummaryRow[];
  /**
   * La tarjeta de lo que le queda a la persona: el pasaporte de un asistente
   * presencial, la credencial de un voluntario.
   *
   * Es distinta de la tarjeta de compartir, que es una imagen cuadrada para
   * redes. Ésta enseña lo que va a tener el día del evento, así que sólo se
   * pasa cuando de verdad lo va a tener — a quien se registró en línea no se
   * le crea pasaporte y enseñárselo sería prometerle algo que no existe.
   */
  preview?: React.ReactNode;
}) {
  const t = useTranslations("Forms");
  const withCard = kind !== "volunteer";

  // Las claves siguen el patron success_<tipo>_<parte>, asi que el tipo elige
  // el juego de textos sin necesidad de una tabla aparte. La modalidad online
  // es un tipo mas para este efecto.
  const copyKind = kind === "attendee" && attendance === "online" ? "attendee_online" : kind;
  const cardKind = kind === "volunteer" ? "attendee" : copyKind;

  const copy = {
    kicker: t(`success_${copyKind}_kicker`),
    heading: t(`success_${copyKind}_heading`),
    lead: t(`success_${copyKind}_lead`),
    shareText: kind === "volunteer" ? "" : t(`success_${copyKind}_share`),
  };

  const card = useShareCard({
    kind: withCard ? (kind as ShareKind) : "attendee",
    name: name ?? "",
    labels: {
      kicker: t(`card_kicker_${cardKind}`),
      headline: t(`card_headline_${cardKind}`),
      date: t("card_date"),
      footer: t("card_footer"),
    },
  });

  const share = (to: "whatsapp" | "linkedin" | "x") => {
    const text = copy.shareText;
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${SITE}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SITE)}`,
    };
    window.open(urls[to], "_blank", "noopener,noreferrer");
  };

  return (
    <main className="form-block flex min-h-screen flex-col bg-hack-block pt-28">
      <div className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20">
        {/* El avión entra girando: es lo primero que se mueve al cargar, y
            sigue el ratón de arriba abajo. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center"
        >
          <Plane size={420} className="max-w-full" />
        </motion.div>

        {/* Atribución del modelo. La licencia CC-BY la exige, y es una línea. */}
        <p className="m-0 text-center font-mono text-[10px] text-hack-ink/45">
          {t("plane_credit")}{" "}
          <a
            href="https://creativecommons.org/licenses/by/3.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            CC-BY 3.0
          </a>
        </p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-center"
        >
          <p className="dot-matrix mb-4 text-lg leading-none text-hack-ink/70">
            {copy.kicker}
          </p>
          <div className="flex justify-center">
            <DotHeading tone="block" variant="inverted" flicker>
              {copy.heading}
            </DotHeading>
          </div>
          <p className="mx-auto mt-6 max-w-[52ch] font-mono text-sm leading-relaxed text-hack-ink/75">
            {copy.lead}
          </p>
          {extra && <div className="mt-6">{extra}</div>}
        </motion.div>

        {withCard && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-14 grid max-w-3xl gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
          >
            <div className="border-2 border-hack-ink shadow-[10px_10px_0_0_rgba(0,0,0,0.3)]">
              {card.canvas}
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={card.download}
                disabled={!card.ready}
                className="btn-hard inline-flex items-center justify-center gap-2 px-6 py-3.5 font-mono text-sm"
              >
                <Download className="h-4 w-4" />
                {t("success_download")}
              </button>

              <p className="dot-matrix mt-2 text-sm leading-none text-hack-ink/60">
                {t("success_share_direct")}
              </p>

              {(
                [
                  ["whatsapp", "WhatsApp", IconWhatsApp],
                  ["linkedin", "LinkedIn", IconLinkedIn],
                  ["x", "X", IconX],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => share(id)}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 border-2 border-hack-ink px-6 py-3",
                    "font-mono text-sm font-bold text-hack-ink transition-all",
                    "hover:bg-hack-ink hover:text-hack-block",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-14 w-full max-w-sm"
          >
            {preview}
          </motion.div>
        )}

        {/* Lo que enviaste.
            Debajo de la tarjeta y de los botones de compartir a propósito: lo
            primero que quiere hacer alguien que acaba de registrarse es
            contarlo; repasar los datos viene después. */}
        {rows && rows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-16 max-w-3xl border-2 border-hack-ink/25 bg-white/25 p-5 sm:p-7"
          >
            <p className="dot-matrix m-0 text-base leading-none text-hack-ink/70">
              {t("summary_title")}
            </p>
            <dl className="mt-4 border-t-2 border-hack-ink/20">
              {rows.map((r) => (
                <div
                  key={r.label}
                  className="flex items-start justify-between gap-4 border-b border-hack-ink/15 py-3"
                >
                  <dt className="dot-matrix shrink-0 text-[11px] text-hack-ink/70">{r.label}</dt>
                  <dd className="m-0 min-w-0 break-words text-right font-mono text-sm text-hack-ink">
                    {r.value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="m-0 mt-4 font-mono text-xs leading-relaxed text-hack-ink/65">
              {t("summary_note")}
            </p>
          </motion.div>
        )}
      </div>

      {/* Cinta al pie, igual que en los formularios */}
      <div className="overflow-hidden border-t-2 border-hack-ink/25" aria-hidden="true">
        <div className="flex w-max items-center" style={{ animation: "marquee 34s linear infinite" }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "dot-matrix whitespace-nowrap px-6 py-2.5 text-base leading-none sm:text-lg",
                i % 2 === 1 ? "bg-hack-ink text-hack-block" : "text-hack-ink",
              )}
            >
              {EVENT.city} · {EVENT.dateShort} · {copy.kicker}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
