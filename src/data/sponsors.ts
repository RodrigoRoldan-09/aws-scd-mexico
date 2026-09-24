import type { Sponsor } from "@/types";

/**
 * Tiers disponibles y cómo afectan la card en la sección Sponsors:
 *
 * "diamond"   —  Cards grandes centradas (máx 2 por fila), glow fuerte, logo h-20
 * "platinum"  —  Grid de 2 columnas, glow plateado, logo h-14
 * "gold"      —  Grid de 3 columnas, glow dorado, logo h-10
 * "community" —  Marquee animado horizontal, logos pequeños h-8, sin card
 */
export const sponsors: Sponsor[] = [
  {
    id: "aws",
    name: "Amazon Web Services",
    logo: "/images/logos/aws-logo.svg",
    url: "https://aws.amazon.com",
    tier: "diamond",
  },
];
