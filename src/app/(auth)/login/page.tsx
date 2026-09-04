import type { Metadata } from "next";
import { ChevronDown, Globe, ShieldCheck } from "lucide-react";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { LoginForm } from "@/components/auth/login-form";
import { LeafMark, LogoLockup } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Log in — AgriGrowth",
};

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-night p-3 lg:p-5">
      <div className="mx-auto grid max-w-[1240px] gap-3 lg:grid-cols-[48fr_52fr] lg:gap-5">
        <AuthShowcase />

        <section className="animate-fade-rise relative flex flex-col rounded-[var(--radius-panels)] bg-night-raised px-5 py-8 ring-hairline lg:px-14 lg:py-10">
          {/*
            Language selector. Inert until i18n lands — see DESIGN.md open
            decision 4, which also decides whether Noto Sans Devanagari ships.
          */}
          <div className="flex justify-end">
            <button
              type="button"
              className="flex h-11 items-center gap-2 rounded-[var(--radius-buttons)] border border-border bg-night-card px-4 text-body-sm text-cream transition-colors duration-[--duration-fast] hover:border-border-hi"
            >
              <Globe className="h-4 w-4 text-mist-dim" strokeWidth={1.6} />
              English
              <ChevronDown className="h-4 w-4 text-mist-dim" strokeWidth={1.6} />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center py-8">
            <LogoLockup />
            <div className="mt-8 w-full">
              <LoginForm />
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[var(--radius-cards)] bg-night-card p-5 ring-hairline">
            <LeafMark
              className="pointer-events-none absolute -bottom-4 right-2 h-24 w-24 text-lime/10"
              aria-hidden="true"
            />
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-field)] bg-verified-tint text-verified">
                <ShieldCheck className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <div>
                <p className="text-body-sm font-semibold text-cream">
                  Your data is secure with us
                </p>
                {/*
                  Deliberately concrete. "Advanced encryption" overclaims in
                  the vague way DESIGN.md §10 forbids.
                */}
                <p className="mt-1 text-caption text-mist">
                  Your land records, contracts and payment details are
                  encrypted in transit and at rest.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
