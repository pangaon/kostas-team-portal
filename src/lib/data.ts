import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Player, Guardian, TeamEvent, Attendance, SnackSignup, Announcement,
  GameRosterRow, VolunteerRole, Lineup, PlayerWithGuardians,
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
