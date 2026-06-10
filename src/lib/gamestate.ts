import { createAdminClient } from "@/lib/supabase/admin";

// Game state now lives in a real Postgres table (game_state) for queryability,
// Realtime, and atomic writes. Falls back to the legacy Storage bucket until the
// migration (supabase/migration_v6.sql) has been applied — so deploys never break.

const BUCKET = "gamestate";
let ensured = false;
async function ensureBucket() {
  const a = createAdminClient();
  if (!ensured) { try { const { data } = await a.storage.getBucket(BUCKET); if (!data) await a.storage.createBucket(BUCKET, { public: false }); } catch {} ensured = true; }
  return a;
}

export async function readGameState(eventId: string): Promise<Record<string, unknown> | null> {
  const a = createAdminClient();
  try {
    const { data, error } = await a.from("game_state").select("state").eq("event_id", eventId).maybeSingle();
    if (error) throw error;
    if (data) return (data.state as Record<string, unknown>) ?? null;
    // no row yet — also peek at legacy storage for in-flight games
    return await readStorage(eventId);
  } catch {
    return await readStorage(eventId);
  }
}

export async function writeGameState(eventId: string, teamId: string | null, state: Record<string, unknown>): Promise<void> {
  const a = createAdminClient();
  try {
    const { error } = await a.from("game_state").upsert(
      { event_id: eventId, team_id: teamId, state, updated_at: new Date().toISOString() },
      { onConflict: "event_id" }
    );
    if (error) throw error;
  } catch {
    await writeStorage(eventId, state);
  }
}

async function readStorage(eventId: string): Promise<Record<string, unknown> | null> {
  const a = await ensureBucket();
  try { const { data } = await a.storage.from(BUCKET).download(eventId); if (!data) return null; return JSON.parse(await data.text()); } catch { return null; }
}
async function writeStorage(eventId: string, state: Record<string, unknown>): Promise<void> {
  const a = await ensureBucket();
  try { await a.storage.from(BUCKET).upload(eventId, Buffer.from(JSON.stringify(state)), { upsert: true, contentType: "application/json" }); } catch {}
}
