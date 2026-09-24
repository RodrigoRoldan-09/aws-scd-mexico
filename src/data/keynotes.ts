export interface Keynote {
  firstName: string;
  lastName: string;
  role?: string;
  company?: string;
  talkType?: string;
  talkTitle?: string;
  photo?: string;
  linkedin?: string;
  aws?: boolean;
  profileSlug?: string;
}

/** Keynotes de la edición. Vacío hasta tener los anuncios. */
export const keynotes: Keynote[] = [];
