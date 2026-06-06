"use server";
import { redirect } from "next/navigation";
import { requireUser, listCoachTeams } from "@/lib/auth";
import { createOrg, getOrgForOwner, getOrgByCode, setOrgTeams, renameOrg } from "@/lib/orgs";

export async function createLeague(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (name) await createOrg(user.id, name);
  redirect("/league");
}
export async function renameLeague(formData: FormData) {
  const user = await requireUser();
  const org = await getOrgForOwner(user.id);
  const name = String(formData.get("name") ?? "").trim();
  if (org && name) await renameOrg(org.id, name);
  redirect("/league?saved=" + encodeURIComponent("Saved"));
}
export async function setLeagueTeams(formData: FormData) {
  const user = await requireUser();
  const org = await getOrgForOwner(user.id);
  if (!org) redirect("/league");
  const mine = new Set((await listCoachTeams(user)).map((t) => t.id));
  const ids = formData.getAll("team").map(String).filter((id) => mine.has(id));
  await setOrgTeams(org.id, ids);
  redirect("/league?saved=" + encodeURIComponent("Teams updated"));
}


export async function joinLeagueByCode(formData: FormData) {
  const user = await requireUser();
  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  const teamId = String(formData.get("teamId") ?? "");
  const org = await getOrgByCode(code);
  if (!org) redirect("/league?error=" + encodeURIComponent("League code not found"));
  const mine = new Set((await listCoachTeams(user)).map((t) => t.id));
  if (!teamId || !mine.has(teamId)) redirect("/league?error=" + encodeURIComponent("Pick one of your teams"));
  await setOrgTeams(org!.id, [...org!.teamIds, teamId]);
  redirect("/league?saved=" + encodeURIComponent("Team added to " + org!.name));
}
