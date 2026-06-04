"use server";
import { revalidatePath } from "next/cache";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function toggleCheckin(formData: FormData) {
  const { team } = await requireCoachTeam();
  const event_id = String(formData.get("event_id") || "");
  const player_id = String(formData.get("player_id") || "");
  if (!event_id || !player_id) return;
  const current = String(formData.get("checked") || "false") === "true";
  const db = createAdminClient();
  await db.from("game_roster").upsert(
    { team_id: team.id, event_id, player_id, checked_in: !current },
    { onConflict: "event_id,player_id" }
  );
  revalidatePath("/team/checkin");
}
