import { getParentSession } from "@/lib/parent";
import { getAnnouncements } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { Card, PageTitle, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const session = await getParentSession();
  if (!session) return null;

  const announcements = await getAnnouncements(session.team.id);

  return (
    <div className="space-y-4">
      <PageTitle title="News" subtitle={session.team.name} />

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <EmptyState title="No announcements yet" hint="Updates from your coach will appear here." />
        ) : (
          announcements.map((a) => (
            <Card key={a.id}>
              <p className="font-semibold">{a.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{a.body}</p>
              <p className="mt-2 text-xs text-slate-400">{fmtDate(a.created_at)}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
