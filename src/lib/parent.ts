import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Player, Team } from "@/lib/types";

const COOKIE = "team_portal_parent";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

// The cookie stores a COMMA-SEPARATED list of per-player access_token UUIDs.
// The FIRST token in the list is the currently active child.
function readTokens(): string[] {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}
function writeTokens(tokens: string[]) {
  if (tokens.length === 0) {
    cookies().delete(COOKIE);
    return;
  }
  cookies().set(COOKIE, tokens.join(","), COOKIE_OPTS);
}

// Replace the whole list with a single token (fresh sign-in).
export function setParentCookie(token: string) {
  writeTokens([token]);
}

// Add (or promote) a child token to the front, making it the active child.
// Used for both first join and adding siblings.
export function addChildCookie(token: string) {
  const tokens = readTokens().filter((t) => t !== token);
  tokens.unshift(token);
  writeTokens(tokens);
}

// Move an existing token to the front (switch active child). No-op if absent.
export function setActiveChild(token: string) {
  const tokens = readTokens();
  if (!tokens.includes(token)) return;
  const rest = tokens.filter((t) => t !== token);
  writeTokens([token, ...rest]);
}

export function clearParentCookie() {
  cookies().delete(COOKIE);
}

async function resolveToken(
  token: string
): Promise<{ player: Player; team: Team } | null> {
  const admin = createAdminClient();
  let { data: player } = await admin
    .from("players")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();
  if (!player) {
    const { followToken } = await import("@/lib/accessmap");
    const mapped = await followToken(token);
    if (mapped) {
      const r = await admin.from("players").select("*").eq("access_token", mapped).maybeSingle();
      player = r.data;
    }
    if (!player) return null;
  }
  const { data: team } = await admin
    .from("teams")
    .select("*")
    .eq("id", (player as Player).team_id)
    .maybeSingle();
  if (!team) return null;
  // Privacy: coach-only fields must never reach the parent side.
  const p = player as Player;
  const safePlayer: Player = { ...p, coach_notes: null, preferred_position: null, strong_foot: null };
  return { player: safePlayer, team: team as Team };
}

// The active child (first token), or null.
export async function getParentSession(): Promise<{ player: Player; team: Team } | null> {
  const tokens = readTokens();
  if (tokens.length === 0) return null;
  return resolveToken(tokens[0]);
}

// All linked children (skipping any tokens that no longer resolve).
export async function getParentChildren(): Promise<Array<{ player: Player; team: Team }>> {
  const tokens = readTokens();
  if (tokens.length === 0) return [];
  const resolved = await Promise.all(tokens.map((t) => resolveToken(t)));
  return resolved.filter(
    (r): r is { player: Player; team: Team } => r !== null
  );
}
