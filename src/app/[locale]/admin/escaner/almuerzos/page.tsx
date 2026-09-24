"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, ShieldAlert, ScanLine, Search } from "lucide-react";
import { ScanStatus, type ScanResult } from "../_scan-status";
import { ScanManual } from "../_scan-manual";

type MealType = "lunch" | "snack";

const MEAL_LABELS: Record<MealType, string> = { lunch: "Almuerzo", snack: "Refrigerio" };

function playNote(ctx: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.15) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur);
}

function playSound(type: "success" | "already" | "not_found") {
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    if (type === "success") {
      playNote(ctx, 783.99, t, 0.15, "sine", 0.12);
      playNote(ctx, 1318.5, t + 0.2, 0.25, "sine", 0.14);
    } else if (type === "already") {
      playNote(ctx, 440, t, 0.12, "triangle", 0.14);
      playNote(ctx, 349.23, t + 0.15, 0.18, "triangle", 0.12);
    } else {
      playNote(ctx, 196, t, 0.12, "sawtooth", 0.08);
      playNote(ctx, 146.83, t + 0.24, 0.25, "sawtooth", 0.1);
    }
    setTimeout(() => ctx.close(), 800);
  } catch { /* audio unavailable */ }
}

function extractShortId(raw: string): string {
  try {
    const url = new URL(raw);
    const m = url.pathname.match(/pasaporte\/([^/?]+)/);
    if (m) return m[1];
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || raw;
  } catch {
    return raw.trim();
  }
}

export default function AlmuerzosPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [counts, setCounts] = useState({ lunch: 0, snack: 0 });
  const [result, setResult] = useState<ScanResult | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);
  const mealTypeRef = useRef<MealType>(mealType);

  useEffect(() => { mealTypeRef.current = mealType; }, [mealType]);

  // Entrega la comida (compartido por cámara y manual). Usa el tipo activo (ref).
  const submit = useCallback(async (shortId: string): Promise<ScanResult> => {
    const type = mealTypeRef.current;
    const res = await fetch("/api/scanner/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shortId, type }),
    });
    const data = await res.json() as {
      found?: boolean; alreadyClaimed?: boolean; firstName?: string; lastName?: string; claimedAt?: string; claimedBy?: string; role?: string;
    };

    if (!res.ok || !data.found) {
      playSound("not_found");
      return { outcome: "not_found", primary: "No encontrado", secondary: "Esta escarapela no está en pasaportes" };
    }
    const name = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim();
    if (data.alreadyClaimed) {
      const when = data.claimedAt ? new Date(data.claimedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "";
      playSound("already");
      return {
        outcome: "already",
        primary: `Ya reclamó ${MEAL_LABELS[type].toLowerCase()}`,
        name,
        secondary: [when ? `a las ${when}` : "", data.claimedBy ? `· ${data.claimedBy}` : ""].filter(Boolean).join(" ") || undefined,
        role: data.role,
      };
    }
    playSound("success");
    setCounts((c) => ({ ...c, [type]: c[type] + 1 }));
    return { outcome: "success", primary: `${MEAL_LABELS[type]} entregado`, name, role: data.role };
  }, []);

  const handleScan = useCallback(async (raw: string) => {
    const shortId = extractShortId(raw);
    setProcessing(true);
    const r = await submit(shortId).catch((): ScanResult => ({ outcome: "error", primary: "Error de conexión" }));
    setResult(r);
    setProcessing(false);
  }, [submit]);

  const startScanner = async () => {
    if (!scannerRef.current) return;
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Se requiere HTTPS para la cámara. Usa el modo Manual.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setCameraError("Permiso de cámara denegado.");
      return;
    }

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("almuerzos-qr-reader");
      html5QrRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 20 },
        async (decoded) => {
          await scanner.pause();
          await handleScan(decoded);
        },
        () => {},
      );
      setScanning(true);
    } catch (err) {
      setCameraError(`No se pudo iniciar: ${(err as Error).message}`);
    }
  };

  const stopScanner = async () => {
    const scanner = html5QrRef.current as { stop: () => Promise<void> } | null;
    if (scanner) {
      try { await scanner.stop(); } catch { /* ignore */ }
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  const handleNext = () => {
    setResult(null);
    const scanner = html5QrRef.current as { resume: () => void } | null;
    if (scanner && scanning) { try { scanner.resume(); } catch { /* detenido */ } }
  };

  const switchMode = (m: "scan" | "manual") => {
    if (m === mode) return;
    if (m === "manual") stopScanner();
    setResult(null);
    setMode(m);
  };

  useEffect(() => () => { stopScanner(); }, []);

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <div className="flex items-center gap-2.5">
          <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
            control de alimentos
          </h1>
        </div>
      </div>

      {/* Tipo de comida */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {(["lunch", "snack"] as MealType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setMealType(t)}
            className={`border px-4 py-3 font-mono text-sm font-semibold transition-all ${mealType === t ? "border-aws-orange/40 bg-aws-orange/10 text-aws-orange" : "border-surface-600 bg-surface-800 text-surface-400 hover:text-surface-200"}`}
          >
            {MEAL_LABELS[t]}
            <span className="ml-2 bg-surface-700 px-2 py-0.5 text-xs font-normal">{counts[t]}</span>
          </button>
        ))}
      </div>

      {/* Toggle de modo */}
      <div className="mb-4 grid grid-cols-2 gap-2 border-2 border-surface-600 bg-surface-700/40 p-1.5">
        <button
          onClick={() => switchMode("scan")}
          className={`flex items-center justify-center gap-2 py-2.5 font-mono text-sm font-semibold transition-colors ${mode === "scan" ? "bg-aws-orange text-surface-900" : "text-surface-300 hover:text-surface-100"}`}
        >
          <ScanLine className="h-4 w-4" /> Escáner
        </button>
        <button
          onClick={() => switchMode("manual")}
          className={`flex items-center justify-center gap-2 py-2.5 font-mono text-sm font-semibold transition-colors ${mode === "manual" ? "bg-aws-orange text-surface-900" : "text-surface-300 hover:text-surface-100"}`}
        >
          <Search className="h-4 w-4" /> Manual
        </button>
      </div>

      {/* ── Escáner ── */}
      {mode === "scan" && (
        <div className="flex flex-col gap-4">
          {result && <ScanStatus result={result} onNext={handleNext} />}

          <div className="overflow-hidden border-2 border-surface-600 bg-surface-800">
            <div className="relative aspect-[4/3] w-full bg-black">
              <div id="almuerzos-qr-reader" ref={scannerRef} className="absolute inset-0" />
              {!scanning && !result && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                  {cameraError ? (
                    <>
                      <ShieldAlert className="h-10 w-10 text-yellow-400" />
                      <p className="text-center font-mono text-xs leading-relaxed text-yellow-400">{cameraError}</p>
                    </>
                  ) : (
                    <>
                      <Camera className="h-10 w-10 text-surface-300" />
                      <p className="font-mono text-xs text-surface-400">Cámara desactivada</p>
                    </>
                  )}
                </div>
              )}
              {processing && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-aws-orange border-t-transparent" />
                </div>
              )}
            </div>
          </div>

          {!result && (
            <Button onClick={scanning ? stopScanner : startScanner} variant={scanning ? "secondary" : "primary"} className="w-full">
              {scanning ? (<><CameraOff className="mr-2 h-4 w-4" /> Detener escáner</>) : (<><Camera className="mr-2 h-4 w-4" /> Iniciar escáner</>)}
            </Button>
          )}

          {!result && (
            <p className="text-center font-mono text-xs text-surface-300">
              Modo activo: <span className="font-semibold text-aws-orange">{MEAL_LABELS[mealType]}</span>
            </p>
          )}
        </div>
      )}

      {/* ── Manual ── */}
      {mode === "manual" && (
        <ScanManual actionLabel={`Entregar ${MEAL_LABELS[mealType].toLowerCase()}`} confirm={submit} />
      )}
    </div>
  );
}
