import { createAdminClient } from "@/lib/supabase/admin";

export function isStripeConfigured(): boolean { return !!process.env.STRIPE_SECRET_KEY; }

const BUCKET = "payments";
let ensured = false;
async function ensure() {
  const a = createAdminClient();
  if (!ensured) { try { const { data } = await a.storage.getBucket(BUCKET); if (!data) await a.storage.createBucket(BUCKET, { public: false }); } catch {} ensured = true; }
  return a;
}
export async function isPaid(playerId: string): Promise<boolean> {
  const a = await ensure();
  try { const { data } = await a.storage.from(BUCKET).list("", { limit: 1000 }); return (data ?? []).some((o) => o.name === playerId); } catch { return false; }
}
export async function markPaid(playerId: string, info: Record<string, unknown> = {}): Promise<void> {
  const a = await ensure();
  try { await a.storage.from(BUCKET).upload(playerId, Buffer.from(JSON.stringify({ paidAt: new Date().toISOString(), ...info })), { upsert: true, contentType: "application/json" }); } catch {}
}
export async function paidSet(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const a = await ensure();
  try { const { data } = await a.storage.from(BUCKET).list("", { limit: 1000 }); const have = new Set((data ?? []).map((o) => o.name)); return new Set(ids.filter((id) => have.has(id))); } catch { return new Set(); }
}
