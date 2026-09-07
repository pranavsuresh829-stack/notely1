import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

// Server-side Supabase client bound to the request's auth cookies — usable
// in Server Components and Route Handlers. Uses the publishable (anon) key,
// not the service role key, since this client's job is just to read who's
// signed in via their session cookie.
export async function createServerAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies — fine,
            // proxy.ts refreshes the session on every navigation anyway.
          }
        },
      },
    }
  );
}

// The single place every Server Component/Route Handler asks "who is this?"
// Returns null for signed-out visitors — callers decide whether that means
// a redirect (pages) or a 401 (API routes). Every data query still filters
// by this id explicitly; this function only tells you who to filter by.
export async function getAuthUser(): Promise<User | null> {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
