import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Team } from "@/lib/types";

export async function requireUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return data.user;
}

// A coach's team = one they OWN, or one they're an ACTIVE member of.
// Also auto-claims any pending email invites addressed to this user.
async function resolveCoachTeam(user: { id: string; email?: string | null }): Promise<Team | null> {
  const admin = createAdminClient();
  if (user.email) {
    await admin.from("team_members")
      .update({ user_id: user.id, status: "active" })
      .eq("email", user.email.toLowerCase())
      .eq("status", "invited");
  }
  const { data: owned } = await admin.from("teams").select("*")
    .eq("created_by", user.id).order("created_at", { ascending: true }).limit(1);
  if (owned?.[0]) return owned[0] as Team;

  const { data: mem } = await admin.from("team_members").select("team_id")
    .eq("user_id", user.id).eq("status", "active")
    .order("created_at", { ascending: true }).limit(1);
  if (mem?.[0]) {
    const { data: t } = await admin.from("teams").select("*")
      .eq("id", (mem[0] as { team_id: string }).team_id).maybeSingle();
    return (t as Team) ?? null;
  }
  return null;
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
