import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Map, ShoppingBasket, Sprout } from "lucide-react";
import { LogoLockup } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Get started — AgriGrowth",
};

/*
  Three self-service roles, not Arva's two (DESIGN.md §5.2). "I'm a Farmer"
  conflates owning land with working it; we separate them — different
  dashboards, different permissions.

  INSPECTOR and ADMIN are absent by design: §29A.1 requires inspectors to be
  authorized by AgriGrowth, and self-service admin signup is an open door.
  The allowlist is enforced server-side in Phase 2, not by hiding these.

  Copy is plain language, not role nouns — "I own farmland" beats "Landowner",
  which is platform vocabulary the user has not learned yet.
*/
const ROLES = [
  {
    role: "LANDOWNER",
    icon: Map,
    title: "I own farmland",
    body: "Register your land and receive contract offers from verified buyers.",
    surface: "bg-sage-card",
  },
  {
    role: "WORKER",
    icon: Sprout,
    title: "I work in fields",
    body: "Find work near you, check in on site, and get paid per task.",
    surface: "bg-peach-card",
  },
  {
    role: "BUYER",
    icon: ShoppingBasket,
    title: "I buy produce",
    body: "Contract crop production against real, verified land parcels.",
    surface: "bg-sky-card",
  },
] as const;

export default function GetStartedPage() {
  return (
    <main className="min-h-dvh bg-bone px-5 py-10 lg:py-16">
      <div className="mx-auto max-w-[1000px]">
        <div className="flex flex-col items-center text-center">
          <LogoLockup />
          <h1 className="mt-8 font-serif text-heading-sm text-charcoal lg:text-heading">
            What brings you here?
          </h1>
          <p className="mt-3 max-w-[46ch] text-body text-graphite">
            Pick the one that fits you best. You can add another later from your
            account settings.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {ROLES.map(({ role, icon: Icon, title, body, surface }, i) => (
            <li key={role}>
              <Link
                href={`/register?role=${role.toLowerCase()}`}
                className={`animate-fade-rise group flex h-full min-h-[72px] flex-col rounded-[var(--radius-cards)] ${surface} p-6 transition-transform duration-[--duration-base] ease-[--ease-standard] hover:-translate-y-1`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <Icon
                  className="h-6 w-6 text-forest-ink"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h2 className="mt-4 font-serif text-subheading text-charcoal">
                  {title}
                </h2>
                <p className="mt-2 flex-1 text-body-sm text-graphite">{body}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-body-sm font-medium text-forest-ink">
                  Continue
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-[--duration-base] ease-[--ease-standard] group-hover:translate-x-1"
                    strokeWidth={1.8}
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-body-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-forest-ink underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
