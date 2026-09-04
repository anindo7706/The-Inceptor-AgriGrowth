import { BarChart3, LeafyGreen, Sprout } from "lucide-react";
import { LeafMark } from "@/components/brand/logo";

const FEATURES = [
  {
    icon: LeafyGreen,
    title: "Smart Farming",
    body: "Data driven decisions",
  },
  {
    icon: Sprout,
    title: "Crop Health",
    body: "Monitor & protect your crops",
  },
  {
    icon: BarChart3,
    title: "Better Yield",
    body: "Increase productivity sustainably",
  },
] as const;

/**
 * The photographic panel from the login reference.
 *
 * Marketing content. Per DESIGN.md §5.1 it collapses to a slim header on
 * mobile and the copy is REMOVED rather than stacked — a worker signing in
 * from a field must not scroll past a headline to reach the password box.
 */
export function AuthShowcase() {
  return (
    <section className="relative isolate overflow-hidden rounded-[var(--radius-cards)] bg-forest-ink lg:rounded-[var(--radius-hero-cards)]">
      {/*
        PLACEHOLDER ARTWORK.
        The reference uses a full-bleed photograph of crop rows in warm light.
        Replace this gradient stack with the real image once art direction
        lands — see DESIGN.md §5.1. A scrim is required regardless, because a
        headline legible over one photograph may vanish over the next.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_0%,#f6f1e2_0%,#e7e6c9_38%,#a8bd82_66%,#5c7c4a_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(7,80,63,0.55),transparent_55%)]"
      />

      <div className="flex h-full min-h-[120px] flex-col justify-between p-5 lg:min-h-[720px] lg:p-10">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-bone/70 text-forest-ink backdrop-blur-sm">
          <LeafMark className="h-5 w-5" />
        </div>

        {/* Headline and body: desktop only (DESIGN.md §5.1 mobile rules). */}
        <div className="hidden lg:block">
          <h1 className="max-w-[10ch] font-serif text-heading-sm leading-[1.1] text-charcoal lg:text-heading">
            Growing a better tomorrow
          </h1>
          <span
            className="mt-6 block h-[3px] w-12 rounded-full bg-forest-ink"
            aria-hidden="true"
          />
          <p className="mt-6 max-w-[34ch] text-body text-graphite">
            Smart solutions for modern farming. Manage, monitor and maximise
            your yield with technology.
          </p>
        </div>

        {/* Feature strip: desktop only. */}
        <ul className="hidden gap-6 rounded-[var(--radius-cards)] bg-charcoal/70 p-6 backdrop-blur-sm lg:grid lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="text-bone">
              <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              <p className="mt-3 text-body-sm font-semibold">{title}</p>
              <p className="mt-1 text-caption text-bone/80">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
