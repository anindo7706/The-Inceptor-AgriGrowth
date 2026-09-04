"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, KeyRound, Loader2, Mail, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { allowsGoogleSignIn, type SelfServiceRole } from "@/lib/auth/roles";
import { GoogleButton } from "./google-button";

const FIELD =
  "h-14 w-full rounded-[var(--radius-field)] border border-border bg-night-card pl-11 pr-4 text-body text-cream " +
  "transition-colors duration-[--duration-fast] focus:border-lime focus:outline-none";

const LABELS: Record<SelfServiceRole, string> = {
  BUYER: "buy produce",
  LANDOWNER: "own farmland",
  WORKER: "work in fields",
};

function readableError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been")) {
    return "An account already exists for that email. Try logging in instead.";
  }
  if (m.includes("password")) {
    return "That password is too weak. Use at least 8 characters.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return "We couldn't create your account. Please try again.";
}

export function RegisterForm({ role }: { role: SelfServiceRole }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(readableError(signUpError.message));
      setPending(false);
      return;
    }

    // Email confirmation is on: no session yet, so the profile is created
    // after they confirm and land on /complete-profile.
    if (!data.session) {
      router.push(`/check-email?email=${encodeURIComponent(email)}`);
      return;
    }

    /*
      The role is sent to the server, which validates it against the
      self-service allowlist. Passing it from the client is fine precisely
      because the server does not trust it (§29A.1, CLAUDE.md §4.2).
    */
    const response = await fetch("/api/auth/complete-profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fullName, role }),
    });

    if (!response.ok) {
      setError("Your account was created, but we couldn't finish your profile.");
      setPending(false);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="text-center">
        <h1 className="font-display text-subheading font-semibold text-cream">
          Create your account
        </h1>
        <p className="mt-2 text-body-sm text-mist">
          Signing up as someone who will{" "}
          <span className="font-medium text-lime">{LABELS[role]}</span>.{" "}
          <Link
            href="/get-started"
            className="underline underline-offset-4 hover:text-cream"
          >
            Change
          </Link>
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
          <label htmlFor="fullName" className="sr-only">
            Full name
          </label>
          <UserRound
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mist-dim"
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            placeholder="Full name"
            className={FIELD}
          />
        </div>

        <div className="relative">
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <Mail
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mist-dim"
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Email address"
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
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Password (8+ characters)"
            className={FIELD}
          />
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
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {allowsGoogleSignIn(role) && (
        <>
          <div className="my-6 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-body-sm text-mist-dim">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton />
        </>
      )}

      <p className="mt-6 text-center text-body-sm text-mist">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-lime underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
