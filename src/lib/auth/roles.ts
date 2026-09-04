/**
 * Role rules (§3, §29A.1, PLAN.md R-18).
 *
 * Pure — no database, no Supabase, fully unit-testable. The enforcement
 * points import from here so there is exactly one definition of who may
 * become what.
 */

export const ROLES = [
  "BUYER",
  "LANDOWNER",
  "WORKER",
  "INSPECTOR",
  "ADMIN",
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Roles a person may choose for themselves at signup.
 *
 * INSPECTOR and ADMIN are deliberately absent. §29A.1 requires inspectors to
 * be *authorised by AgriGrowth* — an inspector who could self-register would
 * defeat the independence the whole anti-fraud layer rests on. Self-service
 * admin signup needs no explanation.
 *
 * This is enforced server-side. Hiding the options in the UI is not
 * enforcement (CLAUDE.md §4.2).
 */
export const SELF_SERVICE_ROLES = ["BUYER", "LANDOWNER", "WORKER"] as const;

export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];

/** Roles only an existing admin may grant. */
export const GRANTABLE_ONLY_ROLES = ["INSPECTOR", "ADMIN"] as const;

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isSelfServiceRole(value: unknown): value is SelfServiceRole {
  return (
    typeof value === "string" &&
    (SELF_SERVICE_ROLES as readonly string[]).includes(value)
  );
}

/**
 * Whether a set of roles may be held together.
 *
 * R-18 allows multiple roles — a smallholder who owns land and also works a
 * neighbour's field is both LANDOWNER and WORKER, which is the common rural
 * case. But INSPECTOR is mutually exclusive with the others: §29A.2 requires
 * an inspector to independently verify a field, and someone who owns, works
 * or buys from that land is not independent of it.
 */
export function validateRoleCombination(roles: readonly Role[]): {
  ok: boolean;
  reason?: string;
} {
  const unique = new Set(roles);

  if (unique.size === 0) {
    return { ok: false, reason: "A user must hold at least one role." };
  }

  if (unique.has("INSPECTOR") && unique.size > 1) {
    return {
      ok: false,
      reason:
        "An inspector cannot also be a buyer, landowner or worker — §29A.2 requires independent verification.",
    };
  }

  if (unique.has("ADMIN") && unique.size > 1) {
    return {
      ok: false,
      reason:
        "An admin cannot hold an operational role — admins review disputes and inspections involving those parties.",
    };
  }

  return { ok: true };
}

/** Where each role lands after signing in. */
export const ROLE_HOME: Record<Role, string> = {
  BUYER: "/buyer",
  LANDOWNER: "/landowner",
  WORKER: "/worker",
  INSPECTOR: "/inspector",
  ADMIN: "/admin",
};

/**
 * The landing route for a user holding several roles.
 *
 * Ordered by which dashboard is most likely the reason they signed in.
 * A role switcher in the header covers the rest.
 */
const HOME_PRECEDENCE: readonly Role[] = [
  "ADMIN",
  "INSPECTOR",
  "BUYER",
  "LANDOWNER",
  "WORKER",
];

export function homeForRoles(roles: readonly Role[]): string {
  const match = HOME_PRECEDENCE.find((role) => roles.includes(role));
  return match ? ROLE_HOME[match] : "/get-started";
}

/** Google sign-in is offered only where it earns its keep (DESIGN.md §5.1). */
export function allowsGoogleSignIn(role: SelfServiceRole): boolean {
  // Workers are typically on low-end phones without a Google account, and the
  // OAuth consent detour costs more than it saves. Phone OTP is their route.
  return role === "BUYER" || role === "LANDOWNER";
}
