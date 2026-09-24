import { Mail, Clock, Flame } from "lucide-react";

// Tipos y datos estáticos de la página de recordatorios/campañas.

export type CampaignType =
  | "reminder_15d"
  | "reminder_5d"
  | "reminder_5d_unconfirmed"
  | "reminder_1d"
  | "keynote_daniel"
  | "keynote_alejandra"
  | "day_of"
  | "speaker_slides"
  | "speaker_upload"
  | "volunteer_meeting"
  | "volunteer_meeting_today"
  | "volunteer_setup"
  | "confirm_attendance"
  | "confirm_reminder"
  | "confirm_final"
  | "speaker_rejection"
  | "volunteer_recording"
  | "badge_pickup"
  | "passport_guide"
  | "resilience_message"
  | "post_survey"
  | "gallery_recordings"
  | "cert_challenge";

export interface CampaignDoc {
  _id: string;
  type: CampaignType;
  status: "sending" | "done" | "error";
  sentCount: number;
  failedCount: number;
  triggeredBy: string;
  createdAt: string;
}

export interface StatsData {
  campaigns: CampaignDoc[];
  pendingCounts: Record<string, number>;
}

export const REMINDER_CARDS = [
  {
    type: "reminder_15d" as CampaignType,
    label: "15 días antes",
    date: "20 Oct · 8:00 AM",
    icon: Clock,
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    iconBg: "bg-blue-500/10",
    btnActive: "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20",
  },
  {
    type: "reminder_5d" as CampaignType,
    label: "5 días antes",
    date: "30 Oct · 8:00 AM",
    icon: Mail,
    color: "text-aws-orange",
    border: "border-aws-orange/20",
    bg: "bg-aws-orange/5",
    iconBg: "bg-aws-orange/10",
    btnActive: "bg-aws-orange/10 border-aws-orange/30 text-aws-orange hover:bg-aws-orange/20",
  },
  {
    type: "reminder_1d" as CampaignType,
    label: "1 día antes",
    date: "3 Nov · 8:00 AM",
    icon: Flame,
    color: "text-red-400",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    iconBg: "bg-red-500/10",
    btnActive: "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20",
  },
];

export const KEYNOTE_TYPES: CampaignType[] = ["keynote_daniel", "keynote_alejandra"];
