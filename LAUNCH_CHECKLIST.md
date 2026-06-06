# Badoni — Launch Checklist

Everything's built. This is the short list of keys/accounts to flip features fully ON.
The app works today without any of these; they unlock the paid/extra layers.

## 1. Email sign-in (recommended, ~3 min, free tier)
Lets parents sign in by email (verified magic link).
- Create a free account at resend.com → get an API key.
- In Vercel → Project → Settings → Environment Variables, add:
  - `RESEND_API_KEY` = your key
  - `EMAIL_FROM` = e.g. `Badoni <noreply@badoni.app>` (verify the domain in Resend)
- Redeploy. Until then, /signin shows the link on-screen so it still works for testing.

## 2. Registration payments (optional — turns on card payments)
Already coded; dormant until you add Stripe. You set a fee in Settings → League & game rules.
- Create a Stripe account → get keys (stripe.com).
- In Vercel add:
  - `STRIPE_SECRET_KEY` = sk_live_… (or sk_test_… to test)
  - `STRIPE_WEBHOOK_SECRET` = whsec_… (from the webhook you create below)
- In Stripe → Developers → Webhooks → add endpoint:
  - URL: `https://badoni.app/api/stripe-webhook`
  - Event: `checkout.session.completed`
- Redeploy. Parents then see “Pay registration” on their profile; you see Paid/Unpaid on the roster.
- Note: money flows directly through YOUR Stripe account. (I can write the code but never handle funds or your credentials.)

## 3. Auto game-day reminders (optional hardening)
- Add `CRON_SECRET` in Vercel to lock the reminder endpoint (the daily cron already runs at 8am).

## 4. Custom domain — DONE ✅
badoni.app is live and pointing at the app.

## 5. Native apps (optional) — see NATIVE_BUILD.md
Needs Apple ($99/yr) + Google Play ($25) developer accounts.

## What's live right now (no setup needed)
Multi-team + switcher · Leagues with cross-team standings + public sign-up page · live game console
(clock, fair-play minutes, lines, subs) · multi-sport tactics boards · roster with photos, skills,
notes, nudges · two-way parent chat · auto reminders · parent intake · access links + reset.
