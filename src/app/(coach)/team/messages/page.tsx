import Link from "next/link";
import { requireCoachTeam } from "@/lib/auth";
import { getEvents, nextEvent, originFromEnv, getCoachThreads, getCoachThread } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Badge, EmptyState } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { templates, inviteLink } from "@/lib/whatsapp";
import { replyToParent, markThreadRead } from "./actions";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MessagesPage({ searchParams }: { searchParams: { player?: string } }) {
  const { team } = await requireCoachTeam();

  // ---- Thread view ----
  if (searchParams.player) {
    const { name, messages } = await getCoachThread(team.id, searchParams.player);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/team/messages" className="text-sm font-semibold text-brand-700">← All chats</Link>
        </div>
        <PageTitle title={name} subtitle="Private chat with this family" />
        <form action={markThreadRead}><input type="hidden" name="player" value={searchParams.player} /><button className="text-xs font-semibold text-slate-400">Mark read</button></form>

        <div className="space-y-2">
          {messages.length === 0 ? <EmptyState title="No messages yet" hint="Send the first message below." /> :
            messages.map((m) => (
              <div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.fromCoach ? "ml-auto bg-brand-600 text-white" : "bg-white border border-slate-200 text-ink"}`}>
                <p className="whitespace-pre-line">{m.body}</p>
                <p className={`mt-1 text-[10px] ${m.fromCoach ? "text-brand-100" : "text-slate-400"}`}>{m.fromCoach ? "You" : "Parent"} · {fmtDateTime(m.created_at)}</p>
              </div>
            ))}
        </div>

        <form action={replyToParent} className="sticky bottom-20 flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-card lg:bottom-4">
          <input type="hidden" name="player" value={searchParams.player} />
          <input name="body" required className="input py-2" placeholder="Type a reply…" autoComplete="off" />
          <button className="btn-primary shrink-0">Send</button>
        </form>
      </div>
    );
  }

  // ---- Thread list ----
  const threads = await getCoachThreads(team.id);
  const events = await getEvents(team.id);
  const next = nextEvent(events);
  const origin = originFromEnv();
  const invite = inviteLink(origin, team.invite_code);

  return (
    <div className="space-y-5">
      <PageTitle title="Messages" subtitle="Two-way chats with your families." />

      {threads.length === 0 ? (
        <EmptyState title="No conversations yet" hint="When a parent messages you from their app, it shows here — and you can reply." />
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <Link key={t.key} href={`/team/messages?player=${t.key}`} className="block">
              <Card className="flex items-center gap-3 !py-3 transition hover:border-brand-300 hover:shadow-md">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{t.name.charAt(0)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink">{t.name}</p>
                    {t.unread > 0 && <Badge color="blue">{t.unread} new</Badge>}
                  </div>
                  <p className="truncate text-sm text-slate-500">{t.last}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{fmtDateTime(t.lastAt)}</span>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <details className="card !p-0 overflow-hidden">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-ink">📋 Share & invite templates (WhatsApp)</summary>
        <div className="space-y-3 border-t border-slate-100 p-4">
          <div>
            <p className="break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{invite}</p>
            <div className="mt-2"><CopyButton text={invite} label="Copy invite link" /></div>
          </div>
          {templates.map((tpl) => {
            const text = tpl.build({ team, origin, nextEvent: next });
            return (
              <div key={tpl.id}>
                <SectionTitle>{tpl.label}</SectionTitle>
                <pre className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{text}</pre>
                <div className="mt-2"><CopyButton text={text} label="Copy message" /></div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
