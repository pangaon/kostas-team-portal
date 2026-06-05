-- v5: tactical board — player strength + multiple saved lineup plans
alter table players add column if not exists strength int;

create table if not exists lineup_plans (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  name text not null default 'Lineup',
  formation text not null default '3-3-1',
  slots jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists idx_lineupplans_event on lineup_plans(event_id);
create index if not exists idx_lineupplans_team on lineup_plans(team_id);
alter table lineup_plans enable row level security;
drop policy if exists lineupplans_owner on lineup_plans;
create policy lineupplans_owner on lineup_plans for all using (owns_team(team_id)) with check (owns_team(team_id));
