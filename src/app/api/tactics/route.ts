import { NextResponse } from "next/server";
import { getCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LineupSlot } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { team } = await getCoachTeam();
  if (!team) return NextResponse.json({ error: "no team" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.op) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const db = createAdminClient();
  const eventId = body.eventId as string | undefined;
  if (eventId) {
    const { data: ev } = await db.from("events").select("team_id").eq("id", eventId).maybeSingle();
    if (!ev || (ev as { team_id: string }).team_id !== team.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const p = body.payload ?? {};

  switch (body.op) {
    case "save": {
      const row = { team_id: team.id, event_id: eventId ?? null, name: String(p.name || "Lineup").slice(0, 60), formation: String(p.formation || "3-3-1"), slots: p.slots ?? [] };
      if (p.id) {
        await db.from("lineup_plans").update(row).eq("id", p.id).eq("team_id", team.id);
        return NextResponse.json({ ok: true, id: p.id });
      }
      const { data } = await db.from("lineup_plans").insert(row).select("id").single();
      return NextResponse.json({ ok: true, id: (data as { id: string }).id });
    }
    case "delete": {
      await db.from("lineup_plans").delete().eq("id", p.id).eq("team_id", team.id);
      return NextResponse.json({ ok: true });
    }
    case "push": {
      if (!eventId) return NextResponse.json({ error: "no event" }, { status: 400 });
      const slots = (p.slots ?? []) as LineupSlot[];
      const placed = new Map<string, string>();
      for (const s of slots) if (s.player_id) placed.set(s.player_id, s.pos);
      const { data: players } = await db.from("players").select("id").eq("team_id", team.id).eq("status", "approved");
      for (const pl of (players ?? []) as { id: string }[]) {
        if (placed.has(pl.id)) {
          await db.from("game_roster").upsert({ team_id: team.id, event_id: eventId, player_id: pl.id, status: "starter", position: placed.get(pl.id) }, { onConflict: "event_id,player_id" });
        } else {
          await db.from("game_roster").upsert({ team_id: team.id, event_id: eventId, player_id: pl.id, status: "bench" }, { onConflict: "event_id,player_id" });
        }
      }
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "unknown op" }, { status: 400 });
  }
}
