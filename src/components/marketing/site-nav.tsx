import Link from "next/link";
import { LeafMark, Wordmark } from "@/components/brand/logo";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#roles", label: "Who it's for" },
  { href: "#trust", label: "Verification" },
] as const;

/**
 * Marketing header. Sits over the hero photograph, so it is transparent with
 * a glass pill for the links rather than a solid bar.
 *
 * The links point at sections that do not exist yet — they are anchors on
 * this page, added as the marketing surface grows. Nothing here navigates
 * into the app except the two auth entry points.
 */
export function SiteNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-5 lg:px-8"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="AgriGrowth home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-field)] bg-lime text-night">
            <LeafMark className="h-4 w-4" />
          </span>
          <Wordmark className="text-[19px] leading-none" />
        </Link>

        <ul className="hidden items-center gap-1 rounded-[var(--radius-buttons)] glass-card px-2 py-1.5 lg:flex">
          {LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="block rounded-[var(--radius-buttons)] px-4 py-2 text-body-sm text-mist transition-colors duration-[--duration-fast] hover:text-cream"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-[var(--radius-buttons)] px-4 py-2.5 text-body-sm font-medium text-cream transition-colors duration-[--duration-fast] hover:text-lime sm:block"
          >
            Log in
          </Link>
          <Link
            href="/get-started"
            className="rounded-[var(--radius-buttons)] bg-lime px-5 py-2.5 text-body-sm font-semibold text-night transition-colors duration-[--duration-fast] hover:bg-lime-bright"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
