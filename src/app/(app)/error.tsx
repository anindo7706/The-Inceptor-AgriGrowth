"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/**
 * Error boundary for signed-in screens.
 *
 * requireRole() throws when a user reaches a route they do not hold the role
 * for. Without this the throw reaches Next's default handler, which is a 500
 * page — the wrong status, the wrong tone, and in development a stack trace.
 *
 * Next strips the message in production builds, so this reads the digest
 * rather than the text. It deliberately does not name which role is missing:
 * telling someone "this needs ADMIN" is a small map of the platform's
 * privilege structure.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isAccess = /requires|forbidden|access/i.test(error.message);

  return (
    <div className="animate-fade-rise mx-auto max-w-[440px] py-16 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-field)] bg-warning-tint text-warning">
        <ShieldAlert className="h-6 w-6" strokeWidth={1.6} />
      </span>

      <h1 className="mt-5 font-display text-subheading font-semibold text-cream">
        {isAccess ? "You don't have access to this" : "Something went wrong"}
      </h1>

      <p className="mt-3 text-body-sm text-mist">
        {isAccess
          ? "Your account doesn't include this area. If you think that's wrong, an administrator can grant it."
          : "That didn't work. Try again, and if it keeps happening let us know."}
      </p>

      <div className="mt-8 flex items-center justify-center gap-3">
        <Link
          href="/home"
          className="rounded-[var(--radius-buttons)] bg-lime px-5 py-3 text-body-sm font-semibold text-night transition-colors duration-[--duration-fast] hover:bg-lime-bright"
        >
          Back to your dashboard
        </Link>
        {!isAccess && (
          <button
            type="button"
            onClick={reset}
            className="rounded-[var(--radius-buttons)] border border-border px-5 py-3 text-body-sm text-cream transition-colors duration-[--duration-fast] hover:border-border-hi"
          >
            Try again
          </button>
        )}
      </div>

      {error.digest && (
        <p className="mt-6 text-caption text-mist-dim">
          Reference: <span data-numeric>{error.digest}</span>
        </p>
      )}
    </div>
  );
}
