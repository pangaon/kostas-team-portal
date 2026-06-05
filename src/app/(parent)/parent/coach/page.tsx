import { getParentSession } from "@/lib/parent";
import { getPolls, getPollOptions, getPollVotes, getCoachThread } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Badge, Button, EmptyState } from "@/components/ui";
import { votePoll, sendCoachNote } from "@/lib/parent-actions";

export const dynamic = "force-dynamic";

export default async function ParentCoachPage() {
  const sess = await getParentSession();
  if (!sess) return null;
  const polls = (await getPolls(sess.team.id)).filter((p) => p.status === "open");
  const { messages } = await getCoachThread(sess.team.id, sess.player.id);

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
        <SectionTitle>Chat with your coach</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="max-h-[55vh] space-y-2.5 overflow-y-auto bg-slate-50 p-3">
            {messages.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl">👋</p>
                <p className="mt-2 text-sm text-slate-500">Say hi to your coach — questions, scheduling,<br />or anything about {sess.player.first_name}.</p>
              </div>
            ) : messages.map((m) => (
              <div key={m.id} className={`flex ${m.fromCoach ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${m.fromCoach ? "rounded-bl-md bg-white text-ink ring-1 ring-slate-200" : "rounded-br-md bg-brand-600 text-white"}`}>
                  <p className="whitespace-pre-line leading-snug">{m.body}</p>
                  <p className={`mt-0.5 text-[10px] ${m.fromCoach ? "text-slate-400" : "text-brand-100"}`}>{m.fromCoach ? "Coach" : "You"}</p>
                </div>
              </div>
            ))}
          </div>
          <form action={sendCoachNote} className="flex items-center gap-2 border-t border-slate-100 p-2">
            <input name="body" required autoComplete="off" className="input flex-1 py-2.5" placeholder="Message your coach…" />
            <Button type="submit" className="shrink-0">Send</Button>
          </form>
        </div>
        <p className="mt-1.5 px-1 text-xs text-slate-400">🔒 Private — only your coach sees this.</p>
      </div>
    </div>
  );
}
