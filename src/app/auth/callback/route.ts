import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/session";

// Where the magic-link email sends people back to. Exchanges the one-time
// code for a real session, stored in cookies by the Supabase SSR client.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createServerAuthClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
