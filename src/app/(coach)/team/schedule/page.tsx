import { requireCoachTeam } from "@/lib/auth";
import { getEvents } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Badge, Button, EmptyState, Field } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";
import { EVENT_TYPE_LABEL } from "@/lib/types";
import type { TeamEvent } from "@/lib/types";
import { upsertEvent, deleteEvent, setEventStatus } from "./actions";

function localValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function EventForm({ event }: { event?: TeamEvent }) {
  return (
    <Card>
      <SectionTitle>{event ? "Edit event" : "Add event"}</SectionTitle>
      <form action={upsertEvent} className="space-y-4">
        {event && <input type="hidden" name="id" value={event.id} />}
        <Field label="Type" name="type">
          <select id="type" name="type" className="input" defaultValue={event?.type ?? "game"}>
            <option value="game">Game</option>
            <option value="practice">Practice</option>
            <option value="event">Team Event</option>
            <option value="tournament">Tournament</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title" name="title">
            <input id="title" name="title" className="input" defaultValue={event?.title ?? ""} />
          </Field>
          <Field label="Opponent" name="opponent">
            <input id="opponent" name="opponent" className="input" defaultValue={event?.opponent ?? ""} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Location" name="location">
            <input id="location" name="location" className="input" defaultValue={event?.location ?? ""} />
          </Field>
          <Field label="Field #" name="field_number">
            <input id="field_number" name="field_number" className="input" defaultValue={event?.field_number ?? ""} />
          </Field>
        </div>
        <Field label="Start" name="start" required>
          <input id="start" name="start" type="datetime-local" required className="input" defaultValue={localValue(event?.start_time ?? null)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Arrival" name="arrival">
            <input id="arrival" name="arrival" type="datetime-local" className="input" defaultValue={localValue(event?.arrival_time ?? null)} />
          </Field>
          <Field label="End" name="end">
            <input id="end" name="end" type="datetime-local" className="input" defaultValue={localValue(event?.end_time ?? null)} />
          </Field>
        </div>
        <Field label="Notes" name="notes">
          <textarea id="notes" name="notes" rows={2} className="input" defaultValue={event?.notes ?? ""} />
        </Field>
        <div className="flex gap-2">
          <Button type="submit">{event ? "Save changes" : "Add event"}</Button>
          <Button href="/team/schedule" variant="ghost">Cancel</Button>
        </div>
      </form>
    </Card>
  );
}

function EventCard({ event }: { event: TeamEvent }) {
  const title = event.title || (event.opponent ? `vs ${event.opponent}` : EVENT_TYPE_LABEL[event.type]);
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge color="blue">{EVENT_TYPE_LABEL[event.type]}</Badge>
            {event.status === "cancelled" && <Badge color="red">Cancelled</Badge>}
            {event.status === "postponed" && <Badge color="amber">Postponed</Badge>}
          </div>
          <p className="text-lg font-semibold">{title}</p>
          <p className="text-sm text-slate-500">{fmtDateTime(event.start_time)}</p>
          {(event.location || event.field_number) && (
            <p className="text-sm text-slate-500">
              📍 {[event.location, event.field_number ? `Field ${event.field_number}` : null].filter(Boolean).join(" · ")}
            </p>
          )}
          {event.notes && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{event.notes}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button href={`/team/schedule?edit=${event.id}`} variant="secondary">Edit</Button>
        {event.status === "cancelled" ? (
          <form action={setEventStatus}>
            <input type="hidden" name="id" value={event.id} />
            <input type="hidden" name="status" value="scheduled" />
            <Button type="submit" variant="secondary">Reschedule</Button>
          </form>
        ) : (
          <form action={setEventStatus}>
            <input type="hidden" name="id" value={event.id} />
            <input type="hidden" name="status" value="cancelled" />
            <Button type="submit" variant="secondary">Cancel</Button>
          </form>
        )}
        <form action={deleteEvent}>
          <input type="hidden" name="id" value={event.id} />
          <Button type="submit" variant="danger">Delete</Button>
        </form>
      </div>
    </Card>
  );
}

export default async function SchedulePage({ searchParams }: { searchParams: { edit?: string; add?: string } }) {
  const { team } = await requireCoachTeam();
  const events = await getEvents(team.id);
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.start_time).getTime() >= now);
  const past = events
    .filter((e) => new Date(e.start_time).getTime() < now)
    .reverse();

  const editEvent = searchParams.edit ? events.find((e) => e.id === searchParams.edit) : undefined;
  const showAdd = searchParams.add === "1";

  return (
    <div className="space-y-5">
      <PageTitle
        title="Schedule"
        subtitle={`${upcoming.length} upcoming`}
        action={!showAdd && !editEvent ? <Button href="/team/schedule?add=1">+ Add event</Button> : undefined}
      />

      {editEvent && <EventForm event={editEvent} />}
      {showAdd && !editEvent && <EventForm />}

      <div>
        <SectionTitle>Upcoming</SectionTitle>
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming events" hint="Add a game or practice." />
        ) : (
          <div className="space-y-3">{upcoming.map((e) => <EventCard key={e.id} event={e} />)}</div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <SectionTitle>Past</SectionTitle>
          <div className="space-y-3 opacity-80">{past.map((e) => <EventCard key={e.id} event={e} />)}</div>
        </div>
      )}
    </div>
  );
}
