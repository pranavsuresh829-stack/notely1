-- Notely — initial schema
-- Single-tenant deployment (each deployer runs their own Supabase project),
-- so no row-level multi-user auth is modeled here. RLS is enabled with no
-- policies below, and the app talks to Supabase using the service role key
-- from the server only, which needs explicit CRUD grants — see both sections
-- further down for why.

create extension if not exists "pgcrypto";

create table if not exists lectures (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  audio_path text,
  transcript text,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'transcribing', 'transcribed', 'generating', 'ready', 'error')),
  error_message text,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references lectures(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists flashcards (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  question text not null,
  choices jsonb not null,
  correct_answer text not null,
  created_at timestamptz not null default now()
);

create index if not exists notes_lecture_id_idx on notes(lecture_id);
create index if not exists flashcards_note_id_idx on flashcards(note_id);
create index if not exists quiz_questions_note_id_idx on quiz_questions(note_id);

-- On some newly-created Supabase projects, service_role isn't automatically
-- granted SELECT/INSERT/UPDATE/DELETE on new tables (only TRIGGER/REFERENCES/
-- TRUNCATE come for free) — without this, every query from the app's server
-- fails with "permission denied for table ...". This is independent of RLS,
-- which is checked only after these grant-level checks pass. The `alter
-- default privileges` line covers tables created by future migrations too.
grant select, insert, update, delete on lectures, notes, flashcards, quiz_questions to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;

-- The app only ever queries these tables server-side with the service role
-- key, which bypasses RLS entirely — so this doesn't break anything it does.
-- What it does do: block the publishable/anon key from reading or writing
-- this data at all (no policies = no access), which matters because that
-- key is meant to be safe to expose client-side. Without RLS, Supabase's
-- auto-generated REST API would let anyone holding that key read every
-- transcript directly, whether the app's own UI uses that key or not.
alter table lectures enable row level security;
alter table notes enable row level security;
alter table flashcards enable row level security;
alter table quiz_questions enable row level security;

-- Storage bucket for uploaded/recorded lecture audio. Private by default —
-- the app reads/writes it server-side with the service role key and hands
-- the browser short-lived signed URLs when audio playback is needed.
insert into storage.buckets (id, name, public)
values ('lecture-audio', 'lecture-audio', false)
on conflict (id) do nothing;
