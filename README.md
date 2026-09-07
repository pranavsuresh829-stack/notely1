# Notely

A friendly, free, open-source Turbo AI alternative. Record or upload a lecture. Get back structured notes, flashcards, and a quiz. No subscription — you run it on your own free-tier accounts with your own API keys.

<!-- Add a demo GIF or short screen recording here before sharing the repo. -->

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/notely&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,TRANSCRIPTION_PROVIDER,LLM_PROVIDER,GROQ_API_KEY&envDescription=API%20keys%20needed%20to%20run%20Notely&envLink=https://github.com/YOUR_USERNAME/notely%23environment-variables&project-name=notely&repository-name=notely)

> Replace `YOUR_USERNAME` above with your GitHub username once you've pushed this repo — the button links back to this README for env var instructions.

## What it does

1. Sign in with just your email (magic link — no password to set or remember)
2. Record a lecture with your browser mic, or upload an audio file
3. Transcribe the audio
4. Turn the transcript into structured notes (headings, bullets, key terms)
5. Generate a flashcard set and a short quiz from those notes
6. Save, browse, and delete past lectures — private to your account

## What it doesn't do (yet)

- PDF or YouTube link input (audio only for now)
- Chat/Q&A over your notes
- Folders, tags, or export to PDF/Anki
- Podcast-style summaries, gamification, multi-device sync, or sharing

See the [PRD](.) this was built from for the full roadmap.

## Setup

### 1. Get your keys

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Create a free project at [supabase.com](https://supabase.com/dashboard) → Project Settings → API |
| `GROQ_API_KEY` (default provider for both transcription and generation) | [console.groq.com/keys](https://console.groq.com/keys) — has a free tier |
| `ANTHROPIC_API_KEY` (only if `LLM_PROVIDER=anthropic`) | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) — no free tier, prepaid credits required |
| `OPENAI_API_KEY` (only if `TRANSCRIPTION_PROVIDER=openai`) | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) — no free tier, billing required |
| `ASSEMBLYAI_API_KEY` (only if `TRANSCRIPTION_PROVIDER=assemblyai`) | [assemblyai.com/app/account](https://www.assemblyai.com/app/account) — free trial credit to start |
| None — `LLM_PROVIDER=ollama` | Install [Ollama](https://ollama.com) locally instead. No key, genuinely $0. See "Running note generation fully local" below. |

The defaults (`TRANSCRIPTION_PROVIDER=groq`, `LLM_PROVIDER=groq`) only need the one `GROQ_API_KEY` — it's both the cheapest option and the one with a free tier, so it's the easiest way to get started without paying anything upfront. Swap to OpenAI/AssemblyAI/Anthropic/Ollama in `.env.local` if you'd rather use those.

### 2. Set up the database

In your Supabase project's SQL Editor, run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and then [`supabase/migrations/0002_auth.sql`](supabase/migrations/0002_auth.sql), in that order. Together they create the `lectures`, `notes`, `flashcards`, and `quiz_questions` tables, a private `lecture-audio` storage bucket, and the `user_id` column that ties lectures to whoever's signed in.

Sign-in itself needs no extra Supabase setup — email auth (magic link) is on by default on a new project, using Supabase's own built-in mail sender. That sender is rate-limited and occasionally lands in spam, which is fine for personal use; if you outgrow it, Supabase Auth settings let you plug in your own SMTP provider.

### 3. Run locally

```bash
git clone https://github.com/YOUR_USERNAME/notely.git
cd notely
cp .env.example .env.local
# fill in .env.local with your keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Or deploy straight to Vercel

Click the **Deploy with Vercel** button above. It forks this repo into your GitHub account, prompts you for the env vars from the table above, and spins up your own live instance. Vercel never touches anyone else's data or usage — every deploy is a fully separate instance on the deployer's own accounts.

## Running note generation fully local (free)

Set `LLM_PROVIDER=ollama` in `.env.local` and no key is needed for the notes/flashcards/quiz step:

1. Install [Ollama](https://ollama.com) (Mac/Windows/Linux)
2. Pull a model that supports tool calling: `ollama pull llama3.1`
3. Make sure Ollama is running (it starts automatically after install, or run `ollama serve`)
4. `npm run dev`

This only works when running the app locally — Ollama runs on your own machine, and a Vercel deployment has no way to reach it. Transcription still goes through Groq/OpenAI/AssemblyAI either way, since none of those have a practical fully-local equivalent this app ships with.

## Notes on mobile / PWA

This ships as an installable PWA (manifest + service worker in `public/`) so it can be added to your phone's home screen for recording in class. iOS Safari has real quirks with mic recording in PWAs — no background recording, and permissions reset more aggressively than on desktop — so test on an actual iPhone before relying on it. The mascot and icons in `public/icon-*.png` and `public/apple-touch-icon.png` are generated by `scripts/generate-icons.mjs` from the artwork in `src/lib/mascot.ts` — edit that file and re-run the script if you want to reskin the character.

## Tech stack

- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Transcription**: Groq (Whisper, default), OpenAI Whisper, or AssemblyAI — your choice, your key
- **Notes/flashcards/quiz**: Groq (Llama, default), Anthropic Claude, or a local Ollama model — all via tool/function calling for structured output
- **Database + storage**: Supabase (Postgres + private file storage)
- **Hosting**: Vercel

## Cost reality check

Measured per 60-minute lecture, full pipeline (transcript → notes → flashcards → quiz):

| Setup | Transcription | Generation | Total |
| --- | --- | --- | --- |
| Groq (default) | ~$0.01 | ~$0.01 | **~$0.02** |
| OpenAI + Anthropic | ~$0.36 | ~$0.03 | ~$0.39 |

So with the default Groq setup, even a full course load (~15 hours of lectures/month) runs well under a dollar — and Groq's free tier may cover casual use entirely. Switching to OpenAI/Anthropic still lands around $2-10/month for typical use, well under a subscription. You're billed directly by whichever providers you choose, on your own accounts; this repo has no billing or usage tracking of its own, and prices are set by the providers, not guaranteed by this app.

## Known limits (v1)

- Sign-in is magic-link only — no password option, no OAuth providers (Google, etc.) wired up yet
- Long recordings (60+ min) can take a few minutes to transcribe and generate notes for; the processing pipeline runs as three sequential steps (upload → transcribe → generate) with progress shown in the UI, and a "Retry" button if a step fails partway
- Vercel's default function timeout may need raising (`maxDuration` is already set to 300s in the API routes) if you're on a plan with a lower cap
