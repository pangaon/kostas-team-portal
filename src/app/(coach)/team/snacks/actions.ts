"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function assignSnack(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const event_id = s(formData, "event_id");
  const player_id = s(formData, "player_id");
  const snack_notes = s(formData, "snack_notes");
  if (!event_id || !player_id) {
    redirect("/team/snacks?saved=1");
  }
  await db
    .from("snack_signups")
    .upsert(
      {
        team_id: team.id,
        event_id,
        player_id,
        snack_notes: snack_notes === "" ? null : snack_notes,
      },
      { onConflict: "event_id" }
    );
  revalidatePath("/team/snacks");
  redirect("/team/snacks?saved=1");
}

export async function clearSnack(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const event_id = s(formData, "event_id");
  if (!event_id) return;
  await db.from("snack_signups").delete().eq("event_id", event_id).eq("team_id", team.id);
  revalidatePath("/team/snacks");
  redirect("/team/snacks?saved=1");
}
