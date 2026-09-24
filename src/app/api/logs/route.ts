import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Log } from "@/models/log";
import { LOG_ROLES, isLoggedAction } from "@/lib/log-actions";

const PAGE_SIZE = 30;

/**
 * Qué se puede filtrar sale del catálogo compartido con la pantalla.
 *
 * Antes acá había una lista propia que se había quedado corta, y lo que no
 * estaba en ella no se rechazaba: se ignoraba. Filtrar por una acción reciente
 * devolvía **todos** los registros, así que el filtro parecía funcionar y no
 * filtraba nada.
 */

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "";
    const action = searchParams.get("action") || "";
    const page = Math.max(0, parseInt(searchParams.get("page") || "0") || 0);

    const query: Record<string, string> = {};
    // Un filtro que no se reconoce es un error, no algo que se ignora en
    // silencio: si no, la tabla muestra todo y parece que filtró.
    if (role) {
      if (!Object.hasOwn(LOG_ROLES, role)) {
        return Response.json({ error: "Rol desconocido" }, { status: 400 });
      }
      query.userRole = role;
    }
    if (action) {
      if (!isLoggedAction(action)) {
        return Response.json({ error: "Acción desconocida" }, { status: 400 });
      }
      query.action = action;
    }

    const [logs, total] = await Promise.all([
      Log.find(query).sort({ createdAt: -1 }).skip(page * PAGE_SIZE).limit(PAGE_SIZE).lean(),
      Log.countDocuments(query),
    ]);

    return Response.json({ logs, total, page, totalPages: Math.ceil(total / PAGE_SIZE) });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Unauthorized") return Response.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return Response.json({ error: msg }, { status: 403 });
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
