import Link from "next/link";
import { requireCoachTeam } from "@/lib/auth";
import { getEvents, getEvent, getPlayersWithGuardians, getVolunteers, nextEvent } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Badge, Button, EmptyState } from "@/components/ui";
import { fmtDateTime, isUpcoming } from "@/lib/format";
import { EVENT_TYPE_LABEL, DEFAULT_VOLUNTEER_ROLES } from "@/lib/types";
import type { PlayerWithGuardians, VolunteerRole } from "@/lib/types";
import { assignVolunteer, clearVolunteer, addRole } from "./actions";

function playerLabel(p: PlayerWithGuardians): string {
  const j = p.jersey_number ? ` #${p.jersey_number}` : "";
  return `${p.first_name} ${p.last_name}${j}`;
}

export default async function VolunteersPage({
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
        <PageTitle title="Volunteers" subtitle="Assign game-day jobs." />
        <EmptyState title="No upcoming events" hint="Add a game on the schedule first." />
      </div>
    );
  }

  const [players, existing] = await Promise.all([
    getPlayersWithGuardians(team.id),
    getVolunteers(event.id),
  ]);
  const approved = players.filter((p) => p.status === "approved");
  const byPlayer = new Map<string, PlayerWithGuardians>(approved.map((p) => [p.id, p]));
  const existingByRole = new Map<string, VolunteerRole>(existing.map((v) => [v.role, v]));

  // Default roles plus any custom roles already created for this event.
  const customRoles = existing.map((v) => v.role).filter((r) => !DEFAULT_VOLUNTEER_ROLES.includes(r));
  const roles = [...DEFAULT_VOLUNTEER_ROLES, ...customRoles];

  return (
    <div className="space-y-5">
      <PageTitle title="Volunteers" subtitle="Assign game-day jobs to parents." />

      <div>
        <SectionTitle>Event</SectionTitle>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {upcoming.map((e) => {
            const active = e.id === event.id;
            return (
              <Link
                key={e.id}
                href={`/team/volunteers?event=${e.id}`}
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
        <div className="mb-1"><Badge color="blue">{EVENT_TYPE_LABEL[event.type]}</Badge></div>
        <p className="text-lg font-semibold">
          {event.title || (event.opponent ? `vs ${event.opponent}` : "Event")}
        </p>
        <p className="text-sm text-slate-500">{fmtDateTime(event.start_time)}</p>
      </Card>

      <div className="space-y-2">
        <SectionTitle>Roles</SectionTitle>
        {roles.map((role) => {
          const claim = existingByRole.get(role);
          const assigned = claim?.player_id ? byPlayer.get(claim.player_id) : undefined;
          const isClaimed = !!claim && !!claim.player_id;
          return (
            <Card key={role} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{role}</p>
                {isClaimed && <Badge color="green">Claimed</Badge>}
              </div>
              {isClaimed && claim ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-slate-600">
                    {assigned ? playerLabel(assigned) : "Assigned"}
                  </p>
                  <form action={clearVolunteer}>
                    <input type="hidden" name="id" value={claim.id} />
                    <Button type="submit" variant="danger" className="min-h-[44px] px-3 text-sm">Clear</Button>
                  </form>
                </div>
              ) : (
                <form action={assignVolunteer} className="flex items-end gap-2">
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="role" value={role} />
                  <div className="flex-1">
                    <label className="label" htmlFor={`assign_${role}`}>Assign to</label>
                    <select id={`assign_${role}`} name="player_id" className="input" defaultValue="">
                      <option value="" disabled>Choose a player…</option>
                      {approved.map((p) => (
                        <option key={p.id} value={p.id}>{playerLabel(p)}</option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" variant="secondary" className="min-h-[44px] px-3 text-sm">Assign</Button>
                </form>
              )}
            </Card>
          );
        })}
      </div>

      <Card>
        <SectionTitle>Add a custom role</SectionTitle>
        <form action={addRole} className="flex items-end gap-2">
          <input type="hidden" name="event_id" value={event.id} />
          <div className="flex-1">
            <label className="label" htmlFor="new_role">Role name</label>
            <input id="new_role" name="role" className="input" placeholder="e.g. Photographer" required />
          </div>
          <Button type="submit" variant="secondary" className="min-h-[44px] px-3 text-sm">Add</Button>
        </form>
      </Card>
    </div>
  );
}
