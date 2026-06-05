import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "avatars";
let ensured = false;

export async function ensureAvatarBucket() {
  const admin = createAdminClient();
  if (!ensured) {
    try {
      const { data } = await admin.storage.getBucket(BUCKET);
      if (!data) await admin.storage.createBucket(BUCKET, { public: true });
    } catch { /* best-effort */ }
    ensured = true;
  }
  return admin;
}

export function avatarPublicUrl(playerId: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${BUCKET}/${playerId}`;
}

// Returns the set of player ids that actually have an uploaded photo.
export async function avatarIdSet(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  try {
    const admin = createAdminClient();
    const { data } = await admin.storage.from(BUCKET).list("", { limit: 1000 });
    const present = new Set((data ?? []).map((o) => o.name));
    return new Set(ids.filter((id) => present.has(id)));
  } catch {
    return new Set();
  }
}

// Attaches avatar_url to players that have a photo (for passing to UI).
export async function withAvatars<T extends { id: string }>(players: T[]): Promise<(T & { avatar_url: string | null })[]> {
  const have = await avatarIdSet(players.map((p) => p.id));
  return players.map((p) => ({ ...p, avatar_url: have.has(p.id) ? avatarPublicUrl(p.id) : null }));
}
