"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { keynotes } from "@/data/keynotes";
import { EVENT_OPS } from "@/lib/constants";
import {
  Mail, Clock, Flame, AlertTriangle, CheckCircle2, RefreshCw, Eye, Send,
  Megaphone, History, FlaskConical, UserCheck, Presentation, Upload, Heart, Ticket,
} from "lucide-react";

import {
  REMINDER_CARDS, KEYNOTE_TYPES,
  type CampaignType, type CampaignDoc, type StatsData,
} from "./_shared";

export default function RecordatoriosPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmType, setConfirmType] = useState<CampaignType | null>(null);
  const [previewPending, setPreviewPending] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testType, setTestType] = useState<CampaignType>("reminder_15d");
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [slideUrl, setSlideUrl] = useState("");
  const [slideInput, setSlideInput] = useState("");
  const [savingSlide, setSavingSlide] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadInput, setUploadInput] = useState("");
  const [savingUpload, setSavingUpload] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recordingInput, setRecordingInput] = useState("");
  const [savingRecording, setSavingRecording] = useState(false);
  // Correo de galería + grabaciones (3 URLs)
  const [galleryInput, setGalleryInput] = useState("");
  const [virtualRecInput, setVirtualRecInput] = useState("");
  const [hybridRecInput, setHybridRecInput] = useState("");
  const [savingPost, setSavingPost] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns");
      if (!res.ok) throw new Error();
      const data = await res.json() as StatsData;
      setStats(data);
    } catch {
      toast("Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Admin-only section — bounce anyone else out.
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/admin");
  }, [authLoading, user, router]);

  useEffect(() => {
    loadStats();
    fetch("/api/event-config")
      .then((r) => r.json())
      .then((d) => {
        if (d.slideTemplateUrl) { setSlideUrl(d.slideTemplateUrl); setSlideInput(d.slideTemplateUrl); }
        if (d.speakerUploadUrl) { setUploadUrl(d.speakerUploadUrl); setUploadInput(d.speakerUploadUrl); }
        if (d.volunteerRecordingUrl) { setRecordingUrl(d.volunteerRecordingUrl); setRecordingInput(d.volunteerRecordingUrl); }
        if (d.photosUrl) setGalleryInput(d.photosUrl);
        if (d.recordingVirtualUrl) setVirtualRecInput(d.recordingVirtualUrl);
        if (d.recordingHybridUrl) setHybridRecInput(d.recordingHybridUrl);
      })
      .catch(() => {});
  }, [loadStats]);

  const openConfirm = async (type: CampaignType) => {
    setConfirmType(type);
    setPreviewPending(null);
    setLoadingPreview(true);
    try {
      const res = await fetch("/api/admin/campaigns/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Error al calcular destinatarios");
      const data = await res.json() as { pendingCount: number; sampleNames: string[] };
      setPreviewPending(data.pendingCount);
    } catch {
      setPreviewPending(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSend = async () => {
    if (!confirmType) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: confirmType }),
      });
      const data = await res.json() as { sentCount: number; failedCount: number; error?: string };
      if (!res.ok) throw new Error(data.error || "Error");
      toast(`${data.sentCount} correos enviados${data.failedCount ? ` · ${data.failedCount} fallidos` : ""}`, "success");
      setConfirmType(null);
      loadStats();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSending(false);
    }
  };

  const handleSaveSlideUrl = async () => {
    const url = slideInput.trim();
    if (!url) { toast("Pega una URL válida", "error"); return; }
    setSavingSlide(true);
    try {
      const res = await fetch("/api/event-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideTemplateUrl: url }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setSlideUrl(url);
      toast("URL guardada", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSavingSlide(false);
    }
  };

  const handleSaveUploadUrl = async () => {
    const url = uploadInput.trim();
    if (!url) { toast("Pega una URL válida", "error"); return; }
    setSavingUpload(true);
    try {
      const res = await fetch("/api/event-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speakerUploadUrl: url }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setUploadUrl(url);
      toast("URL guardada", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSavingUpload(false);
    }
  };

  const handleSaveRecordingUrl = async () => {
    const url = recordingInput.trim();
    if (!url) { toast("Pega una URL válida", "error"); return; }
    setSavingRecording(true);
    try {
      const res = await fetch("/api/event-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerRecordingUrl: url }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setRecordingUrl(url);
      toast("URL guardada", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSavingRecording(false);
    }
  };

  // Galería + grabaciones (3 URLs del correo post-evento)
  const handleSavePostUrls = async () => {
    setSavingPost(true);
    try {
      const res = await fetch("/api/event-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photosUrl: galleryInput.trim(),
          recordingVirtualUrl: virtualRecInput.trim(),
          recordingHybridUrl: hybridRecInput.trim(),
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast("Enlaces guardados", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSavingPost(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) { toast("Email inválido", "error"); return; }
    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/campaigns/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: testType, to: testEmail }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      toast(`Prueba enviada a ${testEmail}`, "success");
      setTestOpen(false);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSendingTest(false);
    }
  };

  const lastSent = (type: CampaignType) =>
    stats?.campaigns.find((c) => c.type === type && c.status === "done");

  const pendingCount = (type: CampaignType) => stats?.pendingCounts[type] ?? "—";

  const keynoteForType = (type: CampaignType) =>
    keynotes[type === "keynote_daniel" ? 0 : 1];

  // Don't flash the panel to non-admins while the redirect kicks in.
  if (!authLoading && user && user.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
              recordatorios &amp; marketing
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {isAdmin && (
              <Button size="sm" variant="secondary" onClick={() => setTestOpen(true)}>
                <FlaskConical className="mr-2 h-4 w-4" />
                Enviar prueba
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={loadStats} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* ── Recordatorios del evento ── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-surface-400" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface-400">Recordatorios del evento</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {REMINDER_CARDS.map(({ type, label, date, icon: Icon, color, border, bg, iconBg, btnActive }) => {
            const sent = lastSent(type);
            const pending = pendingCount(type);
            return (
              <div
                key={type}
                className={`border ${border} ${bg} p-5 flex flex-col gap-4`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`${iconBg} p-2.5`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  {sent ? (
                    <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald">
                      <CheckCircle2 className="h-3 w-3" /> Enviado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400">
                      <Clock className="h-3 w-3" /> Pendiente
                    </span>
                  )}
                </div>

                <div>
                  <p className={`font-mono text-base font-bold ${color}`}>{label}</p>
                  <p className="font-mono text-xs text-surface-300 mt-0.5">{date}</p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono mt-auto">
                  <div>
                    {sent ? (
                      <span className="text-surface-300">
                        {sent.sentCount} enviados · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                      </span>
                    ) : (
                      <span className="text-surface-400">
                        {loading ? "..." : `${pending} pendientes`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Two previews: what registrants get (with QR) vs what speakers/volunteers/internal users get (no QR) */}
                  <button
                    type="button"
                    onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                    className="flex w-full items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview · registrados (con QR)
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}&variant=guest`, "_blank")}
                    className="flex w-full items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview · speakers / vol / internos
                  </button>
                  {!isAdmin ? (
                    <div className="flex w-full items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                      Acción no permitida
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openConfirm(type)}
                      disabled={loading || pending === 0}
                      className={`flex w-full items-center justify-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                        pending === 0
                          ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                          : `${btnActive}`
                      }`}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Enviar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 5 días — registrados SIN confirmar (versión reducida + CTA de confirmar) */}
        {(() => {
          const type: CampaignType = "reminder_5d_unconfirmed";
          const sent = lastSent(type);
          const pending = pendingCount(type);
          return (
            <div className="mt-4 border border-orange-500/25 bg-orange-500/5 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold text-surface-50">5 días · registrados sin confirmar</p>
                <p className="font-mono text-xs text-surface-400 mt-0.5">Versión reducida: QR + “Confirma antes del {EVENT_OPS.confirmDeadlineShort}”</p>
                <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                  El recordatorio de 5 días para quienes <span className="text-surface-300">aún no confirman</span>. Los confirmados (y speakers/voluntarios/internos) reciben la versión normal de arriba.
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1">
                {sent ? (
                  <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald">
                    <CheckCircle2 className="h-3 w-3" /> Enviado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400">
                    <Clock className="h-3 w-3" /> Pendiente
                  </span>
                )}
                {!sent && <span className="font-mono text-[10px] text-surface-300">{loading ? "..." : `${pending} sin confirmar`}</span>}
                {sent && <span className="font-mono text-[10px] text-surface-300">{sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                  className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview · sin confirmar
                </button>
                {!isAdmin ? (
                  <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                    Acción no permitida
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConfirm(type)}
                    disabled={loading || pending === 0}
                    className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                      pending === 0
                        ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                        : "border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" /> Enviar
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </section>

      {/* ── Confirmar asistencia · Asistentes ── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Ticket className="h-4 w-4 text-surface-400" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface-400">Asistentes · Confirmar asistencia</h2>
        </div>

        {(() => {
          const type: CampaignType = "confirm_attendance";
          const sent = lastSent(type);
          const pending = pendingCount(type);
          return (
            <div className="border-2 border-aws-orange/20 bg-aws-orange/5 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold text-surface-50">Confirma tu asistencia · escarapela personalizada</p>
                <p className="font-mono text-xs text-surface-400 mt-0.5">Link único por asistente · expira el {EVENT_OPS.confirmDeadlineShort}</p>
                <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                  Correo con contador + link explícito a una página donde el asistente confirma y elige cómo aparece su nombre en la escarapela. Los confirmados se imprimen primero.
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1">
                {sent ? (
                  <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald">
                    <CheckCircle2 className="h-3 w-3" /> Enviado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400">
                    <Clock className="h-3 w-3" /> Pendiente
                  </span>
                )}
                {!sent && (
                  <span className="font-mono text-[10px] text-surface-300">
                    {loading ? "..." : `${pending} asistentes`}
                  </span>
                )}
                {sent && (
                  <span className="font-mono text-[10px] text-surface-300">
                    {sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                  className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
                {!isAdmin ? (
                  <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                    Acción no permitida
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConfirm(type)}
                    disabled={loading || pending === 0}
                    className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                      pending === 0
                        ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                        : "border-aws-orange/30 bg-aws-orange/10 text-aws-orange hover:bg-aws-orange/20"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Recogida anticipada de escarapela: solo confirmados */}
        {(() => {
          const type: CampaignType = "badge_pickup";
          const sent = lastSent(type);
          const pending = pendingCount(type);
          return (
            <div className="mt-4 border border-emerald-500/25 bg-emerald-500/5 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold text-surface-50">Recoge tu escarapela hoy (opcional) · {EVENT_OPS.badgePickupShort}</p>
                <p className="font-mono text-xs text-surface-400 mt-0.5">Solo a quienes YA confirmaron asistencia</p>
                <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                  Invita a los confirmados a pasar hoy (3–5 PM) por la sede a recoger su escarapela con anticipación. Incluye mapa y dirección. Es opcional; si no pueden, los esperamos mañana puntuales a las 8 AM.
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1">
                {sent ? (
                  <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald">
                    <CheckCircle2 className="h-3 w-3" /> Enviado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400">
                    <Clock className="h-3 w-3" /> Pendiente
                  </span>
                )}
                {!sent && <span className="font-mono text-[10px] text-surface-300">{loading ? "..." : `${pending} confirmados`}</span>}
                {sent && <span className="font-mono text-[10px] text-surface-300">{sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                  className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                {!isAdmin ? (
                  <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                    Acción no permitida
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConfirm(type)}
                    disabled={loading || pending === 0}
                    className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                      pending === 0
                        ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" /> Enviar
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Recordatorio: solo a quienes NO han confirmado */}
        {(() => {
          const type: CampaignType = "confirm_reminder";
          const sent = lastSent(type);
          const pending = pendingCount(type);
          return (
            <div className="mt-4 border border-red-500/25 bg-red-500/5 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold text-surface-50">Recordatorio · aún no han confirmado</p>
                <p className="font-mono text-xs text-surface-400 mt-0.5">Solo a registrados sin confirmar · fecha límite {EVENT_OPS.confirmDeadlineShort}</p>
                <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                  Correo de urgencia para los que todavía no confirmaron: les recuerda que es de suma importancia y que sin confirmar no se imprime su escarapela.
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1">
                {sent ? (
                  <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald">
                    <CheckCircle2 className="h-3 w-3" /> Enviado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400">
                    <Clock className="h-3 w-3" /> Pendiente
                  </span>
                )}
                {!sent && <span className="font-mono text-[10px] text-surface-300">{loading ? "..." : `${pending} sin confirmar`}</span>}
                {sent && <span className="font-mono text-[10px] text-surface-300">{sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                  className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                {!isAdmin ? (
                  <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                    Acción no permitida
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConfirm(type)}
                    disabled={loading || pending === 0}
                    className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                      pending === 0
                        ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                        : "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" /> Enviar
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Último llamado — re-enviable (hoy 23 y mañana 24) a quienes NO han confirmado */}
        {(() => {
          const type: CampaignType = "confirm_final";
          const sent = lastSent(type);
          const pending = pendingCount(type);
          return (
            <div className="mt-4 border border-red-500/40 bg-red-500/10 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold text-surface-50">Último llamado · re-enviable</p>
                <p className="font-mono text-xs text-surface-400 mt-0.5">Todos los registrados sin confirmar · se puede enviar varias veces (hoy y mañana, antes del cierre)</p>
                <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                  Nuestro último esfuerzo: correo de máxima urgencia. A diferencia de los demás, este <strong className="text-surface-400">no se deduplica</strong> — cada envío llega a todos los que sigan sin confirmar.
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="flex items-center gap-1 bg-red-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-red-300">
                  <Clock className="h-3 w-3" /> {loading ? "..." : `${pending} sin confirmar`}
                </span>
                {sent && <span className="font-mono text-[10px] text-surface-300">Último: {sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                  className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                {!isAdmin ? (
                  <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                    Acción no permitida
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConfirm(type)}
                    disabled={loading || pending === 0}
                    className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                      pending === 0
                        ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                        : "border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" /> Enviar
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </section>

      {/* ── Día del Evento ── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-surface-400" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface-400">Día del Evento · 4 Nov</h2>
        </div>

        {(() => {
          const type: CampaignType = "day_of";
          const sent = lastSent(type);
          const pending = pendingCount(type);
          return (
            <div className="border border-emerald/20 bg-emerald/5 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold text-surface-50">Pasaporte Digital</p>
                <p className="font-mono text-xs text-surface-400 mt-0.5">Enviar a las 8:00 AM del día del evento</p>
                <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                  Explica cómo activar el pasaporte con el QR + PIN de la escarapela, y muestra los sellos disponibles de los patrocinadores.
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1">
                {sent ? (
                  <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald">
                    <CheckCircle2 className="h-3 w-3" /> Enviado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400">
                    <Clock className="h-3 w-3" /> Pendiente
                  </span>
                )}
                {!sent && (
                  <span className="font-mono text-[10px] text-surface-300">
                    {loading ? "..." : `${pending} destinatarios`}
                  </span>
                )}
                {sent && (
                  <span className="font-mono text-[10px] text-surface-300">
                    {sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                  className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
                {!isAdmin ? (
                  <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                    Acción no permitida
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConfirm(type)}
                    disabled={loading || pending === 0}
                    className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                      pending === 0
                        ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                        : "border-emerald/30 bg-emerald/10 text-emerald hover:bg-emerald/20"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Guía detallada del pasaporte — a TODOS */}
        {(() => {
          const type: CampaignType = "passport_guide";
          const sent = lastSent(type);
          const pending = pendingCount(type);
          return (
            <div className="mt-4 border-2 border-aws-orange/25 bg-aws-orange/5 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold text-surface-50">Guía del pasaporte digital · a TODOS</p>
                <p className="font-mono text-xs text-surface-400 mt-0.5">Registrados + speakers + voluntarios + equipo · enviar 9:00 AM</p>
                <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                  Explica a detalle y bonito cómo funciona el pasaporte en 5 pasos: abrirlo con el QR, desbloquear con el PIN para editar foto/redes, coleccionar sellos de sponsors, conectar con la comunidad y juntar todos para los premios. Los registrados reciben botón directo a su pasaporte.
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1">
                {sent ? (
                  <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald">
                    <CheckCircle2 className="h-3 w-3" /> Enviado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400">
                    <Clock className="h-3 w-3" /> Pendiente
                  </span>
                )}
                {!sent && <span className="font-mono text-[10px] text-surface-300">{loading ? "..." : `${pending} destinatarios`}</span>}
                {sent && <span className="font-mono text-[10px] text-surface-300">{sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                  className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                {!isAdmin ? (
                  <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                    Acción no permitida
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConfirm(type)}
                    disabled={loading || pending === 0}
                    className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                      pending === 0
                        ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                        : "border-aws-orange/30 bg-aws-orange/10 text-aws-orange hover:bg-aws-orange/20"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" /> Enviar
                  </button>
                )}
              </div>
            </div>
          );
        })()}
        {/* Mensaje de resiliencia — re-enviable a TODOS */}
        {(() => {
          const type: CampaignType = "resilience_message";
          const sent = lastSent(type);
          const pending = pendingCount(type);
          return (
            <div className="mt-4 border border-amber-500/30 bg-amber-500/5 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold text-surface-50">💪 Gracias por tu resiliencia · a TODOS · re-enviable</p>
                <p className="font-mono text-xs text-surface-400 mt-0.5">Registrados + speakers + voluntarios + equipo · enviar cuando sea necesario</p>
                <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                  Mensaje cálido de agradecimiento ante las fallas de conectividad, luz e internet en la CCB. Anima a quedarse hasta el cierre con la ceremonia de premios y el keynote de Daniel Saldarriaga. <strong className="text-amber-400">Se puede enviar múltiples veces</strong> — no se deduplica.
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="flex items-center gap-1 bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-400">
                  ♻️ Re-enviable · {loading ? "..." : `${pending} destinatarios`}
                </span>
                {sent && <span className="font-mono text-[10px] text-surface-300">Último: {sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                  className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                {!isAdmin ? (
                  <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                    Acción no permitida
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConfirm(type)}
                    disabled={loading || pending === 0}
                    className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                      pending === 0
                        ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" /> Enviar
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </section>

      {/* ── Post-evento ── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-surface-400" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface-400">Post-evento · a TODOS</h2>
        </div>

        <div className="flex flex-col gap-4">
          {/* Reto de certificación AI Practitioner (AWS Tech Girls + SBG) */}
          {(() => {
            const type: CampaignType = "cert_challenge";
            const sent = lastSent(type);
            const pending = pendingCount(type);
            return (
              <div className="border border-purple-500/25 bg-purple-500/5 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-surface-50">Reto de certificación AWS AI Practitioner · a TODOS</p>
                  <p className="font-mono text-xs text-surface-400 mt-0.5">De AWS Tech Girls + Student Builder Groups · enviar una vez</p>
                  <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                    9 sesiones en vivo (mié 7 PM, 22 jul–11 sep). Botón de registro (forms.gle) + CTA de suscripción a YouTube. Firma del equipo AWS Tech Girls y SBG.
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {sent ? (
                    <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald"><CheckCircle2 className="h-3 w-3" /> Enviado</span>
                  ) : (
                    <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400"><Clock className="h-3 w-3" /> Pendiente</span>
                  )}
                  {!sent && <span className="font-mono text-[10px] text-surface-300">{loading ? "..." : `${pending} destinatarios`}</span>}
                  {sent && <span className="font-mono text-[10px] text-surface-300">{sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                    className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </button>
                  {!isAdmin ? (
                    <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">Acción no permitida</div>
                  ) : (
                    <button type="button" onClick={() => openConfirm(type)} disabled={loading || pending === 0}
                      className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${pending === 0 ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed" : "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"}`}>
                      <Send className="h-3.5 w-3.5" /> Enviar
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Encuesta post-evento */}
          {(() => {
            const type: CampaignType = "post_survey";
            const sent = lastSent(type);
            const pending = pendingCount(type);
            return (
              <div className="border-2 border-aws-orange/25 bg-aws-orange/5 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-surface-50">Encuesta post-evento (con tracking de clic)</p>
                  <p className="font-mono text-xs text-surface-400 mt-0.5">A todos · re-enviable solo a quienes NO han dado clic</p>
                  <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                    Cada persona recibe un enlace propio que registra el clic y redirige a la encuesta de AWS (busca Mexico City · 11/04/2026). El detalle de quién dio clic y el reenvío están en <strong>Encuesta</strong> (menú lateral).
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="font-mono text-[10px] text-surface-300">{loading ? "..." : `${pending} pendientes`}</span>
                  {sent && <span className="font-mono text-[10px] text-surface-300">{sent.sentCount} env · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                    className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </button>
                  {!isAdmin ? (
                    <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">Acción no permitida</div>
                  ) : (
                    <button type="button" onClick={() => openConfirm(type)} disabled={loading || pending === 0}
                      className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${pending === 0 ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed" : "border-aws-orange/30 bg-aws-orange/10 text-aws-orange hover:bg-aws-orange/20"}`}>
                      <Send className="h-3.5 w-3.5" /> Enviar
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Galería + grabaciones */}
          {(() => {
            const type: CampaignType = "gallery_recordings";
            const sent = lastSent(type);
            const pending = pendingCount(type);
            return (
              <div className="border border-emerald-500/25 bg-emerald-500/5 p-5 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-bold text-surface-50">Galería + grabaciones (enviar una vez)</p>
                    <p className="font-mono text-xs text-surface-400 mt-0.5">A todos · botones a fotos y grabaciones de los tracks</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {sent ? (
                      <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald"><CheckCircle2 className="h-3 w-3" /> Enviado</span>
                    ) : (
                      <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400"><Clock className="h-3 w-3" /> Pendiente</span>
                    )}
                    {!sent && <span className="font-mono text-[10px] text-surface-300">{loading ? "..." : `${pending} destinatarios`}</span>}
                    {sent && <span className="font-mono text-[10px] text-surface-300">{sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>}
                  </div>
                </div>

                {/* 3 URLs */}
                <div className="grid gap-2 sm:grid-cols-3">
                  <input value={galleryInput} onChange={(e) => setGalleryInput(e.target.value)} placeholder="URL galería de fotos"
                    className="border-2 border-surface-600 bg-surface-900 px-3 py-2 font-mono text-xs text-surface-100 focus:border-aws-orange focus:outline-none" />
                  <input value={virtualRecInput} onChange={(e) => setVirtualRecInput(e.target.value)} placeholder="URL grabación track virtual"
                    className="border-2 border-surface-600 bg-surface-900 px-3 py-2 font-mono text-xs text-surface-100 focus:border-aws-orange focus:outline-none" />
                  <input value={hybridRecInput} onChange={(e) => setHybridRecInput(e.target.value)} placeholder="URL grabación track híbrido"
                    className="border-2 border-surface-600 bg-surface-900 px-3 py-2 font-mono text-xs text-surface-100 focus:border-aws-orange focus:outline-none" />
                </div>

                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={handleSavePostUrls} disabled={savingPost}
                    className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 disabled:opacity-50">
                    {savingPost ? "Guardando…" : "Guardar enlaces"}
                  </button>
                  <button type="button" onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                    className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </button>
                  {!isAdmin ? (
                    <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">Acción no permitida</div>
                  ) : (
                    <button type="button" onClick={() => openConfirm(type)} disabled={loading || pending === 0}
                      className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${pending === 0 ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"}`}>
                      <Send className="h-3.5 w-3.5" /> Enviar
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── Plantilla para Speakers ── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Presentation className="h-4 w-4 text-surface-400" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface-400">Plantilla de Presentación — Speakers</h2>
        </div>

        {(() => {
          const type: CampaignType = "speaker_slides";
          const sent = lastSent(type);
          const pending = pendingCount(type);
          return (
            <div className="border border-purple-500/20 bg-purple-500/5 p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-surface-50">Plantilla oficial de diapositivas</p>
                  <p className="font-mono text-xs text-surface-400 mt-0.5">Solo para speakers aceptados — no llega a registros</p>
                  <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                    Sube el archivo PPTX o PDF y envíalo a todos los speakers aprobados con un botón de descarga.
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  {sent ? (
                    <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald">
                      <CheckCircle2 className="h-3 w-3" /> Enviado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400">
                      <Clock className="h-3 w-3" /> Pendiente
                    </span>
                  )}
                  {!sent && (
                    <span className="font-mono text-[10px] text-surface-300">
                      {loading ? "..." : `${pending} speakers`}
                    </span>
                  )}
                  {sent && (
                    <span className="font-mono text-[10px] text-surface-300">
                      {sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
              </div>

              {/* Slide template URL */}
              {isAdmin && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={slideInput}
                    onChange={(e) => setSlideInput(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 border-2 border-surface-600 bg-surface-900 px-3 py-2 font-mono text-xs text-surface-100 placeholder:text-surface-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveSlideUrl}
                    disabled={savingSlide || !slideInput.trim()}
                    className="shrink-0 flex items-center gap-1.5 border border-purple-500/30 bg-purple-500/10 px-3 py-2 font-mono text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingSlide ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Guardar
                  </button>
                </div>
              )}
              {slideUrl && (
                <a href={slideUrl} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-[10px] text-purple-400 hover:text-purple-300 break-all underline underline-offset-2">
                  {slideUrl.split("/").pop()}
                </a>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                  className="flex-1 flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
                {!isAdmin ? (
                  <div className="flex-1 flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                    Acción no permitida
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConfirm(type)}
                    disabled={loading || pending === 0 || !slideUrl}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                      pending === 0 || !slideUrl
                        ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                        : "border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                    }`}
                    title={!slideUrl ? "Sube la plantilla primero" : undefined}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar a speakers
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </section>

      {/* ── Subir presentación — Speakers ── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Upload className="h-4 w-4 text-surface-400" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface-400">Subir Presentación — Speakers</h2>
        </div>

        {(() => {
          const type: CampaignType = "speaker_upload";
          const sent = lastSent(type);
          const pending = pendingCount(type);
          return (
            <div className="border border-cyan-500/20 bg-cyan-500/5 p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-surface-50">Sube tu presentación · antes del {EVENT_OPS.slidesDeadline}</p>
                  <p className="font-mono text-xs text-surface-400 mt-0.5">Solo para speakers aceptados — no llega a registros</p>
                  <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                    Pega el enlace de la carpeta de Drive donde los speakers deben subir su presentación final. El correo lleva un botón a esa carpeta y la fecha límite del {EVENT_OPS.slidesDeadline}.
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  {sent ? (
                    <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald">
                      <CheckCircle2 className="h-3 w-3" /> Enviado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400">
                      <Clock className="h-3 w-3" /> Pendiente
                    </span>
                  )}
                  {!sent && <span className="font-mono text-[10px] text-surface-300">{loading ? "..." : `${pending} speakers`}</span>}
                  {sent && <span className="font-mono text-[10px] text-surface-300">{sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>}
                </div>
              </div>

              {/* upload folder URL */}
              {isAdmin && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={uploadInput}
                    onChange={(e) => setUploadInput(e.target.value)}
                    placeholder="https://drive.google.com/… (carpeta para subir)"
                    className="flex-1 border-2 border-surface-600 bg-surface-900 px-3 py-2 font-mono text-xs text-surface-100 placeholder:text-surface-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveUploadUrl}
                    disabled={savingUpload || !uploadInput.trim()}
                    className="shrink-0 flex items-center gap-1.5 border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 font-mono text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingUpload ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Guardar
                  </button>
                </div>
              )}
              {uploadUrl && (
                <a href={uploadUrl} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-[10px] text-cyan-300 hover:text-cyan-200 break-all underline underline-offset-2">
                  {uploadUrl}
                </a>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                  className="flex-1 flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                {!isAdmin ? (
                  <div className="flex-1 flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                    Acción no permitida
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConfirm(type)}
                    disabled={loading || pending === 0 || !uploadUrl}
                    title={!uploadUrl ? "Pega la URL de la carpeta primero" : undefined}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                      pending === 0 || !uploadUrl
                        ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                        : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" /> Enviar a speakers
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </section>

      {/* ── Anuncios de keynotes ── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-surface-400" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface-400">Anuncios de keynotes</h2>
        </div>

        <div className="flex flex-col gap-4">
          {KEYNOTE_TYPES.map((type) => {
            const kn = keynoteForType(type);
            const sent = lastSent(type);
            const pending = pendingCount(type);
            const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
            return (
              <div
                key={type}
                className="border-2 border-aws-orange/20 bg-aws-orange/5 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
              >
                {/* Photo */}
                {kn.photo && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden border-2 border-aws-orange/20">
                    <Image
                      src={`${basePath}${kn.photo}`}
                      alt={`${kn.firstName} ${kn.lastName}`}
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-surface-50">
                    {kn.firstName} {kn.lastName}
                  </p>
                  <p className="font-mono text-xs text-surface-400 mt-0.5">
                    {[kn.role, kn.company].filter(Boolean).join(" · ")}
                  </p>
                  {kn.talkTitle && (
                    <p className="text-xs italic text-surface-300 mt-0.5">&quot;{kn.talkTitle}&quot;</p>
                  )}
                </div>

                {/* Status */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {sent ? (
                    <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald">
                      <CheckCircle2 className="h-3 w-3" /> Enviado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400">
                      <Clock className="h-3 w-3" /> Pendiente
                    </span>
                  )}
                  {sent && (
                    <span className="font-mono text-[10px] text-surface-300">
                      {sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                    className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  {!isAdmin ? (
                    <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                      Acción no permitida
                    </div>
                  ) : (
                  <button
                    type="button"
                    onClick={() => openConfirm(type)}
                    disabled={loading || pending === 0}
                    className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                      pending === 0
                        ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                        : "border-aws-orange/30 bg-aws-orange/10 text-aws-orange hover:bg-aws-orange/20"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar
                  </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Voluntarios ── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Heart className="h-4 w-4 text-surface-400" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface-400">Voluntarios</h2>
        </div>

        <div className="flex flex-col gap-4">
          {([
            {
              type: "volunteer_meeting" as CampaignType,
              title: `Reunión obligatoria · ${EVENT_OPS.volunteerMeetingShort}`,
              desc: "Aviso de reunión obligatoria vía Teams + recordatorio de unirse al grupo de WhatsApp. Incluye botón de Google Calendar.",
              card: "border-green-500/20 bg-green-500/5",
              btn: "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20",
            },
            {
              type: "volunteer_meeting_today" as CampaignType,
              title: "Recordatorio HOY · La reunión es hoy a las 6 PM CST",
              desc: "Recordatorio del mismo día. Mensaje en tono \"es hoy\" con botón directo a Teams + aviso de WhatsApp. Sin botón de calendario.",
              card: "border-amber-500/30 bg-amber-500/5",
              btn: "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
            },
            {
              type: "volunteer_setup" as CampaignType,
              title: `Jornada de montaje · ${EVENT_OPS.setupShort}`,
              desc: `Invitación a montar el evento el día anterior en la sede. Incluye dirección, botón a Google Maps, Google Calendar y recordatorio de ser MUY puntuales el ${EVENT_OPS.weekday} a las 7 AM.`,
              card: "border-aws-orange/25 bg-aws-orange/5",
              btn: "border-aws-orange/30 bg-aws-orange/10 text-aws-orange hover:bg-aws-orange/20",
            },
          ]).map(({ type, title, desc, card, btn }) => {
            const sent = lastSent(type);
            const pending = pendingCount(type);
            return (
              <div key={type} className={`border ${card} p-5 flex flex-col sm:flex-row gap-4 sm:items-center`}>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-surface-50">{title}</p>
                  <p className="font-mono text-xs text-surface-400 mt-0.5">Solo para voluntarios aprobados</p>
                  <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">{desc}</p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  {sent ? (
                    <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald">
                      <CheckCircle2 className="h-3 w-3" /> Enviado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400">
                      <Clock className="h-3 w-3" /> Pendiente
                    </span>
                  )}
                  {!sent && (
                    <span className="font-mono text-[10px] text-surface-300">
                      {loading ? "..." : `${pending} voluntarios`}
                    </span>
                  )}
                  {sent && (
                    <span className="font-mono text-[10px] text-surface-300">
                      {sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                    className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  {!isAdmin ? (
                    <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                      Acción no permitida
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openConfirm(type)}
                      disabled={loading || pending === 0}
                      className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                        pending === 0
                          ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                          : btn
                      }`}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Enviar
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Grabación de la reunión */}
          {(() => {
            const type: CampaignType = "volunteer_recording";
            const sent = lastSent(type);
            const pending = pendingCount(type);
            return (
              <div className="border border-indigo-500/25 bg-indigo-500/5 p-5 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-bold text-surface-50">Grabación de la reunión · {EVENT_OPS.volunteerMeetingShort}</p>
                    <p className="font-mono text-xs text-surface-400 mt-0.5">Solo para voluntarios aprobados</p>
                    <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                      Envía el enlace de la grabación de la reunión de voluntarios. Pega la URL (Teams / Drive / YouTube) abajo.
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {sent ? (
                      <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald">
                        <CheckCircle2 className="h-3 w-3" /> Enviado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400">
                        <Clock className="h-3 w-3" /> Pendiente
                      </span>
                    )}
                    {!sent && <span className="font-mono text-[10px] text-surface-300">{loading ? "..." : `${pending} voluntarios`}</span>}
                    {sent && <span className="font-mono text-[10px] text-surface-300">{sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>}
                  </div>
                </div>

                {/* recording URL */}
                {isAdmin && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={recordingInput}
                      onChange={(e) => setRecordingInput(e.target.value)}
                      placeholder="https://… (enlace de la grabación)"
                      className="flex-1 border-2 border-surface-600 bg-surface-900 px-3 py-2 font-mono text-xs text-surface-100 placeholder:text-surface-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveRecordingUrl}
                      disabled={savingRecording || !recordingInput.trim()}
                      className="shrink-0 flex items-center gap-1.5 border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 font-mono text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingRecording ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Guardar
                    </button>
                  </div>
                )}
                {recordingUrl && (
                  <a href={recordingUrl} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-[10px] text-indigo-300 hover:text-indigo-200 break-all underline underline-offset-2">
                    {recordingUrl}
                  </a>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                    className="flex-1 flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </button>
                  {!isAdmin ? (
                    <div className="flex-1 flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                      Acción no permitida
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openConfirm(type)}
                      disabled={loading || pending === 0 || !recordingUrl}
                      title={!recordingUrl ? "Pega la URL de la grabación primero" : undefined}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                        pending === 0 || !recordingUrl
                          ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                          : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                      }`}
                    >
                      <Send className="h-3.5 w-3.5" /> Enviar
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── Speakers no seleccionados ── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-surface-400" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface-400">Speakers no seleccionados</h2>
        </div>

        {(() => {
          const type: CampaignType = "speaker_rejection";
          const sent = lastSent(type);
          const pending = pendingCount(type);
          return (
            <div className="border border-rose-500/20 bg-rose-500/5 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold text-surface-50">Actualización sobre tu postulación</p>
                <p className="font-mono text-xs text-surface-400 mt-0.5">Solo para speakers rechazados</p>
                <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">
                  Mensaje cálido (no un &quot;rechazado&quot;): agradece, invita a postularse en 2027, a venir como asistente o seguir el track virtual, con botón para registrarse.
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1">
                {sent ? (
                  <span className="flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald">
                    <CheckCircle2 className="h-3 w-3" /> Enviado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-400">
                    <Clock className="h-3 w-3" /> Pendiente
                  </span>
                )}
                {!sent && <span className="font-mono text-[10px] text-surface-300">{loading ? "..." : `${pending} speakers`}</span>}
                {sent && <span className="font-mono text-[10px] text-surface-300">{sent.sentCount} envíos · {new Date(sent.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(`/api/admin/campaigns/email-preview?type=${type}`, "_blank")}
                  className="flex items-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                {!isAdmin ? (
                  <div className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs text-surface-600 cursor-not-allowed select-none">
                    Acción no permitida
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConfirm(type)}
                    disabled={loading || pending === 0}
                    className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-medium transition-all border ${
                      pending === 0
                        ? "bg-surface-800 text-surface-600 border-surface-600 cursor-not-allowed"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" /> Enviar
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </section>

      {/* ── Aprobación de speakers ── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-surface-400" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface-400">Aprobación de speakers</h2>
        </div>
        <p className="mb-4 font-mono text-xs text-surface-300">
          Vista previa de los correos transaccionales que se envían al aprobar un speaker. Solo preview — el envío se dispara desde la sección de Postulaciones.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* In-person */}
          <div className="border-2 border-aws-orange/20 bg-aws-orange/5 p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <div className="bg-aws-orange/10 p-2.5">
                <UserCheck className="h-5 w-5 text-aws-orange" />
              </div>
              <span className="border-2 border-aws-orange/30 bg-aws-orange/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-aws-orange">
                Presencial
              </span>
            </div>
            <div>
              <p className="font-mono text-sm font-bold text-aws-orange">Speaker aceptado — Presencial</p>
              <p className="font-mono text-xs text-surface-300 mt-0.5 leading-relaxed">
                Incluye fecha, venue, mapa y dirección de la sede.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.open("/api/admin/campaigns/email-preview?type=speaker_approval_inperson", "_blank")}
              className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
            >
              <Eye className="h-3.5 w-3.5" />
              Ver preview
            </button>
          </div>

          {/* Online */}
          <div className="border border-blue-500/20 bg-blue-500/5 p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <div className="bg-blue-500/10 p-2.5">
                <UserCheck className="h-5 w-5 text-blue-400" />
              </div>
              <span className="border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-blue-400">
                Online
              </span>
            </div>
            <div>
              <p className="font-mono text-sm font-bold text-blue-400">Speaker aceptado — Online</p>
              <p className="font-mono text-xs text-surface-300 mt-0.5 leading-relaxed">
                Reemplaza el mapa con aviso de sesión por streaming. Sin dirección física.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.open("/api/admin/campaigns/email-preview?type=speaker_approval_online", "_blank")}
              className="flex items-center justify-center gap-1.5 border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100"
            >
              <Eye className="h-3.5 w-3.5" />
              Ver preview
            </button>
          </div>
        </div>
      </section>

      {/* ── Historial ── */}
      {stats && stats.campaigns.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-surface-400" />
            <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface-400">Historial de envíos</h2>
          </div>

          <div className="-mx-4 overflow-x-auto border-y-2 border-surface-600 sm:mx-0 sm:border-2">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-surface-600 bg-surface-700/40">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-surface-300">Campaña</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-surface-300">Estado</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-surface-300">Enviados</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-surface-300">Fallidos</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-surface-300">Por</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-surface-300">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {stats.campaigns.map((c, i) => (
                  <tr key={c._id} className={`border-b border-surface-600/50 ${i % 2 === 0 ? "" : "bg-surface-800/20"}`}>
                    <td className="px-4 py-3 font-mono text-xs text-surface-200">
                      {CAMPAIGN_LABELS[c.type] || c.type}
                    </td>
                    <td className="px-4 py-3">
                      {c.status === "done" ? (
                        <span className="flex items-center gap-1 font-mono text-xs text-emerald"><CheckCircle2 className="h-3.5 w-3.5" /> Completado</span>
                      ) : c.status === "sending" ? (
                        <span className="flex items-center gap-1 font-mono text-xs text-aws-orange"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Enviando</span>
                      ) : (
                        <span className="flex items-center gap-1 font-mono text-xs text-red-400"><AlertTriangle className="h-3.5 w-3.5" /> Error</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-surface-100">{c.sentCount}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-red-400">
                      {c.failedCount > 0 ? c.failedCount : <span className="text-surface-600">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-surface-400">{c.triggeredBy}</td>
                    <td className="px-4 py-3 font-mono text-xs text-surface-300">
                      {new Date(c.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Test email modal ── */}
      <Modal
        open={testOpen}
        onClose={() => setTestOpen(false)}
        title="Enviar correo de prueba"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-surface-400">Campaña</label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value as CampaignType)}
              className="border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-sm text-surface-100 focus:outline-none"
            >
              {Object.entries(CAMPAIGN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-surface-400">Correo destino</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="tu@email.com"
              className="border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-sm text-surface-100 placeholder:text-surface-400 focus:outline-none"
            />
          </div>

          <div className="border-2 border-surface-600 bg-surface-800 px-4 py-3">
            <p className="font-mono text-xs text-surface-400">
              El correo se enviará con el prefijo <span className="text-aws-orange">[PRUEBA]</span> en el asunto y datos de ejemplo. No afecta el historial ni los contadores.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setTestOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSendTest} disabled={sendingTest || !testEmail}>
              {sendingTest ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Enviar prueba</>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm send modal ── */}
      <Modal
        open={!!confirmType}
        onClose={() => { setConfirmType(null); setPreviewPending(null); }}
        title="Confirmar envío"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          {confirmType && (
            <div className="border-2 border-surface-600 bg-surface-800 px-4 py-3">
              <p className="font-mono text-sm font-semibold text-aws-orange">{CAMPAIGN_LABELS[confirmType]}</p>
              {loadingPreview ? (
                <p className="font-mono text-xs text-surface-400 mt-2">Calculando destinatarios...</p>
              ) : previewPending !== null ? (
                <p className="font-mono text-xs text-surface-300 mt-2">
                  Se enviará a{" "}
                  <span className="font-bold text-surface-50">{previewPending} persona{previewPending !== 1 ? "s" : ""}</span>{" "}
                  que aún no han recibido esta campaña.
                </p>
              ) : (
                <p className="font-mono text-xs text-red-400 mt-2">No se pudo calcular el conteo. Intenta de nuevo.</p>
              )}
            </div>
          )}

          <div className="border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
            <p className="font-mono text-xs text-yellow-400 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Esta acción no se puede deshacer. Los correos se enviarán de inmediato.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setConfirmType(null); setPreviewPending(null); }}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sending || loadingPreview || previewPending === 0}
            >
              {sending ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Enviar campaña</>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const CAMPAIGN_LABELS: Record<string, string> = {
  reminder_15d: "Recordatorio — 15 días antes",
  reminder_5d: "Recordatorio — 5 días (confirmados + invitados)",
  reminder_5d_unconfirmed: "Recordatorio 5 días — sin confirmar",
  reminder_1d: "Recordatorio — 1 día antes",
  keynote_daniel: "Anuncio: Daniel Saldarriaga",
  keynote_alejandra: "Anuncio: Alejandra Bricio",
  day_of: "Día del Evento — Pasaporte digital",
  speaker_slides: "Plantilla de presentación — Speakers",
  speaker_upload: "Subir presentación — Speakers",
  volunteer_meeting: "Reunión obligatoria — Voluntarios",
  volunteer_meeting_today: "Recordatorio HOY — Reunión voluntarios",
  volunteer_setup: "Jornada de montaje — Voluntarios",
  confirm_attendance: "Confirmar asistencia — Asistentes",
  confirm_reminder: "Recordatorio: confirma tu asistencia",
  confirm_final: "Último llamado: confirma tu asistencia",
  speaker_rejection: "Actualización postulación — Speakers no seleccionados",
  volunteer_recording: "Grabación de la reunión — Voluntarios",
  badge_pickup: "Recogida anticipada de escarapela — Confirmados",
  passport_guide: "Guía del pasaporte digital — Todos",
  resilience_message: "Gracias por tu resiliencia — Todos (re-enviable)",
  post_survey: "Encuesta post-evento — Todos (re-enviable a no-clic)",
  gallery_recordings: "Galería + grabaciones — Todos",
  cert_challenge: "Reto de certificación AI Practitioner — Todos",
};