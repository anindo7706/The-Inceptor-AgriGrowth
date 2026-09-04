# Supabase setup

Do this **before Phase 1** — Phase 1 needs a database URL to point Prisma at.

Supabase gives us two things: authentication (§35) and the Postgres database. Same project,
one database. Prisma connects to it directly.

Roughly 30 minutes. Work through it in order; each step says how to verify it.

---

## 1 · Create the projects

Create **two** projects, not one:

| Project | Name | Purpose |
|---|---|---|
| Development | `agrigrowth-dev` | Day-to-day work. Seed and reset freely. |
| Production | `agrigrowth-prod` | Create it now, leave it untouched until launch. |

Sharing one project between dev and prod means a `prisma migrate reset` during development
destroys real data. Two projects costs nothing on the free tier.

**Region:** choose **Mumbai (`ap-south-1`)**. The users are in India; every auth call and
every query pays the round trip. A US region adds roughly 200 ms to each one.

**Database password:** generate a strong one and put it straight into your password manager.
It appears in connection strings and Supabase will not show it again.

> ✅ **Verify:** both projects show *Active* in the dashboard.

---

## 2 · Collect the credentials

From the `agrigrowth-dev` dashboard:

**Settings → API**
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public by design, safe in the browser
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` — **bypasses all security. Server only.**

**Settings → Database → Connection string**
- Connection pooling, **transaction mode** (port `6543`) → `DATABASE_URL`
- Direct connection or session mode (port `5432`) → `DIRECT_URL`

### Why two database URLs

Prisma needs both, for different jobs:

- **`DATABASE_URL`** — the pooled connection the app uses at runtime. Serverless functions
  open and close connections constantly; without the pooler you exhaust Postgres connection
  slots under trivial load.
- **`DIRECT_URL`** — an unpooled connection used only by `prisma migrate`. Migrations need
  session-level features (advisory locks, DDL transactions) that transaction-mode pooling
  does not support. Point migrations at the pooler and they fail in confusing ways.

Append `?pgbouncer=true&connection_limit=1` to `DATABASE_URL`. Without `pgbouncer=true`,
Prisma tries to use prepared statements that transaction-mode pooling cannot honour, and
you get intermittent `prepared statement "s0" already exists` errors — the kind that pass
locally and fail under concurrency.

> **If `DIRECT_URL` cannot connect:** the direct database host may be IPv6-only depending on
> your project and plan. If your machine or CI has no IPv6, use the pooler's **session mode**
> string (same pooler host, port `5432`) for `DIRECT_URL` instead. Session mode supports what
> migrations need.

> ✅ **Verify:** `psql "$DIRECT_URL" -c "select version();"` returns a Postgres version.

---

## 3 · Configure authentication

**Authentication → Providers**
- Enable **Email**.
- **Google:** pending decision — see DESIGN.md §5.1. The login reference includes it. It earns
  its keep for buyers on Google Workspace; it is close to useless for workers and adds an
  identity provider to the trust chain. If enabled, render it on the buyer and landowner
  paths only.
- Disable every other social provider. None are in scope, and each one enabled is another
  way in.

**Authentication → URL Configuration**
- Site URL: `http://localhost:3000` for dev; the real domain for prod.
- Redirect URLs — add explicitly:
  ```
  http://localhost:3000/api/auth/callback
  http://localhost:3000/**
  ```
  Production gets its own allowlist. Never use a wildcard that permits arbitrary hosts —
  that is an open redirect for auth codes.

**Authentication → Sign In / Providers → Email**
- Dev: turn **Confirm email** *off*. It makes seeding and manual testing much faster.
- Prod: turn it **on**. Note this as a launch checklist item — it is easy to forget.

**Authentication → Sessions / Advanced**
- JWT expiry: `3600` (1 hour) is fine.
- Refresh token rotation: **on**.
- Enable **leaked password protection** if available on your plan.

> ✅ **Verify:** create a test user via **Authentication → Users → Add user**. It appears in
> the list.

---

## 4 · Phone OTP — decide now

Supabase supports phone OTP natively, and it fits a rural workforce far better than email
(§21, §24, §35). But it is not free and it is not zero-config:

- It needs an SMS provider connected under **Authentication → Providers → Phone** — Twilio,
  MessageBird, Vonage, or Textlocal/MSG91 via the custom hook.
- Every OTP costs money, including every retry and every mistyped number.
- Indian SMS additionally requires **DLT registration** of your sender ID and templates with
  TRAI. That is a multi-day process with paperwork, not a config toggle. Start it early if
  you want phone login at launch.

**Recommendation for the MVP:** email for buyers, landowners, admins and inspectors; phone
OTP for workers, enabled once DLT clears. Build the auth layer so the channel is a per-role
config value, not a hardcoded branch — then switching costs nothing later.

> ✅ **Verify (only if enabling now):** a real handset receives an OTP.

---

## 5 · Schema ownership

This is the part that breaks projects.

**Supabase owns the `auth` schema. Prisma owns `public`.** Prisma must never generate a
migration that touches `auth`, `storage`, or `realtime` — dropping or altering them breaks
authentication for everyone, irreversibly on prod.

Guard it:

1. Scope the connection to `public` by appending `&schema=public` to both URLs.
2. **Review every generated migration before applying it.** If a migration mentions `auth.`,
   `storage.`, or `DROP SCHEMA`, stop and fix the schema file — do not apply it.
3. Never run `prisma migrate reset` against a project holding data you care about. It drops
   and recreates. Treat it as a dev-only command, and never point it at prod.

In `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Linking `public.User` to `auth.users`

`public.User.id` is a uuid equal to `auth.users.id` (CLAUDE.md §2). Two ways to create that
row on signup:

- **Application code** (recommended) — the `/api/auth/complete-profile` route creates it
  after first login. Visible in the codebase, testable, and role assignment runs through the
  same validation as everything else.
- **Postgres trigger** on `auth.users` insert — atomic, but it lives outside Prisma
  migrations, is invisible to anyone reading the repo, and cannot easily enforce the role
  rules below.

Take the application-code path. The trade is one edge case to handle: a user who exists in
`auth.users` but has no `public.User` row yet, because they abandoned signup halfway.
Middleware should route them back to profile completion rather than 500.

**Role assignment rule.** `/api/auth/complete-profile` accepts only `BUYER`, `LANDOWNER` and
`WORKER` as self-selected roles. `INSPECTOR` and `ADMIN` are assigned by an existing admin —
§29A.1 requires inspectors to be *authorized by AgriGrowth*, and self-service admin signup is
an open door. Enforce this server-side with an allowlist, not by hiding options in the UI.

> ✅ **Verify:** after Phase 1, `npx prisma migrate dev` creates tables in `public` and leaves
> `auth` untouched.

---

## 6 · Storage — optional

If you decide to use Supabase Storage instead of S3/R2 for evidence photos (§27), do it here:

- **Storage → New bucket** → `evidence`, **private** (not public).
- Access is granted through short-lived signed URLs generated server-side after an
  authorization check. Never make the bucket public — evidence photos are tied to identifiable
  land, people and contracts.
- Upload limit: 10 MB. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.

This is Phase 8's decision. Skipping it now costs nothing.

---

## 7 · Environment file

`.env.local` for development — **gitignored, never committed**:

```bash
# Supabase — Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key>"   # public by design
SUPABASE_SERVICE_ROLE_KEY="<service role key>"  # SERVER ONLY — bypasses all security

# Database — Settings → Database → Connection string
# Pooled, transaction mode (6543). Used by the app at runtime.
DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true&connection_limit=1&schema=public"
# Unpooled (5432). Used ONLY by prisma migrate.
DIRECT_URL="postgresql://...:5432/postgres?schema=public"
```

`.env.example` carries the same keys with empty values and the comments intact, and **is**
committed.

Confirm `.gitignore` contains `.env*.local` and `.env` before the first commit. A
service-role key in git history is a full database compromise, and rotating it means updating
every deployment.

---

## 8 · Verification

Before starting Phase 1, all six should pass:

- [ ] Both projects active, in `ap-south-1`
- [ ] `psql "$DIRECT_URL" -c "select 1;"` succeeds
- [ ] A test user created in the dashboard appears under Authentication → Users
- [ ] Redirect URLs allowlisted; no open wildcard
- [ ] `.env.local` populated and gitignored; `.env.example` committed
- [ ] Database password stored in a password manager

---

## Launch checklist

Not now — but write it down while it is fresh:

- [ ] Email confirmation re-enabled on prod
- [ ] Prod redirect URLs point at the real domain only
- [ ] Service-role key confirmed absent from the client bundle
      (`grep -r "service_role" .next/static` returns nothing)
- [ ] Database backups enabled (paid plan)
- [ ] Auth rate limits reviewed under **Authentication → Rate Limits**
- [ ] DLT registration complete, if phone OTP is live
