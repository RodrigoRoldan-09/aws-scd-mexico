import { EVENT } from "@/lib/constants";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { AgendaEvent } from "@/models/agenda-event";
import { SpeakerProfile } from "@/models/speaker-profile";
import { revalidatePublic, AGENDA_TAG, SPEAKERS_TAG } from "@/lib/data/revalidate";
import { createLog } from "@/lib/log";

// Día del evento (YYYY-MM-DD) derivado de la fecha oficial.
const EVENT_DAY = new Date(EVENT.date).toISOString().slice(0, 10);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const {
      title, speaker, speakerSlug, description,
      startTime, endTime, room, roomId,
      track, order, sessionType, level, language, cta,
      speakerId, imageUrl, cardImageUrl,
    } = body;

    if (!title || !startTime || !endTime || !room) {
      return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const event = await AgendaEvent.findByIdAndUpdate(
      id,
      {
        title, speaker, speakerSlug: speakerSlug ?? "",
        description, startTime, endTime, room,
        roomId: roomId || null, track, order,
        sessionType, level, language, cta,
        imageUrl: imageUrl || "", cardImageUrl: cardImageUrl || "",
        speakerId: speakerId || null,
      },
      { returnDocument: "after" },
    );

    if (!event) {
      return Response.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // Sync time + room back to the linked SpeakerProfile
    if (event.speakerId) {
      const scheduledAt = new Date(`${EVENT_DAY}T${startTime}:00-03:00`);
      await SpeakerProfile.findByIdAndUpdate(event.speakerId, {
        scheduledAt,
        roomId: roomId || null,
      });
    }

    revalidatePublic(AGENDA_TAG, SPEAKERS_TAG);

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "AGENDA_UPDATED",
      target: title,
      targetId: id,
      details: `${startTime}–${endTime} · ${room}`,
    });

    return Response.json({ event });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();

    const { id } = await params;
    const event = await AgendaEvent.findByIdAndDelete(id);

    if (!event) {
      return Response.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // Un-schedule the linked SpeakerProfile
    if (event.speakerId) {
      await SpeakerProfile.findByIdAndUpdate(event.speakerId, {
        status: "accepted",
        scheduledAt: null,
        sessionId: null,
        roomId: null,
      });
    }

    revalidatePublic(AGENDA_TAG, SPEAKERS_TAG);

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "AGENDA_DELETED",
      target: event.title,
      targetId: id,
    });

    return Response.json({ success: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
