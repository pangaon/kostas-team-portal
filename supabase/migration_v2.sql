-- v2: match results + goals, availability polls, parent->coach inbox
create table if not exists match_results (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade unique,
  our_score int not null default 0,
  opp_score int not null default 0,
  notes text,
  updated_at timestamptz not null default now()
);
create table if not exists goal_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  player_id uuid references players(id) on delete set null,
  assist_player_id uuid references players(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  title text not null,
  status text not null default 'open' check (status in ('open','closed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null,
  location text,
  sort int default 0,
  created_at timestamptz not null default now()
);
create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  response text not null check (response in ('yes','no','maybe')),
  updated_at timestamptz not null default now(),
  unique(option_id, player_id)
);
create table if not exists coach_inbox (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  player_id uuid references players(id) on delete set null,
  from_name text,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_mr_team on match_results(team_id);
create index if not exists idx_ge_team on goal_events(team_id);
create index if not exists idx_polls_team on polls(team_id);
create index if not exists idx_popt_poll on poll_options(poll_id);
create index if not exists idx_pvote_poll on poll_votes(poll_id);
create index if not exists idx_inbox_team on coach_inbox(team_id);

alter table match_results enable row level security;
alter table goal_events enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
alter table coach_inbox enable row level security;
drop policy if exists mr_owner on match_results;
create policy mr_owner on match_results for all using (owns_team(team_id)) with check (owns_team(team_id));
drop policy if exists ge_owner on goal_events;
create policy ge_owner on goal_events for all using (owns_team(team_id)) with check (owns_team(team_id));
drop policy if exists polls_owner on polls;
create policy polls_owner on polls for all using (owns_team(team_id)) with check (owns_team(team_id));
drop policy if exists popt_owner on poll_options;
create policy popt_owner on poll_options for all using (owns_team(team_id)) with check (owns_team(team_id));
drop policy if exists pvote_owner on poll_votes;
create policy pvote_owner on poll_votes for all using (owns_team(team_id)) with check (owns_team(team_id));
drop policy if exists inbox_owner on coach_inbox;
create policy inbox_owner on coach_inbox for all using (owns_team(team_id)) with check (owns_team(team_id));

alter table players add column if not exists claimed boolean not null default false;

-- remove the seeded placeholder practice (not really scheduled yet)
delete from events e using teams t
  where e.team_id = t.id
    and t.created_by = (select id from auth.users order by created_at desc limit 1)
    and e.type = 'practice';
