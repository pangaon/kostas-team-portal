import Link from "next/link";
import { getParentSession } from "@/lib/parent";
import { getEvents } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import { Card, PageTitle, SectionTitle, Badge, EmptyState } from "@/components/ui";
import { EVENT_TYPE_LABEL, type TeamEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

function mapsUrl(loc: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(loc)}`;
}

function EventCard({ e, past = false }: { e: TeamEvent; past?: boolean }) {
  const cancelled = e.status === "cancelled";
  return (
    <Card className={past ? "opacity-70" : ""}>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/event/${e.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge color={e.type === "game" ? "blue" : "slate"}>
              {EVENT_TYPE_LABEL[e.type]}
            </Badge>
            {cancelled && <Badge color="red">Cancelled</Badge>}
            {e.status === "postponed" && <Badge color="amber">Postponed</Badge>}
          </div>
          <p className="mt-1.5 font-semibold">
            {e.type === "game" && e.opponent
              ? `vs ${e.opponent}`
              : e.title || EVENT_TYPE_LABEL[e.type]}
          </p>
          <p className="text-sm text-slate-600">{fmtDateTime(e.start_time)}</p>
          {e.location && <p className="text-sm text-slate-500">{e.location}</p>}
        </Link>
      </div>
      {e.location && (
        <a
          href={mapsUrl(e.location)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-semibold text-brand-700"
        >
          📍 Directions
        </a>
      )}
    </Card>
  );
}

export default async function SchedulePage() {
  const session = await getParentSession();
  if (!session) return null;

  const events = await getEvents(session.team.id);
  const cutoff = Date.now() - 3 * 3600 * 1000;
  const upcoming = events.filter((e) => new Date(e.start_time).getTime() >= cutoff);
  const past = events
    .filter((e) => new Date(e.start_time).getTime() < cutoff)
    .reverse();

  return (
    <div className="space-y-4">
      <PageTitle title="Schedule" subtitle={session.team.name} />

      <div className="space-y-3">
        {upcoming.length === 0 ? (
          <EmptyState title="Nothing upcoming" hint="Check back once your coach adds events." />
        ) : (
          upcoming.map((e) => <EventCard key={e.id} e={e} />)
        )}
      </div>

      {past.length > 0 && (
        <details className="pt-2">
          <summary className="cursor-pointer text-sm font-semibold text-slate-500">
            Past events ({past.length})
          </summary>
          <div className="mt-3 space-y-3">
            {past.map((e) => (
              <EventCard key={e.id} e={e} past />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
