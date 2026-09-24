"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, ShieldAlert, ScanLine, Search } from "lucide-react";
import { ScanStatus, type ScanResult } from "../_scan-status";
import { ScanManual } from "../_scan-manual";

interface AgendaSession {
  _id: string;
  title: string;
  room: string;
  startTime: string;
  speakerId?: string;
  sessionType?: string;
}

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

export default function SalasPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [sessions, setSessions] = useState<AgendaSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AgendaSession | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [localCount, setLocalCount] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);

  useEffect(() => {
    fetch("/api/agenda")
      .then((r) => r.json())
      .then((d) => {
        // No mostrar charlas virtuales (online) — solo las que tienen sala física
        const talkSessions = (d.events as AgendaSession[])
          .filter((e) => e.speakerId && e.sessionType !== "online")
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        setSessions(talkSessions);
      })
      .catch(() => toast("Error al cargar sesiones", "error"));
  }, [toast]);

  // Registra la asistencia (compartido por cámara y manual). Hace el sonido y el
  // conteo, y devuelve el resultado para mostrarlo.
  const submit = useCallback(async (shortId: string): Promise<ScanResult> => {
    if (!selectedSession) return { outcome: "error", primary: "Selecciona una sesión" };
    const res = await fetch("/api/scanner/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shortId,
        sessionId: selectedSession._id,
        sessionTitle: selectedSession.title,
        room: selectedSession.room,
      }),
    });
    const data = await res.json() as {
      found?: boolean; alreadyScanned?: boolean; firstName?: string; lastName?: string; scannedAt?: string; role?: string;
    };

    if (!res.ok || !data.found) {
      playSound("not_found");
      return { outcome: "not_found", primary: "No encontrado", secondary: "Esta escarapela no está en pasaportes" };
    }
    const name = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim();
    if (data.alreadyScanned) {
      const when = data.scannedAt ? new Date(data.scannedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "";
      playSound("already");
      return { outcome: "already", primary: "Ya registrado", name, secondary: when ? `Registrado a las ${when}` : undefined, role: data.role };
    }
    playSound("success");
    setLocalCount((c) => c + 1);
    return { outcome: "success", primary: "Asistencia registrada", name, role: data.role };
  }, [selectedSession]);

  const handleScan = useCallback(async (raw: string) => {
    const shortId = extractShortId(raw);
    setProcessing(true);
    const r = await submit(shortId).catch((): ScanResult => ({ outcome: "error", primary: "Error de conexión" }));
    setResult(r);
    setProcessing(false);
  }, [submit]);

  const startScanner = async () => {
    if (!selectedSession) { toast("Selecciona una sesión primero", "error"); return; }
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
      const scanner = new Html5Qrcode("salas-qr-reader");
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
            asistencia a salas
          </h1>
        </div>
      </div>

      {/* Selector de sesión */}
      <div className="mb-4 border-2 border-surface-600 bg-surface-800 p-4">
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-surface-400">Sesión activa</label>
        <select
          value={selectedSession?._id ?? ""}
          onChange={(e) => {
            const s = sessions.find((s) => s._id === e.target.value) ?? null;
            setSelectedSession(s);
            if (scanning) stopScanner();
            setResult(null);
            setLocalCount(0);
          }}
          className="w-full border-2 border-surface-600 bg-surface-900 px-3 py-2.5 font-mono text-sm text-surface-100 focus:outline-none"
        >
          <option value="">— Selecciona una sesión —</option>
          {sessions.map((s) => (
            <option key={s._id} value={s._id}>{s.startTime}{" · "}{s.room}{" · "}{s.title}</option>
          ))}
        </select>
        {selectedSession && (
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-xs text-surface-400">{selectedSession.room}</span>
            <span className="font-mono text-sm font-bold text-aws-orange">{localCount} registradas</span>
          </div>
        )}
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
              <div id="salas-qr-reader" ref={scannerRef} className="absolute inset-0" />
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
                      <p className="font-mono text-xs text-surface-400">{selectedSession ? "Cámara desactivada" : "Selecciona una sesión para iniciar"}</p>
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
            <Button
              onClick={scanning ? stopScanner : startScanner}
              variant={scanning ? "secondary" : "primary"}
              className="w-full"
              disabled={!selectedSession && !scanning}
            >
              {scanning ? (<><CameraOff className="mr-2 h-4 w-4" /> Detener escáner</>) : (<><Camera className="mr-2 h-4 w-4" /> Iniciar escáner</>)}
            </Button>
          )}
        </div>
      )}

      {/* ── Manual ── */}
      {mode === "manual" && (
        <ScanManual
          actionLabel="Registrar asistencia"
          confirm={submit}
          disabled={!selectedSession}
          disabledHint="Selecciona una sesión primero para registrar asistencia manual"
        />
      )}
    </div>
  );
}
