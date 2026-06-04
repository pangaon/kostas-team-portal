-- =====================================================================
--  KOSTAS TEAM PORTAL — DATABASE SCHEMA + ROW LEVEL SECURITY
--  Run in Supabase > SQL Editor (paste all, click RUN). Safe to re-run.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- TABLES ----------------------------------------------------

create table if not exists teams (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  sport        text default 'Soccer',
  season       text,
  age_group    text,
  invite_code  text unique not null,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists team_members (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  role        text not null default 'coach' check (role in ('coach','assistant','parent')),
  status      text not null default 'active' check (status in ('active','invited','removed')),
  created_at  timestamptz not null default now()
);

create table if not exists players (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid not null references teams(id) on delete cascade,
  first_name     text not null,
  last_name      text not null,
  jersey_number  text,
  allergies      text,
  medical_notes  text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  -- MVP additions: coach approval + passwordless parent access
  status         text not null default 'pending' check (status in ('pending','approved','rejected')),
  access_token   uuid not null default gen_random_uuid(),
  created_at     timestamptz not null default now()
);

create table if not exists guardians (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  team_id       uuid references teams(id) on delete cascade,
  name          text not null,
  phone         text,
  email         text,
  relationship  text,
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references teams(id) on delete cascade,
  type         text not null default 'game'
               check (type in ('game','practice','event','tournament','other')),
  title        text,
  opponent     text,
  location     text,
  field_number text,
  start_time   timestamptz not null,
  end_time     timestamptz,
  arrival_time timestamptz,
  notes        text,
  status       text not null default 'scheduled'
               check (status in ('scheduled','cancelled','postponed')),
  created_at   timestamptz not null default now()
);

create table if not exists attendance (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  guardian_id uuid references guardians(id) on delete set null,
  status      text not null default 'maybe' check (status in ('attending','not_attending','maybe')),
  note        text,
  updated_at  timestamptz not null default now(),
  unique (event_id, player_id)
);

create table if not exists snack_signups (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid references teams(id) on delete cascade,
  event_id     uuid not null references events(id) on delete cascade,
  player_id    uuid references players(id) on delete set null,
  guardian_id  uuid references guardians(id) on delete set null,
  snack_notes  text,
  created_at   timestamptz not null default now(),
  unique (event_id)                 -- one family per snack date (MVP rule)
);

create table if not exists announcements (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  title       text not null,
  body        text not null,
  event_id    uuid references events(id) on delete set null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists message_templates (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- In-app notification feed (the "no WhatsApp needed" channel). The app writes
-- a row here whenever the coach posts an announcement, adds/cancels an event,
-- or a snack date is claimed. Parents see these in /parent/announcements.
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  kind        text not null default 'announcement'
              check (kind in ('announcement','event','snack','attendance','general')),
  title       text not null,
  body        text,
  event_id    uuid references events(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------- INDEXES ---------------------------------------------------
create index if not exists idx_members_team   on team_members(team_id);
create index if not exists idx_players_team    on players(team_id);
create index if not exists idx_guardians_player on guardians(player_id);
create index if not exists idx_events_team      on events(team_id);
create index if not exists idx_attendance_event on attendance(event_id);
create index if not exists idx_snacks_event     on snack_signups(event_id);
create index if not exists idx_ann_team         on announcements(team_id);
create index if not exists idx_notif_team       on notifications(team_id);

-- ---------- ROW LEVEL SECURITY ---------------------------------------
-- Coach = logged-in auth user; may only touch rows for a team they own
-- (teams.created_by = auth.uid()). Parents are NOT logged in; all parent
-- reads/writes go through the Next.js server (service_role key, bypasses
-- RLS) which enforces invite-code + per-player token checks and never
-- leaks other families' contact details. RLS below blocks direct anon use.

alter table teams            enable row level security;
alter table team_members     enable row level security;
alter table players          enable row level security;
alter table guardians        enable row level security;
alter table events           enable row level security;
alter table attendance       enable row level security;
alter table snack_signups    enable row level security;
alter table announcements    enable row level security;
alter table message_templates enable row level security;
alter table notifications    enable row level security;

create or replace function owns_team(t uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from teams where id = t and created_by = auth.uid());
$$;

drop policy if exists teams_owner on teams;
create policy teams_owner on teams for all
  using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists members_owner on team_members;
create policy members_owner on team_members for all
  using (owns_team(team_id)) with check (owns_team(team_id));

drop policy if exists players_owner on players;
create policy players_owner on players for all
  using (owns_team(team_id)) with check (owns_team(team_id));

drop policy if exists guardians_owner on guardians;
create policy guardians_owner on guardians for all
  using (exists (select 1 from players p where p.id = player_id and owns_team(p.team_id)))
  with check (exists (select 1 from players p where p.id = player_id and owns_team(p.team_id)));

drop policy if exists events_owner on events;
create policy events_owner on events for all
  using (owns_team(team_id)) with check (owns_team(team_id));

drop policy if exists attendance_owner on attendance;
create policy attendance_owner on attendance for all
  using (exists (select 1 from events e where e.id = event_id and owns_team(e.team_id)))
  with check (exists (select 1 from events e where e.id = event_id and owns_team(e.team_id)));

drop policy if exists snacks_owner on snack_signups;
create policy snacks_owner on snack_signups for all
  using (exists (select 1 from events e where e.id = event_id and owns_team(e.team_id)))
  with check (exists (select 1 from events e where e.id = event_id and owns_team(e.team_id)));

drop policy if exists ann_owner on announcements;
create policy ann_owner on announcements for all
  using (owns_team(team_id)) with check (owns_team(team_id));

drop policy if exists tmpl_owner on message_templates;
create policy tmpl_owner on message_templates for all
  using (owns_team(team_id)) with check (owns_team(team_id));

drop policy if exists notif_owner on notifications;
create policy notif_owner on notifications for all
  using (owns_team(team_id)) with check (owns_team(team_id));


-- ---------- WEB PUSH SUBSCRIPTIONS -----------------------------------
-- One row per parent device that opted in to push. Written by the server
-- (service_role) after a parent taps "Enable notifications". The coach's
-- send routine reads these to deliver push to the whole team.
create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  player_id   uuid references players(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_push_team on push_subscriptions(team_id);

alter table push_subscriptions enable row level security;
drop policy if exists push_owner on push_subscriptions;
create policy push_owner on push_subscriptions for all
  using (owns_team(team_id)) with check (owns_team(team_id));


-- ---------- COACH TOOLS: lineup, playing-time, check-in, notes, volunteers
-- Private coach notes + position prefs live on the player row (coach-only;
-- the parent server endpoints never select these columns).
alter table players add column if not exists preferred_position text;
alter table players add column if not exists strong_foot text;       -- 'left' | 'right' | 'both'
alter table players add column if not exists coach_notes text;

-- One lineup per event (formation + free notes).
create table if not exists lineups (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  event_id    uuid not null references events(id) on delete cascade unique,
  formation   text default '2-3-1',
  notes       text,
  updated_at  timestamptz not null default now()
);

-- Per-player, per-game row. Powers the lineup (position + is_starter),
-- the game-day check-in (checked_in), and the season playing-time tracker
-- (aggregate is_starter / status across events).
create table if not exists game_roster (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  event_id    uuid not null references events(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  status      text not null default 'bench' check (status in ('starter','bench','out')),
  position    text,
  checked_in  boolean not null default false,
  sort        int default 0,
  updated_at  timestamptz not null default now(),
  unique (event_id, player_id)
);
create index if not exists idx_groster_event on game_roster(event_id);
create index if not exists idx_groster_player on game_roster(player_id);

-- Volunteer roles per event (team parent, field setup, scorekeeper, etc.).
create table if not exists volunteer_roles (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references teams(id) on delete cascade,
  event_id     uuid not null references events(id) on delete cascade,
  role         text not null,
  player_id    uuid references players(id) on delete set null,
  guardian_id  uuid references guardians(id) on delete set null,
  notes        text,
  created_at   timestamptz not null default now(),
  unique (event_id, role)
);
create index if not exists idx_vol_event on volunteer_roles(event_id);

alter table lineups         enable row level security;
alter table game_roster     enable row level security;
alter table volunteer_roles enable row level security;

drop policy if exists lineups_owner on lineups;
create policy lineups_owner on lineups for all
  using (owns_team(team_id)) with check (owns_team(team_id));
drop policy if exists groster_owner on game_roster;
create policy groster_owner on game_roster for all
  using (owns_team(team_id)) with check (owns_team(team_id));
drop policy if exists vol_owner on volunteer_roles;
create policy vol_owner on volunteer_roles for all
  using (owns_team(team_id)) with check (owns_team(team_id));


-- ---------- PARENT DELIGHT: season block-dates + carpool board --------
-- A parent blocks a date range once (e.g. vacation); the app treats the
-- player as not-attending for any event inside the range unless they set an
-- explicit response.
create table if not exists availability_blocks (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  start_date  date not null,
  end_date    date not null,
  reason      text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_block_player on availability_blocks(player_id);

-- Carpool offers / needs per event.
create table if not exists carpool_posts (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  event_id    uuid not null references events(id) on delete cascade,
  player_id   uuid references players(id) on delete set null,
  kind        text not null check (kind in ('offer','need')),
  seats       int default 1,
  note        text,
  contact     text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_carpool_event on carpool_posts(event_id);

alter table availability_blocks enable row level security;
alter table carpool_posts       enable row level security;
drop policy if exists blocks_owner on availability_blocks;
create policy blocks_owner on availability_blocks for all
  using (owns_team(team_id)) with check (owns_team(team_id));
drop policy if exists carpool_owner on carpool_posts;
create policy carpool_owner on carpool_posts for all
  using (owns_team(team_id)) with check (owns_team(team_id));

-- Done. Next: run supabase/seed.sql AFTER signing up your coach account.
