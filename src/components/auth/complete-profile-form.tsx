"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Map, ShoppingBasket, Sprout } from "lucide-react";
import type { SelfServiceRole } from "@/lib/auth/roles";

const CHOICES = [
  { role: "LANDOWNER", icon: Map, label: "I own farmland" },
  { role: "WORKER", icon: Sprout, label: "I work in fields" },
  { role: "BUYER", icon: ShoppingBasket, label: "I buy produce" },
] as const satisfies readonly {
  role: SelfServiceRole;
  icon: typeof Map;
  label: string;
}[];

export function CompleteProfileForm() {
  const router = useRouter();
  const [role, setRole] = useState<SelfServiceRole>("LANDOWNER");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const fullName = String(
      new FormData(event.currentTarget).get("fullName") ?? "",
    ).trim();

    const response = await fetch("/api/auth/complete-profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fullName, role }),
    });

    if (!response.ok) {
      setError("We couldn't save your profile. Please try again.");
      setPending(false);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <h1 className="font-display text-subheading font-semibold text-cream">
        Almost there
      </h1>
      <p className="mt-2 text-body-sm text-mist">
        Tell us your name and what brings you here.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-[var(--radius-field)] bg-risk-tint p-4"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-risk"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <p className="text-body-sm text-cream">{error}</p>
        </div>
      )}

      <label htmlFor="fullName" className="sr-only">
        Full name
      </label>
      <input
        id="fullName"
        name="fullName"
        type="text"
        autoComplete="name"
        required
        minLength={2}
        placeholder="Full name"
        className="mt-6 h-14 w-full rounded-[var(--radius-field)] border border-border bg-night-card px-4 text-body text-cream transition-colors duration-[--duration-fast] focus:border-lime focus:outline-none"
      />

      <fieldset className="mt-4">
        <legend className="sr-only">What brings you here</legend>
        <div className="space-y-2">
          {CHOICES.map(({ role: value, icon: Icon, label }) => {
            const selected = role === value;
            return (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-3 rounded-[var(--radius-field)] border p-4 transition-colors duration-[--duration-fast] ${
                  selected
                    ? "border-lime bg-night-card"
                    : "border-border bg-night-card/50 hover:border-border-hi"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={selected}
                  onChange={() => setRole(value)}
                  className="h-4 w-4 accent-lime"
                />
                <Icon
                  className={`h-5 w-5 ${selected ? "text-lime" : "text-mist-dim"}`}
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
                <span className="text-body-sm text-cream">{label}</span>
              </label>
            );
          })}
        </div>
        {/*
          Only these three. Inspector and admin are granted by an existing
          admin (§29A.1) and the server rejects them regardless of what is
          posted here.
        */}
        <p className="mt-3 text-caption text-mist-dim">
          You can add another later. Inspectors are appointed by AgriGrowth.
        </p>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-field)] bg-lime text-body font-semibold text-night transition-colors duration-[--duration-fast] hover:bg-lime-bright disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2
              className="h-5 w-5 animate-spin"
              data-progress
              aria-hidden="true"
            />
            Saving…
          </>
        ) : (
          "Finish signing up"
        )}
      </button>

    </form>
  );
}
