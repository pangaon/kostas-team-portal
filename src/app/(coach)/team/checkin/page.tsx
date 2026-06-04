import Link from "next/link";
import { requireCoachTeam } from "@/lib/auth";
import { getEvents, getEvent, getPlayers, getGameRoster, nextEvent } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Badge, EmptyState } from "@/components/ui";
import { fmtDateTime, isUpcoming } from "@/lib/format";
import { EVENT_TYPE_LABEL } from "@/lib/types";
import type { GameRosterRow } from "@/lib/types";
import { toggleCheckin } from "./actions";

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: { event?: string };
}) {
  const { team } = await requireCoachTeam();
  const events = await getEvents(team.id);
  const event = searchParams.event ? await getEvent(searchParams.event) : nextEvent(events);
  const upcoming = events.filter((e) => isUpcoming(e.start_time) && e.status !== "cancelled");

  if (!event) {
    return (
      <div className="space-y-4">
        <PageTitle title="Check-in" subtitle="Tap each player as they arrive." />
        <EmptyState title="No upcoming events" hint="Add a game on the schedule first." />
      </div>
    );
  }

  const [players, roster] = await Promise.all([
    getPlayers(team.id),
    getGameRoster(event.id),
  ]);
  const approved = players.filter((p) => p.status === "approved");
  const rosterByPlayer = new Map<string, GameRosterRow>(roster.map((r) => [r.player_id, r]));
  const checkedCount = approved.filter((p) => rosterByPlayer.get(p.id)?.checked_in).length;

  return (
    <div className="space-y-5">
      <PageTitle title="Check-in" subtitle="Tap each player as they arrive." />

      <div>
        <SectionTitle>Event</SectionTitle>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {upcoming.map((e) => {
            const active = e.id === event.id;
            return (
              <Link
                key={e.id}
                href={`/team/checkin?event=${e.id}`}
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

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">
            {event.title || (event.opponent ? `vs ${event.opponent}` : "Event")}
          </p>
          <p className="text-sm text-slate-500">{fmtDateTime(event.start_time)}</p>
        </div>
        <Badge color={checkedCount === approved.length && approved.length > 0 ? "green" : "blue"}>
          {checkedCount} / {approved.length} checked in
        </Badge>
      </Card>

      {approved.length === 0 ? (
        <EmptyState title="No approved players yet" hint="Approve players on the roster." />
      ) : (
        <div className="space-y-2">
          {approved.map((p) => {
            const checked = !!rosterByPlayer.get(p.id)?.checked_in;
            return (
              <form key={p.id} action={toggleCheckin}>
                <input type="hidden" name="event_id" value={event.id} />
                <input type="hidden" name="player_id" value={p.id} />
                <input type="hidden" name="checked" value={checked ? "true" : "false"} />
                <button
                  type="submit"
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                    checked
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="font-medium">
                    {p.first_name} {p.last_name}
                    {p.jersey_number && <span className="text-slate-400"> #{p.jersey_number}</span>}
                  </span>
                  <span
                    className={`inline-flex min-h-[44px] items-center rounded-xl px-4 text-sm font-semibold ${
                      checked ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {checked ? "Present ✓" : "Tap to check in"}
                  </span>
                </button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
