import { connectDB } from "@/lib/db";
import { Log } from "@/models/log";
import { getAuthUser } from "@/lib/auth";

type LogRole = "admin" | "organizer" | "volunteer" | "attendee" | "badges";

interface CreateLogParams {
  userId?: string;
  userName?: string;
  userRole?: LogRole;
  action: string;
  target: string;
  targetId?: string | null;
  details?: string | null;
}

export async function createLog(params: CreateLogParams): Promise<void> {
  try {
    await connectDB();

    let { userId, userName, userRole } = params;

    // Auto-resolve the authenticated staff user when actor fields aren't provided.
    // (Public actions — e.g. an attendee confirming — must pass the actor explicitly.)
    if (!userId || !userName || !userRole) {
      const user = await getAuthUser().catch(() => null);
      if (user) {
        userId = userId || String(user._id);
        userName = userName || user.name;
        userRole = userRole || (user.role as LogRole);
      }
    }

    // Without an actor we can't satisfy the schema — skip silently.
    if (!userId || !userName || !userRole) return;

    await Log.create({ ...params, userId, userName, userRole });
  } catch {
    // Logs never break the main flow
  }
}
