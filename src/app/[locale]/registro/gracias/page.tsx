"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SuccessScreen, type SummaryRow } from "@/components/forms/success-screen";
import { PassportPreview } from "@/components/forms/previews";

/**
 * Confirmación del registro.
 *
 * El nombre y la modalidad los deja `/registro` en sessionStorage al enviar.
 * Si no están —porque alguien llegó por la URL directa, o el navegador bloquea
 * el almacenamiento— la pantalla se muestra igual: la tarjeta sale sin nombre
 * y el mensaje cae en el de presencial, que es la mayoría.
 */

/** Los valores no cambian mientras la página vive: no hay a qué suscribirse. */
const subscribe = () => () => {};

function read(key: string) {
  try {
    return sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

const readName = () => read("scd:nombre");
const readAttendance = () => read("scd:modalidad");
const readSummary = () => read("scd:resumen");
const readEmail = () => read("scd:correo");
const readEntity = () => read("scd:entidad");

export default function GraciasPage() {
  const t = useTranslations("Forms");
  // `useSyncExternalStore` en vez de useState + useEffect: es la forma de leer
  // una fuente externa sin encadenar un render extra al montar, y deja
  // explícito que en el servidor no hay sessionStorage.
  const name = useSyncExternalStore(subscribe, readName, () => "");
  const modalidad = useSyncExternalStore(subscribe, readAttendance, () => "");
  const online = modalidad === "online";

  // El repaso de lo enviado. Si el navegador bloqueó el almacenamiento o
  // alguien llegó por la URL directa, simplemente no se muestra.
  const email = useSyncExternalStore(subscribe, readEmail, () => "");
  const entidad = useSyncExternalStore(subscribe, readEntity, () => "");
  const crudo = useSyncExternalStore(subscribe, readSummary, () => "");
  let rows: SummaryRow[] | undefined;
  try {
    const parsed = crudo ? (JSON.parse(crudo) as SummaryRow[]) : null;
    rows = Array.isArray(parsed) && parsed.length ? parsed : undefined;
  } catch {
    rows = undefined;
  }

  return (
    <SuccessScreen
      kind="attendee"
      attendance={online ? "online" : "in-person"}
      name={name}
      rows={rows}
      preview={
        // Sólo presencial: a quien sigue la transmisión no se le crea
        // pasaporte, así que enseñárselo sería prometerle algo que no va a
        // tener.
        online ? undefined : (
          <PassportPreview
            firstName={name.split(" ")[0] ?? ""}
            lastName={name.split(" ").slice(1).join(" ")}
            email={email}
            extra={entidad}
          />
        )
      }
      extra={
        <p className="font-mono text-sm text-hack-ink/70">
          {t("success_no_mail")}{" "}
          <Link href="/" className="font-bold underline underline-offset-4">
            {t("success_back")}
          </Link>
        </p>
      }
    />
  );
}
