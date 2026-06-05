import { requireCoachTeam } from "@/lib/auth";
import { getPlayers, getEvents, getLineupPlans, getAttendance, nextEvent } from "@/lib/data";
import { PageTitle, EmptyState, Card } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { TacticsBoard } from "./TacticsBoard";
import { withAvatars } from "@/lib/avatars";
import { Onboarding } from "@/components/Onboarding";
import { sportFromString } from "@/lib/sports";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TacticsPage({ searchParams }: { searchParams: { event?: string } }) {
  const { team } = await requireCoachTeam();
  const sport = sportFromString(team.sport);
  const pitchReady = sport.id === "soccer8";
  const events = await getEvents(team.id);
  const games = events.filter((e) => e.type === "game" || e.type === "tournament");
  const event = searchParams.event ? events.find((e) => e.id === searchParams.event) : (nextEvent(games) ?? games[games.length - 1]);

  if (!event) {
    return (<div className="space-y-4"><PageTitle title="Tactics" subtitle="Build your lineup on the pitch" /><EmptyState title="No game to plan yet" hint="Add a game on the Schedule first." /></div>);
  }
  if (!pitchReady) {
    return (
      <div className="space-y-4">
        <PageTitle title="Tactics" subtitle={`${sport.emoji} ${sport.label}`} />
        <Card className="space-y-2">
          <p className="font-semibold text-ink">{sport.emoji} The visual board for {sport.label} is on the way.</p>
          <p className="text-sm text-slate-600">For now, set your starting lineup right in the live game: open the next {sport.noun}, tap <b>Auto-pick {sport.onField}</b> or tap players onto the floor, set positions ({sport.positions.join(", ")}), and sub live. Everything tracks playing time and syncs across devices.</p>
          <Link href={`/event/${event.id}/live`} className="btn-primary inline-flex w-fit">▶ Open live {sport.noun}</Link>
        </Card>
      </div>
    );
  }
  const players = await withAvatars((await getPlayers(team.id)).filter((p) => p.status === "approved"));
  const [plans, att] = await Promise.all([getLineupPlans(event.id), getAttendance(event.id)]);
  const attendingIds = att.filter((a) => a.status === "attending").map((a) => a.player_id);

  return (
    <div className="space-y-4">
      <PageTitle title="Tactics" subtitle="Drag players onto the pitch. Undo anytime. Rate strength with the stars." />
      <Onboarding id="tactics_v1" title="🎯 How the pitch works" steps={["Pick a formation up top.","Drag a player from the squad onto any spot \u2014 or tap a player then tap a spot.","Drag a player off the pitch to bench them; hit Undo to revert.","Tap a player to rate strength (stars). Share exports the lineup as an image."]} />
      <Card className="!p-2">
        <div className="flex gap-2 overflow-x-auto">
          {games.map((g) => (
            <Link key={g.id} href={`/team/tactics?event=${g.id}`}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${g.id === event.id ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-600"}`}>
              {g.opponent ? `vs ${g.opponent}` : g.title} · {fmtDate(g.start_time)}
            </Link>
          ))}
        </div>
      </Card>
      <TacticsBoard
        eventId={event.id}
        attendingIds={attendingIds}
        initialPlans={plans}
        players={players.map((p) => ({ id: p.id, first_name: p.first_name, last_name: p.last_name, jersey_number: p.jersey_number, strength: p.strength, preferred_position: p.preferred_position, coach_notes: p.coach_notes, avatar_url: p.avatar_url }))}
      />
    </div>
  );
}
