import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompleteProfileForm } from "@/components/auth/complete-profile-form";
import { LogoLockup } from "@/components/brand/logo";
import { PhotoBackdrop } from "@/components/layout/photo-backdrop";
import { getCurrentUser, needsProfile } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Finish signing up — AgriGrowth" };

/**
 * The half-finished signup.
 *
 * A user can exist in auth.users with no public.User row — they confirmed an
 * email and closed the tab, or an OAuth sign-in created the auth record
 * before we ever asked what they are. Without this they would sign in
 * successfully and land nowhere.
 */
export default async function CompleteProfilePage() {
  const user = await getCurrentUser();
  if (user) redirect("/home");
  if (!(await needsProfile())) redirect("/login");

  return (
    <main className="relative flex min-h-dvh items-center justify-center p-5">
      <PhotoBackdrop />
      <section className="animate-fade-rise w-full max-w-[440px] rounded-[var(--radius-panels)] glass p-8">
        <LogoLockup />
        <CompleteProfileForm />
      </section>
    </main>
  );
}
