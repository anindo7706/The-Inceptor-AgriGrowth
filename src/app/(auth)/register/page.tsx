import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { RegisterForm } from "@/components/auth/register-form";
import { LogoLockup } from "@/components/brand/logo";
import { PhotoBackdrop } from "@/components/layout/photo-backdrop";
import { isSelfServiceRole } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Create your account — AgriGrowth" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const upper = role?.toUpperCase();

  /*
    The allowlist runs here too, not only in the API. Landing on
    /register?role=admin must not render an admin signup form even briefly —
    a form that cannot succeed is still a false promise.
  */
  if (!isSelfServiceRole(upper)) redirect("/get-started");

  return (
    <main className="relative min-h-dvh p-3 lg:p-5">
      <PhotoBackdrop />
      <div className="mx-auto grid max-w-[1240px] gap-3 lg:grid-cols-[48fr_52fr] lg:gap-5">
        <AuthShowcase />
        <section className="animate-fade-rise flex flex-col items-center justify-center rounded-[var(--radius-panels)] glass px-5 py-10 lg:px-14">
          <LogoLockup />
          <div className="mt-8 w-full flex justify-center">
            <RegisterForm role={upper} />
          </div>
        </section>
      </div>
    </main>
  );
}
