import { notFound } from "next/navigation";
import { requireCoachTeam } from "@/lib/auth";
import { getEvent, getResult, getGoals, getPlayersWithGuardians, getGameRoster, getSubPlans, getSeasonRoster, getLineupPlans } from "@/lib/data";
import { fmtDate, fmtTime } from "@/lib/format";
import { LiveGameClient } from "./LiveGameClient";
import { sportFromString } from "@/lib/sports";
import { readTeamRules } from "@/lib/teamrules";
import { withAvatars } from "@/lib/avatars";

export const dynamic = "force-dynamic";

export default async function LiveGame({ params }: { params: { eventId: string } }) {
  const { team } = await requireCoachTeam();
  const sport = sportFromString(team.sport);
  const rules = await readTeamRules(team.id);
  const onField = rules.onField ?? sport.onField;
  const periodCount = rules.periodCount ?? sport.periodCount;
  const periodMin = rules.periodMin ?? sport.defaultPeriodMin;
  const event = await getEvent(params.eventId);
  if (!event || event.team_id !== team.id) notFound();

  const [result, goals, players, roster, subPlans, season, plans] = await Promise.all([
    getResult(event.id), getGoals(event.id), getPlayersWithGuardians(team.id), getGameRoster(event.id),
    getSubPlans(event.id), getSeasonRoster(team.id), getLineupPlans(event.id),
  ]);
  const approved = await withAvatars(players.filter((p) => p.status === "approved"));

  const initField: Record<string, { status: "starter" | "bench" | "out"; position: string | null }> = {};
  for (const r of roster) initField[r.player_id] = { status: r.status, position: r.position };

  const startsBy: Record<string, number> = {};
  for (const r of season) if (r.status === "starter") startsBy[r.player_id] = (startsBy[r.player_id] ?? 0) + 1;

  return (
    <LiveGameClient
      eventId={event.id}
      teamName={team.name}
      opponent={event.opponent ?? ""}
      title={event.title || (event.opponent ? `vs ${event.opponent}` : "Game")}
      when={`${fmtDate(event.start_time)} · ${fmtTime(event.start_time)}${event.location ? " · " + event.location : ""}`}
      initUs={result?.our_score ?? 0}
      initThem={result?.opp_score ?? 0}
      players={approved.map((p) => ({
        id: p.id, first_name: p.first_name, last_name: p.last_name, jersey_number: p.jersey_number,
        allergies: p.allergies, emergency_contact_name: p.emergency_contact_name, emergency_contact_phone: p.emergency_contact_phone,
        guardian_phone: p.guardians?.[0]?.phone ?? null, avatar_url: p.avatar_url, strength: p.strength,
      }))}
      initField={initField}
      initGoals={goals.map((g) => ({ id: g.id, player_id: g.player_id, saved: true }))}
      initNotes={(result?.notes ?? "").split("\n").filter(Boolean)}
      initSubs={subPlans.map((sp) => ({ id: sp.id, player_in: sp.player_in, player_out: sp.player_out, saved: true }))}
      startsBy={startsBy}
      plans={plans.map((pl) => ({ id: pl.id, name: pl.name, slots: pl.slots }))}
      sport={{ label: sport.label, emoji: sport.emoji, scoreTerm: sport.scoreTerm, scoreEmoji: sport.scoreEmoji, onField, periodType: sport.periodType, periodCount, defaultPeriodMin: periodMin, timed: sport.timed, positions: sport.positions, hasPitch: sport.surface !== "diamond" }}
    />
  );
}
