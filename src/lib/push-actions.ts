"use server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Player } from "@/lib/types";

type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };

// Saves a parent device's push subscription, tied to their player + team.
export async function savePushSubscription(sub: Sub, userAgent?: string) {
  const token = cookies().get("team_portal_parent")?.value;
  if (!token) return { ok: false, error: "Not joined" };
  const admin = createAdminClient();
  const { data: player } = await admin
    .from("players").select("*").eq("access_token", token).maybeSingle();
  if (!player) return { ok: false, error: "Player not found" };
  const p = player as Player;
  await admin.from("push_subscriptions").upsert(
    {
      team_id: p.team_id, player_id: p.id, endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_agent: userAgent ?? null,
    },
    { onConflict: "endpoint" }
  );
  return { ok: true };
}
