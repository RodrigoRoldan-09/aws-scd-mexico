"use client";

import { CheckCircle2, Clock, Copy, ExternalLink, Mail, Phone, XCircle } from "lucide-react";
import { Dato, Datos, HardButton, HardLink, Panel, Tag } from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import {
  STATUS_LABEL, safeExternalUrl, shortUrl,
  type CommunityRow, type CommunityStatus,
} from "./_types";

/** El estado de la postulación, con el mismo lenguaje que las otras listas. */
export function StatusBadge({ status }: { status: CommunityStatus }) {
  if (status === "approved") return <Tag tone="good" icon={CheckCircle2}>{STATUS_LABEL.approved}</Tag>;
  if (status === "rejected") return <Tag tone="danger" icon={XCircle}>{STATUS_LABEL.rejected}</Tag>;
  return <Tag icon={Clock}>{STATUS_LABEL.pending}</Tag>;
}

/**
 * El enlace a redes. Si lo que escribieron no es un enlace http(s) se muestra
 * como texto, sin enlazar.
 */
export function SocialLink({ url, className }: { url: string; className?: string }) {
  const href = safeExternalUrl(url);
  if (!href) return <span className={className}>{url || "—"}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      <span className="inline-flex max-w-full items-center gap-1.5 text-surface-100 underline decoration-surface-500 underline-offset-2 transition-colors hover:text-aws-orange">
        <span className="truncate">{shortUrl(url)}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </span>
    </a>
  );
}

/**
 * Detalle de una postulación de comunidad aliada.
 *
 * Es sólo consulta: los textos largos —métricas y aportación— van enteros, que
 * es lo que no cabe en la tabla.
 */
export function CommunityDetail({ community }: { community: CommunityRow }) {
  const c = community;
  const { toast } = useToast();
  const socialHref = safeExternalUrl(c.socialUrl);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${what} copiado`, "success");
    } catch {
      toast("No se pudo copiar", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="m-0 break-words font-mono text-lg font-bold text-surface-50">{c.communityName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={c.status} />
            <Tag>Postuló {formatDateTime(c.submittedAt)}</Tag>
          </div>
        </div>
        {socialHref && (
          <HardLink icon={ExternalLink} href={socialHref} external>
            Ver redes
          </HardLink>
        )}
      </div>

      <Panel label="Redes sociales">
        <SocialLink url={c.socialUrl} className="block max-w-full break-all font-mono text-sm text-surface-50" />
      </Panel>

      <Panel label="Audiencia y alcance">
        <p className="m-0 break-words whitespace-pre-wrap font-mono text-sm leading-relaxed text-surface-50">
          {c.metrics || "—"}
        </p>
      </Panel>

      <Panel label="Aportación al evento">
        <p className="m-0 break-words whitespace-pre-wrap font-mono text-sm leading-relaxed text-surface-50">
          {c.contribution || "—"}
        </p>
      </Panel>

      <Panel label="Contacto">
        <Datos>
          <Dato label="Correo" value={c.contactEmail} />
          <Dato label="Teléfono" value={c.contactPhone} />
        </Datos>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {c.contactEmail && (
            <>
              <HardLink icon={Mail} href={`mailto:${c.contactEmail}`}>Escribir</HardLink>
              <HardButton tone="ghost" icon={Copy} onClick={() => copy(c.contactEmail, "Correo")}>
                Copiar correo
              </HardButton>
            </>
          )}
          {c.contactPhone && (
            <>
              <HardLink icon={Phone} href={`tel:${c.contactPhone.replace(/[^\d+]/g, "")}`}>Llamar</HardLink>
              <HardButton tone="ghost" icon={Copy} onClick={() => copy(c.contactPhone, "Teléfono")}>
                Copiar teléfono
              </HardButton>
            </>
          )}
        </div>
      </Panel>

      <Panel label="Trámite">
        <Datos>
          <Dato label="Postuló" value={formatDateTime(c.submittedAt)} />
          <Dato
            label="Estado"
            tone={c.status === "approved" ? "good" : c.status === "rejected" ? "danger" : undefined}
            value={STATUS_LABEL[c.status] ?? c.status}
          />
          {c.notes && <Dato label="Notas" value={c.notes} wide />}
        </Datos>
      </Panel>

      <div className="border-t-2 border-surface-600 pt-4">
        <p className="m-0 font-mono text-[10px] text-surface-400">ID: {c._id}</p>
      </div>
    </div>
  );
}
