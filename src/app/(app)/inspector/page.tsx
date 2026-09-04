import { requireRole } from "@/lib/auth/session";
import { RolePlaceholder } from "@/components/app/role-placeholder";

export default async function Page() {
  // Belt and braces: the layout checks for a session, this checks the role.
  await requireRole("INSPECTOR");

  return (
    <RolePlaceholder
      role="Inspector"
      summary="Physical field verification — the layer that GPS and photographs alone cannot provide."
      arriving={[
        { phase: "Phase 12", what: "assigned inspection jobs and field verification" },
        { phase: "Phase 12", what: "multi-area evidence capture (§29A.4)" },
        { phase: "Phase 12", what: "seven inspection outcomes, append-only" },
      ]}
    />
  );
}
