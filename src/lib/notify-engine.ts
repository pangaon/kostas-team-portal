import { createAdminClient } from "@/lib/supabase/admin";
import { notifyTeam } from "@/lib/push";

const TZ = "America/Toronto";
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type EngineResult = { scanned: number; sent: number; skipped: number; teams: number };

/**
 * Smart auto-reminders. Scans every team's scheduled events starting within the
 * next ~15h (i.e. "happening today") and sends ONE game-day reminder per event
 * per day. Dedupes via the notifications table (no extra schema). Safe to run
 * repeatedly — it will not double-send. Returns a summary.
 *
 * Optionally scope to a single team (used by the coach "send now" button).
 */
export async function runAutoNotifications(onlyTeamId?: string): Promise<EngineResult> {
  const admin = createAdminClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 15 * 3600 * 1000);

  let q = admin
    .from("events")
    .select("id, team_id, type, title, opponent, location, field_number, start_time, arrival_time, status")
    .eq("status", "scheduled")
    .gte("start_time", now.toISOString())
    .lte("start_time", windowEnd.toISOString());
  if (onlyTeamId) q = q.eq("team_id", onlyTeamId);

  const { data: events } = await q;
  const list = events ?? [];

  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);

  const teams = new Set<string>();
  let sent = 0;
  let skipped = 0;

  for (const ev of list) {
    teams.add(ev.team_id);

    // Already reminded for this event today? skip (dedupe)
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("event_id", ev.id)
      .eq("kind", "event")
      .gte("created_at", dayStart.toISOString())
      .limit(1);
    if (existing && existing.length) {
      skipped++;
      continue;
    }

    const isGame = ev.type === "game" || ev.type === "tournament";
    const title = isGame
      ? `⚽ Game today${ev.opponent ? " vs " + ev.opponent : ""}`
      : `${ev.type === "practice" ? "🏃" : "📅"} ${cap(ev.type)} today`;

    const parts: string[] = [fmtTime(ev.start_time)];
    if (ev.location) parts.push(`at ${ev.location}${ev.field_number ? " #" + ev.field_number : ""}`);
    if (ev.arrival_time) parts.push(`be there by ${fmtTime(ev.arrival_time)}`);
    let snackNote = "";
    if (isGame) {
      const { data: sn } = await admin.from("snack_signups").select("id").eq("event_id", ev.id).limit(1);
      if (!sn || !sn.length) snackNote = " · 🍎 snacks still need a volunteer!";
    }
    const body = parts.join(" · ") + snackNote;

    await admin.from("notifications").insert({
      team_id: ev.team_id,
      kind: "event",
      title,
      body,
      event_id: ev.id,
    });
    await notifyTeam(ev.team_id, { title, body, url: "/parent" });
    sent++;
  }

  return { scanned: list.length, sent, skipped, teams: teams.size };
}
