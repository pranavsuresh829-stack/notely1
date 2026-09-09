import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Redirects signed-out visitors to /login and signed-in visitors away from
// /login, and refreshes the Supabase session cookie on every navigation so
// it doesn't silently expire mid-session. This is the first line of
// defense for page routes — API routes independently check auth again
// (see src/lib/supabase/session.ts), since a proxy matcher mistake
// shouldn't be the only thing standing between a request and someone
// else's lectures.
const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/signout"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // A redirect must carry forward whatever fresh session cookies getUser()
  // just wrote onto `response` above — Supabase rotates the refresh token on
  // every use, and a redirect response that drops that rotation leaves the
  // browser holding an already-consumed refresh token. That fails on the
  // very next request, which redirects again, forever: an infinite
  // "/" <-> "/login" loop, not just an occasional stale session.
  function redirectTo(path: string) {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (!user && !isPublicPath) {
    return redirectTo("/login");
  }
  if (user && pathname === "/login") {
    return redirectTo("/");
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and PWA files — API routes are
    // intentionally included so their session cookie also stays fresh,
    // even though they re-check auth themselves rather than relying on this.
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-|apple-touch-icon).*)",
  ],
};
