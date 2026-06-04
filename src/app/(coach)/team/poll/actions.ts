"use server";
import { revalidatePath } from "next/cache";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createPoll(formData: FormData) {
  const { team, userId } = await requireCoachTeam();
  const title = String(formData.get("title") || "").trim();
  const raw = String(formData.get("options") || "");
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!title || lines.length === 0) return;
  const db = createAdminClient();
  const { data: poll } = await db.from("polls")
    .insert({ team_id: team.id, title, created_by: userId }).select("id").single();
  if (!poll) return;
  const opts = lines.map((line, i) => {
    const [label, location] = line.split("|").map((s) => s.trim());
    return { team_id: team.id, poll_id: poll.id, label: label || line, location: location || null, sort: i };
  });
  await db.from("poll_options").insert(opts);
  revalidatePath("/team/poll");
}

export async function closePoll(formData: FormData) {
  const { team } = await requireCoachTeam();
  const id = String(formData.get("id") || "");
  const db = createAdminClient();
  await db.from("polls").update({ status: "closed" }).eq("id", id).eq("team_id", team.id);
  revalidatePath("/team/poll");
}

export async function deletePoll(formData: FormData) {
  const { team } = await requireCoachTeam();
  const id = String(formData.get("id") || "");
  const db = createAdminClient();
  await db.from("polls").delete().eq("id", id).eq("team_id", team.id);
  revalidatePath("/team/poll");
}
