import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth and magic-link callback.
 *
 * Supabase redirects here with a code; we exchange it for a cookie session.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  // Only ever redirect within this origin. A crafted ?next=https://evil.test
  // would otherwise turn the callback into an open redirect that carries a
  // freshly-minted session.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/home";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
