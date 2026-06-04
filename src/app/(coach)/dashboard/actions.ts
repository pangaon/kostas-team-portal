"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, requireCoachTeam } from "@/lib/auth";
import { notifyTeam } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify, randomCode } from "@/lib/format";

export async function createTeam(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const sport = String(formData.get("sport") || "Soccer").trim();
  const season = String(formData.get("season") || "").trim();
  const age_group = String(formData.get("age_group") || "").trim();
  if (!name) return;
  const admin = createAdminClient();
  let code = `${slugify(name)}-${season ? slugify(season) : randomCode(4)}`.slice(0, 40);
  // ensure unique
  const { data: exists } = await admin.from("teams").select("id").eq("invite_code", code).maybeSingle();
  if (exists) code = `${code}-${randomCode(3)}`.toLowerCase();
  const { data: team } = await admin.from("teams")
    .insert({ name, sport, season, age_group, invite_code: code, created_by: user.id })
    .select("*").single();
  if (team) await admin.from("team_members").insert({ team_id: team.id, user_id: user.id, role: "coach", status: "active" });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function sendTestAlert() {
  const { team } = await requireCoachTeam();
  await notifyTeam(team.id, { title: "✅ Test alert", body: "If you see this, alerts are working!", url: "/dashboard" });
}
