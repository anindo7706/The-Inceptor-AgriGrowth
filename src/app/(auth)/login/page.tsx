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
    <main className="min-h-dvh bg-bone p-3 lg:p-5">
      <div className="mx-auto grid max-w-[1200px] gap-3 lg:grid-cols-[48fr_52fr] lg:gap-5">
        <AuthShowcase />

        <section className="animate-fade-rise relative flex flex-col rounded-[var(--radius-cards)] bg-[#faf8ef] px-5 py-8 lg:rounded-[var(--radius-hero-cards)] lg:px-14 lg:py-10">
          {/*
            Language selector. Inert until i18n lands — see DESIGN.md open
            decision 4, which also decides whether Noto Sans Devanagari ships.
          */}
          <div className="flex justify-end">
            <button
              type="button"
              className="flex h-11 items-center gap-2 rounded-[var(--radius-nav-pills)] border border-moss bg-pure-white px-4 text-body-sm text-charcoal transition-colors duration-[--duration-fast] hover:bg-ash-gray"
            >
              <Globe className="h-4 w-4 text-muted" strokeWidth={1.6} />
              English
              <ChevronDown className="h-4 w-4 text-muted" strokeWidth={1.6} />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center py-8">
            <LogoLockup />
            <div className="mt-8 w-full">
              <LoginForm />
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[var(--radius-cards)] bg-ash-gray/70 p-5">
            <LeafMark
              className="pointer-events-none absolute -bottom-4 right-2 h-24 w-24 text-forest-ink/10"
              aria-hidden="true"
            />
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-field)] bg-forest-ink text-bone">
                <ShieldCheck className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <div>
                <p className="text-body-sm font-semibold text-charcoal">
                  Your data is secure with us
                </p>
                {/*
                  Deliberately concrete. "Advanced encryption" overclaims in
                  the vague way DESIGN.md §10 forbids.
                */}
                <p className="mt-1 text-caption text-muted">
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
