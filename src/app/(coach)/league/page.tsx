import { requireUser, listCoachTeams } from "@/lib/auth";
import { getOrgForOwner, orgTeamIds } from "@/lib/orgs";
import { leagueStandings, originFromEnv } from "@/lib/data";
import { PageTitle, Card, SectionTitle, Button, EmptyState } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { createLeague, renameLeague, setLeagueTeams, joinLeagueByCode } from "./actions";

export const dynamic = "force-dynamic";

export default async function LeaguePage() {
  const user = await requireUser();
  const org = await getOrgForOwner(user.id);
  const myTeams = await listCoachTeams(user);

  if (!org) {
    return (
      <div className="space-y-4">
        <PageTitle title="Leagues" subtitle="Group your teams into a league — shared standings + one public sign-up page." />
        <Card>
          <SectionTitle>Create a league</SectionTitle>
          <p className="mb-3 text-sm text-slate-500">e.g. &ldquo;Olympic Flame U10&rdquo;. You can add your teams to it next.</p>
          <form action={createLeague} className="flex gap-2">
            <input name="name" required className="input" placeholder="League / club name" />
            <Button type="submit">Create</Button>
          </form>
        </Card>
      <Card>
        <SectionTitle>Join another league</SectionTitle>
        <p className="mb-2 text-sm text-slate-500">Got a league code from another organizer? Add one of your teams to their league.</p>
        <form action={joinLeagueByCode} className="space-y-2">
          <input name="code" required className="input" placeholder="league code (e.g. olympic-flame-ab3d)" />
          <select name="teamId" required className="input">
            <option value="">Choose your team…</option>
            {myTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <Button type="submit" variant="secondary">Join league</Button>
        </form>
      </Card>
      </div>
    );
  }

  const allTeamIds = await orgTeamIds(org);
  const inLeague = new Set(org.teamIds);
  const standings = await leagueStandings(allTeamIds);
  const publicUrl = `${originFromEnv()}/l/${org.code}`;

  return (
    <div className="space-y-5">
      <PageTitle title={org.name} subtitle="Your league" />

      <Card>
        <SectionTitle>Public league page</SectionTitle>
        <p className="mb-2 text-sm text-slate-500">Share this — families pick their team and sign up, and anyone can see the standings.</p>
        <p className="break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{publicUrl}</p>
        <div className="mt-2"><CopyButton text={publicUrl} label="Copy league link" /></div>
        <p className="mt-3 text-sm text-slate-600">Coaches join with code: <span className="font-mono font-semibold">{org.code}</span></p>
        <div className="mt-1"><CopyButton text={org.code} label="Copy coach code" /></div>
      </Card>

      <Card>
        <SectionTitle>Teams in this league</SectionTitle>
        <form action={setLeagueTeams} className="space-y-2">
          {myTeams.map((t) => (
            <label key={t.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
              <input type="checkbox" name="team" value={t.id} defaultChecked={inLeague.has(t.id)} className="h-4 w-4" />
              <span className="font-medium">{t.name}</span>
              <span className="text-slate-400">{t.sport ?? ""}{t.age_group ? ` · ${t.age_group}` : ""}</span>
            </label>
          ))}
          <Button type="submit">Save teams</Button>
        </form>
        <p className="mt-2 text-xs text-slate-400">As more coaches join the league and use the app, their teams &amp; results roll into the standings below.</p>
      </Card>

      <div>
        <SectionTitle>Standings</SectionTitle>
        {standings.length === 0 ? <EmptyState title="No teams yet" hint="Add teams above to build the table." /> : (
          <Card className="!p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="p-3">Team</th><th className="p-3">P</th><th className="p-3">W</th><th className="p-3">D</th><th className="p-3">L</th><th className="p-3">GD</th><th className="p-3">Pts</th>
              </tr></thead>
              <tbody>
                {standings.map((r, i) => (
                  <tr key={r.teamId} className="border-b border-slate-100">
                    <td className="p-3 font-medium">{i + 1}. {r.name}</td>
                    <td className="p-3">{r.played}</td><td className="p-3">{r.w}</td><td className="p-3">{r.d}</td><td className="p-3">{r.l}</td>
                    <td className="p-3">{r.gf - r.ga >= 0 ? "+" : ""}{r.gf - r.ga}</td><td className="p-3 font-bold">{r.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
      <Card>
        <SectionTitle>Join another league</SectionTitle>
        <p className="mb-2 text-sm text-slate-500">Got a league code from another organizer? Add one of your teams to their league.</p>
        <form action={joinLeagueByCode} className="space-y-2">
          <input name="code" required className="input" placeholder="league code (e.g. olympic-flame-ab3d)" />
          <select name="teamId" required className="input">
            <option value="">Choose your team…</option>
            {myTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <Button type="submit" variant="secondary">Join league</Button>
        </form>
      </Card>
    </div>
  );
}
