-- v3: planned substitutions ("on deck")
create table if not exists sub_plans (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  player_in uuid not null references players(id) on delete cascade,
  player_out uuid not null references players(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','done')),
  created_at timestamptz not null default now()
);
create index if not exists idx_subplans_event on sub_plans(event_id);
alter table sub_plans enable row level security;
drop policy if exists subplans_owner on sub_plans;
create policy subplans_owner on sub_plans for all using (owns_team(team_id)) with check (owns_team(team_id));
