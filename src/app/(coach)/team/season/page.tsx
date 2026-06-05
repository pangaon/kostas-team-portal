import { requireCoachTeam } from "@/lib/auth";
import { getPlayers, getEvents, getResults, getSeasonGoals } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Badge, Button, Stat, EmptyState } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { saveResult, addGoal, removeGoal } from "./actions";
import type { Player, TeamEvent } from "@/lib/types";
import { sportFromString } from "@/lib/sports";

export const dynamic = "force-dynamic";

export default async function SeasonPage() {
  const { team } = await requireCoachTeam();
  const sport = sportFromString(team.sport);
  const term = sport.scoreTerm;
  const termPlural = term + "s";
  const [players, events, results, goals] = await Promise.all([
    getPlayers(team.id), getEvents(team.id), getResults(team.id), getSeasonGoals(team.id),
  ]);
  const approved = players.filter((p) => p.status === "approved");
  const nameOf = (id: string | null) => {
    const p = approved.find((x) => x.id === id);
    return p ? `${p.first_name}${p.jersey_number ? " #" + p.jersey_number : ""}` : "—";
  };
  const games = events.filter((e) => e.type === "game")
    .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time));
  const resByEvent = new Map(results.map((r) => [r.event_id, r]));

  // record
  let w = 0, d = 0, l = 0, gf = 0, ga = 0;
  const form: ("W" | "D" | "L")[] = [];
  for (const g of games) {
    const r = resByEvent.get(g.id);
    if (!r) continue;
    gf += r.our_score; ga += r.opp_score;
    if (r.our_score > r.opp_score) { w++; form.push("W"); }
    else if (r.our_score === r.opp_score) { d++; form.push("D"); }
    else { l++; form.push("L"); }
  }
  const pts = w * 3 + d;

  // scorers
  const scoreCount = new Map<string, number>();
  const assistCount = new Map<string, number>();
  for (const ge of goals) {
    if (ge.player_id) scoreCount.set(ge.player_id, (scoreCount.get(ge.player_id) ?? 0) + 1);
    if (ge.assist_player_id) assistCount.set(ge.assist_player_id, (assistCount.get(ge.assist_player_id) ?? 0) + 1);
  }
  const scorers = [...scoreCount.entries()].map(([id, n]) => ({ id, n, a: assistCount.get(id) ?? 0 }))
    .sort((x, y) => y.n - x.n || y.a - x.a);

  const formColor = (r: "W" | "D" | "L"): "green" | "amber" | "red" => (r === "W" ? "green" : r === "D" ? "amber" : "red");

  return (
    <div className="space-y-5">
      <PageTitle title="Season" subtitle={`Results, record and top ${termPlural.toLowerCase()}`} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Record (W-D-L)" value={`${w}-${d}-${l}`} hint={`${pts} pts`} />
        <Stat label={`${termPlural} for`} value={gf} />
        <Stat label={`${termPlural} against`} value={ga} />
        <Stat label={`${term} diff`} value={(gf - ga >= 0 ? "+" : "") + (gf - ga)} />
      </div>

      {form.length > 0 && (
        <div>
          <SectionTitle>Recent form</SectionTitle>
          <div className="flex gap-1.5">
            {form.slice(-6).map((r, i) => <Badge key={i} color={formColor(r)}>{r}</Badge>)}
          </div>
        </div>
      )}

      <div>
        <SectionTitle>Top {termPlural.toLowerCase()}</SectionTitle>
        {scorers.length === 0 ? <EmptyState title={`No ${termPlural.toLowerCase()} recorded yet`} hint={`Add ${termPlural.toLowerCase()} under each ${sport.noun} below.`} /> : (
          <Card>
            <ol className="divide-y divide-slate-100">
              {scorers.map((s, i) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <span className="font-medium">{i + 1}. {nameOf(s.id)}</span>
                  <span className="text-sm text-slate-500">{s.n} {s.n === 1 ? term.toLowerCase() : termPlural.toLowerCase()}{s.a ? ` · ${s.a} ast` : ""}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>

      <div>
        <SectionTitle>{sport.noun === "match" ? "Matches" : "Games"} — record scores &amp; {termPlural.toLowerCase()}</SectionTitle>
        <div className="space-y-3">
          {games.map((g) => {
            const r = resByEvent.get(g.id);
            const gGoals = goals.filter((x) => x.event_id === g.id);
            return (
              <Card key={g.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{g.title || (g.opponent ? `vs ${g.opponent}` : "Game")}</p>
                    <p className="text-xs text-slate-500">{fmtDate(g.start_time)}</p>
                  </div>
                  {r && <Badge color={r.our_score > r.opp_score ? "green" : r.our_score === r.opp_score ? "amber" : "red"}>
                    {r.our_score} - {r.opp_score}
                  </Badge>}
                </div>
                <form action={saveResult} className="mt-3 flex items-end gap-2">
                  <input type="hidden" name="event_id" value={g.id} />
                  <div><label className="label text-xs">Us</label><input name="our_score" type="number" min="0" defaultValue={r?.our_score ?? 0} className="input w-16 py-2" /></div>
                  <div><label className="label text-xs">Them</label><input name="opp_score" type="number" min="0" defaultValue={r?.opp_score ?? 0} className="input w-16 py-2" /></div>
                  <Button type="submit" variant="secondary" className="py-2">Save</Button>
                  <Button href={`/event/${g.id}/live`} variant="ghost" className="py-2">▶ Live</Button>
                  <textarea name="notes" rows={1} defaultValue={r?.notes ?? ""} placeholder="Game notes…" className="input ml-auto w-full py-2" />
                </form>
                <div className="mt-3">
                  {gGoals.map((ge) => (
                    <div key={ge.id} className="flex items-center justify-between text-sm">
                      <span>⚽ {nameOf(ge.player_id)}{ge.assist_player_id ? ` (assist ${nameOf(ge.assist_player_id)})` : ""}</span>
                      <form action={removeGoal}><input type="hidden" name="id" value={ge.id} /><button className="text-rose-500">remove</button></form>
                    </div>
                  ))}
                  <form action={addGoal} className="mt-2 flex items-end gap-2">
                    <input type="hidden" name="event_id" value={g.id} />
                    <div className="flex-1"><label className="label text-xs">Scorer</label>
                      <select name="player_id" className="input py-2"><option value="">Select…</option>
                        {approved.map((p: Player) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}</option>)}
                      </select></div>
                    <div className="flex-1"><label className="label text-xs">Assist (optional)</label>
                      <select name="assist_player_id" className="input py-2"><option value="">—</option>
                        {approved.map((p: Player) => <option key={p.id} value={p.id}>{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}</option>)}
                      </select></div>
                    <Button type="submit" variant="secondary" className="py-2">+ {term}</Button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
