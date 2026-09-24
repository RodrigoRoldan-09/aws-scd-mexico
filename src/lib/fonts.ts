import { Handjet, JetBrains_Mono, Oxanium } from "next/font/google";

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains",
  display: "swap",
});

// Display font del sitio (estética hack): titulares en minúsculas,
// tracking apretado. Se usa vía la utilidad `font-display` de Tailwind.
export const oxanium = Oxanium({
  subsets: ["latin", "latin-ext"],
  variable: "--font-oxanium",
  display: "swap",
});

// Dot-matrix / display de LED. Es la equivalente libre a la MD Thermochrome que
// usa Platanus: variable, con ejes ELGR (densidad de la grilla) y ELSH (forma
// del elemento, 0 = cuadrado … 16 = redondo). Los puntos redondos se piden en
// CSS con `font-variation-settings` — ver la utilidad `.dot-matrix`.
export const handjet = Handjet({
  subsets: ["latin", "latin-ext"],
  axes: ["ELGR", "ELSH"],
  weight: "variable",
  variable: "--font-handjet",
  display: "swap",
});
