# Kostas Team Portal — Build Report

**Status: LIVE in production.** https://kostas-team-portal.vercel.app
Stack: Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth + RLS) · Vercel · PWA + Web Push.
Verification: `tsc --noEmit` 0 errors · `next build` compiles all 33 routes · independent security audit performed and HIGH findings fixed.

## What's deployed and working
Confirmed live: coach account, real roster (15 players) and full 2026 schedule (13 games + picture day) loaded, dashboard, and the new Season page rendering against the live database.

### Coach
Command-center dashboard · roster + parent directory with approve/add/edit/delete · schedule (games, events, tournaments, picture day) · **lineup planner (8-a-side: 7 outfield + goalie)** · **Season: scores, W-D-L record, goals for/against, form, top-scorer & assist leaderboard, per-game goal entry** · attendance with no-reply tracking · snack signup · **practice availability poll** · **parent-notes inbox** · announcements with push · WhatsApp message templates · game-day check-in · printable game-day sheet (lineup + allergies + emergency contacts) · private player notes · volunteer roles · calendar (iCal) · settings (regenerate invite).

### Parent (no password — invite link + "tap your child's name")
Bottom-nav portal (Home · Schedule · Snacks · News · Coach) · mark attendance + note · one-tap directions · claim snack date · season block-out dates · multi-child family view · carpool board · **vote on practice times** · **message the coach** · self-service profile · installable PWA + push alerts.

## How it works (architecture)
- **Coach auth:** Supabase Auth (email/password), SSR cookie session refreshed by middleware. Coach data access runs server-side, scoped to the team they own (`requireCoachTeam`).
- **Parent access:** no login. Joining (or claiming an existing roster player) stores the player's random `access_token` in an httpOnly cookie. All parent reads/writes run through server actions using the service-role key, after verifying the player/team. Parents only ever see their own child's details plus other players' first name + jersey.
- **Privacy/security:** Supabase Row Level Security enabled on all 22 tables as a backstop; the real boundary is the server-action layer. Phone/email, medical notes, and coach notes are never exposed to other families.
- **Push:** VAPID web-push; service worker delivers notifications; installs to home screen.
- **CI/CD:** GitHub repo `pangaon/kostas-team-portal` → every push to `main` auto-deploys on Vercel.

## Database (22 tables)
teams, team_members, players (+ claimed, coach_notes, position, foot), guardians, events, attendance, snack_signups, announcements, message_templates, notifications, push_subscriptions, lineups, game_roster, volunteer_roles, availability_blocks, carpool_posts, match_results, goal_events, polls, poll_options, poll_votes, coach_inbox. Full DDL in `supabase/schema.sql` + `supabase/migration_v2.sql`.

## Security audit — findings & fixes (this build)
An independent audit was run against the privacy/authorization model. Result: the architecture held up (no cross-family PII leaks, RLS complete, secrets server-only). Issues found and **fixed**:
- **HIGH — Claim-takeover:** the "claim your child" action trusted the posted player id; a holder of the (shared) invite code could claim an already-claimed child and gain their data. **Fixed:** claim now only succeeds for an unclaimed, approved player on that team.
- **HIGH — Volunteer overwrite:** a parent could reassign a role another family already claimed. **Fixed:** server now refuses to overwrite an existing claim.
- **MEDIUM — Input caps / date validation:** parent free-text (notes, carpool, reasons) had no length bound; block-out dates weren't order-checked. **Fixed:** length caps + start≤end validation added.
Remaining LOW notes (acceptable / future): the iCal calendar feed is gated only by the invite code (no child PII in it); consider a separate calendar token later.

## Known limitations / honest notes
- iOS PWAs can occasionally drop the login cookie between launches (a Safari limitation); the app now reopens to the correct home so this is far less noticeable.
- Game-day reminders are manual (a button/template) until a Vercel Cron is added.
- Parents' contact info on claimed seeded players is the placeholder from your spreadsheet until each parent updates their own profile.

## What I'd harden next (production-grade checklist)
1. Per-parent magic-link email login (cross-device continuity; removes cookie-takeover surface entirely).
2. Vercel Cron for automatic game-day + RSVP-deadline push.
3. Rate-limiting on join/claim/vote endpoints; CAPTCHA-free abuse checks.
4. Audit log + soft-delete; nightly DB backups (Supabase PITR on a paid tier).
5. Coach approval email when a new family joins; bulk roster CSV import.
6. Automated tests (Playwright) for the join → approve → attendance → lineup → result flow.
