/**
 * Funciones de validación de horarios para actividades, workshops y hackatones.
 *
 * Los horarios están en formato "HH:mm" (24 horas, Ciudad de México).
 * Dos intervalos [startA, endA] y [startB, endB] se empalman si y solo si:
 *   Math.max(startA, startB) < Math.min(endA, endB)
 */

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export function doTimesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  return Math.max(sA, sB) < Math.min(eA, eB);
}

export interface ScheduledItem {
  startTime: string;
  endTime: string;
  title?: string;
  titleEn?: string;
  activityId?: string;
  slug?: string;
  type?: string;
}

export function findScheduleConflict<T extends ScheduledItem>(
  target: ScheduledItem,
  existingItems: T[],
): T | null {
  for (const item of existingItems) {
    if (doTimesOverlap(target.startTime, target.endTime, item.startTime, item.endTime)) {
      return item;
    }
  }
  return null;
}
