import { connectDB } from "@/lib/db";
import { Activity } from "@/models/activity";
import { getUnifiedActivityFormConfig } from "@/lib/activity-config";
import { toPublicActivityDTO } from "@/lib/activities-dto";
import {
  DEFAULT_UNIFIED_FORM_CONFIG,
  type PublicActivityDTO,
  type UnifiedActivityFormConfig,
} from "@/types/activities";

/** Consultas de servidor para las páginas públicas de actividades. */

const SORT = { order: 1, startTime: 1, createdAt: 1 } as const;

function serialize(docs: unknown[]): PublicActivityDTO[] {
  // `lean()` devuelve ObjectId/Date: pasar por JSON los vuelve serializables para el cliente.
  return (JSON.parse(JSON.stringify(docs)) as Record<string, unknown>[]).map(toPublicActivityDTO);
}

export async function listPublicActivities(): Promise<PublicActivityDTO[]> {
  try {
    await connectDB();
    const docs = await Activity.find({ isPublished: true }).sort(SORT).lean();
    return serialize(docs);
  } catch {
    return [];
  }
}

export async function getPublicActivityBySlug(slug: string): Promise<PublicActivityDTO | null> {
  try {
    await connectDB();
    const doc = await Activity.findOne({
      slug: slug.toLowerCase().trim(),
      isPublished: true,
    }).lean();
    return doc ? serialize([doc])[0] : null;
  } catch {
    return null;
  }
}

export async function getUnifiedFormPublicData(): Promise<{
  config: UnifiedActivityFormConfig;
  activities: PublicActivityDTO[];
}> {
  try {
    await connectDB();
    const [config, docs] = await Promise.all([
      getUnifiedActivityFormConfig(),
      Activity.find({ type: "activity", isPublished: true, isOpen: true }).sort(SORT).lean(),
    ]);
    return { config, activities: serialize(docs) };
  } catch {
    return { config: DEFAULT_UNIFIED_FORM_CONFIG, activities: [] };
  }
}
