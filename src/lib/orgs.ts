import { createAdminClient } from "@/lib/supabase/admin";
import { slugify, randomCode } from "@/lib/format";

const BUCKET = "orgs";
let ensured = false;
async function ensure() {
  const a = createAdminClient();
  if (!ensured) { try { const { data } = await a.storage.getBucket(BUCKET); if (!data) await a.storage.createBucket(BUCKET, { public: false }); } catch {} ensured = true; }
  return a;
}
export type Org = { id: string; code: string; name: string; ownerId: string; teamIds: string[]; createdAt: string };

async function readJson<T>(path: string): Promise<T | null> {
  const a = await ensure();
  try { const { data } = await a.storage.from(BUCKET).download(path); if (!data) return null; return JSON.parse(await data.text()); } catch { return null; }
}
async function writeJson(path: string, obj: unknown) {
  const a = await ensure();
  try { await a.storage.from(BUCKET).upload(path, Buffer.from(JSON.stringify(obj)), { upsert: true, contentType: "application/json" }); } catch {}
}

export async function getOrg(id: string): Promise<Org | null> { return readJson<Org>(`org/${id}.json`); }
export async function getOrgByCode(code: string): Promise<Org | null> {
  const id = await readJson<{ id: string }>(`code/${code}.json`);
  return id?.id ? getOrg(id.id) : null;
}
export async function getOrgForOwner(ownerId: string): Promise<Org | null> {
  const ref = await readJson<{ id: string }>(`owner/${ownerId}.json`);
  return ref?.id ? getOrg(ref.id) : null;
}
export async function createOrg(ownerId: string, name: string): Promise<Org> {
  const existing = await getOrgForOwner(ownerId);
  if (existing) return existing;
  const id = crypto.randomUUID();
  const code = `${slugify(name).slice(0, 24) || "league"}-${randomCode(4).toLowerCase()}`;
  const org: Org = { id, code, name: name.slice(0, 80), ownerId, teamIds: [], createdAt: new Date().toISOString() };
  await writeJson(`org/${id}.json`, org);
  await writeJson(`owner/${ownerId}.json`, { id });
  await writeJson(`code/${code}.json`, { id });
  return org;
}
export async function setOrgTeams(id: string, teamIds: string[]): Promise<void> {
  const org = await getOrg(id); if (!org) return;
  org.teamIds = [...new Set(teamIds)];
  await writeJson(`org/${id}.json`, org);
}
export async function renameOrg(id: string, name: string): Promise<void> {
  const org = await getOrg(id); if (!org) return;
  org.name = name.slice(0, 80);
  await writeJson(`org/${id}.json`, org);
}
