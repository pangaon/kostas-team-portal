import { requireCoachTeam } from "@/lib/auth";
import { getInbox } from "@/lib/data";
import { Card, PageTitle, Badge, Button, EmptyState } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";
import { markRead, deleteNote } from "./actions";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const { team } = await requireCoachTeam();
  const notes = await getInbox(team.id);
  return (
    <div className="space-y-4">
      <PageTitle title="Parent notes" subtitle="Messages parents sent you" />
      {notes.length === 0 ? <EmptyState title="No notes yet" hint="Parents can message you from their portal." /> :
        notes.map((n) => (
          <Card key={n.id} className={n.is_read ? "" : "border-brand-200 bg-brand-50"}>
            <div className="flex items-center justify-between">
              <p className="font-semibold">{n.from_name || "A parent"}</p>
              {!n.is_read && <Badge color="blue">new</Badge>}
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{n.body}</p>
            <p className="mt-1 text-xs text-slate-400">{fmtDateTime(n.created_at)}</p>
            <div className="mt-2 flex gap-2">
              {!n.is_read && <form action={markRead}><input type="hidden" name="id" value={n.id} /><Button type="submit" variant="secondary" className="py-2">Mark read</Button></form>}
              <form action={deleteNote}><input type="hidden" name="id" value={n.id} /><Button type="submit" variant="danger" className="py-2">Delete</Button></form>
            </div>
          </Card>
        ))}
    </div>
  );
}
