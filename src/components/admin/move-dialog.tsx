"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/admin/avatar";
import { HardButton, Panel } from "@/components/admin/ui";
import { MissingFields } from "@/components/admin/missing-fields";

/**
 * Mover a una persona de una lista a otra. Lo usan la consola y los botones
 * del detalle de cada tabla.
 *
 * El flujo es el mismo siempre: se intenta, y si el servidor responde 422 con
 * la lista de campos que faltan, se piden y se reintenta con ellos.
 */

export type MoveKind =
  | "registration_to_volunteer"
  | "volunteer_to_registration"
  | "speaker_to_registration"
  | "attendance_in_person"
  | "attendance_online";

export const MOVE_LABELS: Record<MoveKind, { title: string; desc: string }> = {
  attendance_in_person: {
    title: "Pasar a presencial",
    desc: "Guarda el documento, crea el pasaporte y manda el correo de presencial con QR y pase.",
  },
  attendance_online: {
    title: "Pasar a online",
    desc: "Elimina el pasaporte y manda el correo del track online.",
  },
  registration_to_volunteer: {
    title: "Mover a voluntarios",
    desc: "Crea su postulación de voluntario y elimina el registro de asistente con su pasaporte.",
  },
  volunteer_to_registration: {
    title: "Mover a asistentes",
    desc: "Crea su registro de asistente y elimina la postulación de voluntario.",
  },
  speaker_to_registration: {
    title: "Registrar como asistente",
    desc: "Le crea el registro. La postulación de speaker se conserva.",
  },
};

export type MoveSubject = {
  id: string;
  name: string;
  email: string;
  /** Una línea de contexto: modalidad, estado, si está aprobado… */
  detail?: string;
  /** Con qué se dibuja su carita. Ver `Avatar`. */
  seed?: string;
  photo?: string | null;
};

export function MoveDialog({
  subject,
  move,
  onClose,
  onDone,
}: {
  /** A quién se mueve. `null` cierra el diálogo. */
  subject: MoveSubject | null;
  move: MoveKind | null;
  onClose: () => void;
  /** Se llama cuando el movimiento salió bien, para refrescar la lista. */
  onDone?: (subjectId: string) => void;
}) {
  const { toast } = useToast();
  const [extra, setExtra] = useState<Record<string, unknown>>({});
  const [needs, setNeeds] = useState<string[]>([]);
  const [needsMsg, setNeedsMsg] = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState<string[] | null>(null);

  const close = () => {
    setExtra({});
    setNeeds([]);
    setNeedsMsg("");
    setDone(null);
    onClose();
  };

  const run = async () => {
    if (!subject || !move) return;
    setRunning(true);
    try {
      const res = await fetch("/api/admin/console/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: move, id: subject.id, data: extra }),
      });
      const data = await res.json();

      if (res.status === 422) {
        // El servidor dice exactamente qué falta; se pide y se reintenta.
        setNeeds(data.needs ?? []);
        setNeedsMsg(data.message ?? "Faltan datos para completar el movimiento.");
        return;
      }
      if (!res.ok) {
        toast(data.error || "No se pudo mover", "error");
        return;
      }
      setDone(data.done ?? []);
      setNeeds([]);
      onDone?.(subject.id);
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setRunning(false);
    }
  };

  const label = move ? MOVE_LABELS[move] : null;

  return (
    <Modal open={!!subject && !!move} onClose={close} title="Mover a alguien" size="xl">
      {subject && label && (
        <div className="flex flex-col gap-5">
          {/* Quién */}
          <div className="flex items-center gap-3 border-2 border-surface-600 bg-surface-800 p-3">
            <Avatar seed={subject.seed} name={subject.name} email={subject.email} photo={subject.photo} size={44} />
            <div className="min-w-0">
              <p className="m-0 truncate font-mono text-sm font-bold text-surface-50">{subject.name}</p>
              <p className="m-0 truncate font-mono text-xs text-surface-300">
                {subject.email}
                {subject.detail ? ` · ${subject.detail}` : ""}
              </p>
            </div>
          </div>

          {/* Qué va a pasar */}
          <div className="flex gap-3 border-l-2 border-aws-orange pl-3">
            <ArrowRightLeft className="mt-0.5 h-4 w-4 shrink-0 text-aws-orange" />
            <div>
              <p className="m-0 font-mono text-sm font-bold text-aws-orange">{label.title}</p>
              <p className="m-0 mt-1 font-mono text-xs leading-relaxed text-surface-200">{label.desc}</p>
            </div>
          </div>

          {needs.length > 0 && !done && (
            <Panel tone="warn" label="Faltan datos">
              <p className="m-0 mb-4 flex items-start gap-2 font-mono text-xs leading-relaxed text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {needsMsg}
              </p>
              <MissingFields
                needs={needs}
                values={extra}
                onChange={(k, v) => setExtra((p) => ({ ...p, [k]: v }))}
              />
            </Panel>
          )}

          {done && (
            <Panel tone="good" label="Hecho">
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {done.map((d) => (
                  <li key={d} className="flex items-start gap-2 font-mono text-xs text-surface-100">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                    {d}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <HardButton tone="ghost" onClick={close}>
              {done ? "Cerrar" : "Cancelar"}
            </HardButton>
            {!done && (
              <HardButton onClick={run} disabled={running} icon={ArrowRightLeft}>
                {running ? "Moviendo…" : needs.length ? "Guardar y mover" : "Mover"}
              </HardButton>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
