"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, Check, Download, Share2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { SITE_URL, EVENT } from "@/lib/constants";

// ── Brand SVG icons ───────────────────────────────────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function XTwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.634zM17.083 20.25h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

// ── Predefined share texts ────────────────────────────────────────────────────
type ShareRole = "speaker" | "attendee";

function buildTexts(name: string, talkTitle: string, profileUrl: string, role: ShareRole) {
  const baseUrl = profileUrl.split("/speakers/")[0] ?? SITE_URL;
  const registroUrl = `${baseUrl}/registro`;

  if (role === "speaker") {
    return {
      whatsapp: `¡Seré speaker en el AWS Student Community Day México 2026! 🎤🇲🇽

📌 *${talkTitle}*

Evento gratuito en la Ciudad de México. ¡Regístrate gratis!
🔗 ${registroUrl}`,

      linkedin: `Me complace anunciar que participaré como speaker en el AWS Student Community Day México 2026 🚀

🎤 Mi charla: ${talkTitle}

Este evento gratuito reúne a la comunidad cloud de habla hispana para aprender, conectar y crecer juntos.

📍 ${EVENT.venue.name}, Ciudad de México
🎟️ Registro gratuito: ${registroUrl}

¡Nos vemos ahí! 🙌

#AWS #CloudComputing #AWSCommunity #StudentCommunityDay #Mexico`,

      twitter: `¡Seré speaker en el AWS Student Community Day México 2026! 🎤

${talkTitle}

Regístrate gratis 👉 ${registroUrl}

#AWS #CloudComputing #AWSCommunity #Mexico`,

      instagram: `¡Seré speaker en el AWS Student Community Day México 2026! 🎤🇲🇽

Mi charla: ${talkTitle}

Evento gratuito en la Ciudad de México.
¡La comunidad cloud más grande de habla hispana!

⬆️ Link en bio: ${registroUrl}

#AWSStudentCommunityDay #AWS #CloudComputing #Mexico #CDMX`,
    };
  }

  // Attendee — third person
  return {
    whatsapp: `¡${name} será speaker en el AWS Student Community Day México 2026! 🎤🇲🇽

📌 *${talkTitle}*

Míralo en: ${profileUrl}

Evento gratuito en la Ciudad de México. ¡Regístrate gratis!
🔗 ${registroUrl}`,

    linkedin: `¡Qué lineup tan increíble! ${name} será speaker en el AWS Student Community Day México 2026 🚀

🎤 Su charla: ${talkTitle}

Este evento gratuito reúne a la comunidad cloud de habla hispana. ¡No te lo pierdas!

👤 Perfil del speaker: ${profileUrl}
📍 ${EVENT.venue.name}, Ciudad de México
🎟️ Registro gratuito: ${registroUrl}

#AWS #CloudComputing #AWSCommunity #StudentCommunityDay #Mexico`,

    twitter: `¡${name} será speaker en el AWS Student Community Day México 2026! 🎤

${talkTitle}

Ver perfil 👉 ${profileUrl}
Regístrate gratis 👉 ${registroUrl}

#AWS #CloudComputing #AWSCommunity #Mexico`,

    instagram: `¡${name} será speaker en el AWS Student Community Day México 2026! 🎤🇲🇽

Su charla: ${talkTitle}

Evento gratuito en la Ciudad de México.
¡La comunidad cloud más grande de habla hispana!

⬆️ Link en bio: ${registroUrl}

#AWSStudentCommunityDay #AWS #CloudComputing #Mexico #CDMX`,
  };
}

type Platform = "whatsapp" | "linkedin" | "twitter" | "instagram";

const PLATFORMS: { key: Platform; label: string; color: string; icon: React.ReactNode; action: "share" | "copy" }[] = [
  { key: "whatsapp",  label: "WhatsApp",  color: "bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366]",    icon: <WhatsAppIcon className="h-5 w-5" />, action: "share" },
  { key: "linkedin",  label: "LinkedIn",  color: "bg-[#0A66C2]/10 border-[#0A66C2]/30 text-[#0A66C2]",    icon: <LinkedInIcon className="h-5 w-5" />, action: "share" },
  { key: "twitter",   label: "X / Twitter", color: "bg-white/5 border-white/20 text-white",               icon: <XTwitterIcon className="h-5 w-5" />, action: "share" },
  { key: "instagram", label: "Instagram", color: "bg-[#E1306C]/10 border-[#E1306C]/30 text-[#E1306C]",    icon: <InstagramIcon className="h-5 w-5" />, action: "copy" },
];

// ── CopyButton ────────────────────────────────────────────────────────────────
function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button onClick={copy} className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-all", copied ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-[#2C2550] bg-[#1E1838] text-[#E6E4DA]/70 hover:border-[#C143BC]/40 hover:text-[#C143BC]")}>
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado ✓" : label}
    </button>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
interface ShareModalProps {
  name: string;
  talkTitle?: string;
  profileUrl: string;
  cardUrl: string;
  slug: string;
  onClose: () => void;
}

function ShareModal({ name, talkTitle = "", profileUrl, cardUrl, slug, onClose }: ShareModalProps) {
  const [activePlatform, setActivePlatform] = useState<Platform>("whatsapp");
  const [role, setRole] = useState<ShareRole>("attendee");
  const texts = buildTexts(name, talkTitle, profileUrl, role);

  const shareUrl = (platform: Platform) => {
    const text = texts[platform];
    switch (platform) {
      case "whatsapp":
        return `https://wa.me/?text=${encodeURIComponent(text)}`;
      case "linkedin":
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
      case "twitter":
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      case "instagram":
        return null; // copy only
    }
  };

  const active = PLATFORMS.find((p) => p.key === activePlatform)!;
  const url = shareUrl(activePlatform);

  useScrollLock(true);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#2C2550] bg-[#1E1838] shadow-2xl"
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between border-b border-[#2C2550] px-4 py-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#E6E4DA]/60">Compartir tarjeta</p>
          <button onClick={onClose} className="rounded-full border border-[#2C2550] bg-[#0E0E1A] p-1.5 text-[#E6E4DA]/60 transition-colors hover:text-[#E6E4DA]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="max-h-[75dvh] overflow-y-auto">
          <div className="p-4 pb-3">
            <div className="overflow-hidden rounded-xl border border-[#2C2550] shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cardUrl} alt={`Tarjeta de ${name}`} className="w-full" />
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <a
                href={cardUrl}
                download={`${slug}-card.png`}
                className="flex items-center gap-1.5 rounded-lg border border-[#2C2550] bg-[#0E0E1A] px-3 py-1.5 font-mono text-xs font-semibold text-[#E6E4DA]/70 transition-colors hover:border-[#C143BC]/40 hover:text-[#C143BC]"
              >
                <Download className="h-3 w-3" /> Descargar
              </a>
              <CopyButton text={profileUrl} label="Copiar link" />
            </div>
          </div>

          {/* Role selector */}
          <div className="border-t border-[#2C2550] px-4 py-3">
            <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#E6E4DA]/60">¿Cómo estás compartiendo?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRole("speaker")}
                className={`rounded-xl border px-3 py-2 text-left transition-all ${
                  role === "speaker"
                    ? "border-[#C143BC]/40 bg-[#C143BC]/10 text-[#C143BC]"
                    : "border-[#2C2550] bg-[#0E0E1A]/40 text-[#E6E4DA]/60 hover:border-[#C143BC]/30 hover:text-[#E6E4DA]"
                }`}
              >
                <p className="font-mono text-xs font-bold">🎤 Soy el speaker</p>
                <p className="font-mono text-[10px] text-current opacity-70">Primera persona</p>
              </button>
              <button
                onClick={() => setRole("attendee")}
                className={`rounded-xl border px-3 py-2 text-left transition-all ${
                  role === "attendee"
                    ? "border-sky-400/40 bg-sky-400/10 text-sky-400"
                    : "border-[#2C2550] bg-[#0E0E1A]/40 text-[#E6E4DA]/60 hover:border-[#C143BC]/30 hover:text-[#E6E4DA]"
                }`}
              >
                <p className="font-mono text-xs font-bold">👥 Soy asistente</p>
                <p className="font-mono text-[10px] text-current opacity-70">Tercera persona</p>
              </button>
            </div>
          </div>

          {/* Platform selector */}
          <div className="border-t border-[#2C2550] px-4 py-3">
            <p className="mb-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#E6E4DA]/60">Compartir en</p>
            <div className="mb-3 grid grid-cols-4 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setActivePlatform(p.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border py-2 transition-all",
                    activePlatform === p.key ? p.color : "border-[#2C2550] bg-[#0E0E1A]/40 text-[#E6E4DA]/60 hover:border-[#C143BC]/30 hover:text-[#E6E4DA]"
                  )}
                >
                  {p.icon}
                  <span className="font-mono text-[9px] font-semibold">{p.label}</span>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-[#2C2550] bg-[#0E0E1A]/40">
              <textarea
                readOnly
                value={texts[activePlatform]}
                rows={4}
                className="w-full resize-none rounded-t-xl bg-transparent px-3 py-2.5 font-mono text-xs leading-relaxed text-[#E6E4DA]/80 focus:outline-none"
              />
              <div className="flex items-center justify-between border-t border-[#2C2550] px-3 py-2">
                <span className="font-mono text-[10px] text-[#E6E4DA]/40 hidden sm:block">
                  {active.action === "copy" ? "Instagram: copia y pega" : "Edita antes de publicar"}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <CopyButton text={texts[activePlatform]} />
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-all", active.color)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Abrir {active.label}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Exported button + modal wrapper ──────────────────────────────────────────
export function ShareButton({
  name, talkTitle, profileUrl, cardUrl, slug,
}: Omit<ShareModalProps, "onClose">) {
  const [open, setOpen] = useState(false);
  // El modal va en un portal: sólo se puede montar cuando existe el DOM.
  const mounted = useHydrated();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-[#2C2550] bg-[#1E1838] px-4 py-2.5 font-mono text-sm font-semibold text-[#E6E4DA]/80 transition-colors hover:border-[#C143BC]/50 hover:text-[#C143BC]"
      >
        <Share2 className="h-4 w-4" />
        Compartir tarjeta
      </button>
      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <ShareModal
              name={name}
              talkTitle={talkTitle}
              profileUrl={profileUrl}
              cardUrl={cardUrl}
              slug={slug}
              onClose={() => setOpen(false)}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
