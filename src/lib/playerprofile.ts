import { createAdminClient } from "@/lib/supabase/admin";
export { SKILL_OPTIONS } from "@/lib/skills";

const BUCKET = "playerprofiles";
let ensured = false;
async function ensure() {
  const a = createAdminClient();
  if (!ensured) { try { const { data } = await a.storage.getBucket(BUCKET); if (!data) await a.storage.createBucket(BUCKET, { public: false }); } catch {} ensured = true; }
  return a;
}
export type PlayerNote = { text: string; at: string };
export type PlayerProfile = { skills: string[]; notes: PlayerNote[] };

export async function readPlayerProfile(playerId: string): Promise<PlayerProfile> {
  const a = await ensure();
  try { const { data } = await a.storage.from(BUCKET).download(playerId); if (!data) return { skills: [], notes: [] }; const p = JSON.parse(await data.text()); return { skills: p.skills ?? [], notes: p.notes ?? [] }; } catch { return { skills: [], notes: [] }; }
}
export async function writePlayerProfile(playerId: string, profile: PlayerProfile): Promise<void> {
  const a = await ensure();
  try { await a.storage.from(BUCKET).upload(playerId, Buffer.from(JSON.stringify(profile)), { upsert: true, contentType: "application/json" }); } catch {}
}
export async function appendNote(playerId: string, text: string): Promise<void> {
  const p = await readPlayerProfile(playerId);
  p.notes = [{ text: text.slice(0, 500), at: new Date().toISOString() }, ...(p.notes ?? [])].slice(0, 50);
  await writePlayerProfile(playerId, p);
}
export async function readProfiles(ids: string[]): Promise<Record<string, PlayerProfile>> {
  if (!ids.length) return {};
  const a = await ensure();
  let present = new Set<string>();
  try { const { data } = await a.storage.from(BUCKET).list("", { limit: 1000 }); present = new Set((data ?? []).map((o) => o.name)); } catch {}
  const wanted = ids.filter((id) => present.has(id));
  const out: Record<string, PlayerProfile> = {};
  await Promise.all(wanted.map(async (id) => { const p = await readPlayerProfile(id); if (p.skills?.length || p.notes?.length) out[id] = p; }));
  return out;
}
