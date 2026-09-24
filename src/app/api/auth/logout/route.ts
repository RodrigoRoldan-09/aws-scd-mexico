import { connectDB } from "@/lib/db";
import { getAuthUser, clearAuthCookie } from "@/lib/auth";
import { Session } from "@/models/session";
import { User } from "@/models/user";
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
      await Session.deleteMany({ userId: user._id.toString() });
      await User.findByIdAndUpdate(user._id, { currentSessionId: null });
    }
    await clearAuthCookie();
    return Response.json({ ok: true });
  } catch {
    await clearAuthCookie();
    return Response.json({ ok: true });
  }
}
