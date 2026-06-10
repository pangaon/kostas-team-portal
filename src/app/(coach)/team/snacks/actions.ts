"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyTeam } from "@/lib/push";

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function assignSnack(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const event_id = s(formData, "event_id");
  const player_id = s(formData, "player_id");
  const snack_notes = s(formData, "snack_notes");
  if (!event_id || !player_id) {
    redirect("/team/snacks?saved=1");
  }
  await db
    .from("snack_signups")
    .upsert(
      {
        team_id: team.id,
        event_id,
        player_id,
        snack_notes: snack_notes === "" ? null : snack_notes,
      },
      { onConflict: "event_id" }
    );
  revalidatePath("/team/snacks");
  redirect("/team/snacks?saved=1");
}

export async function clearSnack(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const event_id = s(formData, "event_id");
  if (!event_id) return;
  await db.from("snack_signups").delete().eq("event_id", event_id).eq("team_id", team.id);
  revalidatePath("/team/snacks");
  redirect("/team/snacks?saved=1");
}


export async function remindSnack(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const event_id = s(formData, "event_id");
  if (!event_id) redirect("/team/snacks");
  const { data: ev } = await db.from("events").select("*").eq("id", event_id).eq("team_id", team.id).maybeSingle();
  if (!ev) redirect("/team/snacks");
  const e = ev as { start_time: string; title: string | null; opponent: string | null };
  const when = new Date(e.start_time).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "America/Toronto" });
  const what = e.title || (e.opponent ? "vs " + e.opponent : "the game");
  const title = "🍎 Snacks still needed";
  const body = `No one has signed up for snacks for ${what} on ${when}. Can someone grab them?`;
  await notifyTeam(team.id, { title, body, url: "/parent/snacks" });
  await db.from("notifications").insert({ team_id: team.id, kind: "snack", title, body, event_id });
  revalidatePath("/team/snacks");
  redirect("/team/snacks?saved=" + encodeURIComponent("Reminder sent to the team"));
}
