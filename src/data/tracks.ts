/**
 * Etapas y Learning Paths del AWS Student Community Day México 2026.
 *
 * Cuatro etapas que acompañan la trayectoria universitaria del estudiante:
 * 01 DESCUBRE · 02 EXPANDE · 03 PREPÁRATE · 04 CONQUISTA
 */

export interface StageTrack {
  id: string;
  step: string;
  badgeKey: string;
  titleKey: string;
  subtitleKey: string;
  shortDescKey: string;
  longDescKey: string;
  idealKey: string;
  featuresKeys: string[];
  keywords: string[];
  ctaKey: string;
  ctaHref: string;
}

export const tracks: StageTrack[] = [
  {
    id: "descubre",
    step: "01",
    badgeKey: "stage1_badge",
    titleKey: "stage1_title",
    subtitleKey: "stage1_sub",
    shortDescKey: "stage1_short_desc",
    longDescKey: "stage1_long_desc",
    idealKey: "stage1_ideal",
    featuresKeys: [
      "stage1_f1",
      "stage1_f2",
      "stage1_f3",
      "stage1_f4",
    ],
    keywords: ["Conferencias", "Workshops", "Laboratorios", "Charlas técnicas"],
    ctaKey: "stage1_cta",
    ctaHref: "#agenda",
  },
  {
    id: "expande",
    step: "02",
    badgeKey: "stage2_badge",
    titleKey: "stage2_title",
    subtitleKey: "stage2_sub",
    shortDescKey: "stage2_short_desc",
    longDescKey: "stage2_long_desc",
    idealKey: "stage2_ideal",
    featuresKeys: [
      "stage2_f1",
      "stage2_f2",
      "stage2_f3",
      "stage2_f4",
    ],
    keywords: ["Stands", "Comunidades", "Cursos", "Certificaciones", "Networking"],
    ctaKey: "stage2_cta",
    ctaHref: "#communities",
  },
  {
    id: "preparate",
    step: "03",
    badgeKey: "stage3_badge",
    titleKey: "stage3_title",
    subtitleKey: "stage3_sub",
    shortDescKey: "stage3_short_desc",
    longDescKey: "stage3_long_desc",
    idealKey: "stage3_ideal",
    featuresKeys: [
      "stage3_f1",
      "stage3_f2",
      "stage3_f3",
      "stage3_f4",
    ],
    keywords: ["CV en vivo", "Entrevistas", "Foto LinkedIn", "Marca personal"],
    ctaKey: "stage3_cta",
    ctaHref: "#register",
  },
  {
    id: "conquista",
    step: "04",
    badgeKey: "stage4_badge",
    titleKey: "stage4_title",
    subtitleKey: "stage4_sub",
    shortDescKey: "stage4_short_desc",
    longDescKey: "stage4_long_desc",
    idealKey: "stage4_ideal",
    featuresKeys: [
      "stage4_f1",
      "stage4_f2",
      "stage4_f3",
      "stage4_f4",
    ],
    keywords: ["Reclutamiento", "Pasantías", "Prácticas", "Estancias internacionales"],
    ctaKey: "stage4_cta",
    ctaHref: "#sponsors",
  },
];
