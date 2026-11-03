"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, ShieldAlert, ScanLine, Search } from "lucide-react";
import { ScanStatus, type ScanResult } from "../_scan-status";
import { ScanManual } from "../_scan-manual";

interface RoomOption {
  id: string;
  name: string;
  capacity?: number;
}

interface AgendaSession {
  _id: string;
  title: string;
  room: string;
  startTime: string;
  speakerId?: string;
  sessionType?: string;
  speaker?: string;
  activityId?: string;
  activitySlug?: string;
  isActivity?: boolean;
  activityType?: "workshop" | "hackathon" | "activity";
  maxCapacity?: number;
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
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [allSessions, setAllSessions] = useState<AgendaSession[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<AgendaSession | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [localCount, setLocalCount] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/agenda").then((r) => r.json()).catch(() => ({})),
      fetch("/api/rooms").then((r) => r.json()).catch(() => ({})),
      fetch("/api/activities?admin=1").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([agendaData, roomsData, activitiesData]) => {
        const loadedRooms: RoomOption[] = (
          ((roomsData.rooms || []) as { _id?: string; id?: string; name?: string; capacity?: number }[])
        )
          .map((r) => ({
            id: String(r._id || r.id || ""),
            name: (r.name || "").trim(),
            capacity: r.capacity,
          }))
          .filter((r) => r.name);

        const rawActivities = ((activitiesData.activities || []) as {
          _id: string;
          slug: string;
          title: string;
          type: "workshop" | "hackathon" | "activity";
          roomName?: string;
          roomId?: string;
          startTime?: string;
          endTime?: string;
          maxCapacity?: number;
          agendaEventId?: string;
          speakerName?: string;
        }[]);

        // Indexar actividades por agendaEventId y por título normalizado
        const actByAgendaId = new Map<string, (typeof rawActivities)[0]>();
        const actByTitle = new Map<string, (typeof rawActivities)[0]>();
        rawActivities.forEach((act) => {
          if (act.agendaEventId) actByAgendaId.set(String(act.agendaEventId), act);
          if (act.title) actByTitle.set(act.title.trim().toLowerCase(), act);
        });

        // Bloques de la agenda (que no sean virtuales)
        const matchedActivityIds = new Set<string>();
        const events: AgendaSession[] = (
          ((agendaData.events || []) as (AgendaSession & { speaker?: string })[]) || []
        )
          .filter((e) => e.sessionType !== "online")
          .map((e) => {
            const matchedAct =
              actByAgendaId.get(String(e._id)) ||
              actByTitle.get((e.title || "").trim().toLowerCase());
            if (matchedAct) {
              matchedActivityIds.add(String(matchedAct._id));
              return {
                ...e,
                activityId: String(matchedAct._id),
                activitySlug: matchedAct.slug,
                isActivity: true,
                activityType: matchedAct.type,
                maxCapacity: matchedAct.maxCapacity,
              };
            }
            return e;
          })
          .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

        // Agregar actividades que no estaban en la agenda pero tienen horario y sala
        rawActivities.forEach((act) => {
          if (!matchedActivityIds.has(String(act._id))) {
            events.push({
              _id: String(act._id),
              title: act.title,
              room: (act.roomName || "").trim() || "Sin sala asignada",
              startTime: act.startTime || "",
              speaker: act.speakerName || "",
              activityId: String(act._id),
              activitySlug: act.slug,
              isActivity: true,
              activityType: act.type,
              maxCapacity: act.maxCapacity,
            });
          }
        });

        // Asegurar que todas las salas encontradas estén en loadedRooms
        const known = new Set(loadedRooms.map((r) => r.name.toLowerCase()));
        events.forEach((e) => {
          const roomName = (e.room || "").trim();
          if (roomName && !known.has(roomName.toLowerCase())) {
            loadedRooms.push({ id: `manual-${roomName}`, name: roomName, capacity: e.maxCapacity });
            known.add(roomName.toLowerCase());
          }
        });
        rawActivities.forEach((act) => {
          const roomName = (act.roomName || "").trim();
          if (roomName && !known.has(roomName.toLowerCase())) {
            loadedRooms.push({ id: `manual-${roomName}`, name: roomName, capacity: act.maxCapacity });
            known.add(roomName.toLowerCase());
          }
        });

        events.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

        setRooms(loadedRooms);
        setAllSessions(events);
      })
      .catch(() => toast("Error al cargar salas y bloques", "error"));
  }, [toast]);

  // Lista de opciones a mostrar según la sala elegida
  const availableOptions = useMemo<AgendaSession[]>(() => {
    if (selectedRoom !== "all") {
      const roomObj = rooms.find((r) => r.name.toLowerCase() === selectedRoom.toLowerCase());
      const roomBlocks = allSessions.filter(
        (s) => (s.room || "").trim().toLowerCase() === selectedRoom.toLowerCase()
      );
      const general: AgendaSession = {
        _id: `room-${roomObj?.id || selectedRoom}`,
        title: "Acceso general",
        room: selectedRoom,
        startTime: "",
      };
      return [general, ...roomBlocks];
    }

    const generalEntries: AgendaSession[] = rooms.map((r) => ({
      _id: `room-${r.id}`,
      title: "Acceso general",
      room: r.name,
      startTime: "",
    }));

    return [...generalEntries, ...allSessions];
  }, [selectedRoom, rooms, allSessions]);

  // Registra la asistencia (compartido por cámara y manual). Hace el sonido y el
  // conteo, y devuelve el resultado para mostrarlo.
  const submit = useCallback(async (shortId: string): Promise<ScanResult> => {
    if (!selectedSession) return { outcome: "error", primary: "Selecciona una sala o sesión" };
    const res = await fetch("/api/scanner/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shortId,
        sessionId: selectedSession._id,
        sessionTitle: selectedSession.title,
        room: selectedSession.room,
        activityId: selectedSession.activityId,
        activitySlug: selectedSession.activitySlug,
      }),
    });
    const data = await res.json() as {
      found?: boolean;
      alreadyScanned?: boolean;
      notRegistered?: boolean;
      activityTitle?: string;
      message?: string;
      firstName?: string;
      lastName?: string;
      scannedAt?: string;
      role?: string;
    };

    // Validación estricta: No tiene registro previo para esta actividad
    if (data.notRegistered || res.status === 403) {
      playSound("not_found");
      const name = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim();
      return {
        outcome: "error",
        primary: "Acceso denegado",
        name: name || undefined,
        secondary:
          data.message ||
          `No cuenta con registro previo en ${data.activityTitle || selectedSession.title}`,
        role: data.role,
      };
    }

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
    if (!selectedSession) { toast("Selecciona una sala o sesión primero", "error"); return; }
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

      {/* Selector de sala y bloque/sesión */}
      <div className="mb-4 border-2 border-surface-600 bg-surface-800 p-4 space-y-3">
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-surface-400">
            Sala / Salón
          </label>
          <select
            value={selectedRoom}
            onChange={(e) => {
              const rName = e.target.value;
              setSelectedRoom(rName);
              if (scanning) stopScanner();
              setResult(null);
              setLocalCount(0);
              setSelectedSession(null);
            }}
            className="w-full border-2 border-surface-600 bg-surface-900 px-3 py-2.5 font-mono text-sm text-surface-100 focus:outline-none focus:border-aws-orange"
          >
            <option value="all">— Todas las salas —</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}{r.capacity ? ` (cap. ${r.capacity})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-surface-400">
            Bloque o Sesión activa
          </label>
          <select
            value={selectedSession?._id ?? ""}
            onChange={(e) => {
              const s = availableOptions.find((opt) => opt._id === e.target.value) ?? null;
              setSelectedSession(s);
              if (scanning) stopScanner();
              setResult(null);
              setLocalCount(0);
            }}
            className="w-full border-2 border-surface-600 bg-surface-900 px-3 py-2.5 font-mono text-sm text-surface-100 focus:outline-none focus:border-aws-orange"
          >
            <option value="">— Selecciona un bloque o acceso general —</option>
            {selectedRoom !== "all" ? (
              availableOptions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.startTime ? `${s.startTime} · ` : ""}{s.title}
                  {s.isActivity
                    ? ` [${s.activityType === "hackathon" ? "Hackatón" : s.activityType === "workshop" ? "Workshop" : "Actividad"} · Requiere registro]`
                    : s.speaker ? ` (${s.speaker})` : ""}
                </option>
              ))
            ) : (
              <>
                {rooms.map((r) => {
                  const roomBlocks = allSessions.filter(
                    (s) => (s.room || "").trim().toLowerCase() === r.name.toLowerCase()
                  );
                  return (
                    <optgroup key={r.id} label={`Sala: ${r.name}`}>
                      <option value={`room-${r.id}`}>{r.name} · Acceso general</option>
                      {roomBlocks.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.startTime ? `${s.startTime} · ` : ""}{s.title}
                          {s.isActivity
                            ? ` [${s.activityType === "hackathon" ? "Hackatón" : s.activityType === "workshop" ? "Workshop" : "Actividad"} · Requiere registro]`
                            : s.speaker ? ` (${s.speaker})` : ""}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
                {allSessions.filter((s) => !s.room).length > 0 && (
                  <optgroup label="Sin sala asignada">
                    {allSessions
                      .filter((s) => !s.room)
                      .map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.startTime ? `${s.startTime} · ` : ""}{s.title}
                          {s.isActivity
                            ? ` [${s.activityType === "hackathon" ? "Hackatón" : s.activityType === "workshop" ? "Workshop" : "Actividad"} · Requiere registro]`
                            : s.speaker ? ` (${s.speaker})` : ""}
                        </option>
                      ))}
                  </optgroup>
                )}
              </>
            )}
          </select>
        </div>

        {selectedSession && (
          <div className="mt-2 flex flex-col gap-1 border-t border-surface-700 pt-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-surface-400 truncate max-w-[220px]">
                {selectedSession.room}{selectedSession.title !== "Acceso general" ? ` · ${selectedSession.title}` : " · Acceso general"}
              </span>
              <span className="font-mono text-sm font-bold text-aws-orange shrink-0">
                {localCount} escaneados
                {selectedSession.maxCapacity ? ` / cap. ${selectedSession.maxCapacity}` : ""}
              </span>
            </div>
            {selectedSession.isActivity && (
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 mt-1">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Control estricto: solo ingresan asistentes con inscripción confirmada a este {selectedSession.activityType === "hackathon" ? "hackatón" : "workshop"}.
                </span>
              </div>
            )}
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
                      <p className="font-mono text-xs text-surface-400">{selectedSession ? "Cámara desactivada" : "Selecciona una sala o sesión para iniciar"}</p>
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
          disabledHint="Selecciona una sala o sesión primero para registrar asistencia manual"
        />
      )}
    </div>
  );
}
