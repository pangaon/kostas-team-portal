import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "magiclinks";
let ensured = false;
async function ensure() {
  const a = createAdminClient();
  if (!ensured) { try { const { data } = await a.storage.getBucket(BUCKET); if (!data) await a.storage.createBucket(BUCKET, { public: false }); } catch {} ensured = true; }
  return a;
}
export type MagicRec = { email: string; exp: number };

export async function writeMagicToken(token: string, rec: MagicRec) {
  const a = await ensure();
  try { await a.storage.from(BUCKET).upload(token, Buffer.from(JSON.stringify(rec)), { upsert: true, contentType: "application/json" }); } catch {}
}
export async function readMagicToken(token: string): Promise<MagicRec | null> {
  const a = await ensure();
  try { const { data } = await a.storage.from(BUCKET).download(token); if (!data) return null; return JSON.parse(await data.text()); } catch { return null; }
}
export async function deleteMagicToken(token: string) {
  const a = await ensure();
  try { await a.storage.from(BUCKET).remove([token]); } catch {}
}
