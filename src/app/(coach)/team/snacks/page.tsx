import { requireCoachTeam } from "@/lib/auth";
import { getEvents, getSnacks, getPlayers } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Badge, Button, EmptyState } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { fmtDateTime } from "@/lib/format";
import { EVENT_TYPE_LABEL } from "@/lib/types";
import type { Player } from "@/lib/types";
import { assignSnack, clearSnack, remindSnack } from "./actions";

export default async function SnacksPage() {
  const { team } = await requireCoachTeam();
  const [events, snacks, players] = await Promise.all([
    getEvents(team.id), getSnacks(team.id), getPlayers(team.id),
  ]);
  const approved = players.filter((p) => p.status === "approved");
  const now = Date.now();
  const upcoming = events.filter(
    (e) => new Date(e.start_time).getTime() >= now && e.status !== "cancelled"
  );

  const playerById = new Map<string, Player>(approved.map((p) => [p.id, p]));
  const snackByEvent = new Map(snacks.map((sn) => [sn.event_id, sn]));
  const withAllergies = approved.filter((p) => p.allergies && p.allergies.trim() !== "");

  const eventName = (e: (typeof upcoming)[number]) =>
    e.title || (e.opponent ? `vs ${e.opponent}` : EVENT_TYPE_LABEL[e.type]);

  const reminderLines = upcoming.map((e) => {
    const sn = snackByEvent.get(e.id);
    const claimer = sn && sn.player_id ? playerById.get(sn.player_id) : undefined;
    const who = claimer ? claimer.first_name + (sn?.snack_notes ? ` (${sn.snack_notes})` : "") : "OPEN — needs a volunteer";
    return `${fmtDateTime(e.start_time)} — ${eventName(e)}: ${who}`;
  });
  const reminder =
`Snack schedule for ${team.name}:

${reminderLines.join("\n") || "No upcoming events."}

${withAllergies.length ? "Allergy reminder: " + withAllergies.map((p) => `${p.first_name} (${p.allergies})`).join(", ") + ". Please keep snacks nut-free." : "Please keep snacks nut-free."}`;

  return (
    <div className="space-y-5">
      <PageTitle title="Snacks" subtitle={`${upcoming.length} upcoming event${upcoming.length === 1 ? "" : "s"}`} />

      {withAllergies.length > 0 && (
        <Card className="border-rose-200 bg-rose-50">
          <p className="font-semibold text-rose-900">Allergy reminder</p>
          <ul className="mt-1 space-y-0.5 text-sm text-rose-800">
            {withAllergies.map((p) => (
              <li key={p.id}>{p.first_name} {p.last_name} — {p.allergies}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-rose-700">Keep all snacks nut-free.</p>
        </Card>
      )}

      <div className="flex justify-end">
        <CopyButton text={reminder} label="Copy snack reminder" />
      </div>

      {upcoming.length === 0 ? (
        <EmptyState title="No upcoming events" hint="Add events to schedule snacks." />
      ) : (
        <div className="space-y-3">
          {upcoming.map((e) => {
            const sn = snackByEvent.get(e.id);
            const claimer = sn && sn.player_id ? playerById.get(sn.player_id) : undefined;
            return (
              <Card key={e.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{eventName(e)}</p>
                    <p className="text-sm text-slate-500">{fmtDateTime(e.start_time)}</p>
                  </div>
                  {claimer ? <Badge color="green">Claimed</Badge> : <Badge color="amber">Available</Badge>}
                </div>

                {claimer ? (
                  <div className="mt-3">
                    <p className="text-sm text-slate-700">
                      Claimed by <span className="font-medium">{claimer.first_name}</span>
                      {sn?.snack_notes ? ` — ${sn.snack_notes}` : ""}
                    </p>
                    <form action={clearSnack} className="mt-2">
                      <input type="hidden" name="event_id" value={e.id} />
                      <Button type="submit" variant="danger">Clear</Button>
                    </form>
                  </div>
                ) : (
                  <>
                  <form action={remindSnack} className="mt-3">
                    <input type="hidden" name="event_id" value={e.id} />
                    <Button type="submit" variant="secondary">📣 Remind team — snacks needed</Button>
                  </form>
                  <form action={assignSnack} className="mt-2 space-y-2">
                    <input type="hidden" name="event_id" value={e.id} />
                    <select name="player_id" required className="input">
                      <option value="">Assign a player…</option>
                      {approved.map((p) => (
                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                      ))}
                    </select>
                    <input name="snack_notes" placeholder="What they're bringing (optional)" className="input" />
                    <Button type="submit">Assign</Button>
                  </form>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
