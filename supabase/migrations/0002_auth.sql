-- Adds real per-user accounts (Supabase Auth, magic-link sign-in). Each
-- lecture now belongs to whoever created it.
--
-- Left nullable rather than `not null`: a `not null` constraint would fail
-- this migration on any project that already has lectures from before auth
-- existed. The app always sets user_id on insert going forward; rows
-- without one (pre-auth test data) just become invisible to every user,
-- which is the safe failure mode here.
--
-- No new RLS policies needed: these tables already have RLS enabled with
-- zero policies (see 0001_init.sql), so anon/authenticated still can't
-- touch them directly. The app's API routes use the service role key
-- (bypasses RLS) and enforce the user_id boundary themselves in code —
-- see src/lib/supabase/session.ts.
alter table lectures add column if not exists user_id uuid references auth.users(id) on delete cascade;
create index if not exists lectures_user_id_idx on lectures(user_id);
