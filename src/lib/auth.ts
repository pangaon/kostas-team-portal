import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Team } from "@/lib/types";

const TEAM_COOKIE = "coach_team";

export async function requireUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return data.user;
}

// All teams a coach owns or is an active member of (auto-claims email invites first).
export const listCoachTeams = cache(async function listCoachTeamsImpl(user: { id: string; email?: string | null }): Promise<Team[]> {
  const admin = createAdminClient();
  if (user.email) {
    await admin.from("team_members")
      .update({ user_id: user.id, status: "active" })
      .eq("email", user.email.toLowerCase())
      .eq("status", "invited");
  }
  const { data: owned } = await admin.from("teams").select("*")
    .eq("created_by", user.id).order("created_at", { ascending: true });
  const ownedTeams = (owned as Team[]) ?? [];
  const ownedIds = new Set(ownedTeams.map((t) => t.id));

  const { data: mem } = await admin.from("team_members").select("team_id")
    .eq("user_id", user.id).eq("status", "active");
  const memberIds = [...new Set((mem ?? []).map((m: { team_id: string }) => m.team_id))].filter((id) => !ownedIds.has(id));
  let memberTeams: Team[] = [];
  if (memberIds.length) {
    const { data: t } = await admin.from("teams").select("*").in("id", memberIds).order("created_at", { ascending: true });
    memberTeams = (t as Team[]) ?? [];
  }
  return [...ownedTeams, ...memberTeams];
});

// Resolve the coach's CURRENT team: the one selected via cookie (if they still
// have access to it), otherwise their first team.
async function resolveCoachTeam(user: { id: string; email?: string | null }): Promise<Team | null> {
  const teams = await listCoachTeams(user);
  if (!teams.length) return null;
  const selected = cookies().get(TEAM_COOKIE)?.value;
  if (selected) {
    const match = teams.find((t) => t.id === selected);
    if (match) return match;
  }
  return teams[0];
}

export function pickCurrentTeam(teams: Team[]): Team | null {
  if (!teams.length) return null;
  const selected = cookies().get(TEAM_COOKIE)?.value;
  if (selected) { const m = teams.find((t) => t.id === selected); if (m) return m; }
  return teams[0];
}

export async function requireCoachTeam(): Promise<{ userId: string; team: Team }> {
  const user = await requireUser();
  const team = await resolveCoachTeam(user);
  if (!team) redirect("/dashboard?setup=1");
  return { userId: user.id, team };
}

export async function getCoachTeam(): Promise<{ userId: string; team: Team | null }> {
  const user = await requireUser();
  const team = await resolveCoachTeam(user);
  return { userId: user.id, team };
}
