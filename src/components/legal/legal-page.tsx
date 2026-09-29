import { getTranslations } from "next-intl/server";
import { DotHeading } from "@/components/ui/dot-heading";
import { EVENT } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Cáscara de las páginas legales (privacidad, código de conducta).
 *
 * Estas páginas se leen de corrido y con atención, así que la prioridad es la
 * legibilidad por encima del efecto: bloque de color con tinta oscura —el
 * contraste más alto de la paleta—, cuerpo de 16px con interlineado amplio y
 * una medida corta, que es lo que evita perder el renglón en un texto largo.
 *
 * El índice lateral se queda fijo en pantallas anchas: en un documento de
 * quince secciones, saber dónde estás importa más que cualquier animación.
 */

export type LegalSection = {
  id: string;
  title: string;
  body: React.ReactNode;
};

export async function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro?: React.ReactNode;
  sections: LegalSection[];
}) {
  const t = await getTranslations("Forms");

  return (
    <main className="form-block flex min-h-screen flex-col bg-hack-block pt-28">
      <div className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20">
        <header className="mb-12 border-b-2 border-hack-ink/25 pb-8">
          <DotHeading tone="block" variant="inverted">
            {title}
          </DotHeading>
          <p className="mt-4 font-mono text-sm text-hack-ink/60">{updated}</p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="Contenido" className="hidden lg:block">
            <div className="sticky top-28">
              <p className="dot-matrix mb-4 text-base leading-none text-hack-ink/60">
                {t("legal_index")}
              </p>
              <ol className="m-0 flex list-none flex-col gap-2 p-0">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="group flex gap-2.5 font-mono text-[13px] leading-snug text-hack-ink/65 transition-colors hover:text-hack-ink"
                    >
                      <span className="tabular-nums text-hack-ink/40 group-hover:text-hack-ink">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="underline-offset-4 group-hover:underline">
                        {s.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <article className="min-w-0 max-w-[68ch]">
            {intro && (
              <div className="mb-14 border-2 border-hack-ink bg-white/45 p-6 shadow-[6px_6px_0_0_rgba(0,0,0,0.28)]">
                <div className="font-mono text-[15px] leading-[1.75] text-hack-ink">
                  {intro}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-14">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-28">
                  <div className="mb-5 flex items-start gap-4">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border-2 border-hack-ink bg-hack-ink font-mono text-xs font-bold tabular-nums text-hack-block"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 className="m-0 pt-1 font-display text-2xl font-medium leading-tight tracking-tight text-hack-ink">
                      {s.title}
                    </h2>
                  </div>
                  <div className="font-mono text-[15px] leading-[1.75] text-hack-ink/85">
                    {s.body}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </div>

      <div className="overflow-hidden border-t-2 border-hack-ink/25" aria-hidden="true">
        <div className="flex w-max items-center" style={{ animation: "marquee 38s linear infinite" }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "dot-matrix whitespace-nowrap px-6 py-2.5 text-base leading-none sm:text-lg",
                i % 2 === 1 ? "bg-hack-ink text-hack-block" : "text-hack-ink",
              )}
            >
              {EVENT.city} · {EVENT.year} · {title}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}

/** Párrafo con el espaciado del documento. */
export function P({ children }: { children: React.ReactNode }) {
  return <p className="m-0 mb-4 last:mb-0">{children}</p>;
}

/** Lista numerada con el número en morado oscuro, que sí se lee sobre el bloque. */
export function NumberedList({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-hack-deep">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

/** Caja para lo que no debe pasarse por alto: plazos, contactos, avisos. */
export function Callout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 border-l-4 border-hack-ink bg-white/40 py-4 pl-5 pr-4">
      <p className="dot-matrix m-0 mb-2 text-sm leading-none text-hack-deep">{label}</p>
      <div className="m-0">{children}</div>
    </div>
  );
}
