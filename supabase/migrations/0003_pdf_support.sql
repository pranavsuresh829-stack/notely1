-- Adds PDF as a second lecture input type alongside audio recordings/uploads.
-- `transcript` already holds whatever text feeds note generation regardless
-- of source — for audio that's the Whisper transcript, for PDFs it's the
-- extracted document text — so it's untouched here.
alter table lectures rename column audio_path to source_path;
alter table lectures add column if not exists source_type text not null default 'audio'
  check (source_type in ('audio', 'pdf'));
