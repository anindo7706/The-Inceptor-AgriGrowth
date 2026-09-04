/**
 * Gives the seeded demo users their auth.users rows so they can actually
 * log in.
 *
 *   npm run db:demo-users
 *
 * The seed creates public.User rows only — it must not depend on network
 * access. Creating auth users needs the service-role key, so it lives here.
 *
 * SAFETY: refuses to run unless every public.User row it would touch is
 * flagged isDemo. That flag is what separates a development database from a
 * real one, and this script creates accounts with a known password.
 */

process.loadEnvFile(".env.local");

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "agrigrowth-demo-2026";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(`
  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.
  Run "npm run db:check" to see what is set.
`);
  process.exit(1);
}

const prisma = new PrismaClient();
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const demoUsers = await prisma.user.findMany({
  where: { isDemo: true },
  select: {
    id: true,
    email: true,
    phone: true,
    fullName: true,
    roles: { select: { role: true } },
  },
  orderBy: { fullName: "asc" },
});

if (demoUsers.length === 0) {
  console.error(`
  No demo users found. Run "npm run db:seed" first.
`);
  await prisma.$disconnect();
  process.exit(1);
}

const realUsers = await prisma.user.count({ where: { isDemo: false } });
if (realUsers > 0) {
  console.error(`
  Refusing to run: this database holds ${realUsers} non-demo user${realUsers === 1 ? "" : "s"}.

  This script creates accounts with a shared, known password. That is fine on
  a development database and unacceptable anywhere real.
`);
  await prisma.$disconnect();
  process.exit(1);
}

console.log(`\nCreating auth users for ${demoUsers.length} demo profiles…\n`);

let created = 0;
let recreated = 0;

for (const user of demoUsers) {
  const roles = user.roles.map((r) => r.role).join(" + ");

  /*
    Delete-then-create rather than update.

    Supabase will not attach an email to an account that was created
    phone-only: updateUserById accepts the change, returns no error, and
    silently does nothing. Recreating is the only way to reconcile such an
    account, and it is safe here because the guard above has already proven
    this database holds no real users.
  */
  const { data: existing } = await admin.auth.admin.getUserById(user.id);
  if (existing?.user) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error(`  x ${user.fullName}: ${deleteError.message}`);
      continue;
    }
    recreated += 1;
  }

  /*
    The auth user id MUST equal public.User.id — that equality is the whole
    link between Supabase auth and our data (CLAUDE.md §2). Supabase lets us
    specify it, so the two never drift.
  */
  const { error } = await admin.auth.admin.createUser({
    id: user.id,
    password: DEMO_PASSWORD,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { full_name: user.fullName },
    /*
      Email OR phone, never both. Supabase silently drops the email when a
      createUser call carries both — the request succeeds and the account
      ends up phone-only, unable to sign in with a password.

      Demo accounts therefore authenticate by email. The phone number stays
      on public.User, where it is the identifier that matters for a worker
      in production (§35) once an SMS provider is configured.
    */
    ...(user.email ? { email: user.email } : { phone: user.phone }),
  });

  if (error) {
    console.error(`  x ${user.fullName}: ${error.message}`);
    continue;
  }

  created += 1;
  const mark = existing?.user ? "~" : "+";
  console.log(`  ${mark} ${user.fullName.padEnd(42)} ${roles}`);
}

console.log(`
  ${created} account${created === 1 ? "" : "s"} ready (${recreated} recreated).

  Sign in at /login with any of the emails above.
  Password: ${DEMO_PASSWORD}

  All six sign in by email. Phone numbers remain on public.User — workers
  sign in by phone in production (§35), once an SMS provider is configured.
`);

await prisma.$disconnect();
