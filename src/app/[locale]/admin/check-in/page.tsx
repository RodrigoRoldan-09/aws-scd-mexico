"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, CameraOff, ShieldAlert, Keyboard, Send, ScanLine, Search } from "lucide-react";
import { StatusCard, type CheckInResult } from "./_status-card";
import { ManualCheckIn } from "./_manual";

/* ── Sound feedback via Web Audio API ── */

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
      playNote(ctx, 987.77, t + 0.1, 0.15, "sine", 0.12);
      playNote(ctx, 1318.5, t + 0.2, 0.25, "sine", 0.14);
      playNote(ctx, 1318.5, t + 0.2, 0.3, "triangle", 0.06);
    } else if (type === "already") {
      playNote(ctx, 440, t, 0.12, "triangle", 0.14);
      playNote(ctx, 349.23, t + 0.15, 0.18, "triangle", 0.12);
    } else {
      playNote(ctx, 196, t, 0.12, "sawtooth", 0.08);
      playNote(ctx, 174.61, t + 0.12, 0.12, "sawtooth", 0.08);
      playNote(ctx, 146.83, t + 0.24, 0.25, "sawtooth", 0.1);
    }
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* audio not available */
  }
}

export default function CheckInPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [totalCheckedIn, setTotalCheckedIn] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);

  const startScanner = async () => {
    if (!scannerRef.current) return;
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        window.location.protocol === "http:" && window.location.hostname !== "localhost"
          ? "Se requiere HTTPS para la cámara. Usa el código manual o el modo Manual."
          : "Tu navegador no soporta acceso a la cámara.",
      );
      setShowManual(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      const msg = (err as Error).message || "";
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setCameraError("Permiso de cámara denegado.");
      } else if (msg.includes("NotFound") || msg.includes("DevicesNotFound")) {
        setCameraError("No se encontró cámara.");
      } else {
        setCameraError(
          window.location.protocol === "http:" && window.location.hostname !== "localhost"
            ? "Se requiere HTTPS para la cámara."
            : `Error: ${msg}`,
        );
      }
      setShowManual(true);
      return;
    }

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 20 },
        async (decodedText) => {
          await scanner.pause();
          await handleScan(decodedText);
        },
        () => {},
      );

      setScanning(true);
      setCameraError(null);
    } catch (err) {
      setCameraError(`No se pudo iniciar: ${(err as Error).message}`);
      setShowManual(true);
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

  function extractCode(raw: string): string {
    try {
      const url = new URL(raw);
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || raw;
    } catch {
      return raw;
    }
  }

  const handleScan = async (raw: string) => {
    const qrCode = extractCode(raw.trim());
    setProcessing(true);
    try {
      const res = await fetch("/api/check-in/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ outcome: "new", name: data.name, online: data.online, confirmed: data.confirmed, badgeName: data.badgeName, checkedInAt: data.checkedInAt });
        if (typeof data.totalCheckedIn === "number") setTotalCheckedIn(data.totalCheckedIn);
        playSound("success");
      } else if (res.status === 409) {
        setResult({ outcome: "already", name: data.name, online: data.online, confirmed: data.confirmed, badgeName: data.badgeName, checkedInAt: data.checkedInAt });
        playSound("already");
      } else {
        setResult({ outcome: "not_found" });
        playSound("not_found");
      }
    } catch {
      setResult({ outcome: "error" });
      toast("Error de conexión", "error");
    }
    setProcessing(false);
  };

  // "Siguiente": limpia el resultado y reanuda el escáner (si está activo)
  const handleNext = () => {
    setResult(null);
    const scanner = html5QrRef.current as { resume: () => void } | null;
    if (scanner && scanning) {
      try { scanner.resume(); } catch { /* detenido */ }
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    setManualCode("");
    await handleScan(code);
  };

  const switchMode = (m: "scan" | "manual") => {
    if (m === mode) return;
    if (m === "manual") stopScanner();
    setResult(null);
    setMode(m);
  };

  useEffect(() => {
    return () => { stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md">
      {/* Header + contador */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
            check-in
          </h1>
        </div>
        <div className="border-2 border-surface-600 bg-surface-800 px-4 py-2 text-center">
          <p className="font-mono text-[9px] uppercase tracking-wider text-surface-400">Check-ins</p>
          <p className="font-mono text-2xl font-bold leading-none text-aws-orange">{totalCheckedIn}</p>
        </div>
      </div>

      {/* Toggle de modo */}
      <div className="mb-4 grid grid-cols-2 gap-2 border-2 border-surface-600 bg-surface-700/40 p-1.5">
        <button
          onClick={() => switchMode("scan")}
          className={`flex items-center justify-center gap-2 py-2.5 font-mono text-sm font-semibold transition-colors ${
            mode === "scan" ? "bg-aws-orange text-surface-900" : "text-surface-300 hover:text-surface-100"
          }`}
        >
          <ScanLine className="h-4 w-4" /> Escáner
        </button>
        <button
          onClick={() => switchMode("manual")}
          className={`flex items-center justify-center gap-2 py-2.5 font-mono text-sm font-semibold transition-colors ${
            mode === "manual" ? "bg-aws-orange text-surface-900" : "text-surface-300 hover:text-surface-100"
          }`}
        >
          <Search className="h-4 w-4" /> Manual
        </button>
      </div>

      {/* ── Modo escáner ── */}
      {mode === "scan" && (
        <div className="flex flex-col gap-4">
          {result && <StatusCard result={result} onNext={handleNext} />}

          {/* La cámara queda montada y visible (en pausa durante el resultado) para
              poder reanudar sin reiniciarla. Solo se ocultan los controles. */}
          <div className="overflow-hidden border-2 border-surface-600 bg-surface-800">
            <div className="relative aspect-square w-full bg-black">
              <div id="qr-reader" ref={scannerRef} className="absolute inset-0" />
              {!scanning && !result && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                  {cameraError ? (
                    <>
                      <ShieldAlert className="h-10 w-10 text-yellow-400" />
                      <p className="text-center font-mono text-xs leading-relaxed text-yellow-400">{cameraError}</p>
                    </>
                  ) : (
                    <>
                      <Camera className="h-12 w-12 text-surface-300" />
                      <p className="font-mono text-sm text-surface-400">Cámara desactivada</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {!result && (
            <>
              <div className="flex gap-2">
                <Button onClick={scanning ? stopScanner : startScanner} variant={scanning ? "secondary" : "primary"} className="flex-1">
                  {scanning ? (<><CameraOff className="mr-2 h-4 w-4" /> Detener</>) : (<><Camera className="mr-2 h-4 w-4" /> Activar escáner</>)}
                </Button>
                <Button variant={showManual ? "secondary" : "ghost"} onClick={() => setShowManual(!showManual)} className="shrink-0">
                  <Keyboard className="h-4 w-4" />
                </Button>
              </div>

              {showManual && (
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <div className="flex-1">
                    <Input placeholder="Código QR manual..." value={manualCode} onChange={(e) => setManualCode(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={processing || !manualCode.trim()} className="shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Modo manual (respaldo) ── */}
      {mode === "manual" && <ManualCheckIn onCheckedIn={setTotalCheckedIn} />}
    </div>
  );
}
