import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoachTeam } from "@/lib/auth";
import { getEvent, getResult, getGoals, getPlayersWithGuardians, getGameRoster, getSubPlans, getSeasonRoster } from "@/lib/data";
import { Card, SectionTitle, Badge, Button } from "@/components/ui";
import { BackBar } from "@/components/BackBar";
import { fmtDate, fmtTime } from "@/lib/format";
import { incScore, logGoalLive, undoGoalLive, addGameNote, toggleOnField, setPosition, planSub, executeSub, cancelSub } from "./actions";

export const dynamic = "force-dynamic";

export default async function LiveGame({ params }: { params: { eventId: string } }) {
  const { team } = await requireCoachTeam();
  const event = await getEvent(params.eventId);
  if (!event || event.team_id !== team.id) notFound();

  const [result, goals, players, roster, subPlans, season] = await Promise.all([
    getResult(event.id), getGoals(event.id), getPlayersWithGuardians(team.id), getGameRoster(event.id),
    getSubPlans(event.id), getSeasonRoster(team.id),
  ]);
  const approved = players.filter((p) => p.status === "approved");
  const statusOf = new Map(roster.map((r) => [r.player_id, r.status]));
  const posOf = new Map(roster.map((r) => [r.player_id, r.position || ""]));
  const POSITIONS = ["GK", "DEF", "MID", "FWD"];
  const posCount = (code: string) => onField.filter((p) => posOf.get(p.id) === code).length;
  const onField = approved.filter((p) => statusOf.get(p.id) === "starter");
  const bench = approved.filter((p) => statusOf.get(p.id) !== "starter");
  const nameOf = (id: string | null) => {
    const p = approved.find((x) => x.id === id);
    return p ? `${p.first_name}${p.jersey_number ? " #" + p.jersey_number : ""}` : "Unassigned";
  };
  const us = result?.our_score ?? 0;
  const them = result?.opp_score ?? 0;
  const noteLines = (result?.notes ?? "").split("\n").filter(Boolean);
  const scorerPool = onField.length > 0 ? onField : approved;
  const startsBy = new Map<string, number>();
  for (const r of season) if (r.status === "starter") startsBy.set(r.player_id, (startsBy.get(r.player_id) ?? 0) + 1);
  const benchFair = [...bench].sort((a, b) => (startsBy.get(a.id) ?? 0) - (startsBy.get(b.id) ?? 0));
  const hasGK = onField.some((p) => posOf.get(p.id) === "GK");

  return (
    <main className="mx-auto max-w-md px-4 pb-12">
      {/* GAME-DAY SCOREBOARD (sticky, focused) */}
      <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-slate-800 bg-slate-900 px-4 pb-4 pt-4 text-white shadow-xl">
        <div className="flex items-center justify-between text-xs">
          <Link href="/dashboard" className="font-semibold text-slate-200 hover:text-white">← Exit game mode</Link>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-300">● LIVE</span>
        </div>
        <p className="mt-2 truncate text-center text-xs text-slate-400">{event.title || (event.opponent ? `vs ${event.opponent}` : "Game")} · {fmtTime(event.start_time)}{event.location ? ` · ${event.location}` : ""}</p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-center">
          {(["us", "them"] as const).map((side) => (
            <div key={side}>
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">{side === "us" ? team.name : (event.opponent || "Them")}</p>
              <p className="my-1 text-6xl font-extrabold tabular-nums">{side === "us" ? us : them}</p>
              <div className="flex justify-center gap-3">
                <form action={incScore}><input type="hidden" name="event_id" value={event.id} /><input type="hidden" name="side" value={side} /><input type="hidden" name="op" value="dec" /><button className="h-11 w-11 rounded-full border border-slate-600 text-2xl leading-none text-slate-200">−</button></form>
                <form action={incScore}><input type="hidden" name="event_id" value={event.id} /><input type="hidden" name="side" value={side} /><input type="hidden" name="op" value="inc" /><button className="h-11 w-11 rounded-full bg-emerald-500 text-2xl leading-none font-bold text-white">+</button></form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GOAL FOR US -> pick scorer (also bumps score) */}
      <div className="mt-5">
        <SectionTitle>⚽ Goal for us — tap the scorer</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {scorerPool.map((p) => (
            <form key={p.id} action={logGoalLive}>
              <input type="hidden" name="event_id" value={event.id} />
              <input type="hidden" name="player_id" value={p.id} />
              <button className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                {p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}
              </button>
            </form>
          ))}
          <form action={logGoalLive}>
            <input type="hidden" name="event_id" value={event.id} />
            <button className="rounded-full border border-slate-300 px-3 py-2 text-sm">Unknown / own goal</button>
          </form>
        </div>
        {goals.length > 0 && (
          <div className="mt-3 space-y-1">
            {goals.map((g, i) => (
              <div key={g.id} className="flex items-center justify-between text-sm">
                <span>{i + 1}. ⚽ {nameOf(g.player_id)}</span>
                <form action={undoGoalLive}><input type="hidden" name="event_id" value={event.id} /><input type="hidden" name="id" value={g.id} /><button className="text-rose-500">undo</button></form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ON FIELD — positions + goalie */}
      <div className="mt-5">
        <SectionTitle>On the field ({onField.length}/8)</SectionTitle>
        <p className="mb-1 text-xs text-slate-500">🧤 GK {posCount("GK")} · DEF {posCount("DEF")} · MID {posCount("MID")} · FWD {posCount("FWD")}</p>
        {(!hasGK || onField.length !== 8) && (
          <p className="mb-2 text-xs font-semibold text-amber-600">
            {!hasGK ? "⚠ No goalie set" : ""}{!hasGK && onField.length !== 8 ? " · " : ""}{onField.length !== 8 ? `${onField.length}/8 on field` : ""}
          </p>
        )}
        <div className="space-y-2">
          {onField.map((p) => {
            const pos = posOf.get(p.id) || "";
            return (
              <div key={p.id} className={`flex items-center gap-2 rounded-xl border p-2 ${pos === "GK" ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}>
                <span className="flex-1 text-sm font-medium">{pos === "GK" ? "🧤 " : ""}{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}</span>
                <form action={setPosition} className="flex items-center gap-1">
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="player_id" value={p.id} />
                  <select name="position" defaultValue={pos} className="input py-1 text-sm">
                    <option value="">pos</option>
                    {POSITIONS.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                  <button className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">set</button>
                </form>
                <form action={toggleOnField}>
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="player_id" value={p.id} />
                  <input type="hidden" name="current" value="starter" />
                  <button className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">sub off</button>
                </form>
              </div>
            );
          })}
          {onField.length === 0 && <p className="text-sm text-slate-400">No one on the field yet — bring players on from the bench below (set your goalie first).</p>}
        </div>
        <div className="mt-3">
          <SectionTitle>Bench — tap to bring on</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {bench.map((p) => (
              <form key={p.id} action={toggleOnField}>
                <input type="hidden" name="event_id" value={event.id} />
                <input type="hidden" name="player_id" value={p.id} />
                <input type="hidden" name="current" value="bench" />
                <button className="rounded-full border border-slate-300 px-3 py-2 text-sm">+ {p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}</button>
              </form>
            ))}
            {bench.length === 0 && <p className="text-sm text-slate-400">Everyone is on the field.</p>}
          </div>
        </div>
      </div>

      {/* SUB PLAN — on deck (fair-play smart) */}
      <div className="mt-5">
        <SectionTitle>Sub plan — get them ready 🔁</SectionTitle>
        {subPlans.length > 0 && (
          <div className="space-y-2">
            {subPlans.map((sp) => (
              <div key={sp.id} className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-2">
                <span className="flex-1 text-sm"><b>IN:</b> {nameOf(sp.player_in)} · <b>OUT:</b> {nameOf(sp.player_out)}</span>
                <form action={executeSub}><input type="hidden" name="id" value={sp.id} /><input type="hidden" name="event_id" value={event.id} /><button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Make sub</button></form>
                <form action={cancelSub}><input type="hidden" name="id" value={sp.id} /><input type="hidden" name="event_id" value={event.id} /><button className="text-xs text-rose-500">cancel</button></form>
              </div>
            ))}
          </div>
        )}
        <Card className="mt-2">
          <form action={planSub} className="space-y-2">
            <input type="hidden" name="event_id" value={event.id} />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label text-xs">Coming OFF</label>
                <select name="player_out" className="input py-2 text-sm"><option value="">Select…</option>
                  {onField.map((p) => <option key={p.id} value={p.id}>{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}{posOf.get(p.id) ? ` (${posOf.get(p.id)})` : ""}</option>)}
                </select></div>
              <div><label className="label text-xs">Going ON</label>
                <select name="player_in" className="input py-2 text-sm"><option value="">Select…</option>
                  {benchFair.map((p, i) => <option key={p.id} value={p.id}>{i === 0 ? "💡 " : ""}{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""} · {startsBy.get(p.id) ?? 0} starts</option>)}
                </select></div>
            </div>
            <Button type="submit" variant="secondary" className="py-2">Add to on deck</Button>
          </form>
          <p className="mt-2 text-xs text-slate-400">💡 = fewest starts this season (fair play). Tap &ldquo;Make sub&rdquo; when they&apos;re ready — the sub takes their position.</p>
        </Card>
      </div>

      {/* NOTES */}
      <div className="mt-5">
        <SectionTitle>Game notes (live)</SectionTitle>
        <Card>
          <form action={addGameNote} className="flex gap-2">
            <input name="note" className="input py-2" placeholder="e.g. great save by keeper, 2nd half kickoff…" />
            <Button type="submit" variant="secondary" className="py-2">Add</Button>
          </form>
          {noteLines.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {noteLines.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </Card>
      </div>

      {/* SAFETY (collapsible) */}
      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-semibold text-slate-600">⚠️ Allergies &amp; emergency contacts</summary>
        <Card className="mt-2">
          <ul className="divide-y divide-slate-100 text-sm">
            {approved.map((p) => {
              const g = p.guardians?.[0];
              return (
                <li key={p.id} className="py-2">
                  <span className="font-medium">{p.first_name} {p.last_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}</span>
                  {p.allergies && <span className="ml-2 font-semibold text-rose-600">⚠ {p.allergies}</span>}
                  <div className="text-xs text-slate-500">
                    Emergency: {p.emergency_contact_name || g?.name || "—"} {p.emergency_contact_phone || g?.phone || ""}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </details>

      <div className="mt-5 flex gap-2">
        <Button href={`/event/${event.id}/sheet`} variant="secondary">Printable sheet</Button>
        <Button href="/team/season" variant="ghost">Season →</Button>
      </div>
    </main>
  );
}
