import { createAdminClient } from "@/lib/supabase/admin";
export { SKILL_OPTIONS } from "@/lib/skills";

const BUCKET = "playerprofiles";
let ensured = false;
async function ensure() {
  const a = createAdminClient();
  if (!ensured) { try { const { data } = await a.storage.getBucket(BUCKET); if (!data) await a.storage.createBucket(BUCKET, { public: false }); } catch {} ensured = true; }
  return a;
}

export type PlayerProfile = { skills: string[] };


export async function readPlayerProfile(playerId: string): Promise<PlayerProfile> {
  const a = await ensure();
  try { const { data } = await a.storage.from(BUCKET).download(playerId); if (!data) return { skills: [] }; return JSON.parse(await data.text()); } catch { return { skills: [] }; }
}
export async function writePlayerProfile(playerId: string, profile: PlayerProfile): Promise<void> {
  const a = await ensure();
  try { await a.storage.from(BUCKET).upload(playerId, Buffer.from(JSON.stringify(profile)), { upsert: true, contentType: "application/json" }); } catch {}
}
export async function readProfiles(ids: string[]): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  await Promise.all(ids.map(async (id) => { const p = await readPlayerProfile(id); if (p.skills?.length) out[id] = p.skills; }));
  return out;
}
