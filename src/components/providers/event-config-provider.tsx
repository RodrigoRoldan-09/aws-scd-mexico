"use client";

import { createContext, useContext } from "react";
import type { PublicEventConfig } from "@/lib/data/event-config";

// La config pública se carga UNA vez en el layout (servidor) y se reparte por
// Context, así ningún componente del sitio vuelve a hacer fetch a /api/event-config.
const EventConfigContext = createContext<PublicEventConfig | null>(null);

export function EventConfigProvider({
  value,
  children,
}: {
  value: PublicEventConfig;
  children: React.ReactNode;
}) {
  return <EventConfigContext.Provider value={value}>{children}</EventConfigContext.Provider>;
}

const FALLBACK: PublicEventConfig = {
  trackVirtualUrl: "",
  photosUrl: "",
  recordingsUrl: "",
  notify2027Url: "",
  showSponsorsCta: true,
  showSpeakerCta: true,
  attendeeOpen: false,
  volunteerOpen: false,
  cfpOpen: false,
};

export function useEventConfig(): PublicEventConfig {
  return useContext(EventConfigContext) ?? FALLBACK;
}
