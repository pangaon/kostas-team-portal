# Test checklist

Run through this after deploying (or locally with `npm run dev`).

## Coach
- [ ] Create account at `/login` and reach `/dashboard`
- [ ] Dashboard shows team name, next event, attendance + snack status, invite link
- [ ] `/team/schedule` — add an event, edit it, cancel it, delete it
- [ ] `/team/roster` — see roster; approve a pending signup; add a player; edit; delete
- [ ] `/team/attendance` — pick an event, see attending / maybe / not / no-reply counts
- [ ] `/team/snacks` — assign a family to a date; clear it
- [ ] `/team/announcements` — post an announcement (parents with alerts get a push)
- [ ] `/team/messages` — copy a WhatsApp template
- [ ] `/team/lineup` — set a formation + positions for the next game; copy the lineup
- [ ] `/team/playing-time` — players sorted by fewest starts
- [ ] `/team/checkin` — tap players present; count updates
- [ ] `/team/volunteers` — assign a role
- [ ] `/event/<id>/sheet` — printable game-day sheet shows lineup + allergies + emergency contacts
- [ ] `/team/settings` — edit team; regenerate invite link; copy calendar link

## Parent
- [ ] Open `/join/kostas-meat-2026` on a phone — form is easy to fill, no horizontal scroll
- [ ] Submit registration → "You're in!" confirmation
- [ ] New player appears under Pending on the coach dashboard
- [ ] `/parent` — see next game; mark Going / Maybe / Can't with a note
- [ ] Tap **Directions** → opens maps
- [ ] `/parent/schedule` — upcoming events list
- [ ] `/parent/snacks` — claim a date; see allergy reminder; cancel a claim
- [ ] `/parent/announcements` — see the coach's posts
- [ ] `/parent/profile` — update own phone/allergies; add a block-date range; add another child
- [ ] Carpool — post an offer/need on an event; delete own post
- [ ] Add to Home Screen → Enable alerts → receive a push when coach posts

## Security / privacy
- [ ] Invalid invite code (`/join/wrong`) shows "not valid", does not join
- [ ] A parent cannot see another family's phone/email (only first name + jersey)
- [ ] Medical notes + coach notes never appear on the parent side
- [ ] Visiting `/dashboard` while not signed in redirects to `/login`
- [ ] Row Level Security is ON (Supabase → Authentication → Policies shows policies)

## Mobile
- [ ] iPhone Safari width — buttons large, forms easy, no sideways scrolling
- [ ] Android Chrome width — same
- [ ] Installs to home screen with the app icon

## Build (developer)
- [x] `npx tsc --noEmit` — 0 type errors
- [x] `next build` — all routes compile (29 routes)
