# Kostas Team Portal

A mobile-first web app that gives a volunteer coach and team parents **one clean place**
for schedule, attendance, snack duty, lineups, announcements and push notifications —
so the team stops living in scattered WhatsApp messages and spreadsheets.

Built with **Next.js (App Router) · TypeScript · Tailwind · Supabase · Vercel**.
Installs to a phone home screen as a PWA and sends **web push** notifications.

> **It's a web app, not an App Store app.** Parents tap a link, it opens in their
> phone browser. They can optionally "Add to Home Screen" for an app icon + alerts.

---

## What's inside

**Coach (signs in with email + password)**
- Dashboard command center — next event, attendance + snack status, pending signups, invite link
- Roster + parent directory ("which parent belongs to which kid") with approve / add / edit / delete
- Schedule — games, practices, tournaments, picture day, uniform pickup
- Attendance — who's coming to each event, with no-reply list and copyable summary
- Snack signup — assign or let families claim; one family per date
- Announcements — post once → in-app + push to every parent
- WhatsApp message helper — 6 ready-to-copy templates
- **Lineup / lines planner** — set positions per game, pulling who's attending
- **Fair playing-time tracker** — keep starts roughly equal across the season
- **Game-day check-in** — tap kids present in seconds at the field
- **Game-day sheet** — printable lineup + allergies + emergency contacts
- Private player notes (position, foot, coach notes — never shown to parents)
- Volunteer roles — team parent, field setup, scorekeeper, etc.
- Settings — edit team, regenerate invite link, calendar subscription URL

**Parent (joins via private invite link — no password)**
- Simple bottom-nav portal: Home · Schedule · Snacks · News
- Mark attendance (Going / Maybe / Can't) + note
- One-tap **directions** to the field
- Claim a snack date; see allergy reminders
- **Season block-dates** — mark "away Jul 1–14" once → auto not-attending for those games
- **Multi-child family view** — one parent, multiple kids, one login
- **Carpool board** — offer or request rides per game
- Self-service profile — update own phone / allergies anytime
- **Push notifications** + "Add to Home Screen" guide
- Game-day reminders (see Automation in DEPLOY.md)

**Privacy:** the coach sees everything. Parents see only their own child's details
plus other players' first name + jersey. Phone/email, medical notes and coach notes
are never exposed to other families. Enforced in app code + Supabase Row Level Security.

---

## Quick start (local)

1. Install Node 18+.
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Supabase keys (see **DEPLOY.md**).
4. In Supabase SQL Editor: run `supabase/schema.sql`, then (after creating your coach
   account) run `supabase/seed.sql` to load the real Kostas Meat roster + schedule.
5. `npm run dev` → open http://localhost:3000

Full step-by-step (Supabase project, Vercel deploy, push keys, creating your coach
account, the invite link): **see DEPLOY.md.**

## Project layout
- `supabase/schema.sql` — tables + Row Level Security (run first)
- `supabase/seed.sql` — Kostas Meat sample data (run after signing up)
- `src/app/(coach)/` — coach dashboard + `/team/*` tools
- `src/app/(parent)/` — parent portal (`/parent/*`)
- `src/app/join/[inviteCode]/` — parent registration
- `src/app/event/[eventId]/` — shared event page + printable sheet
- `src/lib/` — Supabase clients, auth, data access, push, validation
- `public/` — PWA manifest, service worker, icons

See **TEST_CHECKLIST.md** for what to verify and **FINAL_REPORT.md** for the full rundown.
