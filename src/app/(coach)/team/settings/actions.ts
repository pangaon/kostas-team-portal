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
    redirect("/team/settings");
  }
  await db.from("teams").update({
    name,
    sport: nullable(s(formData, "sport")),
    season: nullable(s(formData, "season")),
    age_group: nullable(s(formData, "age_group")),
  }).eq("id", team.id);
  revalidatePath("/team/settings");
  redirect("/team/settings");
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
  redirect("/team/settings");
}
