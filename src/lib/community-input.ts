import {
  cleanWhitespace,
  cleanMultiline,
  normalizeEmail,
  normalizePhone,
  findCountry,
} from "@/lib/normalize";

export type CommunityInput = {
  communityName: string;
  socialUrl: string;
  metrics: string;
  contribution: string;
  contactEmail: string;
  contactPhone: string;
};

type Parsed = { data: CommunityInput } | { error: string };

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? cleanWhitespace(v).slice(0, max) : "";

const multi = (v: unknown, max: number): string =>
  typeof v === "string" ? cleanMultiline(v).slice(0, max) : "";

export function parseCommunityInput(raw: Record<string, unknown>): Parsed {
  const communityName = str(raw.communityName, 120);
  if (!communityName) return { error: "Falta el nombre de la comunidad." };

  const socialUrl = str(raw.socialUrl, 300);
  if (!socialUrl) return { error: "Falta el enlace a redes sociales de la comunidad." };

  const metrics = multi(raw.metrics, 600);
  if (!metrics) return { error: "Falta detallar las métricas de la comunidad." };

  const contribution = multi(raw.contribution, 2000);
  if (!contribution) return { error: "Falta describir qué aportaría la comunidad al evento." };

  const mail = normalizeEmail(str(raw.contactEmail, 200));
  if (!mail.ok) return { error: mail.reason ?? "El correo de contacto no es válido." };

  const phoneCountry = str(raw.contactPhoneCountry, 10) || "MX";
  const tel = normalizePhone(str(raw.contactPhone, 40), findCountry(phoneCountry));
  if (!tel.ok) return { error: tel.reason ?? "El teléfono de contacto no es válido." };

  return {
    data: {
      communityName,
      socialUrl,
      metrics,
      contribution,
      contactEmail: mail.value,
      contactPhone: tel.value,
    },
  };
}
