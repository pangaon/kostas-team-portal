import { requireCoachTeam } from "@/lib/auth";
import { originFromEnv } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Button, Field } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { inviteLink } from "@/lib/whatsapp";
import { updateTeam, regenerateCode } from "./actions";

export default async function SettingsPage() {
  const { team } = await requireCoachTeam();
  const origin = originFromEnv();
  const invite = inviteLink(origin, team.invite_code);
  const calendarUrl = `${origin}/api/calendar/${team.invite_code}.ics`;

  return (
    <div className="space-y-5">
      <PageTitle title="Settings" subtitle="Team details, invite link, and calendar." />

      <Card>
        <SectionTitle>Team details</SectionTitle>
        <form action={updateTeam} className="space-y-4">
          <Field label="Team name" name="name" required>
            <input id="name" name="name" required className="input" defaultValue={team.name} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sport" name="sport">
              <input id="sport" name="sport" className="input" defaultValue={team.sport ?? ""} />
            </Field>
            <Field label="Season" name="season">
              <input id="season" name="season" className="input" defaultValue={team.season ?? ""} />
            </Field>
          </div>
          <Field label="Age group" name="age_group">
            <input id="age_group" name="age_group" className="input" defaultValue={team.age_group ?? ""} />
          </Field>
          <Button type="submit">Save changes</Button>
        </form>
      </Card>

      <Card>
        <SectionTitle>Invite link</SectionTitle>
        <p className="text-sm text-slate-500">Share this with parents so they can register their player.</p>
        <p className="mt-2 break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{invite}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={invite} label="Copy invite link" />
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-sm text-amber-700">
            Regenerating creates a new link. The old link will stop working immediately.
          </p>
          <form action={regenerateCode} className="mt-2">
            <Button type="submit" variant="danger">Regenerate invite link</Button>
          </form>
        </div>
      </Card>

      <Card>
        <SectionTitle>Calendar subscription</SectionTitle>
        <p className="text-sm text-slate-500">
          Parents can subscribe in Apple/Google Calendar to auto-sync the schedule.
        </p>
        <p className="mt-2 break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{calendarUrl}</p>
        <div className="mt-3">
          <CopyButton text={calendarUrl} label="Copy calendar link" />
        </div>
      </Card>
    </div>
  );
}
