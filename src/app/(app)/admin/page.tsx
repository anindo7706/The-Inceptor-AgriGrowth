import { requireRole } from "@/lib/auth/session";
import { RolePlaceholder } from "@/components/app/role-placeholder";

export default async function Page() {
  // Belt and braces: the layout checks for a session, this checks the role.
  await requireRole("ADMIN");

  return (
    <RolePlaceholder
      role="Admin"
      summary="Crops, platform rules, financial configuration, disputes and the AI review queue."
      arriving={[
        { phase: "Phase 1", what: "39 platform config rules, already seeded" },
        { phase: "Phase 5", what: "contract validation gate before offers go out" },
        { phase: "Phase 10", what: "AI alert review and contract risk" },
      ]}
    />
  );
}
