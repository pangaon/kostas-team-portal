"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify, randomCode } from "@/lib/format";

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
function nullable(v: string): string | null {
  return v === "" ? null : v;
}

export async function updateTeam(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const name = s(formData, "name");
  if (!name) {
    redirect("/team/settings?saved=1");
  }
  await db.from("teams").update({
    name,
    sport: nullable(s(formData, "sport")),
    season: nullable(s(formData, "season")),
    age_group: nullable(s(formData, "age_group")),
  }).eq("id", team.id);
  revalidatePath("/team/settings");
  redirect("/team/settings?saved=1");
}

export async function regenerateCode(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  void formData;
  let code = `${slugify(team.name)}-${randomCode(4).toLowerCase()}`.slice(0, 40);
  const { data: exists } = await db
    .from("teams").select("id").eq("invite_code", code).maybeSingle();
  if (exists) code = `${code}-${randomCode(3).toLowerCase()}`;
  await db.from("teams").update({ invite_code: code }).eq("id", team.id);
  revalidatePath("/team/settings");
  redirect("/team/settings?saved=1");
}

export async function inviteCoach(formData: FormData) {
  const { team, userId } = await requireCoachTeam();
  if (team.created_by !== userId) redirect("/team/settings?saved=1"); // only the team owner invites
  const email = s(formData, "email").toLowerCase();
  if (!email || !email.includes("@")) redirect("/team/settings?saved=1");
  const db = createAdminClient();
  const { data: existing } = await db.from("team_members")
    .select("id").eq("team_id", team.id).eq("email", email).maybeSingle();
  if (!existing) {
    await db.from("team_members").insert({ team_id: team.id, email, role: "assistant", status: "invited" });
  }
  revalidatePath("/team/settings");
  redirect("/team/settings?saved=1");
}

export async function removeCoach(formData: FormData) {
  const { team, userId } = await requireCoachTeam();
  if (team.created_by !== userId) redirect("/team/settings?saved=1");
  const id = s(formData, "id");
  if (!id) redirect("/team/settings?saved=1");
  const db = createAdminClient();
  // never remove the owner's own membership
  await db.from("team_members").delete()
    .eq("id", id).eq("team_id", team.id)
    .or(`user_id.is.null,user_id.neq.${team.created_by}`);
  revalidatePath("/team/settings");
  redirect("/team/settings?saved=1");
}
