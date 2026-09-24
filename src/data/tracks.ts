/**
 * Los carriles de contenido del evento, tal como salen en la portada.
 *
 * Cada uno es una imagen: el título, el nivel y los temas están dibujados
 * dentro del PNG. Acá sólo vive lo que el sitio necesita para pintarlos — el
 * orden, la imagen y la clave del título, que se usa como texto alternativo.
 *
 * Ojo con el nombre: `session-tracks.ts` es otra cosa —la categoría a la que
 * pertenece una charla, que se usa en la agenda y en el panel.
 */

export type LearningTrack = {
  id: string;
  /** Clave en `Tracks` de los textos. */
  titleKey: string;
  image: string;
};

export const tracks: LearningTrack[] = [
  { id: "beginner",     titleKey: "beginner_title",     image: "/images/cards/01.png" },
  { id: "intermediate", titleKey: "intermediate_title", image: "/images/cards/02.png" },
  { id: "security",     titleKey: "security_title",     image: "/images/cards/03.png" },
  { id: "soft",         titleKey: "soft_title",         image: "/images/cards/04.png" },
];
