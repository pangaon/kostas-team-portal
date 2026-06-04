# From "Kostas Meat Market" to a platform — business plan

## The thesis
You just built, in an afternoon, the core of a product that real companies charge thousands a year for. The same engine that runs a U10 soccer team runs *any* kid's activity — the data model (teams, members, events, attendance, signups, results, polls, messaging) is already sport-agnostic. The opportunity is a **volunteer-first, parent-simple, all-activities organizer**.

## The market (researched)
- **Youth sports software ≈ $664.7M in 2025, growing ~12.5%/yr.** That's just *sports* — it excludes dance, music, scouts, camps, tutoring, and school clubs, which roughly double the addressable base.
- **It's already mobile:** ~61% of youth teams manage schedules via mobile apps, and leading platforms saw ~23% YoY user growth.
- **Incumbents are big but beatable on simplicity/price:**
  - **TeamSnap** — #1, ~19,000 orgs / ~30M users, ~18% share. Pricing is now sales-gated, ~$9.99/mo and up; widely seen as feature-heavy and pricey for a single volunteer team.
  - **SportsEngine** (NBC) — ~15% share, 1M+ orgs, premium ~$749/yr, org plans $2,500–$4,000/yr. Built for leagues, overkill for a team.
  - **GameChanger** — mobile-first live scoring, dominant in baseball/softball, weak for general team logistics.
  - **Spond** — **free**, monetizes via in-app payment processing (~3.29% + $1). This is the model to study: free kills the adoption barrier; money comes from payments and premium.

**The gap:** incumbents optimize for *league administrators*. Nobody has nailed the **volunteer coach + busy parent** experience: a link you paste in WhatsApp, no app store, no passwords, your kid already on the roster — exactly what you built.

## The wedge (why this can win)
1. **Zero-friction parent onboarding** — invite link → tap your child's name → done. No account creation. This is dramatically simpler than every incumbent.
2. **No app store** — it's a web app that installs to the home screen; no review, no download, instant updates.
3. **Volunteer-coach-first** — lineup, fair playing-time, game-day sheet, snack/volunteer/carpool coordination, polls — the unglamorous logistics that actually eat a coach's week.
4. **All activities, one family hub** — a parent with a soccer kid, a dance kid, and a swim kid sees everything in one place. That's a moat incumbents (siloed by sport) can't easily copy.

## Multi-activity expansion (not just soccer)
The schema already supports it; productizing means adding **activity templates** on top:
- **Team sports** (hockey, baseball, basketball, volleyball, lacrosse): lineups, positions, results — you have this.
- **Individual/scored** (swim, track, gymnastics, martial arts): swap "lineup" for heats/belts/levels; "goals" → personal bests.
- **Performance** (dance, theater, music): rehearsals, costume/recital logistics, parent volunteer slots.
- **Programs** (scouts, camps, tutoring, clubs): sessions, attendance, permission/consent forms, supply signups.
Each is the same primitives (events, attendance, signups, polls, messaging, roster) with a different label set and a couple of custom fields. Ship 2–3 templates, then a "custom activity" builder.

## Monetization (recommended: Spond-style freemium)
- **Free forever** for a single team/group — drives viral, bottom-up adoption (every parent who joins is a prospect).
- **Payments** — collect team fees/registration in-app; take a processing margin (the largest, most defensible revenue line; how Spond makes money).
- **Coach/Org Pro (~$8–15/mo or $79/yr)** — multi-team, advanced lineup/rotation analytics, auto game-day reminders (cron), photo/document vault, custom branding, CSV import, SMS fallback.
- **League/Club tier (annual)** — multi-team rollup, registration + waivers, financials, undercutting SportsEngine on price and setup time.
- **Later:** uniform/merch ordering, photo day, fundraising, sponsorships (local businesses like "Kostas Meat Market" already sponsor teams — a built-in ad/sponsor surface).

## Go-to-market
1. **Bottom-up, coach-led.** Every team you onboard brings 12–15 families; some of those parents coach *other* teams/activities. Build a one-tap "Start your own team" in every parent's view.
2. **Land your league first.** Get the Olympic Flame House League on it team-by-team, then pitch the league office the org tier.
3. **Templated virality.** The WhatsApp invite message *is* the growth loop — it's already how teams communicate.
4. **Niche beachheads.** Win one sport/region cleanly (Greek-Canadian house-league soccer in the GTA), then expand sport-by-sport.

## 90-day roadmap to a real product
- **Weeks 1–2:** Multi-tenant hardening (you're single-team now): org/team switcher, magic-link parent login, rate-limiting, backups, audit log.
- **Weeks 3–5:** Self-serve team creation + onboarding wizard; activity templates (soccer, hockey, dance) ; Stripe payments.
- **Weeks 6–8:** Pro tier + billing; automated reminders (cron); CSV roster import; photo/doc vault.
- **Weeks 9–12:** League/org dashboard; referrals; landing page + analytics; first 50 paying teams.

## Risks & honest caveats
- **Incumbent bundling** (TeamSnap ONE) — counter with radical simplicity + price + multi-activity.
- **Trust/safety** — you're handling children's data; invest early in privacy, consent, and SOC2-readiness (this is also a sales asset).
- **Payments = compliance** — Stripe Connect handles most, but it adds operational weight.
- **Support load** — volunteers need near-zero-config; every support ticket is a design bug.

## Immediate next steps
1. Keep using it this season — you're your own best design partner.
2. Onboard 2–3 more teams in your league (free) and watch where they get stuck.
3. Decide the name/brand (working: TeamDay, FamilyTeam, SquadParent, PlayDay).
4. When you're ready, I can build the multi-tenant + templates + payments layer — that's the leap from "your team's app" to "a company."

---
### Sources
- Youth Sports Software Market size/CAGR — https://www.businessresearchinsights.com/market-reports/youth-sports-software-market-122833
- Platform landscape (TeamSnap, SportsEngine shares/users) — https://www.stax.com/insights/navigating-the-evolving-landscape-of-youth-sports-management-platforms-insights-from-the-field
- Spond vs TeamSnap vs SportsEngine (pricing/model) — https://www.spond.com/en-us/news-and-blog/spond-v-teamsnap-v-sportsengine/
- TeamSnap ONE (incumbent bundling) — https://www.teamsnap.com/blog/announcements/teamsnap-unveils-teamsnap-one-next-generation-platform-future-youth-sports-technology
- TeamSnap vs SportsEngine comparison — https://www.capterra.com/compare/123208-134125/TeamSnap-vs-SportsEngine
