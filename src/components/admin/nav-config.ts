import {
  LayoutDashboard, Users, Mic2, Heart, ClipboardList, QrCode, FileText,
  Calendar, HelpCircle, Settings, Printer,
  Stamp, Mail, ImageIcon, MapPin, Utensils, Activity, FileSpreadsheet, Award,
  SlidersHorizontal, Network,
} from "lucide-react";
import type React from "react";

// Navegación del panel admin. Fuente única usada por el sidebar y por el hub de staff.
export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  exact?: boolean;
}

export interface NavGroup {
  label: string;
  roles: string[];
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "General",
    roles: ["admin", "organizer", "volunteer"],
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "organizer"], exact: true },
      { href: "/admin/evento", label: "Tablero en vivo", icon: Activity, roles: ["admin", "organizer"] },
    ],
  },
  {
    // Las tres listas de gente juntas, que es como se piensan: alguien es
    // asistente, voluntario o speaker, y a veces pasa de una a otra.
    label: "Personas",
    roles: ["admin", "organizer", "volunteer"],
    items: [
      { href: "/admin/registrations", label: "Asistentes", icon: ClipboardList, roles: ["admin", "organizer", "volunteer"] },
      { href: "/admin/volunteers", label: "Voluntarios", icon: Heart, roles: ["admin", "organizer"] },
      { href: "/admin/speakers", label: "Speakers", icon: Mic2, roles: ["admin", "organizer"], exact: true },
      { href: "/admin/comunidades", label: "Comunidades", icon: Network, roles: ["admin", "organizer"] },
      { href: "/admin/users", label: "Cuentas de staff", icon: Users, roles: ["admin"] },
      { href: "/admin/speakers/canvas", label: "Tarjetas de speakers", icon: ImageIcon, roles: ["admin"] },
    ],
  },
  {
    label: "Programa",
    roles: ["admin", "organizer"],
    items: [
      // Una sola entrada: el horario, quién falta por agendar y los salones son
      // el mismo trabajo.
      { href: "/admin/programa", label: "Programa", icon: Calendar, roles: ["admin", "organizer"] },
    ],
  },
  {
    label: "Evento",
    roles: ["admin", "organizer", "volunteer"],
    items: [
      { href: "/admin/check-in", label: "Check-in", icon: QrCode, roles: ["admin", "organizer", "volunteer"] },
      { href: "/admin/pasaportes", label: "Pasaportes", icon: Stamp, roles: ["admin"] },
      { href: "/admin/print", label: "Impresión", icon: Printer, roles: ["admin", "organizer", "volunteer"] },
      { href: "/admin/recordatorios", label: "Recordatorios", icon: Mail, roles: ["admin"] },
      { href: "/admin/certificados", label: "Certificados", icon: Award, roles: ["admin"] },
      { href: "/admin/encuesta", label: "Encuesta", icon: ClipboardList, roles: ["admin"] },
    ],
  },
  {
    label: "Escaner",
    roles: ["admin", "organizer", "volunteer", "badges"],
    items: [
      { href: "/admin/escaner/check-in", label: "Check-in", icon: QrCode, roles: ["admin", "organizer", "volunteer"] },
      { href: "/admin/escaner/salas", label: "Salas", icon: MapPin, roles: ["admin", "organizer", "volunteer"] },
      { href: "/admin/escaner/almuerzos", label: "Almuerzos", icon: Utensils, roles: ["admin", "organizer", "volunteer"] },
      { href: "/admin/escaner/badges", label: "Dar badges", icon: Stamp, roles: ["admin", "organizer", "volunteer", "badges"] },
    ],
  },
  {
    // Todo lo que mira los datos en conjunto, en vez de una lista a la vez.
    label: "Datos",
    roles: ["admin"],
    items: [
      { href: "/admin/consola", label: "Consola", icon: SlidersHorizontal, roles: ["admin"] },
      { href: "/admin/reportes", label: "Reportes", icon: FileSpreadsheet, roles: ["admin"] },
      { href: "/admin/logs", label: "Actividad", icon: FileText, roles: ["admin"] },
    ],
  },
  {
    label: "Sistema",
    roles: ["admin", "organizer"],
    items: [
      { href: "/admin/faq", label: "FAQ", icon: HelpCircle, roles: ["admin", "organizer"] },
      { href: "/admin/config", label: "Configuración", icon: Settings, roles: ["admin"] },
    ],
  },
];
