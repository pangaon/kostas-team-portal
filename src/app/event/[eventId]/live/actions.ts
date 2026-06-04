"use server";
import { revalidatePath } from "next/cache";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function ensureResult(db: ReturnType<typeof createAdminClient>, teamId: string, eventId: string) {
  const { data } = await db.from("match_results").select("*").eq("event_id", eventId).maybeSingle();
  if (data) return data as { id: string; our_score: number; opp_score: number; notes: string | null };
  const { data: created } = await db.from("match_results")
    .insert({ team_id: teamId, event_id: eventId, our_score: 0, opp_score: 0 }).select("*").single();
  return created as { id: string; our_score: number; opp_score: number; notes: string | null };
}
function rev(eventId: string) {
  revalidatePath(`/event/${eventId}/live`);
  revalidatePath("/team/season");
}

export async function incScore(formData: FormData) {
  const { team } = await requireCoachTeam();
  const event_id = String(formData.get("event_id") || "");
  const side = String(formData.get("side") || "");
  const op = String(formData.get("op") || "inc");
  if (!event_id) return;
  const db = createAdminClient();
  const r = await ensureResult(db, team.id, event_id);
  const d = op === "dec" ? -1 : 1;
  const next = side === "them"
    ? { opp_score: Math.max(0, r.opp_score + d) }
    : { our_score: Math.max(0, r.our_score + d) };
  await db.from("match_results").update(next).eq("id", r.id);
  rev(event_id);
}

export async function logGoalLive(formData: FormData) {
  const { team } = await requireCoachTeam();
  const event_id = String(formData.get("event_id") || "");
  const player_id = String(formData.get("player_id") || "") || null;
  if (!event_id) return;
  const db = createAdminClient();
  const r = await ensureResult(db, team.id, event_id);
  await db.from("goal_events").insert({ team_id: team.id, event_id, player_id });
  await db.from("match_results").update({ our_score: r.our_score + 1 }).eq("id", r.id);
  rev(event_id);
}

export async function undoGoalLive(formData: FormData) {
  const { team } = await requireCoachTeam();
  const event_id = String(formData.get("event_id") || "");
  const id = String(formData.get("id") || "");
  if (!event_id || !id) return;
  const db = createAdminClient();
  await db.from("goal_events").delete().eq("id", id).eq("team_id", team.id);
  const r = await ensureResult(db, team.id, event_id);
  await db.from("match_results").update({ our_score: Math.max(0, r.our_score - 1) }).eq("id", r.id);
  rev(event_id);
}

export async function addGameNote(formData: FormData) {
  const { team } = await requireCoachTeam();
  const event_id = String(formData.get("event_id") || "");
  const note = String(formData.get("note") || "").trim().slice(0, 280);
  if (!event_id || !note) return;
  const db = createAdminClient();
  const r = await ensureResult(db, team.id, event_id);
  const stamp = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });
  const line = `[${stamp}] ${note}`;
  const notes = r.notes ? `${r.notes}\n${line}` : line;
  await db.from("match_results").update({ notes: notes.slice(0, 5000) }).eq("id", r.id);
  rev(event_id);
}

export async function toggleOnField(formData: FormData) {
  const { team } = await requireCoachTeam();
  const event_id = String(formData.get("event_id") || "");
  const player_id = String(formData.get("player_id") || "");
  const current = String(formData.get("current") || "bench");
  if (!event_id || !player_id) return;
  const db = createAdminClient();
  const status = current === "starter" ? "bench" : "starter";
  await db.from("game_roster").upsert(
    { team_id: team.id, event_id, player_id, status },
    { onConflict: "event_id,player_id" }
  );
  rev(event_id);
}

export async function setPosition(formData: FormData) {
  const { team } = await requireCoachTeam();
  const event_id = String(formData.get("event_id") || "");
  const player_id = String(formData.get("player_id") || "");
  const position = String(formData.get("position") || "");
  if (!event_id || !player_id) return;
  const db = createAdminClient();
  await db.from("game_roster").upsert(
    { team_id: team.id, event_id, player_id, position, status: "starter" },
    { onConflict: "event_id,player_id" }
  );
  rev(event_id);
}

export async function planSub(formData: FormData) {
  const { team } = await requireCoachTeam();
  const event_id = String(formData.get("event_id") || "");
  const player_in = String(formData.get("player_in") || "");
  const player_out = String(formData.get("player_out") || "");
  if (!event_id || !player_in || !player_out || player_in === player_out) return;
  const db = createAdminClient();
  await db.from("sub_plans").insert({ team_id: team.id, event_id, player_in, player_out });
  rev(event_id);
}

export async function cancelSub(formData: FormData) {
  const { team } = await requireCoachTeam();
  const id = String(formData.get("id") || "");
  const event_id = String(formData.get("event_id") || "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("sub_plans").delete().eq("id", id).eq("team_id", team.id);
  rev(event_id);
}

export async function executeSub(formData: FormData) {
  const { team } = await requireCoachTeam();
  const id = String(formData.get("id") || "");
  const event_id = String(formData.get("event_id") || "");
  if (!id || !event_id) return;
  const db = createAdminClient();
  const { data: plan } = await db.from("sub_plans").select("*").eq("id", id).eq("team_id", team.id).maybeSingle();
  if (!plan) return;
  const p = plan as { player_in: string; player_out: string };
  const { data: outRow } = await db.from("game_roster").select("position").eq("event_id", event_id).eq("player_id", p.player_out).maybeSingle();
  const pos = (outRow as { position: string | null } | null)?.position ?? null;
  await db.from("game_roster").upsert({ team_id: team.id, event_id, player_id: p.player_out, status: "bench" }, { onConflict: "event_id,player_id" });
  await db.from("game_roster").upsert({ team_id: team.id, event_id, player_id: p.player_in, status: "starter", position: pos }, { onConflict: "event_id,player_id" });
  await db.from("sub_plans").update({ status: "done" }).eq("id", id);
  rev(event_id);
}
