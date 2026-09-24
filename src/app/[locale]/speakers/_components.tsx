"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Iconos sociales ───────────────────────────────────────────────────────────
export function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
export function XTwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.634zM17.083 20.25h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}
export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// ── Primitivas de formulario ──────────────────────────────────────────────────
export function Field({ label, error, children, hint }: { label?: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="font-mono text-xs font-semibold text-[#E6E4DA]">{label}</span>}
      {children}
      {hint && !error && <p className="font-mono text-[10px] text-[#B4B2A9]">{hint}</p>}
      {error && <p className="font-mono text-xs text-[#E24B4A]">{error}</p>}
    </div>
  );
}

export function TextInput({ value, onChange, onBlur, placeholder, maxLength, className, inputMode, autoComplete }: { value: string; onChange: (v: string) => void; onBlur?: () => void; placeholder?: string; maxLength?: number; className?: string; inputMode?: "text" | "email" | "numeric" | "url"; autoComplete?: string }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // Al salir se recorta lo que sobra: nunca se guarda con espacios al borde.
        onBlur={() => (onBlur ? onBlur() : onChange(value.trim()))}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete ?? "off"}
        spellCheck={false}
        className={cn("w-full rounded-[6px] border border-[#2C2550] bg-[#0E0E1A] px-4 py-3 font-mono text-sm text-[#E6E4DA] placeholder:text-[#73726C] focus:border-[#C143BC] focus:outline-none focus:ring-1 focus:ring-[#C143BC]/30 transition-all", className)}
      />
      {maxLength && value.length > maxLength * 0.8 && (
        <span className="absolute right-3 top-3 font-mono text-[10px] text-[#73726C]">{value.length}/{maxLength}</span>
      )}
    </div>
  );
}

export function Textarea({ value, onChange, placeholder, maxLength, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; rows?: number }) {
  return (
    <div className="relative">
      <textarea
        onBlur={() => onChange(value.trim())}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className="w-full resize-none rounded-[6px] border border-[#2C2550] bg-[#0E0E1A] px-4 py-3 font-mono text-sm text-[#E6E4DA] placeholder:text-[#73726C] focus:border-[#C143BC] focus:outline-none focus:ring-1 focus:ring-[#C143BC]/30 transition-all"
      />
      {maxLength && (
        <span className={cn("absolute right-3 bottom-3 font-mono text-[10px]", value.length > maxLength * 0.9 ? "text-[#D85A30]" : "text-[#73726C]")}>
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}

// ── Subida de foto (S3 vía public presign) ───────────────────────────────────
export function PhotoUpload({ value, onChange, className }: { value: string; onChange: (url: string) => void; className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const upload = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) { setErr("Máximo 8 MB"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setErr("Solo JPG, PNG o WEBP"); return; }
    setErr(null); setUploading(true); setProgress(0);
    try {
      const res = await fetch("/api/upload/public-presign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentType: file.type }) });
      if (!res.ok) throw new Error("Error al obtener URL");
      const { uploadUrl, publicUrl } = await res.json() as { uploadUrl: string; publicUrl: string };
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => { if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100)); });
        xhr.addEventListener("load", () => { if (xhr.status < 300) resolve(); else reject(new Error("S3 error")); });
        xhr.addEventListener("error", () => reject(new Error("Error de red")));
        xhr.open("PUT", uploadUrl); xhr.setRequestHeader("Content-Type", file.type); xhr.send(file);
      });
      onChange(publicUrl);
    } catch (e) { setErr((e as Error).message); }
    finally { setUploading(false); setProgress(0); }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
        className={cn("relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[6px] border-2 border-dashed transition-all", className ?? "aspect-square w-full max-w-[200px]", value ? "border-[#C143BC]" : "border-[#2C2550] bg-[#0E0E1A] hover:border-[#C143BC] hover:bg-[#0E0E1A]/80", uploading && "pointer-events-none cursor-wait")}
      >
        {value && !uploading && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity hover:opacity-100">
              <Upload className="h-5 w-5 text-white" />
              <span className="font-mono text-xs font-semibold text-white">Cambiar</span>
            </div>
          </>
        )}
        {!value && !uploading && (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <Upload className="h-7 w-7 text-[#73726C]" />
            <p className="font-mono text-xs font-semibold text-[#B4B2A9]">Subir foto</p>
          </div>
        )}
        {uploading && (
          <div className="flex w-full flex-col items-center gap-2 p-4">
            <div className="h-1.5 w-3/4 overflow-hidden rounded-full bg-[#2C2550]">
              <div className="h-full bg-[#D85A30] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-mono text-xs text-[#B4B2A9]">{progress}%</span>
          </div>
        )}
        {value && !uploading && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(""); }} className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-red-500 transition-colors">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {err && <p className="font-mono text-xs text-[#E24B4A]">{err}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
    </div>
  );
}

export function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

/**
 * Marca del AWS Builder Center: la nube del logotipo de AWS.
 *
 * Va dibujada y no como imagen porque tiene que heredar el color del campo, y
 * un PNG no se puede recolorear.
 */
export function BuilderCenterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
    </svg>
  );
}

// ── Selector tipo card ────────────────────────────────────────────────────────
export function CardSelector<T extends string>({
  options, value, onChange, cols,
}: { options: { value: T; label: string; desc: string; icon: React.ReactNode; disabled?: boolean }[]; value: T | ""; onChange: (v: T) => void; cols?: 2 | 4 }) {
  const gridCols = cols ?? (options.length <= 2 ? 2 : 4);
  return (
    <div className={cn("grid gap-3", gridCols === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={opt.disabled}
          aria-disabled={opt.disabled}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-[6px] border p-4 text-center transition-all",
            opt.disabled
              ? "cursor-not-allowed border-dashed border-[#2C2550] bg-transparent text-[#73726C] [&>span:nth-child(2)]:line-through"
              : value === opt.value
                ? "border-[#D85A30] bg-[#D85A30]/15 text-[#D85A30] shadow-[0_0_16px_rgba(216,90,48,0.25)]"
                : "border-[#2C2550] bg-[#0E0E1A] text-[#B4B2A9] hover:border-[#D85A30]/60 hover:text-[#E6E4DA]",
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center">
            {opt.icon}
          </span>
          <span className="font-mono text-xs font-bold">{opt.label}</span>
          <span className="font-mono text-[10px] opacity-70">{opt.desc}</span>
        </button>
      ))}
    </div>
  );
}
