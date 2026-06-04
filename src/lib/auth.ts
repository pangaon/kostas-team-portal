import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Team } from "@/lib/types";

// Returns the logged-in coach user or redirects to /login.
export async function requireUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return data.user;
}

// Returns the coach's team (first team they own). Redirects to /login if not
// authenticated, or /dashboard?setup=1 if they have no team yet.
export async function requireCoachTeam(): Promise<{ userId: string; team: Team }> {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: teams } = await admin
    .from("teams").select("*").eq("created_by", user.id)
    .order("created_at", { ascending: true }).limit(1);
  const team = teams?.[0] as Team | undefined;
  if (!team) redirect("/dashboard?setup=1");
  return { userId: user.id, team };
}

// Like requireCoachTeam but returns null instead of redirecting (for the
// dashboard, which renders a "create team" form when there is no team).
export async function getCoachTeam(): Promise<{ userId: string; team: Team | null }> {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: teams } = await admin
    .from("teams").select("*").eq("created_by", user.id)
    .order("created_at", { ascending: true }).limit(1);
  return { userId: user.id, team: (teams?.[0] as Team) ?? null };
}
