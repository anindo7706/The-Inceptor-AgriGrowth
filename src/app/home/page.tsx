import { redirect } from "next/navigation";
import { getCurrentUser, needsProfile } from "@/lib/auth/session";
import { homeForRoles } from "@/lib/auth/roles";

/**
 * Role resolver.
 *
 * The middleware runs on the edge without Prisma, so it cannot know which
 * roles a user holds — it sends everyone here and this page routes them.
 *
 * Also catches the half-finished signup: authenticated with Supabase but no
 * public.User row, because they abandoned the flow partway.
 */
export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    if (await needsProfile()) redirect("/complete-profile");
    redirect("/login");
  }

  redirect(homeForRoles(user.roles));
}
