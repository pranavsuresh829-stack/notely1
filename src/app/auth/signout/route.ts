import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/session";

// Plain form POST target so signing out needs no client-side JS — see the
// <form action="/auth/signout"> in the header.
export async function POST(request: NextRequest) {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
