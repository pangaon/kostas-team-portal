import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;
function ensureConfigured(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:coach@example.com", pub, priv);
    configured = true;
  }
  return true;
}

// Sends a push to every subscribed device on a team. Best-effort: prunes dead
// subscriptions, never throws (so it can't break the coach's main action).
export async function notifyTeam(
  teamId: string,
  payload: { title: string; body?: string; url?: string }
): Promise<{ sent: number; skipped?: string }> {
  if (!ensureConfigured()) return { sent: 0, skipped: "VAPID keys not set" };
  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions").select("*").eq("team_id", teamId);
  if (!subs?.length) return { sent: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  await Promise.all(
    subs.map(async (s: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        );
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", s.id);
        }
      }
    })
  );
  return { sent };
}
