import { requireCoachTeam } from "@/lib/auth";
import { getPlayers, getSeasonRoster, getEvents } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Badge, EmptyState, Stat } from "@/components/ui";
import type { GameRosterRow } from "@/lib/types";

export default async function PlayingTimePage() {
  const { team } = await requireCoachTeam();
  const [players, season, events] = await Promise.all([
    getPlayers(team.id),
    getSeasonRoster(team.id),
    getEvents(team.id),
  ]);
  const approved = players.filter((p) => p.status === "approved");

  // Count games = events of type game that have at least one roster row.
  const gameEventIds = new Set(season.map((r) => r.event_id));
  const games = events.filter((e) => e.type === "game" && gameEventIds.has(e.id)).length;

  const byPlayer = new Map<string, GameRosterRow[]>();
  for (const r of season) {
    const list = byPlayer.get(r.player_id) ?? [];
    list.push(r);
    byPlayer.set(r.player_id, list);
  }

  const stats = approved.map((p) => {
    const rows = byPlayer.get(p.id) ?? [];
    return {
      player: p,
      starts: rows.filter((r) => r.status === "starter").length,
      benched: rows.filter((r) => r.status === "bench").length,
      out: rows.filter((r) => r.status === "out").length,
      checkedIn: rows.filter((r) => r.checked_in).length,
    };
  });

  // Fewest starts first — these players should start next.
  stats.sort((a, b) => a.starts - b.starts || a.player.first_name.localeCompare(b.player.first_name));

  return (
    <div className="space-y-5">
      <PageTitle title="Playing time" subtitle="Keep it fair — give everyone a turn to start." />

      <Card className="bg-brand-50/60 text-sm text-slate-700">
        <p>
          Fair play means rotating starters so the same kids aren&apos;t always on the bench.
          Players are sorted with the <strong>fewest starts first</strong> — those near the top
          are due to start the next game.
        </p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Players" value={approved.length} />
        <Stat label="Games tracked" value={games} />
        <Stat label="Lineups set" value={gameEventIds.size} />
      </div>

      {stats.length === 0 ? (
        <EmptyState title="No approved players yet" hint="Approve players on the roster." />
      ) : (
        <div>
          <SectionTitle>By starts (fewest first)</SectionTitle>
          <div className="space-y-2">
            {stats.map((s) => (
              <Card key={s.player.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {s.player.first_name} {s.player.last_name}
                    {s.player.jersey_number && <span className="text-slate-400"> #{s.player.jersey_number}</span>}
                  </p>
                  <p className="text-xs text-slate-400">{s.checkedIn} check-in{s.checkedIn === 1 ? "" : "s"}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <Badge color="green">{s.starts} start{s.starts === 1 ? "" : "s"}</Badge>
                  <Badge color="slate">{s.benched} bench</Badge>
                  {s.out > 0 && <Badge color="red">{s.out} out</Badge>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
