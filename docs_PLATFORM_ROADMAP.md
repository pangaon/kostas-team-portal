# Platform Roadmap — from one team to a kids' activity organizer

## The product, in one line
A parent's single hub for **everything their kid does** (soccer, karate, guitar…), and the management tool **any activity provider** (league, club, school, private coach) runs on. The team app built today is provider type #1.

## Why it's real
Every provider ships its own mediocre app; parents juggle five logins and five calendars. Nobody owns the "all my kid's activities in one place" view. That's the wedge — bigger than team management.

## Guardrail (non-negotiable)
**The live single-team app is never broken.** Production runs off `main`. All expansion is built on a separate branch with its own preview URL, proven there, and only merged when data migrates cleanly. Single-team stays the default case of every model below — today's experience never regresses.

## Additive data model (single-team = the default case)
```
Org (personal by default; can become a League/Club/School)
 └─ Activity/Team (a soccer team, a karate class, a guitar studio)
     └─ Members (players/students) + Guardians
Parent ── follows many Activities across many Orgs (the parent hub)
```
A solo coach today = one Org (auto-created, invisible) → one Team. Nothing changes for them. Multi-team, leagues, and other activity types are just *more rows*, not a rewrite.

## Sequencing (each step additive, each behind a preview first)
1. **Multi-team** — one coach account, many teams/seasons/sports. Fixes "switching sport changes my live team."
2. **Org / League layer** — Olympic Flame holds many teams; shared rules; league standings; league-run sign-ups. (This is the paid tier — org pays, parents free.)
3. **Parent hub** — a parent's home shows ALL their kids' activities across orgs in one calendar + feed.
4. **Multi-activity providers** — karate, music, etc. as activity types (schedule + roster + comms, minus the game console).
5. **Native iOS/Android** — wrap the PWA (Capacitor); web stays the engine.

## Honest risks
- A two-sided platform is hard and slow; don't boil the ocean. **Nail one vertical (your league) into a sellable product first**, with the architecture ready to expand.
- Distribution, not product, is the hard part. Bottom-up: coaches love it → league adopts → parents bring it to their *other* activities.
- Monetize the org, never the parent. (Parents free, always.)
