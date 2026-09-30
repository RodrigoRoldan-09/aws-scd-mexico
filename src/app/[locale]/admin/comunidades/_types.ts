/**
 * Fila de comunidad aliada tal como llega del API al panel.
 *
 * Refleja los campos de `ICommunitySubmission`: la fecha viaja como texto
 * porque atraviesa JSON.
 */
export type CommunityStatus = "pending" | "approved" | "rejected";

export interface CommunityRow {
  _id: string;
  communityName: string;
  socialUrl: string;
  metrics: string;
  contribution: string;
  contactEmail: string;
  contactPhone: string;
  status: CommunityStatus;
  notes?: string | null;
  submittedAt: string;
}

export const STATUS_LABEL: Record<CommunityStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

/**
 * El enlace de redes lo escribe quien postula, así que sólo se enlaza si es
 * http(s): un `javascript:` en un `href` se ejecutaría con la sesión del panel.
 */
export function safeExternalUrl(raw: string): string | null {
  const value = (raw || "").trim();
  if (!value) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** El enlace sin protocolo ni barra final, para que quepa en una celda. */
export function shortUrl(raw: string): string {
  return (raw || "").trim().replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

/**
 * Una celda de CSV.
 *
 * Además de las comillas, se neutralizan los valores que una hoja de cálculo
 * leería como fórmula: el texto viene de un formulario público. Los teléfonos
 * con prefijo internacional (`+52 …`) se dejan como están.
 */
function csvCell(value: string): string {
  let v = value ?? "";
  if (/^[=+\-@\t\r]/.test(v) && !/^\+[\d\s().-]*$/.test(v)) v = `'${v}`;
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const CSV_COLUMNS: { label: string; value: (c: CommunityRow) => string }[] = [
  { label: "Comunidad", value: (c) => c.communityName },
  { label: "Redes", value: (c) => c.socialUrl },
  { label: "Correo de contacto", value: (c) => c.contactEmail },
  { label: "Teléfono de contacto", value: (c) => c.contactPhone },
  { label: "Estado", value: (c) => STATUS_LABEL[c.status] ?? c.status },
  { label: "Métricas", value: (c) => c.metrics },
  { label: "Aportación", value: (c) => c.contribution },
  { label: "Notas", value: (c) => c.notes ?? "" },
  { label: "Postuló", value: (c) => c.submittedAt },
  { label: "ID", value: (c) => c._id },
];

export function communitiesToCsv(rows: CommunityRow[]): string {
  const header = CSV_COLUMNS.map((c) => csvCell(c.label)).join(",");
  const lines = rows.map((r) => CSV_COLUMNS.map((c) => csvCell(c.value(r))).join(","));
  // El BOM es para que Excel lea los acentos.
  return `﻿${[header, ...lines].join("\r\n")}`;
}
