import Link from "next/link";
import { requireCoachTeam } from "@/lib/auth";
import {
  getEvents, getEvent, getAttendance, getPlayers, getGameRoster, getLineup, nextEvent,
} from "@/lib/data";
import { Card, PageTitle, SectionTitle, Badge, Button, EmptyState } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { fmtDateTime, isUpcoming } from "@/lib/format";
import { FORMATIONS, EVENT_TYPE_LABEL } from "@/lib/types";
import type { Player, GameRosterRow, Attendance } from "@/lib/types";
import { saveLineup } from "./actions";

const STATUS_OPTIONS = [
  { value: "starter", label: "Starter" },
  { value: "bench", label: "Bench" },
  { value: "out", label: "Out" },
];

function lineupText(
  players: Player[],
  rosterByPlayer: Map<string, GameRosterRow>,
  formation: string | null,
): string {
  const lines: string[] = [];
  if (formation) lines.push(`Formation: ${formation}`);
  const starters = players.filter((p) => rosterByPlayer.get(p.id)?.status === "starter");
  const bench = players.filter((p) => rosterByPlayer.get(p.id)?.status === "bench");
  lines.push("", "Starters:");
  if (starters.length === 0) {
    lines.push("  (none set)");
  } else {
    for (const p of starters) {
      const r = rosterByPlayer.get(p.id);
      const pos = r?.position || p.preferred_position || "—";
      const j = p.jersey_number ? ` #${p.jersey_number}` : "";
      lines.push(`  ${pos}: ${p.first_name} ${p.last_name}${j}`);
    }
  }
  lines.push("", "Bench:");
  if (bench.length === 0) {
    lines.push("  (none)");
  } else {
    for (const p of bench) {
      const j = p.jersey_number ? ` #${p.jersey_number}` : "";
      lines.push(`  ${p.first_name} ${p.last_name}${j}`);
    }
  }
  return lines.join("\n");
}

export default async function LineupPage({
  searchParams,
}: {
  searchParams: { event?: string };
}) {
  const { team } = await requireCoachTeam();
  const events = await getEvents(team.id);
  const event = searchParams.event
    ? await getEvent(searchParams.event)
    : nextEvent(events);

  const upcoming = events.filter((e) => isUpcoming(e.start_time) && e.status !== "cancelled");

  if (!event) {
    return (
      <div className="space-y-4">
        <PageTitle title="Lineup" subtitle="Pick an event to set the starting lineup." />
        <EmptyState title="No upcoming events" hint="Add a game on the schedule first." />
      </div>
    );
  }

  const [players, attendance, roster, lineup] = await Promise.all([
    getPlayers(team.id),
    getAttendance(event.id),
    getGameRoster(event.id),
    getLineup(event.id),
  ]);
  const approved = players.filter((p) => p.status === "approved");
  const attByPlayer = new Map<string, Attendance>(attendance.map((a) => [a.player_id, a]));
  const rosterByPlayer = new Map<string, GameRosterRow>(roster.map((r) => [r.player_id, r]));

  // Sort attending players first, then by jersey/name.
  const sorted = [...approved].sort((a, b) => {
    const aIn = attByPlayer.get(a.id)?.status === "attending" ? 0 : 1;
    const bIn = attByPlayer.get(b.id)?.status === "attending" ? 0 : 1;
    if (aIn !== bIn) return aIn - bIn;
    return a.first_name.localeCompare(b.first_name);
  });

  const copyText = lineupText(approved, rosterByPlayer, lineup?.formation ?? null);

  return (
    <div className="space-y-5">
      <PageTitle title="Lineup" subtitle="Set starters, bench and positions." />

      <div>
        <SectionTitle>Event</SectionTitle>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {upcoming.length === 0 && <p className="text-sm text-slate-500">No upcoming events.</p>}
          {upcoming.map((e) => {
            const active = e.id === event.id;
            return (
              <Link
                key={e.id}
                href={`/team/lineup?event=${e.id}`}
                className={`shrink-0 rounded-xl border px-3 py-2 text-sm ${
                  active
                    ? "border-brand-600 bg-brand-50 font-semibold text-brand-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <span className="block">{e.title || (e.opponent ? `vs ${e.opponent}` : EVENT_TYPE_LABEL[e.type])}</span>
                <span className="block text-xs text-slate-400">{fmtDateTime(e.start_time)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <Card>
        <div className="mb-1">
          <Badge color="blue">{EVENT_TYPE_LABEL[event.type]}</Badge>
        </div>
        <p className="text-lg font-semibold">
          {event.title || (event.opponent ? `vs ${event.opponent}` : "Event")}
        </p>
        <p className="text-sm text-slate-500">{fmtDateTime(event.start_time)}</p>
      </Card>

      {approved.length === 0 ? (
        <EmptyState title="No approved players yet" hint="Approve players on the roster first." />
      ) : (
        <form action={saveLineup} className="space-y-4">
          <input type="hidden" name="event_id" value={event.id} />

          <Card className="space-y-3">
            <div>
              <label className="label" htmlFor="formation">Formation</label>
              <select id="formation" name="formation" className="input" defaultValue={lineup?.formation ?? FORMATIONS[0]}>
                {FORMATIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="notes">Notes</label>
              <input id="notes" name="notes" className="input" defaultValue={lineup?.notes ?? ""} placeholder="Tactics, subs plan…" />
            </div>
          </Card>

          <div className="space-y-2">
            <SectionTitle>Players</SectionTitle>
            {sorted.map((p) => {
              const r = rosterByPlayer.get(p.id);
              const attending = attByPlayer.get(p.id)?.status === "attending";
              return (
                <Card key={p.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">
                      {p.first_name} {p.last_name}
                      {p.jersey_number && <span className="text-slate-400"> #{p.jersey_number}</span>}
                    </p>
                    {attending && <Badge color="green">Attending</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label" htmlFor={`status_${p.id}`}>Status</label>
                      <select
                        id={`status_${p.id}`}
                        name={`status_${p.id}`}
                        className="input"
                        defaultValue={r?.status ?? "bench"}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor={`pos_${p.id}`}>Position</label>
                      <input
                        id={`pos_${p.id}`}
                        name={`pos_${p.id}`}
                        className="input"
                        defaultValue={r?.position ?? p.preferred_position ?? ""}
                        placeholder="e.g. CM"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit">Save lineup</Button>
            <CopyButton text={copyText} label="Copy lineup" />
          </div>
        </form>
      )}
    </div>
  );
}
