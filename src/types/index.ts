export interface Speaker {
  id: string;
  name: string;
  role: string;
  company: string;
  bio: string;
  photo: string;
  social: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  sessions: string[];
}

export interface Track {
  id: string;
  titleKey: string;
  descriptionKey: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  icon: string;
  topicKeys: string[];
}

export interface AgendaItem {
  id: string;
  time: string;
  titleKey: string;
  speakerIds: string[];
  descriptionKey: string;
  category: string;
  level: "basic" | "intermediate" | "advanced";
  room: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  url: string;
  tier: "diamond" | "platinum" | "gold" | "community";
}

export interface Organizer {
  id: string;
  name: string;
  role: string;
  /** País del organizador. Se muestra como etiqueta en la tarjeta. */
  country?: "CL" | "CO" | "MX";
  aws?: boolean;
  clubLogo?: string;
  photo: string;
  social: {
    awsBuilder?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface Community {
  id: string;
  name: string;
  category: string;
  badge?: string;
  description?: string;
  logo?: string;
  url?: string;
  social?: {
    meetup?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
    twitter?: string;
    discord?: string;
  };
}

export interface FAQButton {
  labelKey: string;
  url: string;
}

export interface FAQItem {
  id: string;
  questionKey: string;
  answerKey: string;
  buttons?: FAQButton[];
}

export interface NavItem {
  labelKey: string;
  href: string;
}

