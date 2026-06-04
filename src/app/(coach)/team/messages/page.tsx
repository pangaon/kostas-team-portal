import { requireCoachTeam } from "@/lib/auth";
import { getEvents, nextEvent, originFromEnv } from "@/lib/data";
import { Card, PageTitle, SectionTitle } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { templates, inviteLink } from "@/lib/whatsapp";

export default async function MessagesPage() {
  const { team } = await requireCoachTeam();
  const events = await getEvents(team.id);
  const next = nextEvent(events);
  const origin = originFromEnv();
  const invite = inviteLink(origin, team.invite_code);

  return (
    <div className="space-y-5">
      <PageTitle title="Messages" subtitle="Copy-ready WhatsApp templates for your group." />

      <Card>
        <SectionTitle>Invite link</SectionTitle>
        <p className="break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{invite}</p>
        <div className="mt-3">
          <CopyButton text={invite} label="Copy invite link" />
        </div>
      </Card>

      <div className="space-y-3">
        {templates.map((t) => {
          const text = t.build({ team, origin, nextEvent: next });
          return (
            <Card key={t.id}>
              <SectionTitle>{t.label}</SectionTitle>
              <pre className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{text}</pre>
              <div className="mt-3">
                <CopyButton text={text} label="Copy message" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
