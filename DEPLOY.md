# Deploy guide — Kostas Team Portal

Plain-English, click-by-click. Everything here is **free**. Total time ≈ 20 minutes.
You do this on **your own** Supabase and Vercel accounts. Nothing is downloaded from
an app store.

There are two services:
- **Supabase** = the database (stores players, games, snacks, etc.)
- **Vercel** = the hosting (gives your app a web address parents can open)

---

## Part 1 — Supabase (the database)

1. Go to https://supabase.com → **Start your project** → sign in with GitHub or email.
2. Click **New project**. Name it `kostas-team-portal`. Pick any region near you.
   Set a database password (save it somewhere) and click **Create new project**.
   Wait ~2 minutes for it to finish setting up.
3. In the left sidebar open **SQL Editor** → **New query**.
   Open the file `supabase/schema.sql` from this project, copy ALL of it, paste it in,
   and click **Run**. You should see "Success". (This builds all the tables + security.)
4. Turn OFF email confirmation so your coach login works instantly:
   **Authentication → Sign In / Providers → Email** → turn **Confirm email** OFF → Save.
   (You can turn it back on later.)
5. Get your keys: **Project Settings (gear) → API**. You'll copy three values in Part 3:
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep this secret)

> You'll run `supabase/seed.sql` in step 10, AFTER you've created your coach account.

---

## Part 2 — Push notification keys (so parents get alerts)

You need a VAPID key pair. A ready-to-use pair has been generated for you below — you
can paste these straight into Vercel in Part 3, OR make your own by running
`npx web-push generate-vapid-keys`.

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BAdWU8kd_-veRpnJBkPSfXN_E4bpfxAqhPorNkr13I53x-nZfB0jyMww3c0cpTZ6pHiSVa64yeBqSIZPmcjur1c
VAPID_PRIVATE_KEY=_dG0LdellreOEqU17MIfZlvWjCS_677ptDLnZTRNsS8
VAPID_SUBJECT=mailto:coach@example.com
```

---

## Part 3 — Vercel (hosting)

1. Put this project on GitHub (easiest): create a repo and push this folder.
   (Or use the Vercel CLI: `npm i -g vercel` then `vercel` in this folder.)
2. Go to https://vercel.com → sign in with GitHub → **Add New… → Project** →
   import your repo. Framework auto-detects **Next.js**. Don't deploy yet — first add
   the environment variables.
3. In the import screen open **Environment Variables** and add these (from Parts 1 & 2):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service_role key |
   | `NEXT_PUBLIC_APP_URL` | leave blank for now, or `https://your-app.vercel.app` |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | the public key from Part 2 |
   | `VAPID_PRIVATE_KEY` | the private key from Part 2 |
   | `VAPID_SUBJECT` | `mailto:youremail@example.com` |

4. Click **Deploy**. After ~1 minute you'll get a live address like
   `https://kostas-team-portal.vercel.app`.
5. Set the real address: go to **Settings → Environment Variables**, set
   `NEXT_PUBLIC_APP_URL` to your actual `https://…vercel.app` address, then
   **Deployments → … → Redeploy**. (This makes the invite + calendar links correct.)

---

## Part 4 — Become the coach & load your team

1. Open `https://your-app.vercel.app/login` → click **Create account** → use your email
   + a password (8+ chars). You'll land on the dashboard.
2. Load your real roster + schedule: back in Supabase **SQL Editor → New query**, paste
   ALL of `supabase/seed.sql`, click **Run**. It attaches the **Kostas Meat** team (15
   players, 13 games + picture day) to your new account.
   *(Skip this step if you'd rather start empty and add your own team on the dashboard.)*
3. Refresh the dashboard — you'll see Kostas Meat with everything loaded.

---

## Part 5 — The invite link (what you send parents)

- On the dashboard (or **Team → Settings**) you'll see your invite link:
  `https://your-app.vercel.app/join/kostas-meat-2026`
- That's the **one link** you send. Paste it into your existing WhatsApp group once,
  or text it. Use **Team → Messages** for a ready-written welcome message.

**What a parent does:**
1. Taps the link on their phone → fills the short form (player name, jersey, their
   contact, allergies) → taps **Join team**.
2. Sees a "You're in!" screen. Their player shows up on **your** dashboard under
   **Pending** — you tap **Approve** and they're on the roster.
3. They tap **Add to Home Screen** (Share menu) and **Enable game alerts** to get push
   notifications. On iPhone the home-screen step is required for alerts (iOS 16.4+).

When you post an announcement, every parent who enabled alerts gets a push — no WhatsApp.

---

## Part 6 — Automatic game-day reminders (optional)

The app can push a reminder the morning of each game. To automate it, add a Vercel Cron:
create `vercel.json` with a daily schedule hitting a small route, or simply use
**Team → Messages → Game reminder** to send manually for now. (A cron route can be added
later — see "What's next" in FINAL_REPORT.md.)

## Calendar subscription
In **Team → Settings** there's a calendar link
(`/api/calendar/kostas-meat-2026.ics`). You or parents can paste it into Apple/Google
Calendar to subscribe to all games and practices.

---

### Troubleshooting
- **Can't sign in right after creating account** → you didn't turn off "Confirm email"
  (Part 1, step 4). Turn it off, or click the confirm link in your email.
- **Seed says "No auth user found"** → create your coach account (Part 4.1) first, then
  re-run the seed.
- **Invite link shows the wrong address** → set `NEXT_PUBLIC_APP_URL` and redeploy (Part 3.5).
- **No push on iPhone** → the parent must Add to Home Screen and open it from that icon
  (iOS requirement), on iOS 16.4 or newer, and tap Allow.
