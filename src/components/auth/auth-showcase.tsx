import { Droplets, Sprout, TrendingUp } from "lucide-react";
import { LeafMark } from "@/components/brand/logo";

const STATS = [
  { icon: Sprout, value: "Verified", label: "land parcels" },
  { icon: TrendingUp, value: "Stage-wise", label: "crop timelines" },
  { icon: Droplets, value: "GPS + AI", label: "work evidence" },
] as const;

/**
 * The photographic panel on the auth screens.
 *
 * Marketing content. Per DESIGN.md §5.1 it collapses to a slim banner on
 * mobile and the copy is REMOVED rather than stacked — a worker signing in
 * from a field must not scroll past a headline to reach the password box.
 *
 * The photograph is layered under a scrim so the headline stays legible
 * whatever image is dropped in. If /images/hero-farmer.jpg is absent, the
 * scrim's own gradient carries the panel — see public/images/README.txt.
 */
export function AuthShowcase() {
  return (
    <section className="relative isolate overflow-hidden rounded-[var(--radius-panels)] bg-night-raised ring-hairline">
      {/*
        The photograph sits on top of a gradient of the same tonality, so a
        missing or slow-loading file degrades to something that still reads as
        a field at dusk rather than a black rectangle.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/images/hero-farmer.jpg'), radial-gradient(120% 90% at 70% 15%, #5c7f45 0%, #2c4224 45%, #0f1710 100%)",
        }}
      />
      {/* Scrim: guarantees the text floor regardless of the photograph. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(10,15,11,0.96)_0%,rgba(10,15,11,0.72)_45%,rgba(10,15,11,0.35)_100%)]"
      />

      <div className="flex h-full min-h-[132px] flex-col justify-between p-5 lg:min-h-[760px] lg:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-field)] bg-lime text-night">
            <LeafMark className="h-5 w-5" />
          </span>
          <span className="font-display text-body font-semibold tracking-tight text-cream lg:hidden">
            AgriGrowth
          </span>
        </div>

        {/* Headline and body: desktop only (DESIGN.md §5.1 mobile rules). */}
        <div className="hidden lg:block">
          <p className="inline-flex items-center gap-2 rounded-[var(--radius-buttons)] bg-night-card/80 px-4 py-2 text-caption font-medium uppercase tracking-wider text-lime ring-hairline">
            <LeafMark className="h-3.5 w-3.5" />
            Contract farming, verified end to end
          </p>
          <h1 className="mt-6 max-w-[14ch] font-display text-heading-sm font-semibold text-cream lg:text-heading">
            Nurturing nature.{" "}
            <span className="text-lime">Empowering farmers.</span>
          </h1>
          <p className="mt-5 max-w-[42ch] text-body text-mist">
            AgriGrowth connects buyers, landowners and field workers around real
            land, crop-specific timelines and verified work.
          </p>
        </div>

        {/* Stat strip: desktop only. */}
        <ul className="hidden gap-6 rounded-[var(--radius-cards)] bg-night-card/80 p-6 ring-hairline backdrop-blur-sm lg:grid lg:grid-cols-3">
          {STATS.map(({ icon: Icon, value, label }) => (
            <li key={label} className="flex items-start gap-3">
              <Icon
                className="mt-0.5 h-5 w-5 shrink-0 text-lime"
                strokeWidth={1.6}
                aria-hidden="true"
              />
              <div>
                <p className="font-display text-body font-semibold text-cream">
                  {value}
                </p>
                <p className="mt-0.5 text-caption text-mist">{label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
