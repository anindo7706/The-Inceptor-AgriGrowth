import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { LogoLockup } from "@/components/brand/logo";
import { PhotoBackdrop } from "@/components/layout/photo-backdrop";

export const metadata: Metadata = { title: "Check your email — AgriGrowth" };

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="relative flex min-h-dvh items-center justify-center p-5">
      <PhotoBackdrop />
      <section className="animate-fade-rise w-full max-w-[440px] rounded-[var(--radius-panels)] glass p-8 text-center">
        <LogoLockup />
        <span className="mt-8 inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-field)] bg-verified-tint text-verified">
          <MailCheck className="h-6 w-6" strokeWidth={1.6} />
        </span>
        <h1 className="mt-5 font-display text-subheading font-semibold text-cream">
          Confirm your email
        </h1>
        <p className="mt-3 text-body-sm text-mist">
          We&rsquo;ve sent a confirmation link
          {email ? (
            <>
              {" "}
              to <span className="text-cream">{email}</span>
            </>
          ) : null}
          . Open it to finish setting up your account.
        </p>
        <p className="mt-6 text-caption text-mist-dim">
          No email after a few minutes? Check your spam folder.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-body-sm font-medium text-lime underline-offset-4 hover:underline"
        >
          Back to login
        </Link>
      </section>
    </main>
  );
}
