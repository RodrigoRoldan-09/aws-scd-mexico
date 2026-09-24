import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Form, isFormType } from "@/models/form";
import { createLog } from "@/lib/log";
import { revalidateTag } from "next/cache";
import { EVENT_CONFIG_TAG } from "@/lib/data/event-config";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ formType: string }> },
) {
  try {
    const actor = await requireAuth(["admin", "organizer"]);
    const { formType } = await params;
    const { isPublished, isOpen } = await request.json();

    if (!isFormType(formType)) {
      return Response.json({ error: "Tipo de formulario inválido" }, { status: 400 });
    }

    await connectDB();

    const update: Record<string, boolean> = {};
    if (isPublished !== undefined) update.isPublished = isPublished;
    if (isOpen !== undefined) update.isOpen = isOpen;

    const form = await Form.findOneAndUpdate({ formType }, update, { returnDocument: "after" });

    if (!form) {
      return Response.json({ error: "Formulario no encontrado" }, { status: 404 });
    }

    // La portada lee el estado de los formularios desde la config pública,
    // cacheada cinco minutos: se invalida para que el cambio se vea ya.
    revalidateTag(EVENT_CONFIG_TAG, { expire: 0 });

    const action = isPublished !== undefined
      ? (isPublished ? "FORM_PUBLISHED" : "FORM_CLOSED")
      : (isOpen ? "FORM_PUBLISHED" : "FORM_CLOSED");

    await createLog({
      userId: actor._id.toString(),
      userName: actor.name,
      userRole: actor.role,
      action,
      target: `Form ${formType}`,
    });

    return Response.json({ form });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
