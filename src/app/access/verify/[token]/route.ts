import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addChildCookie } from "@/lib/parent";
import { readMagicToken, deleteMagicToken } from "@/lib/magiclink";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const rec = await readMagicToken(params.token);
  if (!rec || rec.exp < Date.now()) {
    await deleteMagicToken(params.token);
    return NextResponse.redirect(new URL("/signin?expired=1", req.url));
  }
  const db = createAdminClient();
  const { data: gs } = await db.from("guardians").select("player_id").ilike("email", rec.email);
  const ids = [...new Set((gs ?? []).map((g: { player_id: string }) => g.player_id).filter(Boolean))];
  if (ids.length) {
    const { data: players } = await db.from("players").select("access_token").in("id", ids);
    for (const p of (players ?? []) as { access_token: string }[]) if (p.access_token) addChildCookie(p.access_token);
  }
  await deleteMagicToken(params.token); // one-time use
  return NextResponse.redirect(new URL("/parent", req.url));
}
