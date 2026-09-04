"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Google's mark, inlined — our CSP posture blocks a CDN <img>. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.56-5.15 3.56-8.64Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

/**
 * Google sign-in.
 *
 * Shown on the buyer and landowner paths only (DESIGN.md §5.1): it earns its
 * keep for companies on Google Workspace, and is close to useless for a
 * worker on a low-end phone who has no Google account and would meet an
 * OAuth consent screen as a detour rather than a shortcut.
 *
 * Requires a Google OAuth client configured in the Supabase dashboard. Until
 * that is done the provider returns an error, which is surfaced rather than
 * swallowed.
 */
export function GoogleButton({ next }: { next?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    setPending(true);

    const supabase = createClient();
    const callback = new URL("/api/auth/callback", window.location.origin);
    if (next) callback.searchParams.set("next", next);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });

    if (oauthError) {
      setError(
        oauthError.message.toLowerCase().includes("provider")
          ? "Google sign-in isn't set up on this project yet."
          : "Couldn't start Google sign-in. Please try again.",
      );
      setPending(false);
    }
    // On success the browser leaves for Google, so there is nothing to reset.
  }

  return (
    <div>
      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-[var(--radius-field)] border border-border bg-night-card text-body-sm font-medium text-cream transition-colors duration-[--duration-fast] hover:border-border-hi hover:bg-night-raised disabled:opacity-70"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" data-progress aria-hidden="true" />
        ) : (
          <GoogleMark />
        )}
        Continue with Google
      </button>
      {error && (
        <p role="alert" className="mt-2 text-caption text-risk">
          {error}
        </p>
      )}
    </div>
  );
}
