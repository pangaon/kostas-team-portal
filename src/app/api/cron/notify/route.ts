import { NextResponse } from "next/server";
import { runAutoNotifications } from "@/lib/notify-engine";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const result = await runAutoNotifications();
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), ...result });
}
