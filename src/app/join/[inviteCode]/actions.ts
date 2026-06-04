"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { addChildCookie } from "@/lib/parent";
import { joinSchema } from "@/lib/validation";

export type JoinState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
function nullable(v: string): string | null {
  return v === "" ? null : v;
}

export async function joinTeam(
  prev: JoinState,
  formData: FormData
): Promise<JoinState> {
  const inviteCode = s(formData, "inviteCode");
  const db = createAdminClient();

  const { data: team } = await db
    .from("teams")
    .select("id,invite_code")
    .eq("invite_code", inviteCode)
    .maybeSingle();
  if (!team) return { error: "Invalid invite link." };
  const teamId = (team as { id: string }).id;

  const raw = {
    player_first_name: s(formData, "player_first_name"),
    player_last_name: s(formData, "player_last_name"),
    jersey_number: s(formData, "jersey_number"),
    allergies: s(formData, "allergies"),
    medical_notes: s(formData, "medical_notes"),
    emergency_contact_name: s(formData, "emergency_contact_name"),
    emergency_contact_phone: s(formData, "emergency_contact_phone"),
    g1_name: s(formData, "g1_name"),
    g1_phone: s(formData, "g1_phone"),
    g1_email: s(formData, "g1_email"),
    g2_name: s(formData, "g2_name"),
    g2_phone: s(formData, "g2_phone"),
    g2_email: s(formData, "g2_email"),
    consent_comms: s(formData, "consent_comms"),
    consent_accurate: s(formData, "consent_accurate"),
  };

  const parsed = joinSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      error: "Please fix the highlighted fields and try again.",
      fieldErrors,
    };
  }
  const v = parsed.data;

  const { data: playerRow, error: playerErr } = await db
    .from("players")
    .insert({
      team_id: teamId,
      first_name: v.player_first_name,
      last_name: v.player_last_name,
      jersey_number: nullable(v.jersey_number ?? ""),
      allergies: nullable(v.allergies ?? ""),
      medical_notes: nullable(v.medical_notes ?? ""),
      emergency_contact_name: nullable(v.emergency_contact_name ?? ""),
      emergency_contact_phone: nullable(v.emergency_contact_phone ?? ""),
      status: "pending",
      claimed: true,
    })
    .select("access_token,id")
    .single();

  if (playerErr || !playerRow) {
    return { error: "Something went wrong adding your player. Please try again." };
  }
  const player = playerRow as { access_token: string; id: string };

  await db.from("guardians").insert({
    player_id: player.id,
    team_id: teamId,
    name: v.g1_name,
    phone: nullable(v.g1_phone ?? ""),
    email: nullable(v.g1_email ?? ""),
    is_primary: true,
    relationship: "Parent/Guardian",
  });

  if ((v.g2_name ?? "").trim() !== "") {
    await db.from("guardians").insert({
      player_id: player.id,
      team_id: teamId,
      name: v.g2_name,
      phone: nullable(v.g2_phone ?? ""),
      email: nullable(v.g2_email ?? ""),
      is_primary: false,
      relationship: "Parent/Guardian",
    });
  }

  await db.from("notifications").insert({
    team_id: teamId,
    kind: "general",
    title: "New signup",
    body: `${v.player_first_name} ${v.player_last_name} joined and is awaiting approval.`,
  });

  addChildCookie(player.access_token);

  redirect(`/join/${inviteCode}/success`);
}

export async function claimChild(formData: FormData) {
  const inviteCode = s(formData, "inviteCode");
  const playerId = s(formData, "player_id");
  const db = createAdminClient();
  const { data: team } = await db.from("teams").select("id").eq("invite_code", inviteCode).maybeSingle();
  if (!team) return;
  const teamId = (team as { id: string }).id;
  const { data: pl } = await db
    .from("players").select("id,access_token,team_id").eq("id", playerId).maybeSingle();
  if (!pl) return;
  const p = pl as { id: string; access_token: string; team_id: string };
  if (p.team_id !== teamId) return;
  await db.from("players").update({ claimed: true }).eq("id", p.id);
  addChildCookie(p.access_token);
  redirect("/parent");
}
