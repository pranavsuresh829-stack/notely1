import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key. Never import this from a
// client component — it bypasses RLS entirely, which is fine here because
// each deployer runs a single-tenant instance against their own project.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check your .env file."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// Holds both recorded/uploaded audio and uploaded PDFs. Keeping the original
// bucket id ("lecture-audio") avoids a storage migration — it's just a name.
export const SOURCE_BUCKET = "lecture-audio";
