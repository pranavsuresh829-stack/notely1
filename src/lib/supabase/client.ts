import { createBrowserClient } from "@supabase/ssr";

// Browser client for auth (magic-link sign-in/out on the login page). Uses
// @supabase/ssr's cookie-backed client rather than plain @supabase/supabase-js
// — the PKCE code verifier it generates has to live in a cookie, not
// localStorage, so the server-side /auth/callback route handler (a totally
// separate request, no access to localStorage) can read it back to finish
// exchangeCodeForSession(). All actual data reads/writes still go through
// API routes with the service role key; this client only ever handles auth.
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
