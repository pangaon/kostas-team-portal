-- v4: multi-coach access — invite assistants by email
alter table team_members add column if not exists email text;
create index if not exists idx_members_email on team_members(email);
