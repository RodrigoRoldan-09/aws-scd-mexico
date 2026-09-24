"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  ArrowRightLeft, Check, HeartHandshake, MapPin, MonitorPlay,
  QrCode as QrIcon, RefreshCw, Ticket, Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/admin/avatar";
import { Dato, Datos, HardButton, Panel, Tag } from "@/components/admin/ui";
import { MoveDialog, type MoveKind } from "@/components/admin/move-dialog";
import { formatDateTime } from "@/lib/utils";
import {
  attendanceLabelOf,
  docTypeLabelOf,
  entityLabelOf,
  roleLabelOf,
} from "@/data/attendee-form";
import { EmailBadge } from "./_components";
import { rowName, type RegistrationRow } from "./_types";

/**
 * Detalle de un asistente: todo lo que la persona escribió, los
 * consentimientos con su fecha y el pase. Los movimientos pasan por el mismo
 * diálogo que la consola, que sabe pedir lo que falte.
 */
export function RegistrationDetail({
  reg,
  isAdmin,
  onDelete,
  deleting,
  onMoved,
  onEmailResent,
}: {
  reg: RegistrationRow;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  deleting: boolean;
  /** Se llama cuando un movimiento sacó a esta persona de la lista. */
  onMoved: (id: string) => void;
  onEmailResent?: (id: string, status: string, sentAt: string) => void;
}) {
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [resending, setResending] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [move, setMove] = useState<MoveKind | null>(null);

  const online = reg.attendance === "online";
  const name = rowName(reg);
  const conf = reg.confirmation;

  useEffect(() => {
    // El QR sólo se dibuja para quien va a la sede: a quien sigue la
    // transmisión no se le manda ninguno, y pintarlo acá invitaría a dárselo.
    if (online) return;
    QRCode.toDataURL(reg.qrCode, {
      width: 200,
      margin: 2,
      color: { dark: "#FFFFFF", light: "#0A0A0F" },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [reg.qrCode, online]);

  const handleResend = async () => {
    setResending(true);
    try {
      const body = reg.emailError === "Bounced" && newEmail ? { email: newEmail } : {};
      const res = await fetch(`/api/registrations/${reg.id}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Error al reenviar", "error");
        return;
      }
      toast("Correo reenviado correctamente", "success");
      onEmailResent?.(reg.id, data.emailStatus, data.emailSentAt);
    } catch {
      toast("Error al reenviar", "error");
    } finally {
      setResending(false);
    }
  };

  const escarapela = [conf?.badgeFirstName, conf?.badgeLastName].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-6">
      {/* Quién */}
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        {/* La semilla es el `qrCode`, que es el `shortId` de su pasaporte:
            la cara del panel y la de su cartilla son la misma. */}
        <Avatar seed={reg.qrCode} name={name} email={reg.email} size={56} />
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate font-mono text-lg font-bold text-surface-50">{name}</p>
          <p className="m-0 truncate font-mono text-sm text-surface-300">{reg.email || "—"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Tag tone={online ? "neutral" : "accent"} icon={online ? MonitorPlay : MapPin}>
              {online ? "Track online" : "Presencial"}
            </Tag>
            {reg.checkedIn && <Tag tone="good" icon={Check}>Con check-in</Tag>}
            {conf?.confirmed && <Tag tone="good" icon={Ticket}>Confirmó</Tag>}
            {reg.isManual && <Tag tone="warn">Alta manual</Tag>}
          </div>
        </div>
      </div>

      {/* Lo que respondió */}
      <Panel label="Lo que respondió">
        <Datos>
          <Dato label="Nombre" value={reg.firstName} />
          <Dato label="Apellido" value={reg.lastName} />
          <Dato label="Correo" value={reg.email} wide />
          <Dato label="Modalidad" value={attendanceLabelOf(reg.attendance)} />
          <Dato
            label="Documento"
            value={
              reg.documentType
                ? `${docTypeLabelOf(reg.documentType)} · ${reg.documentNumber ?? ""}`.trim()
                : online
                  ? "No se pide en el track online"
                  : ""
            }
          />
          <Dato label="Rol" value={roleLabelOf(reg.role, reg.roleOther)} />
          <Dato label="Tipo de entidad" value={entityLabelOf(reg.entityType)} />
          <Dato label="Entidad" value={reg.entityName} wide />
        </Datos>
      </Panel>

      {/* Consentimientos: con fecha, que es lo que hay que poder demostrar */}
      <Panel label="Consentimientos">
        <Datos>
          <Dato
            label="Código de conducta"
            tone={reg.consent?.codeOfConduct ? "good" : "warn"}
            value={reg.consent?.codeOfConduct ? formatDateTime(reg.consent.codeOfConduct) : "Sin registro"}
          />
          <Dato
            label="Tratamiento de datos"
            tone={reg.consent?.privacy ? "good" : "warn"}
            value={reg.consent?.privacy ? formatDateTime(reg.consent.privacy) : "Sin registro"}
          />
        </Datos>
      </Panel>

      {/* Trámite */}
      <Panel label="Trámite">
        <Datos>
          <Dato label="Se registró" value={formatDateTime(reg.createdAt)} />
          <Dato label="Última modificación" value={formatDateTime(reg.updatedAt)} />
          <Dato
            label="Confirmó asistencia"
            tone={conf?.confirmed ? "good" : undefined}
            wide
            value={
              conf?.confirmed
                ? [
                    conf.confirmedAt ? formatDateTime(conf.confirmedAt) : "Sí",
                    escarapela ? `escarapela: ${escarapela.toUpperCase()}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Sin confirmar"
            }
          />
          <Dato
            label="Check-in"
            tone={reg.checkedIn ? "good" : undefined}
            wide
            value={
              reg.checkedIn
                ? [
                    reg.checkedInAt ? formatDateTime(reg.checkedInAt) : "Sí",
                    reg.checkedInBy ? `por ${reg.checkedInBy}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Pendiente"
            }
          />
          <Dato
            label="Correo de confirmación"
            wide
            value={
              <span className="flex flex-wrap items-center gap-2">
                <EmailBadge status={reg.emailStatus} error={reg.emailError} />
                {reg.emailSentAt && (
                  <span className="text-surface-300">{formatDateTime(reg.emailSentAt)}</span>
                )}
              </span>
            }
          />
          {reg.emailError && <Dato label="Error del correo" value={reg.emailError} tone="danger" wide />}
          {reg.resendId && <Dato label="ID en Resend" value={reg.resendId} wide />}
        </Datos>

        {reg.emailStatus === "failed" && (
          <div className="mt-4 flex flex-col gap-2 border-t-2 border-surface-600 pt-4">
            {reg.emailError === "Bounced" && (
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Correo correcto…"
                className="w-full max-w-sm border-2 border-surface-500 bg-surface-900 px-3 py-2 font-mono text-sm text-surface-50 outline-none placeholder:text-surface-400 focus:border-aws-orange"
              />
            )}
            <HardButton
              tone="ghost"
              icon={RefreshCw}
              onClick={handleResend}
              disabled={resending}
              className="w-fit"
            >
              {resending ? "Reenviando…" : reg.emailError === "Bounced" ? "Corregir y reenviar" : "Reenviar correo"}
            </HardButton>
          </div>
        )}
      </Panel>

      {/* Pase */}
      <Panel label={online ? "Código del registro" : "Pase de acceso"}>
        <div className="flex flex-wrap items-center gap-5">
          {online ? (
            <div className="flex items-center gap-3">
              <MonitorPlay className="h-5 w-5 shrink-0 text-surface-300" />
              <p className="m-0 font-mono text-xs leading-relaxed text-surface-200">
                Sin pase ni pasaporte. Es la referencia interna del registro.
              </p>
            </div>
          ) : qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="Código QR" className="h-32 w-32 shrink-0 border-2 border-surface-500" />
          ) : (
            <div className="h-32 w-32 shrink-0 animate-pulse border-2 border-surface-600 bg-surface-700" />
          )}
          <div className="flex min-w-0 flex-col gap-2">
            <p className="m-0 break-all font-mono text-sm text-surface-100">{reg.qrCode}</p>
            {qrDataUrl && !online && (
              <a
                href={qrDataUrl}
                download={`qr-${reg.qrCode}.png`}
                className="inline-flex w-fit items-center gap-2 border-2 border-surface-500 px-3 py-2 font-mono text-xs font-bold text-surface-100 transition-colors hover:border-aws-orange hover:text-aws-orange"
              >
                <QrIcon className="h-3.5 w-3.5" /> Descargar QR
              </a>
            )}
          </div>
        </div>
      </Panel>

      {/* Acciones */}
      <div className="flex flex-col gap-3 border-t-2 border-surface-600 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="m-0 font-mono text-[10px] text-surface-400">ID: {reg.id}</p>
        {isAdmin && (
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <HardButton
              tone="ghost"
              icon={ArrowRightLeft}
              onClick={() => setMove(online ? "attendance_in_person" : "attendance_online")}
              disabled={deleting}
            >
              {online ? "Pasar a presencial" : "Pasar a online"}
            </HardButton>
            <HardButton
              tone="ghost"
              icon={HeartHandshake}
              onClick={() => setMove("registration_to_volunteer")}
              disabled={deleting}
            >
              Mover a voluntarios
            </HardButton>
            <HardButton tone="danger" icon={Trash2} onClick={() => onDelete(reg.id)} disabled={deleting}>
              {deleting ? "Eliminando…" : "Eliminar"}
            </HardButton>
          </div>
        )}
      </div>

      {/* El mismo diálogo que usa la consola: sabe pedir lo que falte. */}
      <MoveDialog
        subject={{ id: reg.id, name, email: reg.email, seed: reg.qrCode, detail: online ? "Online" : "Presencial" }}
        move={move}
        onClose={() => setMove(null)}
        onDone={onMoved}
      />
    </div>
  );
}
