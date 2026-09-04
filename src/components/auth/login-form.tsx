"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, Loader2, Mail, User } from "lucide-react";
import { LeafMark } from "@/components/brand/logo";

/** Google's mark. Inlined — a CDN <img> is blocked by our own CSP posture. */
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

const FIELD =
  "h-14 w-full rounded-[var(--radius-field)] border border-moss bg-pure-white pl-11 pr-4 text-body text-charcoal " +
  "placeholder:text-muted transition-colors duration-[--duration-fast] " +
  "focus:border-forest-ink focus:outline-none";

const SECONDARY_BTN =
  "flex h-14 w-full items-center justify-center gap-3 rounded-[var(--radius-field)] border border-moss " +
  "bg-pure-white text-body-sm font-medium text-charcoal transition-colors duration-[--duration-fast] " +
  "hover:bg-ash-gray focus-visible:outline-none";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  // Supabase wiring lands in Phase 2 — see PLAN.md. The identifier field
  // accepts email or phone and routes to the matching method there.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setTimeout(() => setPending(false), 900);
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="text-center">
        <h2 className="font-serif text-subheading font-semibold text-forest-ink">
          Welcome Back!
        </h2>
        <p className="mt-2 text-body-sm text-muted">
          Login to continue your journey
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="relative">
          <label htmlFor="identifier" className="sr-only">
            Email or phone number
          </label>
          <User
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            inputMode="email"
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
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
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
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors duration-[--duration-fast] hover:text-charcoal"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" strokeWidth={1.6} />
            ) : (
              <Eye className="h-5 w-5" strokeWidth={1.6} />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-body-sm text-graphite">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded-[3px] border-moss accent-forest-ink"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-body-sm font-medium text-forest-ink underline-offset-4 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-field)] bg-forest-ink text-body font-medium text-bone transition-opacity duration-[--duration-fast] hover:opacity-95 disabled:opacity-70"
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
        <span className="h-px flex-1 bg-moss" />
        <span className="text-body-sm text-muted">or</span>
        <span className="h-px flex-1 bg-moss" />
      </div>

      <div className="space-y-3">
        {/*
          Google is shown on the buyer/landowner path only — see DESIGN.md
          §5.1 change 2. It is close to useless for workers and adds an
          identity provider to the trust chain.
        */}
        <button type="button" className={SECONDARY_BTN}>
          <GoogleMark />
          Continue with Google
        </button>
        <button type="button" className={SECONDARY_BTN}>
          <Mail className="h-4 w-4 text-forest-ink" strokeWidth={1.6} />
          Continue with Email OTP
        </button>
      </div>

      {/* Absent from the reference — new users had no route in (DESIGN.md §5.1). */}
      <p className="mt-6 text-center text-body-sm text-muted">
        New to AgriGrowth?{" "}
        <Link
          href="/get-started"
          className="font-medium text-forest-ink underline-offset-4 hover:underline"
        >
          Get started
        </Link>
      </p>
    </div>
  );
}
