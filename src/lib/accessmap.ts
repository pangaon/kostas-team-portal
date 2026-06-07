import { createAdminClient } from "@/lib/supabase/admin";
const BUCKET = "tokenmap";
let ensured = false;
async function ensure() {
  const a = createAdminClient();
  if (!ensured) { try { const { data } = await a.storage.getBucket(BUCKET); if (!data) await a.storage.createBucket(BUCKET, { public: false }); } catch {} ensured = true; }
  return a;
}
export async function mapToken(oldToken: string, newToken: string): Promise<void> {
  const a = await ensure();
  try { await a.storage.from(BUCKET).upload(oldToken, Buffer.from(JSON.stringify({ to: newToken })), { upsert: true, contentType: "application/json" }); } catch {}
}
export async function followToken(token: string): Promise<string | null> {
  const a = await ensure();
  try { const { data } = await a.storage.from(BUCKET).download(token); if (!data) return null; const o = JSON.parse(await data.text()); return o.to ?? null; } catch { return null; }
}
