import { NextResponse } from "next/server";
import Stripe from "stripe";
import { markPaid } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !whSecret) return NextResponse.json({ error: "not configured" }, { status: 400 });
  const stripe = new Stripe(key);
  const body = await req.text();
  let event: Stripe.Event;
  try {
    const sig = req.headers.get("stripe-signature") ?? "";
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const playerId = s.metadata?.playerId;
    if (playerId) await markPaid(playerId, { amount: s.amount_total, email: s.customer_details?.email ?? null });
  }
  return NextResponse.json({ received: true });
}
