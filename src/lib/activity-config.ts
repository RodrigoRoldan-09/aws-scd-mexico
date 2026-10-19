import { connectDB } from "@/lib/db";
import { Setting } from "@/models/setting";
import type { ICustomField } from "@/models/activity";

export interface UnifiedActivityFormConfig {
  isOpen: boolean;
  maxPriorities: number;
  requireLaptop: boolean;
  prerequisitesList: string[];
  prerequisitesListEn: string[];
  globalCustomFields: ICustomField[];
}

export const DEFAULT_UNIFIED_ACTIVITY_FORM_CONFIG: UnifiedActivityFormConfig = {
  isOpen: true,
  maxPriorities: 3,
  requireLaptop: false,
  prerequisitesList: ["Contar con registro general al evento."],
  prerequisitesListEn: ["Have a general event registration."],
  globalCustomFields: [],
};

const SETTING_KEY = "unified_activity_form_config";

export async function getUnifiedActivityFormConfig(): Promise<UnifiedActivityFormConfig> {
  await connectDB();
  const setting = await Setting.findOne({ key: SETTING_KEY });
  if (!setting || !setting.value) {
    return DEFAULT_UNIFIED_ACTIVITY_FORM_CONFIG;
  }
  try {
    const parsed = JSON.parse(setting.value);
    return {
      isOpen: typeof parsed.isOpen === "boolean" ? parsed.isOpen : true,
      maxPriorities: typeof parsed.maxPriorities === "number" && parsed.maxPriorities > 0 ? parsed.maxPriorities : 3,
      requireLaptop: !!parsed.requireLaptop,
      prerequisitesList: Array.isArray(parsed.prerequisitesList) ? parsed.prerequisitesList : [],
      prerequisitesListEn: Array.isArray(parsed.prerequisitesListEn) ? parsed.prerequisitesListEn : [],
      globalCustomFields: Array.isArray(parsed.globalCustomFields) ? parsed.globalCustomFields : [],
    };
  } catch {
    return DEFAULT_UNIFIED_ACTIVITY_FORM_CONFIG;
  }
}

export async function setUnifiedActivityFormConfig(
  config: Partial<UnifiedActivityFormConfig>,
): Promise<UnifiedActivityFormConfig> {
  await connectDB();
  const current = await getUnifiedActivityFormConfig();
  const updated: UnifiedActivityFormConfig = {
    isOpen: typeof config.isOpen === "boolean" ? config.isOpen : current.isOpen,
    maxPriorities: typeof config.maxPriorities === "number" && config.maxPriorities > 0 ? config.maxPriorities : current.maxPriorities,
    requireLaptop: typeof config.requireLaptop === "boolean" ? config.requireLaptop : current.requireLaptop,
    prerequisitesList: Array.isArray(config.prerequisitesList) ? config.prerequisitesList : current.prerequisitesList,
    prerequisitesListEn: Array.isArray(config.prerequisitesListEn) ? config.prerequisitesListEn : current.prerequisitesListEn,
    globalCustomFields: Array.isArray(config.globalCustomFields) ? config.globalCustomFields : current.globalCustomFields,
  };

  await Setting.updateOne(
    { key: SETTING_KEY },
    { $set: { key: SETTING_KEY, value: JSON.stringify(updated) } },
    { upsert: true },
  );

  return updated;
}
