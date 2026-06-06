import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { readTeamRules } from "@/lib/teamrules";
import { getParentSession } from "@/lib/parent";
import { originFromEnv } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "Payments not set up yet" }, { status: 400 });
  const sess = await getParentSession();
  if (!sess) return NextResponse.json({ error: "not signed in" }, { status: 403 });
  const rules = await readTeamRules(sess.team.id);
  const cents = rules.feeCents ?? 0;
  if (cents <= 0) return NextResponse.json({ error: "no fee set" }, { status: 400 });

  const stripe = new Stripe(key);
  const origin = originFromEnv();
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price_data: { currency: "cad", product_data: { name: `${sess.team.name} registration — ${sess.player.first_name} ${sess.player.last_name}` }, unit_amount: cents }, quantity: 1 }],
    success_url: `${origin}/parent?paid=1`,
    cancel_url: `${origin}/parent/profile`,
    metadata: { playerId: sess.player.id, teamId: sess.team.id },
  });
  // mark intent so webhook can confirm; store playerId in metadata (handled by webhook)
  void createAdminClient;
  return NextResponse.json({ url: checkout.url });
}
