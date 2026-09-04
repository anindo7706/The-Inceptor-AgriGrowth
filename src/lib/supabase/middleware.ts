import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Route groups that require a session. Everything else is public. */
const PROTECTED_PREFIXES = [
  "/buyer",
  "/landowner",
  "/worker",
  "/inspector",
  "/admin",
  "/complete-profile",
] as const;

/** Auth pages a signed-in user should not sit on. */
const AUTH_PAGES = ["/login", "/get-started", "/register"] as const;

export async function updateSession(request: NextRequest) {
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
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  /*
    Do not put code between createServerClient and getUser(). getUser()
    revalidates the token and refreshes the cookie; anything that returns
    early in between ships a stale session and produces logouts that are
    very hard to reproduce.
  */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => path.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Come back here after signing in — but only to an internal path, so a
    // crafted ?next=https://evil.example cannot turn login into an open
    // redirect.
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    // Which dashboard depends on roles, which live in Postgres — and the
    // middleware runs on the edge without Prisma. /home resolves it.
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
