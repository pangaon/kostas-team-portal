import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrgByCode } from "@/lib/orgs";
import { getTeamsByIds, leagueStandings, originFromEnv } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PublicLeague({ params }: { params: { code: string } }) {
  const org = await getOrgByCode(params.code);
  if (!org) notFound();
  const teams = await getTeamsByIds(org.teamIds);
  const standings = await leagueStandings(org.teamIds);
  const origin = originFromEnv();

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-5 text-center">
        <p className="text-4xl">🏆</p>
        <h1 className="mt-2 h-title">{org.name}</h1>
        <p className="text-sm text-slate-500">Sign up and follow the league</p>
      </div>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Join your team</h2>
        {teams.length === 0 ? (
          <p className="text-sm text-slate-400">No teams listed yet.</p>
        ) : (
          <div className="space-y-2">
            {teams.map((t) => (
              <Link key={t.id} href={`${origin}/join/${t.invite_code}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
                <span><span className="font-semibold">{t.name}</span><span className="ml-2 text-xs text-slate-400">{t.sport ?? ""}{t.age_group ? ` · ${t.age_group}` : ""}</span></span>
                <span className="chip bg-brand-600 text-white">Join →</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Standings</h2>
        {standings.length === 0 ? (
          <p className="text-sm text-slate-400">No results yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="p-3">Team</th><th className="p-3">P</th><th className="p-3">W</th><th className="p-3">D</th><th className="p-3">L</th><th className="p-3">Pts</th>
              </tr></thead>
              <tbody>
                {standings.map((r, i) => (
                  <tr key={r.teamId} className="border-b border-slate-100">
                    <td className="p-3 font-medium">{i + 1}. {r.name}</td>
                    <td className="p-3">{r.played}</td><td className="p-3">{r.w}</td><td className="p-3">{r.d}</td><td className="p-3">{r.l}</td><td className="p-3 font-bold">{r.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="mt-6 text-center text-xs text-slate-400">Powered by Badoni</p>
    </div>
  );
}
