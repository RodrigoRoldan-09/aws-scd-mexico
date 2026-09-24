import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { Form, isFormType } from "@/models/form";

/**
 * Estado de un formulario: si está abierto y cuántas respuestas admite. Las
 * preguntas son estáticas y viven en el código.
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formType: string }> },
) {
  try {
    const { formType } = await params;

    if (!isFormType(formType)) {
      return Response.json({ error: "Tipo de formulario inválido" }, { status: 400 });
    }

    await connectDB();

    // El staff ve el estado aunque el formulario esté despublicado: es lo que
    // leen las pantallas de recepción y convocatoria para dibujar el
    // interruptor.
    const user = await getAuthUser();
    if (user && (user.role === "admin" || user.role === "organizer" || user.role === "volunteer")) {
      let form = await Form.findOne({ formType });
      if (!form) {
        form = await Form.create({ formType });
      }
      return Response.json({ form });
    }

    // Público: sólo el estado, y sólo si está publicado.
    const form = await Form.findOne({ formType, isPublished: true }).select("formType isPublished isOpen maxSubmissions");
    return Response.json({ form: form ?? null });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
