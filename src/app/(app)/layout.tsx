import Link from "next/link";
import { redirect } from "next/navigation";
import { LeafMark, Wordmark } from "@/components/brand/logo";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";

/**
 * Shell for every signed-in screen.
 *
 * The middleware has already bounced anonymous requests, but this checks
 * again: middleware is routing, not authorization, and a route group that
 * trusts it alone breaks the moment the matcher changes (CLAUDE.md §4.2).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh bg-night">
      <header className="border-b border-border bg-night-raised">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <Link href="/home" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-field)] bg-lime text-night">
              <LeafMark className="h-4 w-4" />
            </span>
            <Wordmark className="text-[17px] leading-none" />
          </Link>

          <div className="flex items-center gap-3">
            {/*
              Role switcher (R-18). Only rendered when a user actually holds
              more than one role — the smallholder who owns land and also
              works a neighbour's field.
            */}
            {user.roles.length > 1 && (
              <nav aria-label="Switch role" className="flex items-center gap-1">
                {user.roles.map((role) => (
                  <Link
                    key={role}
                    href={ROLE_HOME[role]}
                    className="rounded-[var(--radius-buttons)] px-3 py-1.5 text-caption font-medium uppercase tracking-wide text-mist transition-colors duration-[--duration-fast] hover:bg-night-card hover:text-cream"
                  >
                    {role.toLowerCase()}
                  </Link>
                ))}
              </nav>
            )}

            <span className="hidden text-body-sm text-mist sm:block">
              {user.fullName}
            </span>

            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-[var(--radius-buttons)] border border-border px-4 py-2 text-body-sm text-cream transition-colors duration-[--duration-fast] hover:border-border-hi"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 py-8 lg:px-8">{children}</main>
    </div>
  );
}
