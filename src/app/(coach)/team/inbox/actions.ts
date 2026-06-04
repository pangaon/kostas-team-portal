"use server";
import { revalidatePath } from "next/cache";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markRead(formData: FormData) {
  const { team } = await requireCoachTeam();
  const id = String(formData.get("id") || "");
  const db = createAdminClient();
  await db.from("coach_inbox").update({ is_read: true }).eq("id", id).eq("team_id", team.id);
  revalidatePath("/team/inbox");
}
export async function deleteNote(formData: FormData) {
  const { team } = await requireCoachTeam();
  const id = String(formData.get("id") || "");
  const db = createAdminClient();
  await db.from("coach_inbox").delete().eq("id", id).eq("team_id", team.id);
  revalidatePath("/team/inbox");
}
