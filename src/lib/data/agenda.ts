import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { AgendaEvent } from "@/models/agenda-event";
import { SpeakerProfile } from "@/models/speaker-profile";
// Side-effect import para registrar el schema de Room
import "@/models/room";

export const AGENDA_TAG = "agenda";

// Forma serializable que consume la vista (todo string/number, sin ObjectId)
export type AgendaEventDTO = {
  _id: string;
  title: string;
  speaker: string;
  speakerSlug?: string;
  speakerPhoto?: string;
  description: string;
  startTime: string;
  endTime: string;
  room: string;
  track: string;
  order: number;
  sessionType?: "presencial" | "online" | "hibrida";
  level?: "" | "100" | "200" | "300" | "400";
  language?: "es" | "en" | "bilingual";
  cta?: string;
  imageUrl?: string;
  cardImageUrl?: string;
};

// Lee la agenda desde la DB, cacheada (se invalida con revalidateTag(AGENDA_TAG)).
export const getAgendaEvents = unstable_cache(
  async (): Promise<AgendaEventDTO[]> => {
    await connectDB();
    const events = await AgendaEvent.find({}).sort({ startTime: 1, room: 1 }).lean<Record<string, unknown>[]>();

    const speakerIds = events
      .map((e) => e.speakerId)
      .filter((id): id is object => id != null)
      .map((id) => String(id));
    const photoMap: Record<string, string> = {};
    if (speakerIds.length > 0) {
      const profiles = await SpeakerProfile.find({ _id: { $in: speakerIds } })
        .select("_id photo").lean<{ _id: unknown; photo?: string }[]>();
      profiles.forEach((p) => { photoMap[String(p._id)] = p.photo ?? ""; });
    }

    return events.map((e) => ({
      _id: String(e._id),
      title: (e.title as string) ?? "",
      speaker: (e.speaker as string) ?? "",
      speakerSlug: (e.speakerSlug as string) ?? "",
      speakerPhoto: e.speakerId ? (photoMap[String(e.speakerId)] ?? "") : "",
      description: (e.description as string) ?? "",
      startTime: (e.startTime as string) ?? "",
      endTime: (e.endTime as string) ?? "",
      room: (e.room as string) ?? "",
      track: (e.track as string) ?? "general",
      order: (e.order as number) ?? 0,
      sessionType: e.sessionType as AgendaEventDTO["sessionType"],
      level: e.level as AgendaEventDTO["level"],
      language: e.language as AgendaEventDTO["language"],
      cta: (e.cta as string) ?? "",
      imageUrl: (e.imageUrl as string) ?? "",
      cardImageUrl: (e.cardImageUrl as string) ?? "",
    }));
  },
  ["agenda-events"],
  { tags: [AGENDA_TAG], revalidate: 120 },
);
