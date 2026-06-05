"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteNotification(formData: FormData) {
  const { team } = await requireCoachTeam();
  const id = String(formData.get("id") ?? "");
  const db = createAdminClient();
  if (id) await db.from("notifications").delete().eq("id", id).eq("team_id", team.id);
  revalidatePath("/team/notifications");
}

export async function clearNotifications() {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  await db.from("notifications").delete().eq("team_id", team.id);
  revalidatePath("/team/notifications");
  redirect("/team/notifications?saved=" + encodeURIComponent("Cleared"));
}
