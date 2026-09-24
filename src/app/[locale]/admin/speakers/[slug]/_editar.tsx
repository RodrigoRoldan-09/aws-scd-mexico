"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/components/ui/toast";
import { HardButton, SectionHead } from "@/components/admin/ui";
import { SOCIAL_FIELDS, TRACKS, type SpeakerRow } from "../_shared";

/**
 * Editar la ficha de un speaker.
 *
 * Los datos vienen de la fila que ya tiene la pantalla: `GET
 * /api/speaker-profiles/[slug]` sólo devuelve perfiles públicos. Se editan las
 * ocho redes porque `PUT` reemplaza el objeto `social` entero.
 */

const areaCls =
  "w-full resize-none border-2 border-surface-600 bg-surface-900 px-3 py-2.5 font-mono text-sm " +
  "text-surface-100 placeholder:text-surface-400 outline-none transition-colors focus:border-aws-orange";

const labelCls = "mb-1.5 block font-mono text-xs font-medium text-surface-200";

export function EditarPerfil({
  row,
  onSaved,
  onCancel,
}: {
  row: SpeakerRow;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    name: row.name || "",
    role: row.role || "",
    tagline: row.tagline || "",
    company: row.company || "",
    companyLogo: row.companyLogo || "",
    bio: row.bio || "",
    photo: row.photo || "",
    talkTitle: row.talkTitle || "",
    talkAbstract: row.talkAbstract || "",
    track: row.track || "general",
    isPublic: row.isPublic,
    social: { ...row.social },
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const setSocial = (k: keyof SpeakerRow["social"], v: string) =>
    setForm((f) => ({ ...f, social: { ...f.social, [k]: v } }));

  const guardar = async () => {
    if (!form.name.trim()) {
      toast("El nombre no puede quedar vacío", "error");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch(`/api/speaker-profiles/${row.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast(d.error || "No se pudo guardar", "error");
        return;
      }
      toast("Ficha guardada", "success");
      onSaved();
    } catch {
      toast("No se pudo guardar", "error");
    } finally {
      setGuardando(false);
    }
  };

  const copiarTarjeta = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/api/og/speaker/${row.slug}`);
      toast("Enlace copiado", "success");
    } catch {
      toast("No se pudo copiar", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <section>
          <SectionHead title="la persona" />
          <div className="flex flex-col gap-3">
            <Input label="Nombre completo" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej. María Rodríguez" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Cargo" value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="Ej. Cloud Architect" />
              <Input label="Empresa" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Ej. AWS" />
            </div>
            <Input
              label="Tagline"
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="La frase que sale en el home y el directorio"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ImageUpload label="Foto" value={form.photo} onChange={(url) => set("photo", url)} folder="speakers/photos" aspectRatio="square" />
              <ImageUpload label="Logo de la empresa" value={form.companyLogo} onChange={(url) => set("companyLogo", url)} folder="speakers/logos" aspectRatio="wide" />
            </div>
            <div>
              <label className={labelCls} htmlFor="bio">Biografía</label>
              <textarea
                id="bio"
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                maxLength={300}
                rows={3}
                className={areaCls}
                placeholder="Tres líneas sobre quién es."
              />
              <p className="m-0 mt-1 font-mono text-[11px] text-surface-300">{form.bio.length}/300</p>
            </div>
          </div>
        </section>

        <section>
          <SectionHead title="sus redes" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((f) => (
              <Input
                key={f.key}
                label={f.label}
                value={form.social[f.key] ?? ""}
                onChange={(e) => setSocial(f.key, e.target.value)}
                placeholder="https://…"
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHead title="la charla" />
          <div className="flex flex-col gap-3">
            <Input label="Título" value={form.talkTitle} onChange={(e) => set("talkTitle", e.target.value)} placeholder="Ej. Serverless en producción" />
            <div>
              <label className={labelCls} htmlFor="abstract">Resumen</label>
              <textarea
                id="abstract"
                value={form.talkAbstract}
                onChange={(e) => set("talkAbstract", e.target.value)}
                rows={4}
                className={areaCls}
                placeholder="De qué va la charla."
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="track">Track</label>
              <select
                id="track"
                value={form.track}
                onChange={(e) => set("track", e.target.value)}
                className="min-h-11 w-full border-2 border-surface-600 bg-surface-900 px-3 py-2 font-mono text-sm text-surface-100 outline-none focus:border-aws-orange"
              >
                {TRACKS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <SectionHead title="visibilidad" />
          <Switch checked={form.isPublic} onChange={(v) => set("isPublic", v)} label="Visible en el sitio público" />
        </section>

        <div className="grid grid-cols-2 gap-2 border-t-2 border-surface-600 pt-4 sm:flex sm:justify-end">
          <HardButton tone="ghost" onClick={onCancel} disabled={guardando}>Cancelar</HardButton>
          <HardButton onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar cambios"}
          </HardButton>
        </div>
      </div>

      {/* La tarjeta que sale en el sitio, al lado, para ver el efecto al vuelo. */}
      <div className="flex w-full shrink-0 flex-col gap-3 lg:w-64">
        <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-widest text-surface-200">
          Tarjeta del sitio
        </p>
        <div className="border-2 border-surface-600 bg-surface-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/og/speaker/${row.slug}`}
            alt=""
            className="w-full"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <HardButton tone="ghost" icon={Copy} onClick={copiarTarjeta}>Copiar enlace</HardButton>
      </div>
    </div>
  );
}
