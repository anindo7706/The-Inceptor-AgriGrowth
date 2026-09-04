import { LeafMark } from "@/components/brand/logo";

/**
 * Placeholder dashboard.
 *
 * Phase 2 delivers authentication and route protection, not the dashboards
 * themselves — those arrive with the data behind them in Phases 3 onward.
 * This states plainly what the screen will become rather than mocking up
 * numbers, which §48 forbids presenting as real.
 */
export function RolePlaceholder({
  role,
  summary,
  arriving,
}: {
  role: string;
  summary: string;
  arriving: readonly { phase: string; what: string }[];
}) {
  return (
    <div className="animate-fade-rise">
      <p className="text-caption font-medium uppercase tracking-[0.18em] text-lime">
        {role}
      </p>
      <h1 className="mt-3 font-display text-heading-sm font-semibold text-cream">
        You&rsquo;re signed in
      </h1>
      <p className="mt-3 max-w-[52ch] text-body text-mist">{summary}</p>

      <section className="mt-8 rounded-[var(--radius-panels)] border border-border bg-night-raised p-6">
        <h2 className="font-display text-body font-semibold text-cream">
          What lands here
        </h2>
        <ul className="mt-4 space-y-3">
          {arriving.map(({ phase, what }) => (
            <li key={`${phase}-${what}`} className="flex items-start gap-3">
              <LeafMark
                className="mt-0.5 h-4 w-4 shrink-0 text-lime"
                aria-hidden="true"
              />
              <p className="text-body-sm text-mist">
                <span className="font-medium text-cream">{phase}</span>
                {" — "}
                {what}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
