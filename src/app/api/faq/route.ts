import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { FAQ } from "@/models/faq";
import { revalidatePublic, FAQ_TAG } from "@/lib/data/revalidate";
import { createLog } from "@/lib/log";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all");

    if (all === "true") {
      await requireAuth(["admin", "organizer"]);
      const faqs = await FAQ.find({}).sort({ order: 1 });
      return Response.json({ faqs });
    }

    const faqs = await FAQ.find({ isActive: true }).sort({ order: 1 });
    return Response.json({ faqs });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "organizer"]);
    await connectDB();

    const body = await request.json();
    const { questionEs, answerEs, questionEn, answerEn, order, isActive, buttons } = body;

    if (!questionEs || !answerEs || !questionEn || !answerEn) {
      return Response.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    const faq = await FAQ.create({
      questionEs,
      answerEs,
      questionEn,
      answerEn,
      order: order ?? 0,
      isActive: isActive ?? true,
      buttons: buttons ?? [],
    });

    revalidatePublic(FAQ_TAG);

    await createLog({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "FAQ_CREATED",
      target: questionEs.slice(0, 80),
      targetId: faq._id.toString(),
    });

    return Response.json({ faq }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
