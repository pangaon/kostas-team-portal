"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyTeam } from "@/lib/push";
import { originFromEnv } from "@/lib/data";

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createAnnouncement(formData: FormData) {
  const { userId, team } = await requireCoachTeam();
  const db = createAdminClient();
  const title = s(formData, "title");
  const body = s(formData, "body");
  const eventRaw = s(formData, "event_id");
  const event_id = eventRaw === "" ? null : eventRaw;
  if (!title || !body) {
    redirect("/team/announcements?saved=1");
  }

  await db.from("announcements").insert({
    team_id: team.id, title, body, event_id, created_by: userId,
  });
  await db.from("notifications").insert({
    team_id: team.id, kind: "announcement", title, body, event_id,
  });
  await notifyTeam(team.id, {
    title: "📣 " + title,
    body,
    url: originFromEnv() + "/parent/announcements",
  });

  revalidatePath("/team/announcements");
  redirect("/team/announcements?saved=1");
}

export async function deleteAnnouncement(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const id = s(formData, "id");
  if (!id) return;
  const { data: ann } = await db.from("announcements").select("title").eq("id", id).eq("team_id", team.id).maybeSingle();
  await db.from("announcements").delete().eq("id", id).eq("team_id", team.id);
  if (ann) {
    await db.from("notifications").delete().eq("team_id", team.id).eq("kind", "announcement").eq("title", (ann as { title: string }).title);
  }
  revalidatePath("/team/announcements");
  redirect("/team/announcements?saved=1");
}
