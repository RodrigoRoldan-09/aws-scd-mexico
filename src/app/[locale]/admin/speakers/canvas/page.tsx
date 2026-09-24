"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Save, CheckCircle, RotateCcw, Loader2, AlertCircle, Info, RefreshCw,
} from "lucide-react";

interface CanvasProfile {
  slug: string;
  name: string;
  status: string;
  talkTitle: string;
  talkTitleCard: string;
  tagline: string;
  role: string;
  company: string;
  roleCard: string;
  cardContentX: number | null;
  cardContentY: number | null;
  cardNameOffset: number | null;
  cardTitleSize: number | null;
  cardNameSize: number | null;
  cardApproved: boolean;
  cardImageUrl: string;
}

type ToastState = { message: string; type: "ok" | "err" } | null;

function NumField({
  label, value, onChange, min, max, step, hint,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; hint?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-36 shrink-0 font-mono text-xs text-surface-400">{label}</label>
      <input
        type="number"
        value={value}
        min={min} max={max} step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 border-2 border-surface-600 bg-surface-800 px-2 py-1 font-mono text-sm text-aws-orange text-center focus:border-aws-orange focus:outline-none"
      />
      {hint && <span className="font-mono text-[10px] text-surface-600">{hint}</span>}
    </div>
  );
}

const DEFAULT_X = 530;
const DEFAULT_Y = 180;
const DEFAULT_NAME_OFFSET = 532;

function CanvasEditorPageInner() {
  const slugPedido = useSearchParams().get("slug");
  const [profiles, setProfiles] = useState<CanvasProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [showS3, setShowS3] = useState(false);
  const [s3ImgKey, setS3ImgKey] = useState(Date.now());
  const [toast, setToast] = useState<ToastState>(null);

  // Bulk re-render state
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; failed: number; total: number } | null>(null);

  // Form state
  const [talkTitleCard, setTalkTitleCard] = useState("");
  const [roleCard, setRoleCard] = useState("");
  const [contentX, setContentX] = useState(DEFAULT_X);
  const [contentY, setContentY] = useState(DEFAULT_Y);
  const [nameOffset, setNameOffset] = useState(DEFAULT_NAME_OFFSET);
  const [titleSize, setTitleSize] = useState(0); // 0 = auto
  const [nameSize, setNameSize] = useState(40);

  // Debounced preview URL
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    fetch("/api/speaker-profiles/admin")
      .then((r) => r.json())
      .then((d) => {
        const profs = (d.profiles as CanvasProfile[]) ?? [];
        setProfiles(profs);
        if (profs.length === 0) { setLoading(false); return; }
        // Si se llegó desde la ficha de alguien (`?slug=`), se abre en esa persona.
        const pedido = slugPedido ? profs.findIndex((p) => p.slug === slugPedido) : -1;
        const i = pedido >= 0 ? pedido : 0;
        setCurrentIndex(i);
        syncState(profs[i]);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugPedido]);

  const profile = profiles[currentIndex];

  function defaultOgLine(p: CanvasProfile) {
    return p.tagline || [p.role, p.company].filter(Boolean).join(" · ");
  }

  function syncState(p: CanvasProfile) {
    const titleVal = p.talkTitleCard || p.talkTitle || "";
    const roleVal  = p.roleCard || defaultOgLine(p);
    const cx  = p.cardContentX  ?? DEFAULT_X;
    const cy  = p.cardContentY  ?? DEFAULT_Y;
    const no  = p.cardNameOffset ?? DEFAULT_NAME_OFFSET;
    const ts  = p.cardTitleSize  ?? 0;
    const ns  = p.cardNameSize   ?? 40;
    setTalkTitleCard(titleVal);
    setRoleCard(roleVal);
    setContentX(cx);
    setContentY(cy);
    setNameOffset(no);
    setTitleSize(ts);
    setNameSize(ns);
    // Immediately set preview without debounce when switching speaker
    setPreviewUrl(buildUrl(p.slug, titleVal, roleVal, cx, cy, no, ts, ns));
  }

  function buildUrl(slug: string, t: string, r: string, cx: number, cy: number, no: number, ts: number, ns: number) {
    const p = new URLSearchParams({
      preview: "1",
      titleCard: t,
      roleCard: r,
      contentX: String(cx),
      contentY: String(cy),
      nameOffset: String(no),
      nameSize: String(ns),
      _t: String(Date.now()),
      ...(ts > 0 ? { titleSize: String(ts) } : {}),
    });
    return `/api/og/speaker/${slug}?${p.toString()}`;
  }

  // Debounce preview updates while typing
  useEffect(() => {
    if (!profile) return;
    const timer = setTimeout(() => {
      setPreviewUrl(buildUrl(profile.slug, talkTitleCard, roleCard, contentX, contentY, nameOffset, titleSize, nameSize));
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talkTitleCard, roleCard, contentX, contentY, nameOffset, titleSize, nameSize]);

  function goTo(index: number) {
    if (index < 0 || index >= profiles.length) return;
    setCurrentIndex(index);
    setShowS3(false);
    syncState(profiles[index]);
  }

  function showToast(message: string, type: "ok" | "err") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/speaker-profiles/${profile.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talkTitleCard, roleCard,
          cardContentX: contentX,
          cardContentY: contentY,
          cardNameOffset: nameOffset,
          cardTitleSize: titleSize > 0 ? titleSize : null,
          cardNameSize: nameSize,
        }),
      });
      if (!res.ok) throw new Error();
      setProfiles((prev) =>
        prev.map((p, i) =>
          i === currentIndex
            ? { ...p, talkTitleCard, roleCard, cardContentX: contentX, cardContentY: contentY, cardNameOffset: nameOffset, cardTitleSize: titleSize || null, cardNameSize: nameSize, cardApproved: false, cardImageUrl: "" }
            : p,
        ),
      );
      showToast("Guardado.", "ok");
    } catch {
      showToast("Error al guardar", "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!profile) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/speaker-profiles/${profile.slug}/approve-card`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json() as { cardImageUrl: string };
      setProfiles((prev) =>
        prev.map((p, i) =>
          i === currentIndex ? { ...p, cardApproved: true, cardImageUrl: data.cardImageUrl } : p,
        ),
      );
      setS3ImgKey(Date.now());
      setShowS3(true);
      showToast("Imagen guardada en S3 ✓", "ok");
    } catch {
      showToast("Error al guardar imagen", "err");
    } finally {
      setApproving(false);
    }
  }

  async function handleReset() {
    if (!profile) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/speaker-profiles/${profile.slug}/approve-card`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProfiles((prev) =>
        prev.map((p, i) =>
          i === currentIndex ? { ...p, cardApproved: false, cardImageUrl: "" } : p,
        ),
      );
      setShowS3(false);
      showToast("Canvas reseteado", "ok");
    } catch {
      showToast("Error al resetear", "err");
    } finally {
      setResetting(false);
    }
  }

  async function handleBulkRerender() {
    const approved = profiles.filter((p) => p.cardApproved && p.cardImageUrl && (p.status === "accepted" || p.status === "scheduled"));
    if (approved.length === 0) { showToast("No hay imágenes aprobadas", "err"); return; }
    setBulkRunning(true);
    setBulkProgress({ done: 0, failed: 0, total: approved.length });
    let done = 0; let failed = 0;
    for (const p of approved) {
      try {
        const res = await fetch(`/api/speaker-profiles/${p.slug}/approve-card`, { method: "POST" });
        if (!res.ok) throw new Error();
        done++;
      } catch {
        failed++;
      }
      setBulkProgress({ done: done + failed, failed, total: approved.length });
    }
    setS3ImgKey(Date.now());
    setBulkRunning(false);
    showToast(`Listo: ${done} actualizadas, ${failed} fallidas`, done > 0 ? "ok" : "err");
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-aws-orange" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-sm text-surface-400">
        No hay perfiles de speakers.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header + nav */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
            canvas editor
          </h1>
          <p className="font-mono text-xs text-surface-300 mt-0.5">
            {profile.name} — <span className="text-surface-400">{profile.status}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="border-2 border-surface-600 p-2 text-surface-300 hover:bg-surface-800 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono text-sm text-surface-300">
            {currentIndex + 1} / {profiles.length}
          </span>
          <button
            onClick={() => goTo(currentIndex + 1)}
            disabled={currentIndex === profiles.length - 1}
            className="border-2 border-surface-600 p-2 text-surface-300 hover:bg-surface-800 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Preview */}
        <div className="flex flex-col gap-3">
          {/* Tab toggle */}
          <div className="flex items-center gap-1 border-2 border-surface-600 bg-surface-700/40 p-1 w-fit">
            <button
              onClick={() => setShowS3(false)}
              className={`px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                !showS3
                  ? "bg-surface-700 text-surface-100"
                  : "text-surface-300 hover:text-surface-300"
              }`}
            >
              En vivo
            </button>
            <button
              onClick={() => setShowS3(true)}
              disabled={!profile.cardImageUrl}
              className={`px-3 py-1.5 font-mono text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                showS3
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-surface-300 hover:text-surface-300"
              }`}
            >
              {profile.cardApproved ? "✓ Imagen S3" : "Imagen S3"}
            </button>
          </div>

          {/* Image area */}
          <div className="relative overflow-hidden border-2 border-surface-600 bg-surface-900">
            {(imgLoading || !previewUrl) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-900/60" style={{ minHeight: 320 }}>
                <Loader2 className="h-6 w-6 animate-spin text-aws-orange" />
              </div>
            )}
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={profile.slug + (showS3 ? "-s3" : "-live")}
                src={showS3 && profile.cardImageUrl ? `${profile.cardImageUrl}?cb=${s3ImgKey}` : previewUrl}
                alt="Card preview"
                className="block w-full h-auto"
                onLoadStart={() => setImgLoading(true)}
                onLoad={() => setImgLoading(false)}
                onError={() => setImgLoading(false)}
              />
            )}
          </div>

          {profile.cardImageUrl && (
            <div className="border-2 border-surface-600 bg-surface-800 px-3 py-2">
              <p className="font-mono text-[10px] text-surface-300 mb-1">URL S3</p>
              <p className="font-mono text-xs text-aws-orange break-all">{profile.cardImageUrl}</p>
            </div>
          )}
        </div>

        {/* Right: Editor */}
        <div className="flex flex-col gap-5">

          {/* Texto */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block font-mono text-xs font-semibold text-surface-300">Título (en card)</label>
              <textarea
                value={talkTitleCard}
                onChange={(e) => setTalkTitleCard(e.target.value)}
                rows={3}
                className="w-full border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-sm text-surface-100 placeholder:text-surface-400 focus:border-aws-orange focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs font-semibold text-surface-300">Rol / cargo (en card)</label>
              <input
                value={roleCard}
                onChange={(e) => setRoleCard(e.target.value)}
                className="w-full border-2 border-surface-600 bg-surface-800 px-3 py-2 font-mono text-sm text-surface-100 placeholder:text-surface-400 focus:border-aws-orange focus:outline-none"
              />
            </div>
          </div>

          {/* Posición y tamaño */}
          <div className="flex flex-col gap-3 border-2 border-surface-600 bg-surface-800 p-4">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-surface-300 mb-1">Posición y tamaño</p>
            <NumField label="Columna X" value={contentX} onChange={setContentX} min={400} max={700} step={1} hint="(default 530)" />
            <NumField label="Título Y" value={contentY} onChange={setContentY} min={50} max={450} step={1} hint="(default 180)" />
            <NumField label="Nombre Y" value={nameOffset} onChange={setNameOffset} min={200} max={900} step={1} hint="(default 532)" />
            {/* Title font size */}
            {(() => {
              const autoVal = talkTitleCard.length <= 60 ? 49 : talkTitleCard.length <= 80 ? 41 : talkTitleCard.length <= 105 ? 34 : 27;
              return (
                <div className="flex items-center gap-3">
                  <label className="w-36 shrink-0 font-mono text-xs text-surface-400">Tamaño título</label>
                  <input
                    type="number"
                    value={titleSize > 0 ? titleSize : autoVal}
                    min={14} max={72} step={1}
                    onChange={(e) => setTitleSize(Number(e.target.value))}
                    className="w-24 border-2 border-surface-600 bg-surface-800 px-2 py-1 font-mono text-sm text-aws-orange text-center focus:border-aws-orange focus:outline-none"
                  />
                  {titleSize === 0 ? (
                    <span className="font-mono text-[10px] text-surface-600">AUTO</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTitleSize(0)}
                      className="font-mono text-[10px] text-surface-300 hover:text-surface-300 underline"
                    >
                      auto
                    </button>
                  )}
                </div>
              );
            })()}
            {/* Name font size */}
            <NumField label="Tamaño nombre" value={nameSize} onChange={setNameSize} min={14} max={72} step={1} hint="(default 40)" />
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-3 pt-1 border-t-2 border-surface-600">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 border-2 border-aws-orange/30 bg-aws-orange/10 px-4 py-2.5 font-mono text-sm font-semibold text-aws-orange hover:bg-aws-orange/20 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar cambios
            </button>

            <div className="flex flex-col gap-1.5">
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex items-center justify-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 font-mono text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
              >
                {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Guardar imagen del card en S3
              </button>
              <div className="flex items-start gap-1.5 px-1">
                <Info className="h-3 w-3 mt-0.5 shrink-0 text-surface-600" />
                <p className="font-mono text-[10px] text-surface-600 leading-relaxed">
                  Solo guarda la imagen del card. No aprueba al speaker como ponente.
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center justify-center gap-2 border-2 border-surface-600 px-4 py-2.5 font-mono text-sm text-surface-400 hover:bg-surface-800 disabled:opacity-50 transition-colors"
            >
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Resetear imagen guardada
            </button>
          </div>
        </div>
      </div>

      {/* Bulk re-render */}
      <div className="border-2 border-surface-600 bg-surface-800 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm font-semibold text-surface-200">Regenerar todas las imágenes en S3</p>
            <p className="mt-1 font-mono text-xs text-surface-300 leading-relaxed">
              Re-genera y sube a S3 las imágenes de todos los speakers con canvas aprobado, usando los tracks actuales.
              La URL en S3 no cambia — los enlaces enviados por correo siguen funcionando.
            </p>
            <p className="mt-1.5 font-mono text-xs text-surface-600">
              {profiles.filter((p) => p.cardApproved && p.cardImageUrl && (p.status === "accepted" || p.status === "scheduled")).length} speakers aprobados con imagen en S3 · se procesan una a una
            </p>
          </div>
          <button
            onClick={handleBulkRerender}
            disabled={bulkRunning}
            className="shrink-0 flex items-center gap-2 border-2 border-aws-orange/30 bg-aws-orange/10 px-4 py-2.5 font-mono text-sm font-semibold text-aws-orange hover:bg-aws-orange/20 disabled:opacity-50 transition-colors"
          >
            {bulkRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {bulkRunning ? "Regenerando..." : "Regenerar todas"}
          </button>
        </div>

        {bulkProgress && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs text-surface-400">
                {bulkProgress.done} / {bulkProgress.total}
                {bulkProgress.failed > 0 && <span className="text-red-400 ml-2">· {bulkProgress.failed} fallidas</span>}
              </span>
              <span className="font-mono text-xs text-surface-300">
                {Math.round((bulkProgress.done / bulkProgress.total) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-surface-700 overflow-hidden">
              <div
                className="h-full bg-aws-orange transition-all duration-300"
                style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 border px-4 py-3 font-mono text-sm shadow-lg ${
            toast.type === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {toast.type === "err" && <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

// useSearchParams requiere un <Suspense> alrededor
export default function CanvasEditorPage() {
  return (
    <Suspense>
      <CanvasEditorPageInner />
    </Suspense>
  );
}
