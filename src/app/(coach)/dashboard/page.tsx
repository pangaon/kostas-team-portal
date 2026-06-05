import Link from "next/link";
import { getCoachTeam } from "@/lib/auth";
import {
  getPlayers, getEvents, getAnnouncements, getSnacks, getAttendance, nextEvent, originFromEnv,
} from "@/lib/data";
import { Card, PageTitle, Stat, Badge, Button, EmptyState, SectionTitle } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { fmtDateTime } from "@/lib/format";
import { EVENT_TYPE_LABEL } from "@/lib/types";
import { inviteLink } from "@/lib/whatsapp";
import { createTeam, sendTestAlert, sendTodayReminders } from "./actions";
import { CoachPushControls } from "@/components/CoachPushControls";
import { Onboarding } from "@/components/Onboarding";
import { Hint } from "@/components/Hint";

export default async function Dashboard() {
  const { team } = await getCoachTeam();
  const origin = originFromEnv();

  if (!team) {
    return (
      <div className="mx-auto max-w-md">
        <PageTitle title="Create your team" subtitle="Set this up once to get your invite link." />
        <Card>
          <form action={createTeam} className="space-y-4">
            <div><label className="label">Team name</label><input name="name" required className="input" placeholder="Kostas Meat" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Sport</label><input name="sport" defaultValue="Soccer" className="input" /></div>
              <div><label className="label">Season</label><input name="season" placeholder="2026" className="input" /></div>
            </div>
            <div><label className="label">Age group</label><input name="age_group" placeholder="U9/U10" className="input" /></div>
            <Button type="submit" className="w-full">Create team</Button>
          </form>
        </Card>
      </div>
    );
  }

  const [players, events, anns, snacks] = await Promise.all([
    getPlayers(team.id), getEvents(team.id), getAnnouncements(team.id), getSnacks(team.id),
  ]);
  const approved = players.filter((p) => p.status === "approved");
  const joined = approved.filter((p) => p.claimed);
  const notJoined = approved.filter((p) => !p.claimed);
  const pending = players.filter((p) => p.status === "pending");
  const next = nextEvent(events);
  const att = next ? await getAttendance(next.id) : [];
  const counts = {
    in: att.filter((a) => a.status === "attending").length,
    out: att.filter((a) => a.status === "not_attending").length,
    maybe: att.filter((a) => a.status === "maybe").length,
  };
  const noReply = approved.length - (counts.in + counts.out + counts.maybe);
  const nextSnack = next ? snacks.find((s) => s.event_id === next.id) : null;
  const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const latest = anns[0];
  const invite = inviteLink(origin, team.invite_code);

  return (
    <div className="space-y-5">
      <Onboarding
        id="coach_v1"
        title="👋 Welcome, coach! Here's your 60-second setup"
        steps={[
          "Roster: add your players (tap 👥 Roster). Set a strength rating to color them on the pitch.",
          "Schedule: add your games & practices so reminders and the live console work.",
          "Invite parents: share your team link (below) — they join with no password.",
          "Tactics: tap 🎯 to build a lineup on the pitch, then push it into the live game.",
          "Turn on notifications below so you get game-day reminders automatically.",
        ]}
      />
      <PageTitle title={team.name} subtitle={`${team.sport ?? ""} · ${team.age_group ?? ""} · ${team.season ?? ""}`} />

      {pending.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-900">{pending.length} signup{pending.length > 1 ? "s" : ""} awaiting approval</p>
              <p className="text-sm text-amber-700">New players join through your invite link and wait for your OK.</p>
            </div>
            <Button href="/team/roster" variant="secondary">Review</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat href="/team/roster" label="Players" value={approved.length} hint={pending.length ? `${pending.length} pending approval` : "tap to manage"} />
        <Stat href="/team/schedule" label="Events" value={events.length} hint="games & practices" />
        <Stat href={next ? `/event/${next.id}` : "/team/schedule"} label="Next game" value={next ? shortDate(next.start_time) : "—"} hint={next ? `${counts.in} in · ${noReply} awaiting RSVP` : "none scheduled"} />
        <Stat href="/team/snacks" label="Snack" value={next ? (nextSnack ? "Claimed ✓" : "Open") : "—"} hint={next && !nextSnack ? "needs a volunteer" : "tap to view"} />
      </div>

      <div>
        <SectionTitle><span className="inline-flex items-center gap-1.5">Registrations <Hint text="Joined = parent linked their child. Pending = invited but not joined yet. Share your team link to get everyone on." /></span></SectionTitle>
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="green">{joined.length} joined</Badge>
            <Badge color="slate">{notJoined.length} not joined</Badge>
            {pending.length > 0 && <Badge color="amber">{pending.length} pending approval</Badge>}
            <Button href="/team/roster" variant="ghost" className="ml-auto py-1">Open roster →</Button>
          </div>
          {notJoined.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Haven&apos;t joined yet — give them a nudge</p>
              <p className="mt-1 text-sm text-slate-700">{notJoined.map((p) => `${p.first_name} ${p.last_name}`).join(", ")}</p>
            </div>
          )}
        </Card>
      </div>

      <div>
        <SectionTitle>Next event</SectionTitle>
        {next ? (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-1"><Badge color="blue">{EVENT_TYPE_LABEL[next.type]}</Badge></div>
                <p className="text-lg font-semibold">{next.title || (next.opponent ? `vs ${next.opponent}` : "Event")}</p>
                <p className="text-sm text-slate-500">{fmtDateTime(next.start_time)}</p>
                {next.location && <p className="text-sm text-slate-500">📍 {next.location}</p>}
              </div>
              <Button href={`/event/${next.id}`} variant="secondary">Open</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge color="green">{counts.in} attending</Badge>
              <Badge color="red">{counts.out} out</Badge>
              <Badge color="amber">{counts.maybe} maybe</Badge>
              <Badge color="slate">{noReply} no reply</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button href={`/event/${next.id}/live`}>▶ Live game</Button>
              <Button href={`/team/tactics?event=${next.id}`} variant="secondary">🎯 Tactics / lineup</Button>
              <Button href={`/event/${next.id}/sheet`} variant="secondary">Game-day sheet</Button>
            </div>
          </Card>
        ) : <EmptyState title="No upcoming events" hint="Add your first game or practice." />}
      </div>

      <div>
        <SectionTitle>Quick actions</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Button href="/team/schedule" variant="secondary">➕ Add event</Button>
          <Button href="/team/roster" variant="secondary">👥 Roster</Button>
          <Button href="/team/snacks" variant="secondary">🍎 Snacks</Button>
          <Button href="/team/attendance" variant="secondary">✅ Attendance</Button>
          <Button href="/team/announcements" variant="secondary">📣 Announce</Button>
          <Button href="/team/messages" variant="secondary">💬 Messages</Button>
          <Button href="/parent" variant="secondary">👨‍👧 My kid (parent view)</Button>
        </div>
      </div>

      <div>
        <SectionTitle><span className="inline-flex items-center gap-1.5">Notifications <Hint text="Game-day reminders auto-send at 8am to every parent who turned on alerts. No more manual WhatsApp messages." /></span></SectionTitle>
        <Card>
          <p className="text-sm text-slate-600">Alerts reach parents who turn them on. Enable them for your own device, then send a test to confirm.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <CoachPushControls />
            <form action={sendTestAlert}><Button type="submit" variant="secondary">Send test alert</Button></form>
            <form action={sendTodayReminders}><Button type="submit">📣 Send today&rsquo;s reminders</Button></form>
            <p className="text-xs text-slate-500">Auto-sends every game day at 8am. Tap to send now or test.</p>
          </div>
        </Card>
      </div>

      <div>
        <SectionTitle>Invite link</SectionTitle>
        <Card>
          <p className="break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{invite}</p>
          <div className="mt-3 flex gap-2">
            <CopyButton text={invite} label="Copy invite link" />
            <Button href="/team/messages" variant="ghost">WhatsApp message →</Button>
          </div>
        </Card>
      </div>

      {latest && (
        <div>
          <SectionTitle>Latest announcement</SectionTitle>
          <Card>
            <p className="font-semibold">{latest.title}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{latest.body}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
