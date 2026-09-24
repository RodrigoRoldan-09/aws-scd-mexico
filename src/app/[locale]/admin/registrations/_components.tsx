"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  DOC_TYPES,
  ENTITY_TYPES,
  ROLES,
  countryCodeOf,
} from "@/data/attendee-form";
import { EVENT } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import { Check, X, Mail, MailX, Clock, AlertTriangle } from "lucide-react";
import { Tag } from "@/components/admin/ui";
import type { RegistrationRow } from "./_types";

/**
 * Los tres estados de una fila.
 *
 * Van con la misma `Tag` que el resto del panel —borde, versalitas, tono— en
 * vez de tres bloques con su propio relleno cada uno. Se usan igual en la tabla
 * del escritorio y en la tarjeta del teléfono.
 */
export function EmailBadge({ status, error }: { status: string; error?: string | null }) {
  switch (status) {
    case "sent":
      return <Tag tone="good" icon={Mail}>Enviado</Tag>;
    case "failed":
      return <span title={error || "Error"}><Tag tone="danger" icon={MailX}>Error</Tag></span>;
    case "pending":
      return <Tag tone="warn" icon={Clock}>Pendiente</Tag>;
    case "skipped":
      return <Tag icon={AlertTriangle}>Sin correo</Tag>;
    default:
      return <Tag icon={Clock}>—</Tag>;
  }
}

export function CheckInBadge({ checkedIn, checkedInAt }: { checkedIn: boolean; checkedInAt: string | null }) {
  if (!checkedIn) return <Tag icon={X}>Sin check-in</Tag>;
  return (
    <Tag tone="good" icon={Check}>
      {checkedInAt
        ? new Date(checkedInAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
        : "Check-in"}
    </Tag>
  );
}

export function ConfirmedBadge({ confirmation }: { confirmation?: RegistrationRow["confirmation"] }) {
  return confirmation?.confirmed ? (
    <Tag tone="good" icon={Check}>Confirmó</Tag>
  ) : (
    <Tag icon={X}>Sin confirmar</Tag>
  );
}

const MANUAL_COUNTRY = countryCodeOf(EVENT.country);
const manualDocTypes = DOC_TYPES[MANUAL_COUNTRY];
const manualRoles = ROLES[MANUAL_COUNTRY];
const manualEntities = ENTITY_TYPES[MANUAL_COUNTRY];

export function ManualRegistrationForm({
  onCreated,
  onCancel,
}: {
  onCreated: (reg: RegistrationRow) => void;
  onCancel: () => void;
}) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [checkedIn, setCheckedIn] = useState(false);
  const [skipEmail, setSkipEmail] = useState(false);
  const [generatePassport, setGeneratePassport] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();


  const setValue = (id: string, val: string) => setResponses((r) => ({ ...r, [id]: val }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: responses, manual: true, skipEmail, checkedIn, generatePassport }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Error al crear registro", "error");
        return;
      }
      // Build a fake row to add to local state
      const now = new Date().toISOString();
      onCreated({
        id: data.id,
          firstName: responses.firstName ?? "",
          lastName: responses.lastName ?? "",
          email: responses.email ?? "",
          attendance: responses.attendance === "online" ? "online" as const : "in-person" as const,
          documentType: responses.documentType ?? null,
          documentNumber: responses.documentNumber ?? null,
          role: responses.role ?? "other",
          roleOther: null,
          entityType: responses.entityType ?? "none",
          entityName: responses.entityName ?? null,
        qrCode: data.qrCode,
        checkedIn,
        checkedInAt: checkedIn ? now : null,
        checkedInBy: null,
        emailStatus: skipEmail ? "skipped" : "pending",
        emailError: null,
        emailSentAt: null,
        resendId: null,
        createdAt: now,
        updatedAt: now,
      });
    } catch {
      toast("Error al crear registro", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Los campos son los mismos del formulario público. */}
      <Input label="Nombre(s)" required value={responses.firstName ?? ""} onChange={(e) => setValue("firstName", e.target.value)} placeholder="Tu nombre" />
      <Input label="Apellido(s)" required value={responses.lastName ?? ""} onChange={(e) => setValue("lastName", e.target.value)} placeholder="Tu apellido" />
      <Input label="Correo electrónico" required type="email" value={responses.email ?? ""} onChange={(e) => setValue("email", e.target.value)} placeholder="tu@correo.com" />

      <Select
        label="¿Asistirá de manera presencial o virtual?"
        required
        value={responses.attendance ?? ""}
        onChange={(val) => setValue("attendance", val)}
        options={[
          { value: "in-person", label: "Presencial" },
          { value: "online", label: "Virtual" },
        ]}
      />

      {/* El documento sólo aplica a quien va presencialmente, igual que en el
          formulario público. */}
      {responses.attendance === "in-person" && (
        <>
          <Select
            label="Tipo de documento"
            value={responses.documentType ?? ""}
            onChange={(val) => setValue("documentType", val)}
            options={manualDocTypes.map((d) => ({ value: d.value, label: d.label }))}
          />
          <Input
            label="Número de documento"
            value={responses.documentNumber ?? ""}
            onChange={(e) => setValue("documentNumber", e.target.value)}
            placeholder={manualDocTypes.find((d) => d.value === responses.documentType)?.example ?? ""}
          />
        </>
      )}

      <Select
        label="Rol"
        value={responses.role ?? ""}
        onChange={(val) => setValue("role", val)}
        options={manualRoles.map((r) => ({ value: r.value, label: r.label }))}
      />

      <Select
        label="Tipo de entidad"
        value={responses.entityType ?? ""}
        onChange={(val) => setValue("entityType", val)}
        options={manualEntities.map((e) => ({ value: e.value, label: e.label }))}
      />

      <Input
        label="Nombre de la entidad"
        value={responses.entityName ?? ""}
        onChange={(e) => setValue("entityName", e.target.value)}
        placeholder="Universidad, empresa, colegio…"
      />

      {/* Options */}
      <div className="border-2 border-surface-600 bg-surface-800 p-4 flex flex-col gap-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-surface-400">Opciones</p>
        <Checkbox
          label="Generar pasaporte automáticamente"
          checked={generatePassport}
          onChange={setGeneratePassport}
        />
        <Checkbox
          label="Marcar con check-in inmediato"
          checked={checkedIn}
          onChange={(v) => { setCheckedIn(v); if (v) setSkipEmail(true); }}
        />
        <Checkbox
          label="No enviar correo de confirmación"
          checked={skipEmail}
          onChange={setSkipEmail}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "Creando..." : "Crear registro"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
