import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { SpeakerProfile } from "@/models/speaker-profile";
import { Setting } from "@/models/setting";
// Side-effect import para registrar el schema de Room (lo usa populate)
import "@/models/room";
import type { PublicProfile } from "@/components/sections/speakers";

export const SPEAKERS_TAG = "speakers";

type SortMode =
  | "approval_date" | "name_asc" | "name_desc"
  | "lastname_asc" | "lastname_desc" | "international_first" | "custom";

function buildSort(mode: SortMode): Record<string, 1 | -1> {
  switch (mode) {
    case "name_asc":            return { name: 1 };
    case "name_desc":           return { name: -1 };
    case "lastname_asc":        return { name: 1 };
    case "lastname_desc":       return { name: -1 };
    case "custom":              return { sortOrder: 1, createdAt: 1 };
    case "international_first":  return { speakerType: -1, sortOrder: 1, name: 1 };
    case "approval_date":
    default:                    return { createdAt: 1 };
  }
}

const SELECT_FIELDS =
  "name slug role tagline photo companyLogo social track sessionType countryCity talkTitle language audienceLevel roomId scheduledAt speakerType sortOrder coSpeakers.firstName coSpeakers.lastName coSpeakers.role coSpeakers.tagline coSpeakers.company coSpeakers.companyLogo coSpeakers.bio coSpeakers.photo coSpeakers.countryCity coSpeakers.social";

// Lista pública de speakers publicados, cacheada (invalida con revalidateTag(SPEAKERS_TAG)).
export const getPublicSpeakers = unstable_cache(
  async (): Promise<PublicProfile[]> => {
    await connectDB();

    const sortSetting = await Setting.findOne({ key: "speaker_sort" }).lean<{ value?: string } | null>();
    const sortMode = (sortSetting?.value as SortMode) ?? "approval_date";

    const raw = await SpeakerProfile.find({ isPublic: true })
      .select(SELECT_FIELDS)
      .populate<{ roomId: { name: string } | null }>({ path: "roomId", select: "name" })
      .sort(buildSort(sortMode))
      .lean();

    const profiles = raw.map((p) => {
      const { roomId, ...rest } = p as typeof p & { roomId?: { name: string } | null };
      return { ...rest, room: roomId?.name ?? null };
    });

    return JSON.parse(JSON.stringify(profiles)) as PublicProfile[];
  },
  ["public-speakers"],
  { tags: [SPEAKERS_TAG], revalidate: 120 },
);
