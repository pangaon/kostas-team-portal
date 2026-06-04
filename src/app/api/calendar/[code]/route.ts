import { createAdminClient } from "@/lib/supabase/admin";
import { EVENT_TYPE_LABEL } from "@/lib/types";
import type { Team, TeamEvent } from "@/lib/types";

// Format an ISO datetime to iCal UTC: yyyymmddThhmmssZ
function icalDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

// Escape per RFC 5545 text rules.
function esc(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export async function GET(
  _req: Request,
  ctx: { params: { code: string } }
) {
  const code = ctx.params.code.replace(/\.ics$/i, "");
  const db = createAdminClient();

  const { data: teamData } = await db
    .from("teams")
    .select("*")
    .eq("invite_code", code)
    .maybeSingle();
  const team = teamData as Team | null;
  if (!team) return new Response("Not found", { status: 404 });

  const { data: eventsData } = await db
    .from("events")
    .select("*")
    .eq("team_id", team.id)
    .order("start_time");
  const events = (eventsData as TeamEvent[]) ?? [];

  const now = icalDate(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//kostasportal//Team Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(team.name)}`,
  ];

  for (const e of events) {
    const summary =
      e.title || (e.opponent ? `vs ${e.opponent}` : EVENT_TYPE_LABEL[e.type]);
    const start = icalDate(e.start_time);
    const end = e.end_time
      ? icalDate(e.end_time)
      : icalDate(new Date(new Date(e.start_time).getTime() + 90 * 60 * 1000).toISOString());

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.id}@kostasportal`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${esc(summary)}`);
    if (e.location) {
      const loc = e.field_number ? `${e.location} (Field ${e.field_number})` : e.location;
      lines.push(`LOCATION:${esc(loc)}`);
    }
    if (e.notes) lines.push(`DESCRIPTION:${esc(e.notes)}`);
    if (e.status === "cancelled") lines.push("STATUS:CANCELLED");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  const ics = lines.join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="team.ics"`,
    },
  });
}
