import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "parentintake";
let ensured = false;
async function ensure() {
  const a = createAdminClient();
  if (!ensured) { try { const { data } = await a.storage.getBucket(BUCKET); if (!data) await a.storage.createBucket(BUCKET, { public: false }); } catch {} ensured = true; }
  return a;
}

export type ParentIntake = { about?: string; asPlayer?: string; helpMe?: string };

export async function readIntake(playerId: string): Promise<ParentIntake> {
  const a = await ensure();
  try { const { data } = await a.storage.from(BUCKET).download(playerId); if (!data) return {}; return JSON.parse(await data.text()); } catch { return {}; }
}
export async function writeIntake(playerId: string, intake: ParentIntake): Promise<void> {
  const a = await ensure();
  try { await a.storage.from(BUCKET).upload(playerId, Buffer.from(JSON.stringify(intake)), { upsert: true, contentType: "application/json" }); } catch {}
}
export function intakeEmpty(i: ParentIntake): boolean { return !(i.about || i.asPlayer || i.helpMe); }
export async function readIntakes(ids: string[]): Promise<Record<string, ParentIntake>> {
  if (!ids.length) return {};
  const a = await ensure();
  let present = new Set<string>();
  try { const { data } = await a.storage.from(BUCKET).list("", { limit: 1000 }); present = new Set((data ?? []).map((o) => o.name)); } catch {}
  const out: Record<string, ParentIntake> = {};
  await Promise.all(ids.filter((id) => present.has(id)).map(async (id) => { const i = await readIntake(id); if (!intakeEmpty(i)) out[id] = i; }));
  return out;
}
