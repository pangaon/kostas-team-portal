-- =====================================================================
--  KOSTAS TEAM PORTAL — SEED DATA (real roster from coach's organizer)
--  RUN *AFTER* schema.sql AND after you sign up your coach account at
--  /login. Attaches the team to the most-recently-created auth user.
--  Safe to re-run: skips if invite code 'kostas-meat-2026' already exists.
--  Want a clean/empty start instead? Just don't run this file.
-- =====================================================================
do $$
declare coach_id uuid; t_id uuid; p_id uuid;
begin
  select id into coach_id from auth.users order by created_at desc limit 1;
  if coach_id is null then
    raise exception 'No auth user found. Sign up your coach account first, then re-run.';
  end if;
  if exists (select 1 from teams where invite_code = 'kostas-meat-2026') then
    raise notice 'Seed skipped: team already exists.'; return;
  end if;

  insert into teams (name, sport, season, age_group, invite_code, created_by)
  values ('Kostas Meat', 'Soccer', '2026', 'U9/U10', 'kostas-meat-2026', coach_id)
  returning id into t_id;

  insert into team_members (team_id, user_id, role, status)
  values (t_id, coach_id, 'coach', 'active');


  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Adoni', 'Hatzis', '16', 'Confirmed handwritten', 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Adoni', '416-831-0242', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Katerina', 'Matziouras', '11', null, 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Katerina', '416-904-8152', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Zoe', 'Sevastos', '7', null, 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Zoe', '416-712-1053', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'William', 'Bradley', '10', null, 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of William', '416-704-3028', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Mateo', 'Daniel', null, 'Jersey # to confirm', 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Mateo', '416-788-1437', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Ezra', 'Herrera', '6', null, 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Ezra', '647-551-7137', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Joey', 'Khammo', '2', null, 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Joey', '416-871-4795', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Benjamin', 'Thomas', '9', 'Number note unclear in image', 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Benjamin', '647-283-9093', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Brayden', 'Pillai', '5', null, 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Brayden', '647-588-8607', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Benjamin', 'Jeyanithe', '12', 'Name appears spelled BENAJMIN on roster', 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Benjamin', '416-605-4404', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Olivia', 'Lee', '13', null, 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Olivia', '647-296-4319', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Panagiotis', 'Kavouras', '8', null, 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Panagiotis', '647-983-3731', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Caleb', 'Cheng', '3', null, 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Caleb', '647-545-3976', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Thanos', 'Bliankas', null, 'Jersey # to confirm', 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Thanos', '647-271-5662', 'Parent/Guardian', true);

  insert into players (team_id, first_name, last_name, jersey_number, medical_notes, status)
  values (t_id, 'Maverick', 'Fraser', '4', 'Handwritten add-on', 'approved') returning id into p_id;
  insert into guardians (player_id, team_id, name, phone, relationship, is_primary)
  values (p_id, t_id, 'Parent of Maverick', '416-414-7684', 'Parent/Guardian', true);

  insert into events (team_id, type, title, opponent, location, start_time, end_time, arrival_time, notes)
  values (t_id, 'game', 'Game 1 vs Loukoumaki', 'Loukoumaki', 'Home field', '2026-06-04 18:00:00-04', '2026-06-04 19:00:00-04', '2026-06-04 18:00:00-04', null);

  insert into events (team_id, type, title, opponent, location, start_time, end_time, arrival_time, notes)
  values (t_id, 'game', 'Game 2 vs Kefalos', 'Kefalos', 'Kefalos field (Away)', '2026-06-11 19:15:00-04', '2026-06-11 20:15:00-04', '2026-06-11 19:15:00-04', null);

  insert into events (team_id, type, title, opponent, location, start_time, end_time, arrival_time, notes)
  values (t_id, 'game', 'Game 3 vs Metro Golf', 'Metro Golf', 'Home field', '2026-06-18 18:00:00-04', '2026-06-18 19:00:00-04', '2026-06-18 18:00:00-04', 'Picture Day — arrive early in full uniform');

  insert into events (team_id, type, title, opponent, location, start_time, end_time, arrival_time, notes)
  values (t_id, 'game', 'Game 4 vs Loukoumaki', 'Loukoumaki', 'Home field', '2026-06-25 19:15:00-04', '2026-06-25 20:15:00-04', '2026-06-25 19:15:00-04', null);

  insert into events (team_id, type, title, opponent, location, start_time, end_time, arrival_time, notes)
  values (t_id, 'game', 'Game 5 vs Kefalos', 'Kefalos', 'Kefalos field (Away)', '2026-07-02 18:00:00-04', '2026-07-02 19:00:00-04', '2026-07-02 18:00:00-04', null);

  insert into events (team_id, type, title, opponent, location, start_time, end_time, arrival_time, notes)
  values (t_id, 'game', 'Game 6 vs Metro Golf', 'Metro Golf', 'Metro Golf field (Away)', '2026-07-09 19:15:00-04', '2026-07-09 20:15:00-04', '2026-07-09 19:15:00-04', null);

  insert into events (team_id, type, title, opponent, location, start_time, end_time, arrival_time, notes)
  values (t_id, 'game', 'Game 7 vs Loukoumaki', 'Loukoumaki', 'Home field', '2026-07-16 18:00:00-04', '2026-07-16 19:00:00-04', '2026-07-16 18:00:00-04', null);

  insert into events (team_id, type, title, opponent, location, start_time, end_time, arrival_time, notes)
  values (t_id, 'game', 'Game 8 vs Kefalos', 'Kefalos', 'Kefalos field (Away)', '2026-07-23 19:15:00-04', '2026-07-23 20:15:00-04', '2026-07-23 19:15:00-04', null);

  insert into events (team_id, type, title, opponent, location, start_time, end_time, arrival_time, notes)
  values (t_id, 'game', 'Game 9 vs Metro Golf', 'Metro Golf', 'Metro Golf field (Away)', '2026-07-30 18:00:00-04', '2026-07-30 19:00:00-04', '2026-07-30 18:00:00-04', null);

  insert into events (team_id, type, title, opponent, location, start_time, end_time, arrival_time, notes)
  values (t_id, 'game', 'Game 10 vs Loukoumaki', 'Loukoumaki', 'Home field', '2026-08-06 19:00:00-04', '2026-08-06 20:00:00-04', '2026-08-06 19:00:00-04', null);

  insert into events (team_id, type, title, opponent, location, start_time, end_time, arrival_time, notes)
  values (t_id, 'game', 'Game 11 vs Kefalos', 'Kefalos', 'Home field', '2026-08-13 17:45:00-04', '2026-08-13 18:45:00-04', '2026-08-13 17:45:00-04', null);

  insert into events (team_id, type, title, opponent, location, start_time, end_time, arrival_time, notes)
  values (t_id, 'game', 'Game 12 vs Metro Golf', 'Metro Golf', 'Metro Golf field (Away)', '2026-08-20 19:00:00-04', '2026-08-20 20:00:00-04', '2026-08-20 19:00:00-04', null);

  insert into events (team_id, type, title, opponent, location, start_time, end_time, arrival_time, notes)
  values (t_id, 'game', 'Game 13 vs Loukoumaki', 'Loukoumaki', 'Home field', '2026-08-27 17:45:00-04', '2026-08-27 18:45:00-04', '2026-08-27 17:45:00-04', null);

  insert into events (team_id, type, title, location, start_time, end_time, notes)
  values (t_id, 'practice', 'Team Practice', 'Home field', '2026-06-09 18:00:00-04', '2026-06-09 19:00:00-04', 'Bring water + shin guards.');
  insert into events (team_id, type, title, location, start_time, end_time, notes)
  values (t_id, 'event', 'Uniform Pickup', 'Clubhouse', '2026-06-02 17:00:00-04', '2026-06-02 19:00:00-04', 'Pick up jerseys before Game 1.');
  insert into events (team_id, type, title, location, start_time, end_time, notes)
  values (t_id, 'event', 'Picture Day', 'Home field', '2026-06-18 17:30:00-04', '2026-06-18 18:00:00-04', 'Before Game 3. Full uniform.');


  insert into message_templates (team_id, type, title, body) values (t_id, 'welcome', 'Welcome / Group Setup', 'Hi everyone, welcome to the Kostas Meat U9/U10 soccer team for the 2026 season. Please register here: [INVITE LINK]. In WhatsApp, set your name as: Parent - Player - #Jersey (e.g. George - Adoni - #16).');

  insert into message_templates (team_id, type, title, body) values (t_id, 'registration', 'Registration Reminder', 'Reminder: please complete the team registration form here: [INVITE LINK]. This helps me organize roster, contacts, allergies, attendance and snacks.');

  insert into message_templates (team_id, type, title, body) values (t_id, 'snack', 'Snack Signup', 'Snack signup is now open. Please choose one available date: [SNACK LINK]. Keep allergies in mind and please avoid nuts.');

  insert into message_templates (team_id, type, title, body) values (t_id, 'game', 'Game Reminder', 'Game reminder — Date: [DATE]  Time: [TIME]  Arrival: [ARRIVAL]  Location: [LOCATION]  Opponent: [OPPONENT]. Mark attendance: [EVENT LINK].');

  insert into message_templates (team_id, type, title, body) values (t_id, 'rainout', 'Rainout / Cancellation', 'Today''s event is cancelled/postponed due to weather/field conditions. I''ll update everyone once we have a new time or date.');

  insert into message_templates (team_id, type, title, body) values (t_id, 'attendance', 'Attendance Reminder', 'Please mark whether your player is attending the next game/practice: [EVENT LINK]. This helps with lines, subs and snacks.');

  insert into announcements (team_id, title, body, created_by)
  values (t_id, 'Welcome to Kostas Meat', 'Hi everyone, welcome to the Kostas Meat U9/U10 soccer team for the 2026 season! 

I''m Coach George. We''ll use this portal for the schedule, attendance, snack signups, and announcements — so important info doesn''t get buried in chat.

Please open your invite link, add your child (name, jersey #, allergies, your contact), and mark any dates your child will miss. Thanks!', coach_id);
  insert into notifications (team_id, kind, title, body)
  values (t_id, 'announcement', 'Welcome to Kostas Meat', 'The team portal is live — add your player and check the schedule.');

  raise notice 'Seed complete: Kostas Meat, % players, % games + 3 events.', 15, 13;
end $$;
