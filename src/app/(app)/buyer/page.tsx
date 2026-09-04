import { requireRole } from "@/lib/auth/session";
import { RolePlaceholder } from "@/components/app/role-placeholder";

export default async function Page() {
  // Belt and braces: the layout checks for a session, this checks the role.
  await requireRole("BUYER");

  return (
    <RolePlaceholder
      role="Buyer"
      summary="Create crop demands, pick land on the map, and track contracts through to delivery."
      arriving={[
        { phase: "Phase 4", what: "crop demand wizard and map-based land selection" },
        { phase: "Phase 5", what: "contract offers, acceptance and financial allocation" },
        { phase: "Phase 10", what: "production forecasts, shown as ranges" },
      ]}
    />
  );
}
