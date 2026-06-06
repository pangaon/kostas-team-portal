import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "teamrules";
let ensured = false;
async function ensure() {
  const a = createAdminClient();
  if (!ensured) { try { const { data } = await a.storage.getBucket(BUCKET); if (!data) await a.storage.createBucket(BUCKET, { public: false }); } catch {} ensured = true; }
  return a;
}

export type TeamRules = { league?: string | null; onField?: number | null; periodCount?: number | null; periodMin?: number | null; feeCents?: number | null };

export async function readTeamRules(teamId: string): Promise<TeamRules> {
  const a = await ensure();
  try { const { data } = await a.storage.from(BUCKET).download(teamId); if (!data) return {}; return JSON.parse(await data.text()); } catch { return {}; }
}
export async function writeTeamRules(teamId: string, rules: TeamRules): Promise<void> {
  const a = await ensure();
  try { await a.storage.from(BUCKET).upload(teamId, Buffer.from(JSON.stringify(rules)), { upsert: true, contentType: "application/json" }); } catch {}
}
