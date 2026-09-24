"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  aspectRatio?: "square" | "wide";
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  label,
  folder = "speakers",
  aspectRatio = "square",
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const upload = async (file: File) => {
    setError(null);

    if (file.size > 5 * 1024 * 1024) {
      setError("Máximo 5 MB");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("Solo JPG, PNG, WEBP o GIF");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // 1. Get presigned URL
      const res = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, folder }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al obtener URL");
      }

      const { uploadUrl, publicUrl } = await res.json();

      // 2. Upload directly to S3
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`S3 error ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Error de red")));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      onChange(publicUrl);
    } catch (e) {
      setError((e as Error).message || "Error al subir");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFile = (file: File | null | undefined) => {
    if (file) upload(file);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <span className="font-mono text-xs font-medium text-[#E6E4DA]/70">{label}</span>}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden border-2 border-dashed transition-colors",
          aspectRatio === "square" ? "aspect-square" : "aspect-video",
          dragging
            ? "border-[#C143BC] bg-[#C143BC]/10"
            : "border-[#2C2550] bg-[#1E1838] hover:border-[#C143BC]",
          uploading && "cursor-wait pointer-events-none",
        )}
      >
        {value && !uploading && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity hover:opacity-100">
              <Upload className="h-6 w-6 text-white" />
              <span className="font-mono text-xs font-semibold text-white">Cambiar imagen</span>
            </div>
          </>
        )}

        {!value && !uploading && (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
            <ImageIcon className="h-8 w-8 text-[#E6E4DA]/40" />
            <div>
              <p className="font-mono text-xs font-semibold text-[#E6E4DA]/70">
                {dragging ? "Suelta aquí" : "Haz clic o arrastra"}
              </p>
              <p className="font-mono text-[10px] text-[#E6E4DA]/50">JPG, PNG, WEBP · máx 5 MB</p>
            </div>
          </div>
        )}

        {uploading && (
          <div className="flex w-full flex-col items-center justify-center gap-3 p-4">
            <div className="h-1.5 w-3/4 overflow-hidden rounded-full bg-[#2C2550]">
              <div
                className="h-full rounded-full bg-[#C143BC] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="font-mono text-xs text-[#E6E4DA]/60">{progress}%</p>
          </div>
        )}

        {value && !uploading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-red-500"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {error && <p className="font-mono text-xs text-red-400">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
