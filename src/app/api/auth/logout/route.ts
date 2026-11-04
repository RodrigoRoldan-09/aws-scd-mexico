import { connectDB } from "@/lib/db";
import { getAuthUser, clearAuthCookie, endCurrentSession } from "@/lib/auth";
import { createLog } from "@/lib/log";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (user) {
      await connectDB();
      await createLog({
        userId: user._id.toString(),
        userName: user.name,
        userRole: user.role,
        action: "USER_LOGOUT",
        target: user.email,
      });
      await endCurrentSession(user);
    }
    await clearAuthCookie();
    return Response.json({ ok: true });
  } catch {
    await clearAuthCookie();
    return Response.json({ ok: true });
  }
}
