import { requireCoachTeam } from "@/lib/auth";
import { getNotifications } from "@/lib/data";
import { PageTitle, Card, EmptyState } from "@/components/ui";
import { sendTodayReminders } from "@/app/(coach)/dashboard/actions";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const KIND_ICON: Record<string, string> = { event: "📅", announcement: "📣", snack: "🍎", attendance: "✅", general: "🔔" };

export default async function NotificationsPage() {
  const { team } = await requireCoachTeam();
  const items = await getNotifications(team.id);

  return (
    <div className="space-y-5">
      <PageTitle title="Notifications" subtitle="Everything sent to your parents — auto + manual." />

      <Card className="flex flex-wrap items-center justify-between gap-2 border-brand-200 bg-brand-50">
        <div>
          <p className="font-semibold text-ink">Game-day reminders</p>
          <p className="text-sm text-slate-600">Auto-send every game morning at 8am. Send now or test:</p>
        </div>
        <form action={sendTodayReminders}><button className="btn-primary">📣 Send today&rsquo;s reminders</button></form>
      </Card>

      <div>
        {items.length === 0 ? (
          <EmptyState title="Nothing sent yet" hint="Reminders and announcements will show up here." />
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <Card key={n.id} className="flex items-start gap-3 !py-3">
                <span className="text-lg">{KIND_ICON[n.kind] ?? "🔔"}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{n.title}</p>
                  {n.body && <p className="text-sm text-slate-600">{n.body}</p>}
                  <p className="mt-0.5 text-xs text-slate-400">{fmtDateTime(n.created_at)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
