import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "gamestate";
let ensured = false;

async function ensure() {
  const a = createAdminClient();
  if (!ensured) {
    try { const { data } = await a.storage.getBucket(BUCKET); if (!data) await a.storage.createBucket(BUCKET, { public: false }); } catch {}
    ensured = true;
  }
  return a;
}

export async function readGameState(eventId: string): Promise<Record<string, unknown> | null> {
  const a = await ensure();
  try {
    const { data } = await a.storage.from(BUCKET).download(eventId);
    if (!data) return null;
    return JSON.parse(await data.text());
  } catch { return null; }
}

export async function writeGameState(eventId: string, state: Record<string, unknown>): Promise<void> {
  const a = await ensure();
  try {
    await a.storage.from(BUCKET).upload(eventId, Buffer.from(JSON.stringify(state)), { upsert: true, contentType: "application/json" });
  } catch {}
}
