import { requireCoachTeam } from "@/lib/auth";
import { getPlayers, getEvents, getLineupPlans, getAttendance, nextEvent } from "@/lib/data";
import { PageTitle, EmptyState, Card } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { TacticsBoard } from "./TacticsBoard";
import { Onboarding } from "@/components/Onboarding";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TacticsPage({ searchParams }: { searchParams: { event?: string } }) {
  const { team } = await requireCoachTeam();
  const events = await getEvents(team.id);
  const games = events.filter((e) => e.type === "game" || e.type === "tournament");
  const event = searchParams.event ? events.find((e) => e.id === searchParams.event) : (nextEvent(games) ?? games[games.length - 1]);

  if (!event) {
    return (<div className="space-y-4"><PageTitle title="Tactics" subtitle="Build your lineup on the pitch" /><EmptyState title="No game to plan yet" hint="Add a game on the Schedule first." /></div>);
  }
  const players = (await getPlayers(team.id)).filter((p) => p.status === "approved");
  const [plans, att] = await Promise.all([getLineupPlans(event.id), getAttendance(event.id)]);
  const attendingIds = att.filter((a) => a.status === "attending").map((a) => a.player_id);

  return (
    <div className="space-y-4">
      <PageTitle title="Tactics" subtitle="Drag your squad onto the pitch — try formations, save plans, push to the game." />
      <Onboarding id="tactics_v1" title="🎯 How the pitch works" steps={["Pick a formation up top.","Tap a player chip, then tap a spot on the pitch to place them.","Players are colored by strength rating (set it in Roster).","Save the plan, then tap \u201cUse this lineup in the game\u201d to load it into the live console."]} />
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
        players={players.map((p) => ({ id: p.id, first_name: p.first_name, last_name: p.last_name, jersey_number: p.jersey_number, strength: p.strength, preferred_position: p.preferred_position, coach_notes: p.coach_notes }))}
      />
    </div>
  );
}
