"use server";
import { revalidatePath } from "next/cache";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function assignVolunteer(formData: FormData) {
  const { team } = await requireCoachTeam();
  const event_id = String(formData.get("event_id") || "");
  const role = String(formData.get("role") || "").trim();
  const player_id = String(formData.get("player_id") || "").trim() || null;
  if (!event_id || !role || !player_id) return;
  const db = createAdminClient();
  await db.from("volunteer_roles").upsert(
    { team_id: team.id, event_id, role, player_id, guardian_id: null },
    { onConflict: "event_id,role" }
  );
  revalidatePath("/team/volunteers");
}

export async function clearVolunteer(formData: FormData) {
  await requireCoachTeam();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("volunteer_roles").delete().eq("id", id);
  revalidatePath("/team/volunteers");
}

export async function addRole(formData: FormData) {
  const { team } = await requireCoachTeam();
  const event_id = String(formData.get("event_id") || "");
  const role = String(formData.get("role") || "").trim();
  if (!event_id || !role) return;
  const db = createAdminClient();
  const { data: exists } = await db
    .from("volunteer_roles")
    .select("id")
    .eq("event_id", event_id)
    .eq("role", role)
    .maybeSingle();
  if (!exists) {
    await db.from("volunteer_roles").insert({ team_id: team.id, event_id, role });
  }
  revalidatePath("/team/volunteers");
}
