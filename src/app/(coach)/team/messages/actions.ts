"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COACH_SENDER } from "@/lib/data";
import { notifyTeam } from "@/lib/push";

function s(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

export async function replyToParent(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const playerKey = s(formData, "player");
  const body = s(formData, "body").slice(0, 3000);
  if (!body) redirect(`/team/messages?player=${playerKey}`);
  await db.from("coach_inbox").insert({
    team_id: team.id,
    player_id: playerKey === "general" ? null : playerKey,
    from_name: COACH_SENDER,
    body,
    is_read: true,
  });
  // best-effort notify the team (parent will see it on their Coach page)
  notifyTeam(team.id, { title: `💬 Message from Coach`, body: body.slice(0, 80), url: "/parent/coach" }).catch(() => {});
  revalidatePath(`/team/messages`);
  redirect(`/team/messages?player=${playerKey}&saved=Sent`);
}

export async function markThreadRead(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const playerKey = s(formData, "player");
  let q = db.from("coach_inbox").update({ is_read: true }).eq("team_id", team.id).neq("from_name", COACH_SENDER);
  q = playerKey === "general" ? q.is("player_id", null) : q.eq("player_id", playerKey);
  await q;
  revalidatePath("/team/messages");
}
