import { cn } from "@/lib/utils";

/** The leaf glyph, used inside the logo tile and as a standalone badge. */
export function LeafMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Two-leaf sprout: stem, left frond, right frond. */}
      <path d="M12 21v-7.5" />
      <path d="M12 14C7.6 14 5 11 5 6.5 9.4 6.5 12 9.5 12 14Z" />
      <path d="M12 14c4.4 0 7-3 7-7.5C14.6 6.5 12 9.5 12 14Z" />
    </svg>
  );
}

/** Forest tile with the leaf mark — the app icon. */
export function LogoTile({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-forest-ink text-bone",
        "rounded-[var(--radius-field)]",
        className,
      )}
    >
      <LeafMark className="h-3/5 w-3/5" />
    </div>
  );
}

/**
 * Wordmark — "Agri" in charcoal, "Growth" in forest green, per the login
 * reference's two-tone treatment.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("font-serif tracking-tight text-charcoal", className)}
      // Serif is Latin-only (DESIGN.md §3); the wordmark is never translated.
      translate="no"
    >
      Agri<span className="text-forest-ink">Growth</span>
    </span>
  );
}

/** Stacked lockup used on the auth screens. */
export function LogoLockup() {
  return (
    <div className="flex flex-col items-center">
      <LogoTile className="h-14 w-14" />
      <Wordmark className="mt-4 text-[32px] leading-none" />
      <p className="mt-2 text-body-sm text-muted">Connect. Cultivate. Thrive.</p>
      <span
        className="mt-4 block h-px w-10 bg-forest-ink/50"
        aria-hidden="true"
      />
    </div>
  );
}
