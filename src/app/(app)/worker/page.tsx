import { requireRole } from "@/lib/auth/session";
import { RolePlaceholder } from "@/components/app/role-placeholder";

export default async function Page() {
  // Belt and braces: the layout checks for a session, this checks the role.
  await requireRole("WORKER");

  return (
    <RolePlaceholder
      role="Worker"
      summary="Find work near you, check in on site, and submit evidence of what you have done."
      arriving={[
        { phase: "Phase 7", what: "job feed filtered to your area and availability" },
        { phase: "Phase 8", what: "GPS check-in and photo evidence upload" },
        { phase: "Phase 11", what: "payment record per verified task" },
      ]}
    />
  );
}
