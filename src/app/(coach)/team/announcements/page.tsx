import { requireCoachTeam } from "@/lib/auth";
import { getAnnouncements, getEvents } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Button, EmptyState, Field } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";
import { EVENT_TYPE_LABEL } from "@/lib/types";
import { createAnnouncement, deleteAnnouncement } from "./actions";

export default async function AnnouncementsPage() {
  const { team } = await requireCoachTeam();
  const [anns, events] = await Promise.all([getAnnouncements(team.id), getEvents(team.id)]);
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.start_time).getTime() >= now);
  const eventName = (id: string | null) => {
    const e = events.find((ev) => ev.id === id);
    if (!e) return null;
    return e.title || (e.opponent ? `vs ${e.opponent}` : EVENT_TYPE_LABEL[e.type]);
  };

  return (
    <div className="space-y-5">
      <PageTitle title="Announcements" subtitle="Sends a push notification to the team." />

      <Card>
        <SectionTitle>New announcement</SectionTitle>
        <form action={createAnnouncement} className="space-y-4">
          <Field label="Title" name="title" required>
            <input id="title" name="title" required className="input" placeholder="Game moved to Field 3" />
          </Field>
          <Field label="Message" name="body" required>
            <textarea id="body" name="body" required rows={4} className="input" placeholder="Details for parents…" />
          </Field>
          <Field label="Related event (optional)" name="event_id">
            <select id="event_id" name="event_id" className="input" defaultValue="">
              <option value="">None</option>
              {upcoming.map((e) => (
                <option key={e.id} value={e.id}>
                  {(e.title || (e.opponent ? `vs ${e.opponent}` : EVENT_TYPE_LABEL[e.type]))} · {fmtDateTime(e.start_time)}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit">Send announcement</Button>
        </form>
      </Card>

      <div>
        <SectionTitle>Past announcements</SectionTitle>
        {anns.length === 0 ? (
          <EmptyState title="No announcements yet" />
        ) : (
          <div className="space-y-3">
            {anns.map((a) => (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-xs text-slate-400">{fmtDateTime(a.created_at)}{eventName(a.event_id) ? ` · ${eventName(a.event_id)}` : ""}</p>
                  </div>
                  <form action={deleteAnnouncement}>
                    <input type="hidden" name="id" value={a.id} />
                    <Button type="submit" variant="danger">Delete</Button>
                  </form>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{a.body}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
