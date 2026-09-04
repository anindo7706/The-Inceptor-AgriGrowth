# CLAUDE.md — AgriGrowth

Digital agricultural contract platform connecting **Buyers**, **Landowners**, **Workers**,
**Inspectors**, and **Admins**. Buyers contract crop production against real land parcels;
the platform generates crop-specific timelines, dispatches workers by stage, verifies work
with GPS + photo + AI + physical inspection, and tracks payments.

**The spec is [`docs/PRD.md`](docs/PRD.md).** Read the relevant sections before implementing
any feature. Section numbers below (`§7`, `§29A`) refer to it. When this file and the PRD
disagree, the PRD wins on *what* to build; this file wins on *how*.

[`PLAN.md`](PLAN.md) is the working checklist — resolutions to the PRD's logical gaps
(`R-1` … `R-17`), then a tickable task list and exit criteria per phase. Read Part 1 before
writing any schema; several resolutions change the data model.

[`docs/API_SURFACE.md`](docs/API_SURFACE.md) lists every external service and every internal
endpoint, phase by phase, marking which the PRD specifies and which are inferred.
[`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) is the one-time project setup, done
before Phase 1.

[`DESIGN.md`](DESIGN.md) is the visual reference. Read Part 2 before building any screen —
those constraints (field use, estimated-vs-verified styling, status colour mapping) come
from the PRD and are not negotiable by visual preference.

---

## 1. Project state

The repository is **greenfield** — there is no application code yet, despite the PRD (§48)
describing an "existing frontend" to reuse. Phase 0 must confirm this before anything else:

- If the repo is genuinely empty → scaffold from scratch per §2 below.
- If prototype code appears later (dropped in by the user) → **audit first, do not rewrite.**
  Convert mock data to real data page by page. §48's "do not rebuild working pages" applies.

---

## 2. Stack (decided — do not substitute without asking)

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript `strict` | Server Components by default; `"use client"` only where interactivity demands it |
| UI | Tailwind CSS + shadcn/ui | No second component library |
| DB | PostgreSQL (Supabase-hosted) + Prisma | Same instance Supabase Auth uses. Migrations checked in; never `db push` outside local scratch work |
| Validation | Zod | One schema per endpoint, shared between route handler and client form |
| Auth | **Supabase Auth** (`@supabase/ssr`), cookie sessions | Replaces the PRD's demo OTP (§35). See below — role handling has a trap |
| Maps | MapLibre GL JS + OpenStreetMap tiles | No API key, no billing — matters for a rural-India MVP |
| Weather | Open-Meteo | Free, no key, gives forecast **and** historical rainfall (needed for §18) |
| Image storage | S3-compatible (R2/S3) via presigned PUT | DB stores URL + metadata only (§27). Local-disk driver for dev |
| AI | Anthropic SDK (`@anthropic-ai/sdk`), model `claude-opus-5` | Vision for crop images (§28). Server-side only |
| Payments | Simulated ledger, no gateway | Real integration is post-MVP (§45); keep the adapter seam |
| Tests | Vitest (unit/integration) + Playwright (the MVP end-to-end flow) | |

### Supabase Auth usage

Supabase provides **authentication and the Postgres database**. Prisma connects directly to
that same Postgres instance — one database, not two.

- `public.User.id` is a **uuid** equal to `auth.users.id`. Never generate app-side user ids;
  the row is created on signup from the Supabase user id.
- **Roles come from the database, and only from there.** Never read a role from
  `user_metadata` — it is writable by the authenticated user, so a worker could make
  themselves an admin. If a role must travel in the JWT, put it in `app_metadata`
  (service-role writes only) and still treat the database as the source of truth on every
  mutation. Whether that is `User.role` or a `UserRole` join table is **PLAN.md R-18**,
  pending — write authorization as *"does this user hold role X"* so either answer fits.
- Server-side, verify with `supabase.auth.getUser()`, which revalidates against Supabase.
  Do **not** authorize on `getSession()` — it trusts the cookie without checking it.
- The service-role key is server-only and never appears in a client bundle or a
  `NEXT_PUBLIC_*` variable. The anon key is public by design; that is fine.
- **Prisma bypasses Row Level Security** because it connects as the database owner. RLS is
  therefore not protecting anything here. Every authorization check lives in
  `src/lib/auth/requireRole()` and the service layer. Do not assume otherwise.
- Prefer phone OTP for workers and email for buyers, landowners and admins (§35). Phone OTP
  needs an SMS provider configured in Supabase and costs money — see `docs/API_SURFACE.md`.

### Anthropic API usage

Only in `src/lib/integrations/ai/`, never in a client component and never in a route without
an auth check.

- Model id is exactly `claude-opus-5` — no date suffix.
- Use `thinking: { type: "adaptive" }` for analysis calls. Do **not** pass `budget_tokens`
  (removed on this model — returns 400).
- Use structured outputs via `output_config: { format: {...} }`, not the deprecated
  `output_format`, and not assistant prefill (prefill 400s on this model).
- Wrap every call behind a `CropAnalyzer` interface so the provider stays swappable (§44).
- Every result carries a `confidence` and maps to `NORMAL | WARNING | HIGH_RISK |
  REVIEW_REQUIRED` by the thresholds in §29 — and those thresholds live in DB config, not
  in code.

---

## 3. Repository layout

```text
docs/PRD.md                  canonical spec
prisma/schema.prisma         entities (§46)
prisma/seed.ts               crops, crop plans, config rules, demo users
src/app/(auth)/              login, register
src/app/(buyer)/             buyer dashboard + demand wizard (§5-§10)
src/app/(landowner)/         land management, contract offers (§12-§13)
src/app/(worker)/            job feed, GPS check-in, evidence upload (§21-§27)
src/app/(inspector)/         inspection jobs, field verification (§29A)
src/app/(admin)/             crops, rules, financial config, disputes, AI review
src/app/api/                 auth users crops lands demands contracts tasks
                             evidence workforce inspections weather ai logistics
                             payments notifications
src/lib/db/                  prisma client, transaction helpers
src/lib/auth/                session, requireRole()
src/lib/domain/              PURE business logic — no I/O, fully unit-tested
      land-estimation.ts       required area from quantity (§7)
      suitability.ts           0-100 land score (§9)
      crop-timeline.ts         crop plan + planting date -> milestones (§15-§17)
      workforce.ts             workers required by crop/stage/area (§19-§20)
      weather-rules.ts         PROCEED | SKIP | DELAY | REVIEW (§18)
      gps.ts                   distance + verification verdict (§26)
      finance.ts               contract split, commission (§11)
      risk.ts                  contract risk index (§29A.7)
      state-machines/          land, contract, task, job, inspection (§47)
src/lib/services/            orchestration: domain + db + external, inside transactions
src/lib/integrations/        weather/ ai/ storage/ payments/ — each behind an interface
src/lib/config/              typed accessors for DB-stored platform rules
src/components/              shared UI
```

**`src/lib/domain/` is the heart of this codebase.** Every calculation the PRD describes goes
there as a pure function taking explicit config, so it can be unit-tested without a database
and re-tuned by admins without a deploy.

---

## 4. Non-negotiable invariants

1. **Money is integer paise (`BigInt`).** Never a float, never a `Number` for currency.
   Format at the render edge only.
2. **All business rules validate server-side** (§48). Client-side checks are UX, never
   enforcement. Assume every request is hostile.
3. **No secrets outside the server.** Nothing sensitive in `NEXT_PUBLIC_*`. Weather, AI,
   storage and payment credentials are read only in server code (§33).
4. **Nothing tunable is hardcoded.** Yield per acre, worker factors, commission %, GPS
   radius, AI confidence thresholds, financial ranges, inspection triggers — all live in DB
   config tables seeded by `prisma/seed.ts` and read via `src/lib/config/`. A magic number
   in a component is a bug (§7, §11, §20, §29).
5. **Status changes go through the entity's state machine**, never a raw
   `prisma.contract.update({ status })`. Illegal transitions throw (§47).
6. **Every state change writes an `AuditLog` row** — actor, entity, from, to, reason,
   timestamp. Inspection results are append-only: corrections add records, they never
   overwrite (§29A.8).
7. **Estimated ≠ verified ≠ guaranteed.** Yield forecasts, suitability scores and AI results
   are typed and labelled as estimates in the UI. Never present them as guaranteed
   agricultural or financial outcomes (§9, §28, §31, §48).
8. **Concurrency is real.** Land reservation, contract acceptance and worker job acceptance
   run in a serializable transaction with row locks. Double-booking a worker or a land
   parcel is a correctness bug, not an edge case (§14, §22).
9. **GPS is evidence, not proof** (§26). A `VERIFIED` GPS check-in alone never closes a task
   that inspection rules have flagged.
10. **Contact details are shared only after assignment + acceptance** (§23). Enforce it in
    the serializer, not the template.

---

## 5. Build order — one phase at a time

Follow §48's phases in order. Do not start a phase before the previous one runs, is seeded,
and has tests.

`0` Audit · `1` Foundation (DB, Prisma, env, API skeleton, errors, seed) ·
`2` Auth + roles · `3` Land management · `4` Buyer demand flow ·
`5` Contract engine · `6` Crop timeline + tasks · `7` Workforce ·
`8` GPS + evidence · `9` Weather · `10` AI · `11` Payments ·
`12` Field inspection (§29A) · `13` Logistics (§30)

For each phase: state the plan → implement → run `npm run verify` → report **changed files**
and **new env vars**. Then stop and confirm before starting the next phase.

The MVP is done when the end-to-end flow in the PRD's *MVP Success Criteria* runs as a
Playwright test against seeded data.

---

## 6. Working rules

- **Read before writing.** Inspect the existing files and their callers before editing.
- **Ask before destructive or architectural changes** — schema rewrites, dependency swaps,
  deleting working code (§AI Agent Instructions).
- **Never break a working feature to add a new one.** If a change requires touching a
  completed phase, say so and confirm.
- **Every feature reaches the database.** Frontend state is not storage (§48).
- Prefer extending `src/lib/domain/` over adding logic to a route handler or component.
- Commit per phase, with a message naming the phase and the PRD sections implemented.

---

## 7. Known gaps in the PRD — resolve, don't silently guess

The PRD contradicts itself in places and leaves load-bearing rules undefined. **All of them,
with recommended resolutions, are in [`PLAN.md`](PLAN.md) Part 1 as `R-1` … `R-17`.** Do not
re-derive them; do not guess past them.

The six that change the data model, and so must be settled before Phase 1:

- **R-1** milestones and tasks belong to a parcel, not a contract
- **R-2** land is a point in §12 but a boundary in §29A — and a fixed GPS radius breaks on
  large parcels
- **R-3** nothing in the PRD ever sets a planting date, which §16 requires
- **R-4** offers never expire, so reserved land can be locked forever
- **R-5** a partially-accepted contract has no path to `ACTIVE`
- **R-6** §14, §17 and §47 give contradictory state vocabularies

Also settled there: five roles not four (§3 vs §29A), the entities §46 is missing, and the
scope limit on §30 logistics — two-tier collection only, no route optimization, no fleet
tracking, no transporter database, and no UI claiming otherwise.

---

## 8. Commands

```bash
npm run dev          # Next.js dev server
npm run verify       # typecheck + lint + unit tests — green before reporting done
npm run test         # vitest
npm run test:e2e     # playwright (the MVP end-to-end flow)
npm run db:migrate   # prisma migrate dev
npm run db:seed      # crops, crop plans, config rules, demo users
npm run db:studio    # prisma studio
```

Env vars are documented in `.env.example`. Every new integration adds its keys there in the
same commit, with a comment saying what breaks when the key is missing.
