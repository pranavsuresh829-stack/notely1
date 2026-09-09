import { createBrowserClient } from "@supabase/ssr";

// Browser client for auth (sign-in/sign-up/sign-out on the login page). Uses
// @supabase/ssr's cookie-backed client rather than plain @supabase/supabase-js
// — the session has to live in a cookie, not localStorage, so server-side
// code (proxy.ts, session.ts) on a totally separate request can read it
// back. All actual data reads/writes still go through API routes with the
// service role key; this client only ever handles auth.
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
