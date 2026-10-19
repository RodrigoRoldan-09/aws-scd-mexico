"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { localePath } from "@/lib/utils";
import {
  Sparkles,
  Terminal,
  Trophy,
  Users,
  Laptop,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface ActivityItem {
  _id: string;
  slug: string;
  type: "workshop" | "hackathon" | "activity";
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  roomName?: string;
  speakerName?: string;
  level?: string;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  isOpen: boolean;
  maxCapacity: number;
  registeredCount: number;
  spotsLeft: number;
  isSoldOut: boolean;
  formConfig?: {
    requireLaptop?: boolean;
    participationMode?: "individual" | "team" | "both";
    minTeamSize?: number;
    maxTeamSize?: number;
    prerequisitesList?: string[];
    prerequisitesListEn?: string[];
  };
}

export function ActividadesScreen() {
  const locale = (useLocale() === "en" ? "en" : "es") as "es" | "en";
  const isEn = locale === "en";

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<"all" | "workshop" | "hackathon" | "activity">("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadActivities() {
      try {
        setLoading(true);
        const res = await fetch("/api/activities");
        if (!res.ok) throw new Error("No se pudo cargar el catálogo de actividades");
        const data = await res.json();
        setActivities(data.activities || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error al cargar actividades");
      } finally {
        setLoading(false);
      }
    }
    loadActivities();
  }, []);

  const filtered = useMemo(() => {
    return activities.filter((act) => {
      if (typeFilter !== "all" && act.type !== typeFilter) return false;
      if (levelFilter !== "all" && act.level !== levelFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (act.title || "").toLowerCase().includes(q) || (act.titleEn || "").toLowerCase().includes(q);
        const descMatch = (act.description || "").toLowerCase().includes(q) || (act.descriptionEn || "").toLowerCase().includes(q);
        const speakerMatch = (act.speakerName || "").toLowerCase().includes(q);
        const roomMatch = (act.roomName || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !speakerMatch && !roomMatch) return false;
      }
      return true;
    });
  }, [activities, typeFilter, levelFilter, searchQuery]);

  const stats = useMemo(() => {
    const workshops = activities.filter((a) => a.type === "workshop").length;
    const hackathons = activities.filter((a) => a.type === "hackathon").length;
    const activitiesCount = activities.filter((a) => a.type === "activity").length;
    return { workshops, hackathons, activitiesCount };
  }, [activities]);

  return (
    <div className="min-h-screen bg-[#07060D] text-[#E6E4DA] selection:bg-[#D85A30]/30 selection:text-white">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-30">
        <div className="absolute -left-48 top-10 h-96 w-96 rounded-full bg-[#3DD6D0]/20 blur-[120px]" />
        <div className="absolute right-0 top-1/4 h-[32rem] w-[32rem] rounded-full bg-[#D85A30]/15 blur-[150px]" />
        <div className="absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-[#C143BC]/20 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Header Section */}
        <div className="mb-10 text-center sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D85A30]/40 bg-[#D85A30]/10 px-3.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-[#D85A30]">
            <Sparkles className="h-3.5 w-3.5" />
            {isEn ? "SCD Mexico 2026 · Dynamic Experiences" : "SCD México 2026 · Experiencias Prácticas"}
          </div>

          <h1 className="mt-4 font-mono text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            {isEn ? (
              <>
                Hands-on <span className="text-[#3DD6D0]">Workshops</span>, <span className="text-[#D85A30]">Hackathons</span> & <span className="text-[#C143BC]">Special Activities</span>
              </>
            ) : (
              <>
                <span className="text-[#3DD6D0]">Workshops</span> Prácticos, <span className="text-[#D85A30]">Hackatones</span> & <span className="text-[#C143BC]">Actividades</span>
              </>
            )}
          </h1>

          <p className="mx-auto mt-4 max-w-3xl font-mono text-sm leading-relaxed text-[#A8A7A0] sm:text-base">
            {isEn
              ? "Put your cloud skills to the test with live labs, team innovation challenges, and exclusive high-impact mentoring sessions in AWS SCD Mexico 2026."
              : "Lleva tu conocimiento a la práctica en laboratorios reales, compite en retos de arquitectura y participa en dinámicas exclusivas con expertos de la industria."}
          </p>
        </div>

        {/* Business Rule Banner (Compatibility & Schedule Explanations) */}
        <div className="mb-10 overflow-hidden rounded-xl border border-[#2C2550] bg-[#0E0C1B]/80 p-5 backdrop-blur-md sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="rounded-lg border border-[#3DD6D0]/40 bg-[#3DD6D0]/10 p-2 text-[#3DD6D0] shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-white">
                  {isEn ? "Enrollment & Schedule Compatibility Rules" : "Reglas de Inscripción y Compatibilidad de Horarios"}
                </h3>
                <p className="font-mono text-xs leading-relaxed text-[#A8A7A0]">
                  {isEn ? (
                    <>
                      • <strong>Workshops & Hackathons</strong>: Register directly for any number of workshops and hackathons as long as their time slots do not overlap.<br />
                      • <strong>Special Activities</strong>: Apply via the unified priority ranking form. To guarantee fair access, each attendee can be assigned to at most <strong>1 special activity</strong>.
                    </>
                  ) : (
                    <>
                      • <strong>Workshops y Hackatones</strong>: Puedes inscribirte a <strong>múltiples talleres y hackatones</strong> siempre y cuando sus horarios no se empalmen entre sí.<br />
                      • <strong>Actividades Especiales</strong>: Postúlate en el formulario unificado de prioridades. Para asegurar igualdad de oportunidades, cada asistente tendrá como máximo <strong>1 actividad asignada</strong>.
                    </>
                  )}
                </p>
              </div>
            </div>

            <Link
              href={localePath(locale, "/actividades/registro-actividades")}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#C143BC] bg-[#C143BC]/20 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[#C143BC] hover:shadow-[0_0_20px_rgba(193,67,188,0.4)]"
            >
              <span>{isEn ? "Unified Activity Form" : "Formulario de Actividades"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mb-8 flex flex-col gap-4 rounded-xl border border-[#2C2550] bg-[#0C0A17]/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Dynamic Type Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTypeFilter("all")}
              className={`rounded-lg px-3.5 py-1.5 font-mono text-xs font-bold transition-all ${
                typeFilter === "all"
                  ? "bg-white text-black shadow-md"
                  : "border border-[#2C2550] text-[#A8A7A0] hover:border-[#3DD6D0]/50 hover:text-white"
              }`}
            >
              {isEn ? "All" : "Todos"} ({activities.length})
            </button>

            <button
              onClick={() => setTypeFilter("workshop")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-mono text-xs font-bold transition-all ${
                typeFilter === "workshop"
                  ? "bg-[#3DD6D0] text-black font-extrabold shadow-[0_0_15px_rgba(61,214,208,0.3)]"
                  : "border border-[#2C2550] text-[#A8A7A0] hover:border-[#3DD6D0]/50 hover:text-white"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              Workshops ({stats.workshops})
            </button>

            <button
              onClick={() => setTypeFilter("hackathon")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-mono text-xs font-bold transition-all ${
                typeFilter === "hackathon"
                  ? "bg-[#D85A30] text-white font-extrabold shadow-[0_0_15px_rgba(216,90,48,0.3)]"
                  : "border border-[#2C2550] text-[#A8A7A0] hover:border-[#D85A30]/50 hover:text-white"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              Hackathons ({stats.hackathons})
            </button>

            <button
              onClick={() => setTypeFilter("activity")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-mono text-xs font-bold transition-all ${
                typeFilter === "activity"
                  ? "bg-[#C143BC] text-white font-extrabold shadow-[0_0_15px_rgba(193,67,188,0.3)]"
                  : "border border-[#2C2550] text-[#A8A7A0] hover:border-[#C143BC]/50 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isEn ? "Special Activities" : "Actividades"} ({stats.activitiesCount})
            </button>
          </div>

          {/* Level Filter & Search */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#73726C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? "Search by title, speaker..." : "Buscar por título, speaker..."}
                className="w-full rounded-lg border border-[#2C2550] bg-[#090812] py-1.5 pl-8 pr-3 font-mono text-xs text-[#E6E4DA] placeholder:text-[#73726C] outline-none transition-all focus:border-[#3DD6D0] sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#73726C]" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="rounded-lg border border-[#2C2550] bg-[#090812] px-2.5 py-1.5 font-mono text-xs text-[#E6E4DA] outline-none focus:border-[#3DD6D0]"
              >
                <option value="all">{isEn ? "All Levels" : "Todos los niveles"}</option>
                <option value="100">{isEn ? "Level 100 - Beginner" : "Nivel 100 - Inicial"}</option>
                <option value="200">{isEn ? "Level 200 - Intermediate" : "Nivel 200 - Intermedio"}</option>
                <option value="300">{isEn ? "Level 300 - Advanced" : "Nivel 300 - Avanzado"}</option>
                <option value="400">{isEn ? "Level 400 - Expert" : "Nivel 400 - Experto"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#3DD6D0] border-t-transparent" />
            <p className="mt-4 font-mono text-xs uppercase tracking-wider text-[#A8A7A0]">
              {isEn ? "Loading activities..." : "Cargando actividades..."}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-center text-red-300">
            <ShieldAlert className="mx-auto h-8 w-8 text-red-400" />
            <p className="mt-2 font-mono text-sm">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#2C2550] bg-[#0A0914] p-12 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-[#73726C]" />
            <h3 className="mt-3 font-mono text-base font-bold text-white">
              {isEn ? "No activities found" : "No se encontraron actividades"}
            </h3>
            <p className="mt-1 font-mono text-xs text-[#A8A7A0]">
              {isEn ? "Try adjusting your filters or search keywords." : "Prueba cambiando los filtros o el término de búsqueda."}
            </p>
          </div>
        )}

        {/* Activities Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((act) => {
              const isWorkshop = act.type === "workshop";
              const isHackathon = act.type === "hackathon";
              const isActivity = act.type === "activity";

              const typeBadgeColor = isWorkshop
                ? "border-[#3DD6D0]/40 bg-[#3DD6D0]/10 text-[#3DD6D0]"
                : isHackathon
                ? "border-[#D85A30]/40 bg-[#D85A30]/10 text-[#D85A30]"
                : "border-[#C143BC]/40 bg-[#C143BC]/10 text-[#C143BC]";

              const cardBorderColor = isWorkshop
                ? "hover:border-[#3DD6D0]/50 hover:shadow-[0_0_30px_rgba(61,214,208,0.15)]"
                : isHackathon
                ? "hover:border-[#D85A30]/50 hover:shadow-[0_0_30px_rgba(216,90,48,0.15)]"
                : "hover:border-[#C143BC]/50 hover:shadow-[0_0_30px_rgba(193,67,188,0.15)]";

              const displayTitle = (isEn && act.titleEn ? act.titleEn : act.title) || act.title;
              const displayDesc = (isEn && act.descriptionEn ? act.descriptionEn : act.description) || act.description;

              const percentFilled = act.maxCapacity > 0 ? Math.min(100, (act.registeredCount / act.maxCapacity) * 100) : 0;

              return (
                <div
                  key={act._id}
                  className={`group flex flex-col justify-between overflow-hidden rounded-xl border border-[#221C3D] bg-[#0E0C1B] transition-all duration-300 ${cardBorderColor}`}
                >
                  <div className="p-5 sm:p-6">
                    {/* Header tags */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <span className={`rounded-md border px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider ${typeBadgeColor}`}>
                        {act.type === "workshop" ? "Workshop" : act.type === "hackathon" ? "Hackatón" : isEn ? "Special Activity" : "Actividad"}
                      </span>

                      {act.level && (
                        <span className="rounded-md border border-[#2C2550] bg-[#16122B] px-2 py-0.5 font-mono text-[10px] font-bold text-[#E6E4DA]">
                          {isEn ? `Level ${act.level}` : `Nivel ${act.level}`}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-mono text-base font-bold text-white transition-colors group-hover:text-white line-clamp-2">
                      {displayTitle}
                    </h3>

                    {/* Speaker / Facilitator */}
                    {act.speakerName && (
                      <p className="mt-1 font-mono text-xs font-medium text-[#3DD6D0]">
                        {act.speakerName}
                      </p>
                    )}

                    {/* Description */}
                    <p className="mt-3 font-mono text-xs leading-relaxed text-[#A8A7A0] line-clamp-3">
                      {displayDesc}
                    </p>

                    {/* Metadata chips */}
                    <div className="mt-4 flex flex-col gap-2 border-t border-[#1F1938] pt-4 font-mono text-[11px] text-[#C5C4BE]">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-[#D85A30] shrink-0" />
                        <span>{act.startTime} - {act.endTime} hrs</span>
                      </div>

                      {act.roomName && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-[#3DD6D0] shrink-0" />
                          <span className="truncate">{act.roomName}</span>
                        </div>
                      )}

                      {act.formConfig?.requireLaptop && (
                        <div className="flex items-center gap-2 text-[#E6E4DA]">
                          <Laptop className="h-3.5 w-3.5 text-[#C143BC] shrink-0" />
                          <span>{isEn ? "Requires laptop" : "Requiere laptop"}</span>
                        </div>
                      )}

                      {act.formConfig?.participationMode && act.formConfig.participationMode !== "individual" && (
                        <div className="flex items-center gap-2 text-[#3DD6D0]">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {act.formConfig.participationMode === "team"
                              ? isEn ? `Teams of ${act.formConfig.minTeamSize || 1}-${act.formConfig.maxTeamSize || 3}` : `Equipos de ${act.formConfig.minTeamSize || 1} a ${act.formConfig.maxTeamSize || 3}`
                              : isEn ? "Individual or Teams" : "Individual o Equipos"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer / CTA section */}
                  <div className="border-t border-[#1F1938] bg-[#090813] p-5">
                    {/* Capacity bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-[#8E8EA0]">
                          {isActivity
                            ? isEn ? "Capacity (Manual Admin Assign)" : "Cupo asignable"
                            : isEn ? "Available Spots" : "Lugares disponibles"}
                        </span>
                        <span className={`font-bold ${act.isSoldOut ? "text-red-400" : act.spotsLeft <= 5 ? "text-yellow-400" : "text-[#3DD6D0]"}`}>
                          {act.isSoldOut
                            ? isEn ? "Sold Out" : "Agotado"
                            : isActivity
                            ? `${act.spotsLeft} de ${act.maxCapacity}`
                            : `${act.spotsLeft} disponibles`}
                        </span>
                      </div>

                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1A162B]">
                        <div
                          className={`h-full transition-all duration-500 ${
                            act.isSoldOut
                              ? "bg-red-500"
                              : percentFilled > 80
                              ? "bg-yellow-500"
                              : isWorkshop
                              ? "bg-[#3DD6D0]"
                              : isHackathon
                              ? "bg-[#D85A30]"
                              : "bg-[#C143BC]"
                          }`}
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>
                    </div>

                    {/* Button */}
                    {isActivity ? (
                      <Link
                        href={localePath(locale, "/actividades/registro-actividades")}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#C143BC]/80 bg-[#C143BC]/15 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[#C143BC] hover:shadow-[0_0_15px_rgba(193,67,188,0.3)]"
                      >
                        <span>{isEn ? "Choose in Unified Form" : "Elegir en Formulario"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : act.isSoldOut ? (
                      <button
                        disabled
                        className="flex w-full cursor-not-allowed items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-red-400"
                      >
                        {isEn ? "Sold Out" : "Cupo Agotado"}
                      </button>
                    ) : (
                      <Link
                        href={localePath(locale, `/actividades/${act.slug}`)}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all ${
                          isWorkshop
                            ? "border-[#3DD6D0]/80 bg-[#3DD6D0]/15 hover:bg-[#3DD6D0] hover:text-black hover:shadow-[0_0_15px_rgba(61,214,208,0.3)]"
                            : "border-[#D85A30]/80 bg-[#D85A30]/15 hover:bg-[#D85A30] hover:text-white hover:shadow-[0_0_15px_rgba(216,90,48,0.3)]"
                        }`}
                      >
                        <span>{isEn ? "Register for Session" : "Inscribirme a la Dinámica"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
