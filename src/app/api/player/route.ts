import { NextResponse } from "next/server";
import { getCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { readPlayerProfile, writePlayerProfile, appendNote } from "@/lib/playerprofile";
import { COACH_SENDER } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { team } = await getCoachTeam();
  if (!team) return NextResponse.json({ error: "no team" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.op || !body?.playerId) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const db = createAdminClient();
  const { data: pl } = await db.from("players").select("id, team_id").eq("id", body.playerId).maybeSingle();
  if (!pl || (pl as { team_id: string }).team_id !== team.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  if (body.op === "skills") {
    const skills = Array.isArray(body.skills) ? body.skills.slice(0, 30).map((x: unknown) => String(x).slice(0, 40)) : [];
    const prof = await readPlayerProfile(body.playerId);
    await writePlayerProfile(body.playerId, { ...prof, skills });
    return NextResponse.json({ ok: true });
  }
  if (body.op === "tip") {
    const text = String(body.text ?? "").trim().slice(0, 1000);
    if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
    await db.from("coach_inbox").insert({ team_id: team.id, player_id: body.playerId, from_name: COACH_SENDER, body: text, is_read: true });
    return NextResponse.json({ ok: true });
  }
  if (body.op === "note") {
    const text = String(body.text ?? "").trim();
    if (text) await appendNote(body.playerId, text);
    return NextResponse.json({ ok: true });
  }
  if (body.op === "getSkills") {
    const p = await readPlayerProfile(body.playerId);
    return NextResponse.json({ ok: true, skills: p.skills });
  }
  return NextResponse.json({ error: "unknown op" }, { status: 400 });
}
