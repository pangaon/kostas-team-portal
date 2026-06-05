import { NextResponse } from "next/server";
import { getCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { readGameState, writeGameState } from "@/lib/gamestate";

export const dynamic = "force-dynamic";

type DB = ReturnType<typeof createAdminClient>;
async function ensureResult(db: DB, teamId: string, eventId: string) {
  const { data } = await db.from("match_results").select("*").eq("event_id", eventId).maybeSingle();
  if (data) return data as { id: string; our_score: number; opp_score: number; notes: string | null };
  const { data: created } = await db.from("match_results")
    .insert({ team_id: teamId, event_id: eventId, our_score: 0, opp_score: 0 }).select("*").single();
  return created as { id: string; our_score: number; opp_score: number; notes: string | null };
}

export async function POST(req: Request) {
  const { team } = await getCoachTeam();
  if (!team) return NextResponse.json({ error: "no team" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.eventId || !body?.op) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const db = createAdminClient();
  const { data: ev } = await db.from("events").select("id,team_id").eq("id", body.eventId).maybeSingle();
  if (!ev || (ev as { team_id: string }).team_id !== team.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const eventId = body.eventId as string;
  const p = body.payload ?? {};

  switch (body.op) {
    case "score": {
      const r = await ensureResult(db, team.id, eventId);
      const next = p.side === "them" ? { opp_score: Math.max(0, p.value | 0) } : { our_score: Math.max(0, p.value | 0) };
      await db.from("match_results").update(next).eq("id", r.id);
      return NextResponse.json({ ok: true });
    }
    case "goal": {
      const r = await ensureResult(db, team.id, eventId);
      const { data: g } = await db.from("goal_events")
        .insert({ team_id: team.id, event_id: eventId, player_id: p.player_id ?? null }).select("id").single();
      const score = r.our_score + 1;
      await db.from("match_results").update({ our_score: score }).eq("id", r.id);
      return NextResponse.json({ ok: true, goalId: (g as { id: string }).id, our_score: score });
    }
    case "undoGoal": {
      const r = await ensureResult(db, team.id, eventId);
      await db.from("goal_events").delete().eq("id", p.id).eq("team_id", team.id);
      const score = Math.max(0, r.our_score - 1);
      await db.from("match_results").update({ our_score: score }).eq("id", r.id);
      return NextResponse.json({ ok: true, our_score: score });
    }
    case "field": {
      await db.from("game_roster").upsert(
        { team_id: team.id, event_id: eventId, player_id: p.player_id, status: p.status, position: p.position ?? null },
        { onConflict: "event_id,player_id" });
      return NextResponse.json({ ok: true });
    }
    case "note": {
      const r = await ensureResult(db, team.id, eventId);
      const note = String(p.note ?? "").trim().slice(0, 280);
      if (!note) return NextResponse.json({ ok: true });
      const stamp = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });
      const line = `[${stamp}] ${note}`;
      const notes = (r.notes ? `${r.notes}\n${line}` : line).slice(0, 5000);
      await db.from("match_results").update({ notes }).eq("id", r.id);
      return NextResponse.json({ ok: true, line });
    }
    case "planSub": {
      const { data: sp } = await db.from("sub_plans")
        .insert({ team_id: team.id, event_id: eventId, player_in: p.player_in, player_out: p.player_out }).select("id").single();
      return NextResponse.json({ ok: true, id: (sp as { id: string }).id });
    }
    case "cancelSub": {
      await db.from("sub_plans").delete().eq("id", p.id).eq("team_id", team.id);
      return NextResponse.json({ ok: true });
    }
    case "execSub": {
      const { data: plan } = await db.from("sub_plans").select("*").eq("id", p.id).eq("team_id", team.id).maybeSingle();
      if (plan) {
        const pl = plan as { player_in: string; player_out: string };
        const { data: outRow } = await db.from("game_roster").select("position").eq("event_id", eventId).eq("player_id", pl.player_out).maybeSingle();
        const pos = (outRow as { position: string | null } | null)?.position ?? null;
        await db.from("game_roster").upsert({ team_id: team.id, event_id: eventId, player_id: pl.player_out, status: "bench" }, { onConflict: "event_id,player_id" });
        await db.from("game_roster").upsert({ team_id: team.id, event_id: eventId, player_id: pl.player_in, status: "starter", position: pos }, { onConflict: "event_id,player_id" });
        await db.from("sub_plans").update({ status: "done" }).eq("id", p.id);
      }
      return NextResponse.json({ ok: true });
    }
    case "stateGet": {
      const state = await readGameState(eventId);
      return NextResponse.json({ ok: true, state });
    }
    case "stateSet": {
      await writeGameState(eventId, (p.state ?? {}) as Record<string, unknown>);
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "unknown op" }, { status: 400 });
  }
}
