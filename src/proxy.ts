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

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
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
