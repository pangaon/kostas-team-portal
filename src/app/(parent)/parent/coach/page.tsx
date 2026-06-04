import { getParentSession } from "@/lib/parent";
import { getPolls, getPollOptions, getPollVotes } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Badge, Button, EmptyState } from "@/components/ui";
import { votePoll, sendCoachNote } from "@/lib/parent-actions";

export const dynamic = "force-dynamic";

export default async function ParentCoachPage() {
  const sess = await getParentSession();
  if (!sess) return null;
  const polls = (await getPolls(sess.team.id)).filter((p) => p.status === "open");

  return (
    <div className="space-y-5">
      <PageTitle title="Coach" subtitle="Vote on practice times & message the coach" />

      <div>
        <SectionTitle>Practice availability</SectionTitle>
        {polls.length === 0 ? <EmptyState title="No open polls right now" /> :
          polls.map(async (poll) => {
            const [opts, votes] = await Promise.all([getPollOptions(poll.id), getPollVotes(poll.id)]);
            const mine = new Map(votes.filter((v) => v.player_id === sess.player.id).map((v) => [v.option_id, v.response]));
            return (
              <Card key={poll.id}>
                <p className="font-semibold">{poll.title}</p>
                <p className="mb-2 text-xs text-slate-500">Tap how {sess.player.first_name} can make each option.</p>
                <div className="space-y-3">
                  {opts.map((o) => (
                    <div key={o.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="font-medium">{o.label}{o.location ? ` · ${o.location}` : ""}</p>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {(["yes", "maybe", "no"] as const).map((resp) => {
                          const active = mine.get(o.id) === resp;
                          const label = resp === "yes" ? "Can make it" : resp === "maybe" ? "Maybe" : "Can’t";
                          const color = resp === "yes" ? "bg-emerald-600" : resp === "maybe" ? "bg-amber-500" : "bg-rose-500";
                          return (
                            <form key={resp} action={votePoll}>
                              <input type="hidden" name="poll_id" value={poll.id} />
                              <input type="hidden" name="option_id" value={o.id} />
                              <input type="hidden" name="response" value={resp} />
                              <button className={`min-h-[44px] w-full rounded-xl text-sm font-semibold ${active ? color + " text-white" : "border border-slate-300 text-slate-700"}`}>{label}</button>
                            </form>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
      </div>

      <div>
        <SectionTitle>Message the coach</SectionTitle>
        <Card>
          <form action={sendCoachNote} className="space-y-3">
            <textarea name="body" required rows={3} className="input" placeholder="Notes, questions, or anything the coach should know…" />
            <Button type="submit">Send to coach</Button>
          </form>
          <p className="mt-2 text-xs text-slate-400">Goes privately to the coach only.</p>
        </Card>
      </div>
    </div>
  );
}
