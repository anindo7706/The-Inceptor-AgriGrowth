import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase client for Server Components, Route Handlers and Server Actions.
 *
 * Must be created per request — it closes over that request's cookies, so a
 * module-level singleton would leak one user's session into another's
 * request.
 */
export async function createClient() {
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
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. Safe to ignore: the
            // middleware refreshes the session on every request, so the
            // cookie is already current by the time we get here.
          }
        },
      },
    },
  );
}

/**
 * The service-role client. Bypasses Row Level Security entirely.
 *
 * Server-only, and only for operations that legitimately act outside a user's
 * own authority — creating auth users, admin role grants. Never reachable
 * from a Client Component, and never used to sidestep an authorization check
 * that should have been written properly.
 */
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. This client cannot be created.",
    );
  }

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
