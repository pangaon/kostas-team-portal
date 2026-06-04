"use server";
import { revalidatePath } from "next/cache";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlayers } from "@/lib/data";
import type { RosterStatus } from "@/lib/types";

const STATUSES: RosterStatus[] = ["starter", "bench", "out"];

export async function saveLineup(formData: FormData) {
  const { team } = await requireCoachTeam();
  const event_id = String(formData.get("event_id") || "");
  if (!event_id) return;
  const db = createAdminClient();

  const formation = String(formData.get("formation") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  await db.from("lineups").upsert(
    { team_id: team.id, event_id, formation, notes },
    { onConflict: "event_id" }
  );

  const players = (await getPlayers(team.id)).filter((p) => p.status === "approved");
  const rows = players.map((p) => {
    const raw = String(formData.get(`status_${p.id}`) || "bench");
    const status: RosterStatus = STATUSES.includes(raw as RosterStatus) ? (raw as RosterStatus) : "bench";
    const position = String(formData.get(`pos_${p.id}`) || "").trim() || null;
    return { team_id: team.id, event_id, player_id: p.id, status, position };
  });
  if (rows.length) {
    await db.from("game_roster").upsert(rows, { onConflict: "event_id,player_id" });
  }

  revalidatePath("/team/lineup");
}
