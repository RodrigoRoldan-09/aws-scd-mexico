import { Pixelify_Sans, Share_Tech_Mono } from "next/font/google";

/**
 * Tipografía Display del Design System SBG v1.0.
 * Utilizada para H1, H2, títulos, countdown y números grandes.
 */
export const pixelifySans = Pixelify_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pixelify",
  display: "swap",
});

/**
 * Tipografía Body / Mono del Design System SBG v1.0.
 * Utilizada para párrafos, labels, forms, código y metadatos.
 */
export const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-share-tech",
  display: "swap",
});

// Alias compatibles para evitar roturas de importación antes de que todos los componentes sean migrados
export const oxanium = pixelifySans;
export const jetbrainsMono = shareTechMono;
export const handjet = pixelifySans;

