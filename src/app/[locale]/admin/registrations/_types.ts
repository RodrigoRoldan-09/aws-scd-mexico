/**
 * Fila de registro tal como llega del API al panel.
 *
 * Refleja los campos del modelo: las fechas viajan como texto porque
 * atraviesan JSON, y el resto es idéntico a `IRegistration`.
 */
export interface RegistrationRow {
  id: string;

  firstName: string;
  lastName: string;
  email: string;
  attendance: "in-person" | "online";
  documentType: string | null;
  documentNumber: string | null;
  role: string;
  roleOther: string | null;
  entityType: string;
  entityName: string | null;
  consent?: {
    codeOfConduct: string | null;
    privacy: string | null;
  };

  qrCode: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  checkedInBy: string | null;
  isManual?: boolean;
  emailStatus: "pending" | "sent" | "failed" | "skipped";
  emailError: string | null;
  emailSentAt: string | null;
  resendId: string | null;
  confirmation?: {
    confirmed: boolean;
    confirmedAt: string | null;
    badgeFirstName: string;
    badgeLastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

/** Nombre completo de una fila, con el correo como último recurso. */
export function rowName(r: RegistrationRow): string {
  return `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || r.email || "—";
}
