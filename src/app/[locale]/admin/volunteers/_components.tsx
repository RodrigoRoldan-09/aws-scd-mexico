"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Trash2, UserPlus, Utensils } from "lucide-react";
import { Avatar } from "@/components/admin/avatar";
import { Dato, Datos, HardButton, Panel, Tag } from "@/components/admin/ui";
import { MoveDialog, type MoveKind } from "@/components/admin/move-dialog";
import { formatDateTime } from "@/lib/utils";
import { docTypeLabelOf, entityLabelOf, roleLabelOf } from "@/data/attendee-form";
import {
  availabilityLabelOf,
  dietaryLabelOf,
  experienceLabelOf,
  interestAreasLabelOf,
  sbgLabelOf,
  shirtSizeLabelOf,
} from "@/data/volunteer-form";
import { volunteerName, type VolunteerRow } from "./_types";

/**
 * Detalle de una postulación de voluntario.
 *
 * Los campos van agrupados por para qué sirven —quién es, el día del evento,
 * logística, trámite—, que es como se usan: el pedido de camisetas se hace
 * mirando una sección y el de comida otra.
 *
 * El movimiento a asistentes pasa por el mismo diálogo que la consola, que sabe
 * preguntar lo que falte (acá, si asiste presencial o en línea).
 */

/** Aprobado o pendiente, con el mismo lenguaje que la tabla de asistentes. */
export function ApprovedBadge({ approved }: { approved: boolean }) {
  return approved ? (
    <Tag tone="good" icon={CheckCircle2}>Aprobado</Tag>
  ) : (
    <Tag icon={Clock}>Pendiente</Tag>
  );
}

export function VolunteerDetail({
  volunteer,
  onApprove,
  approving,
  isAdmin,
  onDelete,
  deleting,
  onMoved,
}: {
  volunteer: VolunteerRow;
  onApprove: () => void;
  approving: boolean;
  isAdmin: boolean;
  onDelete: () => void;
  deleting: boolean;
  /** Se llama cuando un movimiento sacó a esta persona de la lista. */
  onMoved: (id: string) => void;
}) {
  const v = volunteer;
  const name = volunteerName(v);
  const [move, setMove] = useState<MoveKind | null>(null);

  const dietaEspecial = !!v.dietary && v.dietary !== "none";

  return (
    <div className="flex flex-col gap-6">
      {/* Quién */}
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <Avatar seed={v.email} name={name} email={v.email} size={56} />
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate font-mono text-lg font-bold text-surface-50">{name}</p>
          <p className="m-0 truncate font-mono text-sm text-surface-300">{v.email || "—"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ApprovedBadge approved={v.approved} />
            {v.shirtSize && <Tag tone="accent">Talla {shirtSizeLabelOf(v.shirtSize)}</Tag>}
            {dietaEspecial && (
              <Tag tone="warn" icon={Utensils}>{dietaryLabelOf(v.dietary, v.dietaryOther)}</Tag>
            )}
          </div>
        </div>
        {!v.approved && (
          <HardButton onClick={onApprove} disabled={approving}>
            {approving ? "Enviando…" : "Enviar aprobación"}
          </HardButton>
        )}
      </div>

      <Panel label="Quién es">
        <Datos>
          <Dato label="Nombre" value={v.firstName} />
          <Dato label="Apellido" value={v.lastName} />
          <Dato label="Correo" value={v.email} />
          <Dato label="Teléfono" value={v.phone} />
          <Dato
            label="Documento"
            value={[docTypeLabelOf(v.documentType), v.documentNumber].filter(Boolean).join(" · ")}
          />
          <Dato label="Rol" value={roleLabelOf(v.role, v.roleOther)} />
          <Dato label="Tipo de entidad" value={entityLabelOf(v.entityType)} />
          <Dato label="Entidad" value={v.entityName} />
          <Dato label="Student Builder Group" value={sbgLabelOf(v.sbg)} wide />
        </Datos>
      </Panel>

      <Panel label="El día del evento">
        <Datos>
          <Dato label="Disponibilidad" value={availabilityLabelOf(v.availability)} />
          <Dato label="Experiencia previa" value={experienceLabelOf(v.previousExperience)} />
          <Dato label="Áreas de interés" value={interestAreasLabelOf(v.interestAreas ?? [])} wide />
          <Dato label="Motivación" value={v.motivation} wide />
        </Datos>
      </Panel>

      <Panel label="Logística">
        <Datos>
          <Dato label="Talla de camiseta" value={shirtSizeLabelOf(v.shirtSize)} />
          <Dato
            label="Alimentación"
            tone={dietaEspecial ? "warn" : undefined}
            value={dietaryLabelOf(v.dietary, v.dietaryOther)}
          />
          <Dato label="Contacto de emergencia" value={v.emergencyName} />
          <Dato label="Teléfono de emergencia" value={v.emergencyPhone} />
        </Datos>
      </Panel>

      <Panel label="Trámite">
        <Datos>
          <Dato label="Postuló" value={formatDateTime(v.submittedAt)} />
          <Dato
            label="Aprobado"
            tone={v.approved ? "good" : undefined}
            value={v.approvedAt ? formatDateTime(v.approvedAt) : "Sin aprobar"}
          />
          <Dato
            label="Certificado"
            tone={v.certSentAt ? "good" : undefined}
            value={v.certSentAt ? formatDateTime(v.certSentAt) : "Sin enviar"}
          />
          <Dato label="Nombre en el certificado" value={v.certName || "El del registro"} />
          <Dato
            label="Código de conducta"
            tone={v.consent?.codeOfConduct ? "good" : "warn"}
            value={v.consent?.codeOfConduct ? formatDateTime(v.consent.codeOfConduct) : "Sin registro"}
          />
          <Dato
            label="Tratamiento de datos"
            tone={v.consent?.privacy ? "good" : "warn"}
            value={v.consent?.privacy ? formatDateTime(v.consent.privacy) : "Sin registro"}
          />
        </Datos>
      </Panel>

      {/* Acciones — sólo admin */}
      <div className="flex flex-col gap-3 border-t-2 border-surface-600 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="m-0 font-mono text-[10px] text-surface-400">ID: {v.id}</p>
        {isAdmin && (
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <HardButton
              tone="ghost"
              icon={UserPlus}
              onClick={() => setMove("volunteer_to_registration")}
              disabled={deleting}
            >
              Mover a asistentes
            </HardButton>
            <HardButton tone="danger" icon={Trash2} onClick={onDelete} disabled={deleting}>
              {deleting ? "Eliminando…" : "Eliminar"}
            </HardButton>
          </div>
        )}
      </div>

      <MoveDialog
        subject={{ id: v.id, name, email: v.email, seed: v.email, detail: v.approved ? "Aprobado" : "Pendiente" }}
        move={move}
        onClose={() => setMove(null)}
        onDone={onMoved}
      />
    </div>
  );
}
