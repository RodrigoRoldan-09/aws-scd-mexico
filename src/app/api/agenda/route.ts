import { EVENT } from "@/lib/constants";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { AgendaEvent } from "@/models/agenda-event";
import { SpeakerProfile } from "@/models/speaker-profile";
import { revalidatePublic, AGENDA_TAG, SPEAKERS_TAG } from "@/lib/data/revalidate";
import { createLog } from "@/lib/log";

import { Room } from "@/models/room";

// Día del evento (YYYY-MM-DD) derivado de la fecha oficial.
const EVENT_DAY = new Date(EVENT.date).toISOString().slice(0, 10);

export async function GET() {
  try {
    await connectDB();
    const events = await AgendaEvent.find({}).sort({ startTime: 1, room: 1 }).lean();

    const speakerIds = events.map((e) => e.speakerId).filter((id): id is NonNullable<typeof id> => id != null);
    const photoMap: Record<string, string> = {};
    if (speakerIds.length > 0) {
      const profiles = await SpeakerProfile.find({ _id: { $in: speakerIds } })
        .select("_id photo").lean();
      profiles.forEach((p) => { photoMap[p._id.toString()] = (p.photo as string) ?? ""; });
    }

    // El nombre de la sala se resuelve desde el salón cuando el bloque apunta a
    // uno; el texto guardado en `room` queda de respaldo para bloques sin `roomId`.
    const roomIds = events.map((e) => e.roomId).filter((id): id is NonNullable<typeof id> => id != null);
    const roomMap: Record<string, string> = {};
    if (roomIds.length > 0) {
      const rooms = await Room.find({ _id: { $in: roomIds } }).select("_id name").lean();
      rooms.forEach((r) => { roomMap[r._id.toString()] = (r.name as string) ?? ""; });
    }

    const result = events.map((e) => ({
      ...e,
      room: (e.roomId && roomMap[e.roomId.toString()]) || e.room,
      speakerPhoto: e.speakerId ? (photoMap[e.speakerId.toString()] ?? "") : "",
    }));

    return Response.json({ events: result });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();

    const body = await request.json();
    const {
      title, speaker, speakerSlug, description,
      startTime, endTime, room,
      track, order, sessionType, level, language, cta,
      speakerId, roomId, imageUrl, cardImageUrl,
    } = body;

    if (!title || !startTime || !endTime || !room) {
      return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const event = await AgendaEvent.create({
      title,
      speaker: speaker || "",
      speakerSlug: speakerSlug || "",
      description: description || "",
      startTime,
      endTime,
      room,
      roomId: roomId || null,
      track: track || "general",
      order: order || 0,
      sessionType: sessionType || "presencial",
      level: level || "",
      language: language || "es",
      cta: cta || "",
      imageUrl: imageUrl || "",
      cardImageUrl: cardImageUrl || "",
      speakerId: speakerId || null,
    });

    // Sync the linked SpeakerProfile when scheduling a session
    if (speakerId) {
      const scheduledAt = new Date(`${EVENT_DAY}T${startTime}:00-03:00`);
      await SpeakerProfile.findByIdAndUpdate(speakerId, {
        scheduledAt,
        sessionId: event._id,
        roomId: roomId || null,
        status: "scheduled",
        isPublic: true,
      });
    }

    revalidatePublic(AGENDA_TAG, SPEAKERS_TAG);

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "AGENDA_CREATED",
      target: title,
      targetId: event._id.toString(),
      details: `${startTime}–${endTime} · ${room}`,
    });

    return Response.json({ event }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
