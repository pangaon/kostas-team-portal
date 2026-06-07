import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addChildCookie } from "@/lib/parent";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const token = params.token;
  const db = createAdminClient();
  const { data: pl } = await db.from("players").select("id, access_token").eq("access_token", token).maybeSingle();
  if (pl) { addChildCookie(token); return NextResponse.redirect(new URL("/parent", req.url)); }
  const { followToken } = await import("@/lib/accessmap");
  const mapped = await followToken(token);
  if (mapped) { addChildCookie(mapped); return NextResponse.redirect(new URL("/parent", req.url)); }
  return NextResponse.redirect(new URL("/?invalid=1", req.url));
}
