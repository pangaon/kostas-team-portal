import { requireCoachTeam } from "@/lib/auth";
import { getPolls, getPollOptions, getPollVotes } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Badge, Button, EmptyState } from "@/components/ui";
import { createPoll, closePoll, deletePoll } from "./actions";

export const dynamic = "force-dynamic";

export default async function PollPage() {
  const { team } = await requireCoachTeam();
  const polls = await getPolls(team.id);

  return (
    <div className="space-y-5">
      <PageTitle title="Practice poll" subtitle="Ask parents which day/time/place works" />

      <Card>
        <SectionTitle>New poll</SectionTitle>
        <form action={createPoll} className="space-y-3">
          <div><label className="label">Question</label>
            <input name="title" required className="input" placeholder="Which practice time works best?" /></div>
          <div><label className="label">Options — one per line (use “Label | Location”)</label>
            <textarea name="options" required rows={4} className="input"
              placeholder={"Tue 6:00 PM | Main field\nWed 5:30 PM | School field\nSat 10:00 AM | Park"} /></div>
          <Button type="submit">Create poll &amp; share with parents</Button>
        </form>
      </Card>

      {polls.length === 0 ? <EmptyState title="No polls yet" /> :
        polls.map(async (poll) => {
          const [opts, votes] = await Promise.all([getPollOptions(poll.id), getPollVotes(poll.id)]);
          return (
            <Card key={poll.id}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{poll.title}</p>
                <Badge color={poll.status === "open" ? "green" : "slate"}>{poll.status}</Badge>
              </div>
              <div className="mt-3 space-y-2">
                {opts.map((o) => {
                  const ov = votes.filter((v) => v.option_id === o.id);
                  const yes = ov.filter((v) => v.response === "yes").length;
                  const maybe = ov.filter((v) => v.response === "maybe").length;
                  const no = ov.filter((v) => v.response === "no").length;
                  return (
                    <div key={o.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="font-medium">{o.label}{o.location ? ` · ${o.location}` : ""}</p>
                      <div className="mt-1 flex gap-2">
                        <Badge color="green">{yes} can</Badge>
                        <Badge color="amber">{maybe} maybe</Badge>
                        <Badge color="red">{no} can’t</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                {poll.status === "open" &&
                  <form action={closePoll}><input type="hidden" name="id" value={poll.id} /><Button type="submit" variant="secondary">Close</Button></form>}
                <form action={deletePoll}><input type="hidden" name="id" value={poll.id} /><Button type="submit" variant="danger">Delete</Button></form>
              </div>
            </Card>
          );
        })}
    </div>
  );
}
