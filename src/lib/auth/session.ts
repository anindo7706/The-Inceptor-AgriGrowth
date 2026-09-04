import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import type { Role } from "./roles";

export interface CurrentUser {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  roles: Role[];
}

/**
 * The signed-in user, or null.
 *
 * Two things here are load-bearing (CLAUDE.md §2):
 *
 * 1. `getUser()`, never `getSession()`. getSession reads the cookie and
 *    trusts it. getUser revalidates against Supabase. Authorizing on
 *    getSession means anyone who can forge a cookie is whoever they like.
 *
 * 2. Roles come from `public.UserRole`, never from `user_metadata`.
 *    user_metadata is writable by the authenticated user, so reading a role
 *    from it lets a worker make themselves an admin with one API call.
 *
 * Wrapped in React's `cache` so one request that checks the session in a
 * layout, a page and a server action makes one round trip, not three.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      roles: { select: { role: true } },
    },
  });

  // Authenticated with Supabase but no profile row yet — they abandoned
  // signup partway. Not an error; the caller routes them to finish.
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    phone: profile.phone,
    fullName: profile.fullName,
    roles: profile.roles.map((r) => r.role as Role),
  };
});

/** True when the user exists in Supabase auth but has no profile row yet. */
export async function needsProfile(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const count = await prisma.user.count({ where: { id: user.id } });
  return count === 0;
}

/** The signed-in user, or a 401. For routes that require any account. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw ApiError.unauthenticated();
  return user;
}

/**
 * The signed-in user, asserted to hold at least one of `allowed`.
 *
 * Phrased as "does this user hold role X" rather than "is this user's role
 * X", so it works whether R-18 lands as a join table or a single column.
 * It is a join table — see prisma/schema.prisma.
 *
 * Answers 403. Callers that would leak the existence of a record by saying
 * "forbidden" should catch and rethrow `ApiError.notFound()` instead.
 */
export async function requireRole(
  ...allowed: readonly Role[]
): Promise<CurrentUser> {
  const user = await requireUser();
  const holds = allowed.some((role) => user.roles.includes(role));

  if (!holds) {
    throw ApiError.forbidden(
      `This action requires ${allowed.join(" or ")}.`,
    );
  }

  return user;
}

/** Non-throwing check, for conditionally rendering UI. */
export function hasRole(user: CurrentUser | null, ...roles: readonly Role[]) {
  return user !== null && roles.some((role) => user.roles.includes(role));
}
