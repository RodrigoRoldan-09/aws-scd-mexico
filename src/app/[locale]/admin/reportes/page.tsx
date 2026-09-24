"use client";

import { useAuth } from "@/contexts/auth-context";
import { Download, Award } from "lucide-react";

interface ReportCard {
  title: string;
  desc: string;
  href: string;
  icon: React.ElementType;
  accent: string;
}

const REPORTS: ReportCard[] = [
  {
    title: "Base de datos para Credly",
    desc: "Consolidado de TODOS para solicitar badges digitales: organizadores, voluntarios (activos resaltados), speakers (presenciales y virtuales) y asistentes (check-in primero, correos fallidos al final). En inglés, nombres en MAYÚSCULAS, correos tal cual.",
    href: "/api/admin/reports/credly",
    icon: Award,
    accent: "text-emerald-400",
  },
];

export default function ReportesPage() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-mono text-surface-400">No tienes acceso a esta sección</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-2.5">
        <div>
          <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
            reportes
          </h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.href} className="flex flex-col border-2 border-surface-600 bg-surface-800 p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center bg-surface-800">
                  <Icon className={`h-5 w-5 ${r.accent}`} />
                </span>
                <h2 className="font-mono text-sm font-bold text-surface-50">{r.title}</h2>
              </div>
              <p className="flex-1 font-mono text-xs leading-relaxed text-surface-400">{r.desc}</p>
              <a
                href={r.href}
                className="mt-4 inline-flex items-center justify-center gap-2 bg-aws-orange px-4 py-2.5 font-mono text-sm font-bold text-surface-900 transition-all hover:shadow-[0_0_16px_rgba(242,166,240,0.4)]"
              >
                <Download className="h-4 w-4" /> Descargar Excel
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
