-- Sprint 1 hardening: move live game state to a real table with optimistic
-- concurrency + Realtime (replaces storage-JSON last-write-wins).

create table if not exists game_state (
  event_id   uuid primary key references events(id) on delete cascade,
  team_id    uuid not null references teams(id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  version    bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table game_state enable row level security;

drop policy if exists game_state_owner on game_state;
create policy game_state_owner on game_state
  for all using (owns_team(team_id)) with check (owns_team(team_id));

-- Realtime: push row changes to subscribed coach devices.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_state'
  ) then
    execute 'alter publication supabase_realtime add table game_state';
  end if;
end $$;
