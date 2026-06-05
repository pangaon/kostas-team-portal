import Link from "next/link";
import { readIntake, intakeEmpty } from "@/lib/parentintake";
import { getParentSession, getParentChildren } from "@/lib/parent";
import { getEvents, getAttendance, getAnnouncements, getSnacks, nextEvent } from "@/lib/data";
import { setAttendance, switchChild } from "@/lib/parent-actions";
import { fmtDateTime, fmtDate } from "@/lib/format";
import { Card, PageTitle, SectionTitle, Badge, Button, EmptyState } from "@/components/ui";
import { PushControls } from "@/components/PushControls";
import { Onboarding } from "@/components/Onboarding";
import { EVENT_TYPE_LABEL, ATT_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

function mapsUrl(loc: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(loc)}`;
}

export default async function ParentHome() {
  const session = await getParentSession();
  if (!session) return null; // layout already guards this
  const { player, team } = session;
  const intakeMissing = intakeEmpty(await readIntake(player.id));

  const children = await getParentChildren();
  const events = await getEvents(team.id);
  const next = nextEvent(events);

  const myAtt =
    next != null
      ? (await getAttendance(next.id)).find((a) => a.player_id === player.id) ?? null
      : null;

  const snacks = await getSnacks(team.id);
  const openSnackCount = events.filter((e) => {
    if (e.status === "cancelled") return false;
    if (new Date(e.start_time).getTime() < Date.now() - 3 * 3600 * 1000) return false;
    return e.type === "game" && !snacks.some((s) => s.event_id === e.id);
  }).length;

  const announcements = await getAnnouncements(team.id);
  const latest = announcements[0] ?? null;

  return (
    <div className="space-y-4">
      <Onboarding
        id="parent_v1"
        title={`👋 Welcome to ${team.name}!`}
        steps={[
          "Tap \u201cI'll be there\u201d / \u201cCan't make it\u201d on the next game so coach knows who's coming.",
          "Turn on notifications below to get game-day reminders \u2014 no more WhatsApp needed.",
          "Snacks: sign up to bring snacks for a game when it's your turn.",
          "Add to home screen: tap your browser's Share \u2192 Add to Home Screen for a one-tap app.",
        ]}
      />
      {intakeMissing && (
        <Link href="/parent/profile" className="block rounded-2xl border border-brand-200 bg-brand-50 p-3">
          <p className="text-sm font-semibold text-brand-900">💛 Help your coach get to know {player.first_name} →</p>
          <p className="text-xs text-brand-800">A couple lines about your kid as a person and a player — it really helps the coach.</p>
        </Link>
      )}
      <PageTitle
        title={`Hi! ${player.first_name}${player.jersey_number ? ` #${player.jersey_number}` : ""}`}
        subtitle={team.name}
      />

      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map(({ player: c }) => {
            const active = c.id === player.id;
            return (
              <form key={c.id} action={switchChild}>
                <input type="hidden" name="token" value={c.access_token} />
                <button
                  type="submit"
                  className={`inline-flex min-h-[40px] items-center rounded-full px-4 text-sm font-semibold transition ${
                    active
                      ? "bg-brand-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {c.first_name}
                  {c.jersey_number ? ` #${c.jersey_number}` : ""}
                </button>
              </form>
            );
          })}
        </div>
      )}

      <PushControls />

      <div>
        <SectionTitle>Next up</SectionTitle>
        {next ? (
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Badge color={next.type === "game" ? "blue" : "slate"}>
                {EVENT_TYPE_LABEL[next.type]}
              </Badge>
              {myAtt && (
                <Badge
                  color={
                    myAtt.status === "attending"
                      ? "green"
                      : myAtt.status === "not_attending"
                      ? "red"
                      : "amber"
                  }
                >
                  {ATT_LABEL[myAtt.status]}
                </Badge>
              )}
            </div>
            <div>
              <p className="text-lg font-semibold">
                {next.type === "game" && next.opponent
                  ? `vs ${next.opponent}`
                  : next.title || EVENT_TYPE_LABEL[next.type]}
              </p>
              <p className="text-sm text-slate-600">{fmtDateTime(next.start_time)}</p>
              {next.location && (
                <p className="text-sm text-slate-500">{next.location}</p>
              )}
            </div>

            <form action={setAttendance} className="space-y-2">
              <input type="hidden" name="event_id" value={next.id} />
              <p className="text-sm font-medium text-slate-700">Will {player.first_name} be there?</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="submit"
                  name="status"
                  value="attending"
                  className={`min-h-[48px] rounded-xl text-sm font-semibold transition ${
                    myAtt?.status === "attending"
                      ? "bg-emerald-600 text-white"
                      : "border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  Going
                </button>
                <button
                  type="submit"
                  name="status"
                  value="maybe"
                  className={`min-h-[48px] rounded-xl text-sm font-semibold transition ${
                    myAtt?.status === "maybe"
                      ? "bg-amber-500 text-white"
                      : "border border-amber-300 bg-white text-amber-700 hover:bg-amber-50"
                  }`}
                >
                  Maybe
                </button>
                <button
                  type="submit"
                  name="status"
                  value="not_attending"
                  className={`min-h-[48px] rounded-xl text-sm font-semibold transition ${
                    myAtt?.status === "not_attending"
                      ? "bg-rose-600 text-white"
                      : "border border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
                  }`}
                >
                  Can&rsquo;t
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-2 pt-1">
              {next.location && (
                <Button
                  href={mapsUrl(next.location)}
                  variant="secondary"
                  className="flex-1"
                >
                  📍 Directions
                </Button>
              )}
              <Button href={`/event/${next.id}`} variant="ghost" className="flex-1">
                Details
              </Button>
            </div>
          </Card>
        ) : (
          <EmptyState title="No upcoming events" hint="Your coach hasn't scheduled anything yet." />
        )}
      </div>

      <Link href="/parent/snacks" className="block">
        <Card className="flex items-center justify-between">
          <div>
            <p className="font-semibold">🍎 Snack duty</p>
            <p className="text-sm text-slate-500">
              {openSnackCount > 0
                ? `${openSnackCount} game${openSnackCount === 1 ? "" : "s"} still need a volunteer`
                : "All upcoming games covered"}
            </p>
          </div>
          {openSnackCount > 0 && <Badge color="amber">Open</Badge>}
        </Card>
      </Link>

      <div>
        <SectionTitle>Latest from the coach</SectionTitle>
        {latest ? (
          <Link href="/parent/announcements" className="block">
            <Card>
              <p className="font-semibold">{latest.title}</p>
              <p className="mt-1 line-clamp-3 text-sm text-slate-600">{latest.body}</p>
              <p className="mt-2 text-xs text-slate-400">{fmtDate(latest.created_at)}</p>
            </Card>
          </Link>
        ) : (
          <EmptyState title="No announcements yet" />
        )}
      </div>
    </div>
  );
}
