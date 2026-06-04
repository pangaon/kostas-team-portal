import { requireCoachTeam } from "@/lib/auth";
import { getEvents, getPlayers, getAttendance, nextEvent } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Badge, Stat, EmptyState } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { fmtDateTime } from "@/lib/format";
import { EVENT_TYPE_LABEL } from "@/lib/types";
import type { Player, Attendance, AttendanceStatus } from "@/lib/types";

function playerLabel(p: Player): string {
  return `${p.first_name} ${p.last_name}${p.jersey_number ? ` #${p.jersey_number}` : ""}`;
}

export default async function AttendancePage({ searchParams }: { searchParams: { event?: string } }) {
  const { team } = await requireCoachTeam();
  const [events, players] = await Promise.all([getEvents(team.id), getPlayers(team.id)]);
  const approved = players.filter((p) => p.status === "approved");
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.start_time).getTime() >= now);

  const selected =
    (searchParams.event && events.find((e) => e.id === searchParams.event)) ||
    nextEvent(events) ||
    events[events.length - 1] ||
    null;

  if (!selected) {
    return (
      <div className="space-y-5">
        <PageTitle title="Attendance" />
        <EmptyState title="No events yet" hint="Add an event to track attendance." />
      </div>
    );
  }

  const att = await getAttendance(selected.id);
  const byPlayer = new Map<string, Attendance>();
  for (const a of att) byPlayer.set(a.player_id, a);

  const groups: Record<AttendanceStatus | "no_reply", Player[]> = {
    attending: [], maybe: [], not_attending: [], no_reply: [],
  };
  for (const p of approved) {
    const a = byPlayer.get(p.id);
    if (!a) groups.no_reply.push(p);
    else groups[a.status].push(p);
  }

  const counts = {
    attending: groups.attending.length,
    maybe: groups.maybe.length,
    not_attending: groups.not_attending.length,
    no_reply: groups.no_reply.length,
  };

  const eventTitle = selected.title || (selected.opponent ? `vs ${selected.opponent}` : EVENT_TYPE_LABEL[selected.type]);
  const noteFor = (p: Player) => byPlayer.get(p.id)?.note ?? "";

  const summary =
`${team.name} — ${eventTitle}
${fmtDateTime(selected.start_time)}

Attending (${counts.attending}): ${groups.attending.map(playerLabel).join(", ") || "—"}
Maybe (${counts.maybe}): ${groups.maybe.map(playerLabel).join(", ") || "—"}
Not attending (${counts.not_attending}): ${groups.not_attending.map(playerLabel).join(", ") || "—"}
No reply (${counts.no_reply}): ${groups.no_reply.map(playerLabel).join(", ") || "—"}`;

  const renderGroup = (label: string, list: Player[], color: "green" | "amber" | "red" | "slate") => (
    <div>
      <SectionTitle>{label} ({list.length})</SectionTitle>
      {list.length === 0 ? (
        <p className="text-sm text-slate-400">None</p>
      ) : (
        <div className="space-y-2">
          {list.map((p) => (
            <Card key={p.id} className="flex items-center justify-between gap-2 py-3">
              <span className="font-medium">{playerLabel(p)}</span>
              <div className="flex items-center gap-2">
                {noteFor(p) && <span className="text-sm text-slate-500">{noteFor(p)}</span>}
                <Badge color={color}>{label}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <PageTitle title="Attendance" subtitle={`${eventTitle} · ${fmtDateTime(selected.start_time)}`} />

      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        {(upcoming.length ? upcoming : events).map((e) => {
          const isSel = e.id === selected.id;
          return (
            <a
              key={e.id}
              href={`/team/attendance?event=${e.id}`}
              className={`shrink-0 rounded-xl border px-3 py-2 text-sm ${
                isSel ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              <div className="font-medium">{e.title || (e.opponent ? `vs ${e.opponent}` : EVENT_TYPE_LABEL[e.type])}</div>
              <div className="text-xs opacity-70">{fmtDateTime(e.start_time)}</div>
            </a>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Attending" value={counts.attending} />
        <Stat label="Maybe" value={counts.maybe} />
        <Stat label="Not attending" value={counts.not_attending} />
        <Stat label="No reply" value={counts.no_reply} />
      </div>

      <div className="flex justify-end">
        <CopyButton text={summary} label="Copy summary" />
      </div>

      <div className="space-y-5">
        {renderGroup("Attending", groups.attending, "green")}
        {renderGroup("Maybe", groups.maybe, "amber")}
        {renderGroup("Not attending", groups.not_attending, "red")}
        {renderGroup("No reply", groups.no_reply, "slate")}
      </div>
    </div>
  );
}
