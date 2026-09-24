/**
 * Fila de voluntario tal como llega del API al panel.
 *
 * Refleja los campos del modelo: las fechas viajan como texto porque
 * atraviesan JSON, y el resto es idéntico a `IVolunteerSubmission`.
 */
export interface VolunteerRow {
  id: string;

  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;

  role: string;
  roleOther: string | null;
  entityType: string;
  entityName: string | null;
  sbg: string;

  availability: string;
  interestAreas: string[];
  previousExperience: string;
  motivation: string;

  shirtSize: string;
  dietary: string;
  dietaryOther: string | null;
  emergencyName: string;
  emergencyPhone: string;

  consent?: {
    codeOfConduct: string | null;
    privacy: string | null;
  };

  submittedAt: string;
  approved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  certName: string;
  certSentAt: string | null;
}

/** Nombre completo de una fila, con el correo como último recurso. */
export function volunteerName(v: VolunteerRow): string {
  return `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim() || v.email || "—";
}
