import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Passport } from "@/models/passport";
import { rateLimit, getIp } from "@/lib/rate-limit";

const VIEW_WINDOW  = 24 * 60 * 60 * 1000; // 24 h
const CLICK_WINDOW =  1 * 60 * 60 * 1000; // 1 h

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  try {
    const { shortId } = await params;
    const { event, platform } = await req.json();
    const ip = getIp(req);

    if (event === "view") {
      const { ok } = rateLimit(`stats:view:${ip}:${shortId}`, 50, VIEW_WINDOW);
      if (!ok) return Response.json({ ok: false, reason: "already_counted" });

      await connectDB();
      await Passport.updateOne({ shortId }, { $inc: { "stats.views": 1 } });

    } else if (event === "click" && platform) {
      const { ok } = rateLimit(`stats:click:${ip}:${shortId}:${platform}`, 50, CLICK_WINDOW);
      if (!ok) return Response.json({ ok: false, reason: "already_counted" });

      await connectDB();
      await Passport.updateOne({ shortId }, { $inc: { [`stats.clicks.${platform}`]: 1 } });

    } else {
      return Response.json({ ok: false }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
