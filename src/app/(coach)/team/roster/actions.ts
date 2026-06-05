"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
function nullable(v: string): string | null {
  return v === "" ? null : v;
}

async function setStatus(formData: FormData, status: "approved" | "rejected") {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const id = s(formData, "id");
  if (!id) return;
  const { data: player } = await db.from("players").select("id, team_id").eq("id", id).maybeSingle();
  if (!player || player.team_id !== team.id) return;
  await db.from("players").update({ status }).eq("id", id).eq("team_id", team.id);
  revalidatePath("/team/roster");
  redirect("/team/roster?saved=1");
}

export async function approvePlayer(formData: FormData) {
  await setStatus(formData, "approved");
}

export async function rejectPlayer(formData: FormData) {
  await setStatus(formData, "rejected");
}

export async function deletePlayer(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const id = s(formData, "id");
  if (!id) return;
  await db.from("players").delete().eq("id", id).eq("team_id", team.id);
  revalidatePath("/team/roster");
  redirect("/team/roster?saved=1");
}

export async function upsertPlayer(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const id = s(formData, "id");

  const first_name = s(formData, "first_name");
  const last_name = s(formData, "last_name");
  if (!first_name) {
    redirect("/team/roster?error=" + encodeURIComponent("Enter at least a first name"));
  }

  const playerFields = {
    first_name,
    last_name,
    jersey_number: nullable(s(formData, "jersey_number")),
    preferred_position: nullable(s(formData, "preferred_position")),
    strong_foot: nullable(s(formData, "strong_foot")),
    strength: s(formData, "strength") ? parseInt(s(formData, "strength"), 10) : null,
    allergies: nullable(s(formData, "allergies")),
    medical_notes: nullable(s(formData, "medical_notes")),
    emergency_contact_name: nullable(s(formData, "emergency_contact_name")),
    emergency_contact_phone: nullable(s(formData, "emergency_contact_phone")),
    coach_notes: nullable(s(formData, "coach_notes")),
  };

  const gName = s(formData, "guardian1_name");
  const gPhone = nullable(s(formData, "guardian1_phone"));
  const gEmail = nullable(s(formData, "guardian1_email"));
  const gRel = nullable(s(formData, "guardian1_relationship"));

  if (id) {
    const { data: existing } = await db.from("players").select("id, team_id").eq("id", id).maybeSingle();
    if (!existing || existing.team_id !== team.id) {
      redirect("/team/roster?saved=1");
    }
    await db.from("players").update(playerFields).eq("id", id).eq("team_id", team.id);

    if (gName) {
      const { data: primary } = await db
        .from("guardians").select("id").eq("player_id", id).eq("is_primary", true).maybeSingle();
      const gFields = {
        name: gName, phone: gPhone, email: gEmail, relationship: gRel,
        team_id: team.id, is_primary: true, player_id: id,
      };
      if (primary) {
        await db.from("guardians").update(gFields).eq("id", primary.id);
      } else {
        await db.from("guardians").insert(gFields);
      }
    }
  } else {
    const { data: inserted } = await db
      .from("players")
      .insert({ ...playerFields, status: "approved", team_id: team.id })
      .select("id").single();
    if (inserted && gName) {
      await db.from("guardians").insert({
        player_id: inserted.id, team_id: team.id, name: gName,
        phone: gPhone, email: gEmail, relationship: gRel, is_primary: true,
      });
    }
  }

  revalidatePath("/team/roster");
  redirect("/team/roster?saved=1");
}
