import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Player, Guardian, TeamEvent, Attendance, SnackSignup, Announcement,
  GameRosterRow, VolunteerRole, Lineup, PlayerWithGuardians,
  Team,
} from "@/lib/types";

// Coach reads: server-side, already scoped to a team the caller owns
// (ownership is verified by requireCoachTeam before these run).
export async function getPlayers(teamId: string): Promise<Player[]> {
  const a = createAdminClient();
  const { data } = await a.from("players").select("*").eq("team_id", teamId)
    .order("status").order("jersey_number", { nullsFirst: false }).order("first_name");
  return (data as Player[]) ?? [];
}
export async function getPlayersWithGuardians(teamId: string): Promise<PlayerWithGuardians[]> {
  const a = createAdminClient();
  const { data } = await a.from("players").select("*, guardians(*)").eq("team_id", teamId)
    .order("first_name");
  return (data as PlayerWithGuardians[]) ?? [];
}
export async function getEvents(teamId: string): Promise<TeamEvent[]> {
  const a = createAdminClient();
  const { data } = await a.from("events").select("*").eq("team_id", teamId)
    .order("start_time");
  return (data as TeamEvent[]) ?? [];
}
export async function getEvent(eventId: string): Promise<TeamEvent | null> {
  const a = createAdminClient();
  const { data } = await a.from("events").select("*").eq("id", eventId).maybeSingle();
  return (data as TeamEvent) ?? null;
}
export async function getAttendance(eventId: string): Promise<Attendance[]> {
  const a = createAdminClient();
  const { data } = await a.from("attendance").select("*").eq("event_id", eventId);
  return (data as Attendance[]) ?? [];
}
export async function getSnacks(teamId: string): Promise<SnackSignup[]> {
  const a = createAdminClient();
  const { data } = await a.from("snack_signups").select("*").eq("team_id", teamId);
  return (data as SnackSignup[]) ?? [];
}
export async function getAnnouncements(teamId: string): Promise<Announcement[]> {
  const a = createAdminClient();
  const { data } = await a.from("announcements").select("*").eq("team_id", teamId)
    .order("created_at", { ascending: false });
  return (data as Announcement[]) ?? [];
}
export async function getGameRoster(eventId: string): Promise<GameRosterRow[]> {
  const a = createAdminClient();
  const { data } = await a.from("game_roster").select("*").eq("event_id", eventId);
  return (data as GameRosterRow[]) ?? [];
}
export async function getSeasonRoster(teamId: string): Promise<GameRosterRow[]> {
  const a = createAdminClient();
  const { data } = await a.from("game_roster").select("*").eq("team_id", teamId);
  return (data as GameRosterRow[]) ?? [];
}
export async function getLineup(eventId: string): Promise<Lineup | null> {
  const a = createAdminClient();
  const { data } = await a.from("lineups").select("*").eq("event_id", eventId).maybeSingle();
  return (data as Lineup) ?? null;
}
export async function getVolunteers(eventId: string): Promise<VolunteerRole[]> {
  const a = createAdminClient();
  const { data } = await a.from("volunteer_roles").select("*").eq("event_id", eventId);
  return (data as VolunteerRole[]) ?? [];
}
export function nextEvent(events: TeamEvent[]): TeamEvent | null {
  const now = Date.now() - 3 * 3600 * 1000;
  return events.find((e) => new Date(e.start_time).getTime() >= now && e.status !== "cancelled") ?? null;
}
export function originFromEnv(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

import type {
  MatchResult, GoalEvent, Poll, PollOption, PollVote, CoachInboxNote,
} from "@/lib/types";

export async function getResults(teamId: string): Promise<MatchResult[]> {
  const a = createAdminClient();
  const { data } = await a.from("match_results").select("*").eq("team_id", teamId);
  return (data as MatchResult[]) ?? [];
}
export async function getResult(eventId: string): Promise<MatchResult | null> {
  const a = createAdminClient();
  const { data } = await a.from("match_results").select("*").eq("event_id", eventId).maybeSingle();
  return (data as MatchResult) ?? null;
}
export async function getSeasonGoals(teamId: string): Promise<GoalEvent[]> {
  const a = createAdminClient();
  const { data } = await a.from("goal_events").select("*").eq("team_id", teamId);
  return (data as GoalEvent[]) ?? [];
}
export async function getGoals(eventId: string): Promise<GoalEvent[]> {
  const a = createAdminClient();
  const { data } = await a.from("goal_events").select("*").eq("event_id", eventId);
  return (data as GoalEvent[]) ?? [];
}
export async function getPolls(teamId: string): Promise<Poll[]> {
  const a = createAdminClient();
  const { data } = await a.from("polls").select("*").eq("team_id", teamId).order("created_at", { ascending: false });
  return (data as Poll[]) ?? [];
}
export async function getPollOptions(pollId: string): Promise<PollOption[]> {
  const a = createAdminClient();
  const { data } = await a.from("poll_options").select("*").eq("poll_id", pollId).order("sort");
  return (data as PollOption[]) ?? [];
}
export async function getPollVotes(pollId: string): Promise<PollVote[]> {
  const a = createAdminClient();
  const { data } = await a.from("poll_votes").select("*").eq("poll_id", pollId);
  return (data as PollVote[]) ?? [];
}
export async function getInbox(teamId: string): Promise<CoachInboxNote[]> {
  const a = createAdminClient();
  const { data } = await a.from("coach_inbox").select("*").eq("team_id", teamId).order("created_at", { ascending: false });
  return (data as CoachInboxNote[]) ?? [];
}
export async function getUnclaimedPlayers(teamId: string) {
  const a = createAdminClient();
  const { data } = await a.from("players").select("id, first_name, last_name, jersey_number")
    .eq("team_id", teamId).eq("status", "approved").eq("claimed", false).order("first_name");
  return (data as { id: string; first_name: string; last_name: string; jersey_number: string | null }[]) ?? [];
}

import type { SubPlan } from "@/lib/types";
export async function getSubPlans(eventId: string): Promise<SubPlan[]> {
  const a = createAdminClient();
  const { data } = await a.from("sub_plans").select("*").eq("event_id", eventId)
    .eq("status", "pending").order("created_at");
  return (data as SubPlan[]) ?? [];
}

export async function getStaff(teamId: string) {
  const a = createAdminClient();
  const { data } = await a.from("team_members").select("*")
    .eq("team_id", teamId).neq("status", "removed").order("created_at");
  return (data as import("@/lib/types").TeamMember[]) ?? [];
}

export async function getLineupPlans(eventId: string) {
  const a = createAdminClient();
  const { data } = await a.from("lineup_plans").select("*").eq("event_id", eventId).order("created_at");
  return (data as import("@/lib/types").LineupPlan[]) ?? [];
}

export async function getNotifications(teamId: string, limit = 60): Promise<{ id: string; kind: string; title: string; body: string | null; created_at: string }[]> {
  const a = createAdminClient();
  const { data } = await a.from("notifications").select("id, kind, title, body, created_at").eq("team_id", teamId).order("created_at", { ascending: false }).limit(limit);
  return (data as { id: string; kind: string; title: string; body: string | null; created_at: string }[]) ?? [];
}

export const COACH_SENDER = "__coach__";
export type ChatMsg = { id: string; player_id: string | null; from_name: string | null; body: string; is_read: boolean; created_at: string; fromCoach: boolean };
export type ChatThread = { key: string; playerId: string | null; name: string; last: string; lastAt: string; unread: number; count: number };

export async function getCoachThreads(teamId: string): Promise<ChatThread[]> {
  const a = createAdminClient();
  const [{ data: rows }, { data: players }] = await Promise.all([
    a.from("coach_inbox").select("*").eq("team_id", teamId).order("created_at", { ascending: true }),
    a.from("players").select("id, first_name, last_name, jersey_number").eq("team_id", teamId),
  ]);
  const pmap = new Map((players ?? []).map((p: { id: string; first_name: string; last_name: string }) => [p.id, `${p.first_name} ${p.last_name}`]));
  const groups = new Map<string, ChatThread>();
  for (const r of (rows ?? []) as { id: string; player_id: string | null; from_name: string | null; body: string; is_read: boolean; created_at: string }[]) {
    const key = r.player_id ?? "general";
    const name = r.player_id ? (pmap.get(r.player_id) ?? "A parent") : "General";
    const fromCoach = r.from_name === COACH_SENDER;
    const g = groups.get(key) ?? { key, playerId: r.player_id, name, last: "", lastAt: r.created_at, unread: 0, count: 0 };
    g.last = (fromCoach ? "You: " : "") + r.body;
    g.lastAt = r.created_at;
    g.count += 1;
    if (!fromCoach && !r.is_read) g.unread += 1;
    groups.set(key, g);
  }
  return [...groups.values()].sort((x, y) => (y.unread - x.unread) || (new Date(y.lastAt).getTime() - new Date(x.lastAt).getTime()));
}

export async function getCoachThread(teamId: string, playerKey: string): Promise<{ name: string; messages: ChatMsg[] }> {
  const a = createAdminClient();
  let q = a.from("coach_inbox").select("*").eq("team_id", teamId).order("created_at", { ascending: true });
  q = playerKey === "general" ? q.is("player_id", null) : q.eq("player_id", playerKey);
  const { data: rows } = await q;
  let name = "General";
  if (playerKey !== "general") {
    const { data: p } = await a.from("players").select("first_name, last_name").eq("id", playerKey).maybeSingle();
    if (p) name = `${(p as { first_name: string }).first_name} ${(p as { last_name: string }).last_name}`;
  }
  const messages = ((rows ?? []) as { id: string; player_id: string | null; from_name: string | null; body: string; is_read: boolean; created_at: string }[])
    .map((r) => ({ ...r, fromCoach: r.from_name === COACH_SENDER }));
  return { name, messages };
}

export async function getTotalUnread(teamId: string): Promise<number> {
  const a = createAdminClient();
  const { count } = await a.from("coach_inbox").select("*", { count: "exact", head: true }).eq("team_id", teamId).eq("is_read", false).neq("from_name", COACH_SENDER);
  return count ?? 0;
}

export async function getTeamsByIds(ids: string[]): Promise<Team[]> {
  if (!ids.length) return [];
  const a = createAdminClient();
  const { data } = await a.from("teams").select("*").in("id", ids);
  return (data as Team[]) ?? [];
}

export type StandingRow = { teamId: string; name: string; played: number; w: number; d: number; l: number; gf: number; ga: number; pts: number };
export async function leagueStandings(teamIds: string[]): Promise<StandingRow[]> {
  if (!teamIds.length) return [];
  const a = createAdminClient();
  const [teams, resp] = await Promise.all([
    getTeamsByIds(teamIds),
    a.from("match_results").select("team_id, our_score, opp_score").in("team_id", teamIds),
  ]);
  const results = (resp.data as { team_id: string; our_score: number; opp_score: number }[]) ?? [];
  const acc = new Map<string, { w: number; d: number; l: number; gf: number; ga: number }>();
  for (const t of teams) acc.set(t.id, { w: 0, d: 0, l: 0, gf: 0, ga: 0 });
  for (const r of results) {
    const x = acc.get(r.team_id); if (!x) continue;
    x.gf += r.our_score; x.ga += r.opp_score;
    if (r.our_score > r.opp_score) x.w++; else if (r.our_score === r.opp_score) x.d++; else x.l++;
  }
  return teams.map((t) => {
    const x = acc.get(t.id)!;
    return { teamId: t.id, name: t.name, played: x.w + x.d + x.l, w: x.w, d: x.d, l: x.l, gf: x.gf, ga: x.ga, pts: x.w * 3 + x.d };
  }).sort((p, q) => q.pts - p.pts || (q.gf - q.ga) - (p.gf - p.ga));
}
