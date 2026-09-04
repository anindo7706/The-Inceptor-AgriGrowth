"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2, User } from "lucide-react";
import { LeafMark } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "./google-button";

const FIELD =
  "h-14 w-full rounded-[var(--radius-field)] border border-border bg-night-card pl-11 pr-4 text-body text-cream " +
  "transition-colors duration-[--duration-fast] focus:border-lime focus:outline-none";

/**
 * Supabase returns deliberately vague errors for bad credentials so an
 * attacker cannot tell "no such account" from "wrong password". We keep that
 * property and only rewrite the wording to be human.
 */
function readableError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "That email and password don't match an account.";
  }
  if (m.includes("email not confirmed")) {
    return "Check your inbox and confirm your email address first.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return "We couldn't sign you in. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = params.get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const identifier = String(form.get("identifier") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const supabase = createClient();

    /*
      One field for email or phone (DESIGN.md §5.1): the user should not have
      to categorise themselves at the door. Detect which they typed and call
      the matching method. Phone sign-in stays behind an SMS provider, so an
      unconfigured project surfaces the provider's own error rather than
      failing silently.
    */
    const looksLikePhone = /^\+?[0-9\s-]{8,}$/.test(identifier);

    const { error: signInError } = looksLikePhone
      ? await supabase.auth.signInWithPassword({
          phone: identifier.replace(/[\s-]/g, ""),
          password,
        })
      : await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });

    if (signInError) {
      setError(readableError(signInError.message));
      setPending(false);
      return;
    }

    // /home resolves which dashboard, since roles live in Postgres.
    router.push(safeNext ?? "/home");
    router.refresh();
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="text-center">
        <h2 className="font-display text-subheading font-semibold text-cream">
          Welcome Back!
        </h2>
        <p className="mt-2 text-body-sm text-mist">
          Login to continue your journey
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-[var(--radius-field)] bg-risk-tint p-4"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-risk"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <p className="text-body-sm text-cream">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="relative">
          <label htmlFor="identifier" className="sr-only">
            Email or phone number
          </label>
          <User
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mist-dim"
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            required
            placeholder="Email or Phone Number"
            className={FIELD}
          />
        </div>

        <div className="relative">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <KeyRound
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mist-dim"
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Password"
            className={`${FIELD} pr-14`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-mist-dim transition-colors duration-[--duration-fast] hover:text-cream"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" strokeWidth={1.6} />
            ) : (
              <Eye className="h-5 w-5" strokeWidth={1.6} />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-body-sm text-mist">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="h-4 w-4 rounded-[3px] border-border bg-night-card accent-lime"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-body-sm font-medium text-lime underline-offset-4 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-field)] bg-lime text-body font-semibold text-night transition-colors duration-[--duration-fast] hover:bg-lime-bright disabled:opacity-70"
        >
          {pending ? (
            <>
              <Loader2
                className="h-5 w-5 animate-spin"
                data-progress
                aria-hidden="true"
              />
              Signing in…
            </>
          ) : (
            <>
              Login
              <LeafMark className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-body-sm text-mist-dim">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton next={safeNext ?? undefined} />

      <p className="mt-6 text-center text-body-sm text-mist">
        New to AgriGrowth?{" "}
        <Link
          href="/get-started"
          className="font-medium text-lime underline-offset-4 hover:underline"
        >
          Get started
        </Link>
      </p>
    </div>
  );
}
