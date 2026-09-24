import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }
    return Response.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
}
