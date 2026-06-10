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
  const g2Name = s(formData, "guardian2_name");
  const g2Phone = nullable(s(formData, "guardian2_phone"));
  const g2Email = nullable(s(formData, "guardian2_email"));
  const g2Rel = nullable(s(formData, "guardian2_relationship"));
  async function upsertSecondGuardian(playerId: string) {
    if (!g2Name) return;
    const { data: prim } = await db.from("guardians").select("id").eq("player_id", playerId).eq("is_primary", true).maybeSingle();
    const { data: others } = await db.from("guardians").select("id").eq("player_id", playerId).eq("is_primary", false);
    const fields = { name: g2Name, phone: g2Phone, email: g2Email, relationship: g2Rel, team_id: team.id, is_primary: false, player_id: playerId };
    if (others && others.length) await db.from("guardians").update(fields).eq("id", others[0].id);
    else await db.from("guardians").insert(fields);
    void prim;
  }

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
    await upsertSecondGuardian(id);
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
    if (inserted) await upsertSecondGuardian(inserted.id);
  }

  revalidatePath("/team/roster");
  redirect("/team/roster?saved=1");
}

export async function uploadAvatar(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const id = s(formData, "id");
  const file = formData.get("photo") as File | null;
  if (!id || !file || file.size === 0) redirect("/team/roster");
  if (file.size > 6 * 1024 * 1024) redirect("/team/roster?error=" + encodeURIComponent("Photo too large (max 6MB)"));
  const { data: pl } = await db.from("players").select("id, team_id").eq("id", id).maybeSingle();
  if (!pl || pl.team_id !== team.id) redirect("/team/roster");
  const { ensureAvatarBucket } = await import("@/lib/avatars");
  const admin = await ensureAvatarBucket();
  const buf = Buffer.from(await file.arrayBuffer());
  await admin.storage.from("avatars").upload(id, buf, { upsert: true, contentType: file.type || "image/jpeg" });
  revalidatePath("/team/roster");
  redirect("/team/roster?saved=" + encodeURIComponent("Photo updated"));
}

export async function bulkAddPlayers(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const raw = s(formData, "names");
  const lines = raw.split(/[\n,]/).map((x) => x.trim()).filter(Boolean).slice(0, 40);
  const rows = lines.map((line) => {
    const m = line.match(/^(.*?)(?:\s+#?(\d{1,2}))?$/);
    const namePart = (m?.[1] || line).trim();
    const jersey = m?.[2] || null;
    const sp = namePart.split(/\s+/);
    return { team_id: team.id, first_name: sp[0], last_name: sp.slice(1).join(" "), jersey_number: jersey, status: "approved" as const };
  }).filter((r) => r.first_name);
  if (rows.length) await db.from("players").insert(rows);
  revalidatePath("/team/roster");
  redirect("/team/roster?saved=" + encodeURIComponent(`Added ${rows.length} player${rows.length === 1 ? "" : "s"}`));
}

export async function mergePending(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const pendingId = s(formData, "pending");
  const targetId = s(formData, "target");
  if (!pendingId || !targetId) redirect("/team/roster");

  const { data: pend } = await db.from("players").select("*").eq("id", pendingId).eq("team_id", team.id).maybeSingle();
  const { data: targ } = await db.from("players").select("*").eq("id", targetId).eq("team_id", team.id).maybeSingle();
  if (!pend || !targ) redirect("/team/roster");
  const P = pend as Record<string, unknown>; const T = targ as Record<string, unknown>;

  const upd: Record<string, unknown> = { claimed: true };
  // updated safety info from the parent wins
  for (const k of ["allergies", "medical_notes", "emergency_contact_name", "emergency_contact_phone"]) if (P[k]) upd[k] = P[k];
  // fill blanks only
  for (const k of ["jersey_number", "preferred_position", "strong_foot", "strength"]) if (!T[k] && P[k]) upd[k] = P[k];
  await db.from("players").update(upd).eq("id", targetId).eq("team_id", team.id);

  // move guardians, skip duplicates by phone
  const { data: tg } = await db.from("guardians").select("phone").eq("player_id", targetId);
  const have = new Set((tg ?? []).map((g: { phone: string | null }) => g.phone).filter(Boolean));
  const { data: pg } = await db.from("guardians").select("id, phone").eq("player_id", pendingId);
  for (const g of (pg ?? []) as { id: string; phone: string | null }[]) {
    if (g.phone && have.has(g.phone)) continue;
    await db.from("guardians").update({ player_id: targetId }).eq("id", g.id);
  }
  await db.from("players").delete().eq("id", pendingId).eq("team_id", team.id);
  revalidatePath("/team/roster");
  redirect("/team/roster?saved=" + encodeURIComponent("Merged into existing player"));
}

export async function resetAccessToken(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const id = s(formData, "id");
  if (!id) redirect("/team/roster");
  const { data: pl } = await db.from("players").select("id, team_id").eq("id", id).maybeSingle();
  if (!pl || pl.team_id !== team.id) redirect("/team/roster");
  await db.from("players").update({ access_token: crypto.randomUUID() }).eq("id", id).eq("team_id", team.id);
  revalidatePath("/team/roster");
  redirect("/team/roster?saved=" + encodeURIComponent("New parent link created — old links no longer work"));
}

// Merge any two players (incl. already-joined). Moves both parents' guardians onto the
// kept player, preserves access via a token redirect (no parent gets locked out), deletes the dup.
export async function mergePlayers(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const dupId = s(formData, "dup");
  const keepId = s(formData, "keep");
  if (!dupId || !keepId || dupId === keepId) redirect("/team/roster");
  const { data: dup } = await db.from("players").select("*").eq("id", dupId).eq("team_id", team.id).maybeSingle();
  const { data: keep } = await db.from("players").select("*").eq("id", keepId).eq("team_id", team.id).maybeSingle();
  if (!dup || !keep) redirect("/team/roster");
  const D = dup as Record<string, unknown>; const K = keep as Record<string, unknown>;

  const upd: Record<string, unknown> = {};
  if (D.claimed || K.claimed) upd.claimed = true;
  for (const k of ["allergies", "medical_notes", "emergency_contact_name", "emergency_contact_phone"]) if (!K[k] && D[k]) upd[k] = D[k];
  for (const k of ["jersey_number", "preferred_position", "strong_foot", "strength"]) if (!K[k] && D[k]) upd[k] = D[k];
  if (Object.keys(upd).length) await db.from("players").update(upd).eq("id", keepId).eq("team_id", team.id);

  // move dup's guardians to keep (skip exact phone dupes)
  const { data: kg } = await db.from("guardians").select("phone").eq("player_id", keepId);
  const have = new Set((kg ?? []).map((g: { phone: string | null }) => g.phone).filter(Boolean));
  const { data: dg } = await db.from("guardians").select("id, phone").eq("player_id", dupId);
  for (const g of (dg ?? []) as { id: string; phone: string | null }[]) {
    if (g.phone && have.has(g.phone)) continue;
    await db.from("guardians").update({ player_id: keepId }).eq("id", g.id);
  }
  // carry the dup's goal/assist stats, chat history and notification device to the kept player
  await db.from("goal_events").update({ player_id: keepId }).eq("player_id", dupId).eq("team_id", team.id);
  await db.from("goal_events").update({ assist_player_id: keepId }).eq("assist_player_id", dupId).eq("team_id", team.id);
  await db.from("coach_inbox").update({ player_id: keepId }).eq("player_id", dupId).eq("team_id", team.id);
  await db.from("push_subscriptions").update({ player_id: keepId }).eq("player_id", dupId).eq("team_id", team.id);
  // drop the dup's redundant per-event rows (the kept player's are canonical)
  await db.from("attendance").delete().eq("player_id", dupId);
  await db.from("game_roster").delete().eq("player_id", dupId).eq("team_id", team.id);

  // carry storage artifacts (photo, skills/notes, intake, payment) if the kept player lacks them
  for (const bucket of ["avatars", "playerprofiles", "parentintake", "payments"]) {
    try {
      const { data: objs } = await db.storage.from(bucket).list("", { limit: 1000 });
      const names = new Set((objs ?? []).map((o) => o.name));
      if (names.has(dupId) && !names.has(keepId)) await db.storage.from(bucket).copy(dupId, keepId);
    } catch {}
  }

  // keep the dup's parents signed in: their old link/token now resolves to the kept player
  const { mapToken } = await import("@/lib/accessmap");
  if (D.access_token && K.access_token) await mapToken(D.access_token as string, K.access_token as string);

  await db.from("players").delete().eq("id", dupId).eq("team_id", team.id);
  revalidatePath("/team/roster");
  redirect("/team/roster?saved=" + encodeURIComponent("Merged — both parents keep access"));
}
