import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, ScanLine, Sprout } from "lucide-react";
import { LeafMark } from "@/components/brand/logo";
import { PhotoBackdrop } from "@/components/layout/photo-backdrop";
import { SiteNav } from "@/components/marketing/site-nav";

export const metadata: Metadata = {
  title: "AgriGrowth — Contract farming, verified end to end",
  description:
    "Buyers contract crop production against real land. Landowners get guaranteed demand. Workers get paid, verified work.",
};

/*
  Marketing surface (DESIGN.md §1) — the one place the editorial voice is
  allowed. It uses the same tokens and glass language as the app, so clicking
  through to /login is continuous rather than a jump between two products.
*/
const PILLARS = [
  {
    icon: MapPin,
    title: "Verified land",
    body: "Real parcels, mapped boundaries",
  },
  {
    icon: Sprout,
    title: "Crop timelines",
    body: "Stage by stage, per crop",
  },
  {
    icon: ScanLine,
    title: "Proven work",
    body: "GPS, photos, inspection",
  },
] as const;

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <PhotoBackdrop />
      <SiteNav />

      <section className="mx-auto flex min-h-dvh max-w-[1240px] flex-col justify-center px-5 pb-28 pt-28 lg:px-8">
        <p className="animate-fade-rise flex items-center gap-2.5 text-caption font-medium uppercase tracking-[0.18em] text-lime">
          <LeafMark className="h-4 w-4 shrink-0" />
          Contract farming, verified end to end
        </p>

        <h1
          className="animate-fade-rise mt-6 max-w-[16ch] font-display text-heading-sm font-semibold text-cream sm:text-heading lg:text-heading-lg"
          style={{ animationDelay: "60ms" }}
        >
          Farming that{" "}
          {/* Latin-only serif accent — never carries translated copy (DESIGN.md §3). */}
          <span className="font-accent font-normal italic text-lime" translate="no">
            grows
          </span>{" "}
          together.
        </h1>

        <p
          className="animate-fade-rise mt-6 max-w-[46ch] text-body-lg text-mist"
          style={{ animationDelay: "120ms" }}
        >
          Buyers contract production against real land. Landowners get
          guaranteed demand. Workers get organised, verified, paid work.
        </p>

        <div
          className="animate-fade-rise mt-9 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "180ms" }}
        >
          <Link
            href="/login"
            className="group inline-flex h-14 items-center gap-2.5 rounded-[var(--radius-buttons)] bg-lime px-7 text-body font-semibold text-night transition-colors duration-[--duration-fast] hover:bg-lime-bright"
          >
            Log in
            <ArrowRight
              className="h-4 w-4 transition-transform duration-[--duration-base] ease-[--ease-standard] group-hover:translate-x-1"
              strokeWidth={2}
            />
          </Link>
          <Link
            href="/get-started"
            className="inline-flex h-14 items-center gap-2.5 rounded-[var(--radius-buttons)] glass-card glass-interactive px-7 text-body font-medium text-cream"
          >
            Create an account
          </Link>
        </div>

        {/* Three pillars, echoing the reference's feature card. */}
        <ul
          className="animate-fade-rise mt-16 grid w-fit gap-x-8 gap-y-6 rounded-[var(--radius-panels)] glass p-6 sm:grid-cols-3 sm:divide-x sm:divide-border"
          style={{ animationDelay: "240ms" }}
        >
          {PILLARS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className={i > 0 ? "sm:pl-8" : undefined}>
              <Icon
                className="h-5 w-5 text-lime"
                strokeWidth={1.6}
                aria-hidden="true"
              />
              <p className="mt-3 font-display text-body font-semibold text-cream">
                {title}
              </p>
              <p className="mt-1 text-caption text-mist">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-3">
        <span className="text-caption uppercase tracking-[0.18em] text-mist-dim">
          Scroll to explore
        </span>
        <span
          className="flex h-9 w-6 items-start justify-center rounded-[var(--radius-buttons)] p-1.5 ring-hairline"
          aria-hidden="true"
        >
          <span className="h-1.5 w-1 rounded-full bg-lime" />
        </span>
      </div>
    </main>
  );
}
