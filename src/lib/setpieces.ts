import { createAdminClient } from "@/lib/supabase/admin";
const BUCKET = "setpieces";
let ensured = false;
async function ensure() {
  const a = createAdminClient();
  if (!ensured) { try { const { data } = await a.storage.getBucket(BUCKET); if (!data) await a.storage.createBucket(BUCKET, { public: false }); } catch {} ensured = true; }
  return a;
}
export type SetPieces = { corners?: string; freekicks?: string; penalties?: string; throwins?: string };
export const SET_PIECE_FIELDS: { key: keyof SetPieces; label: string }[] = [
  { key: "corners", label: "Corners" }, { key: "freekicks", label: "Free kicks" },
  { key: "penalties", label: "Penalties" }, { key: "throwins", label: "Long throw-ins" },
];
export async function readSetPieces(teamId: string): Promise<SetPieces> {
  const a = await ensure();
  try { const { data } = await a.storage.from(BUCKET).download(teamId); if (!data) return {}; return JSON.parse(await data.text()); } catch { return {}; }
}
export async function writeSetPieces(teamId: string, sp: SetPieces): Promise<void> {
  const a = await ensure();
  try { await a.storage.from(BUCKET).upload(teamId, Buffer.from(JSON.stringify(sp)), { upsert: true, contentType: "application/json" }); } catch {}
}
