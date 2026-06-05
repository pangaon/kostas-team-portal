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
  // Guard: a coach owns exactly one team. If they already have one, don't
  // create a duplicate (this caused players to look like they "vanished").
  const { data: existingTeam } = await admin.from("teams").select("id").eq("created_by", user.id).order("created_at", { ascending: true }).limit(1);
  if (existingTeam?.[0]) { redirect("/dashboard"); }
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

export async function sendTodayReminders() {
  const { team } = await requireCoachTeam();
  const { runAutoNotifications } = await import("@/lib/notify-engine");
  const r = await runAutoNotifications(team.id);
  const msg =
    r.sent > 0
      ? `Sent ${r.sent} reminder${r.sent === 1 ? "" : "s"}`
      : r.scanned > 0
      ? "Already sent for today"
      : "No events today";
  redirect("/dashboard?saved=" + encodeURIComponent(msg));
}
