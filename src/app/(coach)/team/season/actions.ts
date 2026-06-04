"use server";
import { revalidatePath } from "next/cache";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function saveResult(formData: FormData) {
  const { team } = await requireCoachTeam();
  const event_id = String(formData.get("event_id") || "");
  const our_score = parseInt(String(formData.get("our_score") || "0"), 10) || 0;
  const opp_score = parseInt(String(formData.get("opp_score") || "0"), 10) || 0;
  if (!event_id) return;
  const db = createAdminClient();
  await db.from("match_results").upsert(
    { team_id: team.id, event_id, our_score, opp_score },
    { onConflict: "event_id" }
  );
  revalidatePath("/team/season");
}

export async function addGoal(formData: FormData) {
  const { team } = await requireCoachTeam();
  const event_id = String(formData.get("event_id") || "");
  const player_id = String(formData.get("player_id") || "") || null;
  const assist_player_id = String(formData.get("assist_player_id") || "") || null;
  if (!event_id || !player_id) return;
  const db = createAdminClient();
  await db.from("goal_events").insert({ team_id: team.id, event_id, player_id, assist_player_id });
  revalidatePath("/team/season");
}

export async function removeGoal(formData: FormData) {
  const { team } = await requireCoachTeam();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("goal_events").delete().eq("id", id).eq("team_id", team.id);
  revalidatePath("/team/season");
}
