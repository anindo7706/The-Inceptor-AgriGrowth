import { requireRole } from "@/lib/auth/session";
import { RolePlaceholder } from "@/components/app/role-placeholder";

export default async function Page() {
  // Belt and braces: the layout checks for a session, this checks the role.
  await requireRole("LANDOWNER");

  return (
    <RolePlaceholder
      role="Landowner"
      summary="Register your parcels, review contract offers, and follow crop progress stage by stage."
      arriving={[
        { phase: "Phase 3", what: "land registration with mapped boundaries" },
        { phase: "Phase 5", what: "contract offers to accept or decline" },
        { phase: "Phase 6", what: "crop timeline and upcoming tasks" },
      ]}
    />
  );
}
