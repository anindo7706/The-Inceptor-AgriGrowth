# Kickoff prompts

Paste **Prompt A** into a fresh Claude Code session in this directory to start development.
Everything after it is a per-phase continuation prompt.

---

## Prompt A — start development (Phase 0 + Phase 1)

```text
Read CLAUDE.md and docs/PRD.md in full before doing anything.

You are building AgriGrowth, the platform specified in docs/PRD.md. We are starting at
Phase 0 and going as far as Phase 1. Do not touch Phase 2 or later in this session.

PHASE 0 — Audit and plan (no code yet)

1. Inventory the repository as it actually is right now. Report what exists.
2. From the PRD, produce:
   - The complete role and permission matrix. Note that §3 names four roles but §29A adds
     an Inspector — confirm with me that we are modelling five.
   - The full entity list with fields and relations, covering §46 plus the entities §29A
     and §30 imply (inspection, risk, collection center, harvest lot, shipment). Mark which
     ones land in Phase 1 and which are deferred to Phases 12-13.
   - The state machines from §47 as explicit transition tables, including the illegal
     transitions.
   - Every tunable value the PRD mentions (yield per acre, worker factors, commission,
     GPS radius, AI confidence thresholds, financial ranges, inspection triggers) as a list
     of config keys, with the seed value you propose and the PRD section it comes from.
3. List every open question where the PRD is ambiguous enough that two readings give
   materially different code. For each, give me your recommended answer so I can just
   confirm. The five in CLAUDE.md §7 are a starting point, not the full list.
4. Give me the Phase 1 implementation plan: files you will create, in what order, and how
   you will verify it.

Stop there and wait for my confirmation. Do not write application code during Phase 0.

PHASE 1 — Foundation (only after I confirm)

Scaffold the project per CLAUDE.md §2 and §3 and deliver, working end to end:

- Next.js + TypeScript strict project with the folder layout in CLAUDE.md §3
- Prisma schema for the Phase 1 entity set, with a checked-in initial migration
- prisma/seed.ts seeding: crop categories and crops (§6), one full crop plan with stages
  for at least paddy and one vegetable (§15), every platform config key from your Phase 0
  list, and one demo user per role
- src/lib/config/ typed accessors reading those config rows — no magic numbers anywhere
- src/lib/db/ prisma client + a transaction helper
- A shared API layer: Zod request validation, a consistent JSON response envelope, typed
  error classes mapping to HTTP codes, and a single error handler wrapper used by every
  route. Prove it with GET /api/crops and GET /api/categories.
- src/lib/domain/state-machines/ with the §47 transition tables and a guarded transition
  function, unit-tested including rejected illegal transitions
- AuditLog writing on every transition
- .env.example with every variable and a comment on what breaks without it
- npm scripts: dev, verify, test, test:e2e, db:migrate, db:seed, db:studio
- Vitest configured, with real tests for the state machines and the config accessors

Constraints for this phase:
- Money as integer paise (BigInt) in the schema from the very first migration.
- No integrations yet — no weather, AI, storage or payment calls. Just the interfaces in
  src/lib/integrations/ with clearly-marked stub implementations.
- No UI beyond whatever is needed to prove the API works.

When Phase 1 is done: run npm run verify, show me the output, then report the files you
created, the env vars I need to set, and the exact commands to get a working local database.
Then stop.
```

---

## Prompt B — continue to the next phase

```text
Phase <N-1> is confirmed working. Read CLAUDE.md and the PRD sections for Phase <N>, then:

1. Show me the plan for Phase <N>: files, order, and the domain functions involved.
2. Implement it. Keep all calculations as pure functions in src/lib/domain/ with unit tests
   covering the boundary cases; put orchestration in src/lib/services/ inside transactions.
3. Do not modify anything from an earlier completed phase without telling me first and
   explaining why.
4. Run npm run verify, show the output, then report changed files and new env vars.

Stop after this phase.
```

---

## Prompt C — MVP acceptance run

```text
Every phase through 11 is complete. Write the Playwright test that walks the PRD's MVP
Success Criteria end to end against seeded data: buyer logs in, selects a crop, enters a
quantity, the system estimates land, buyer selects available parcels, submits a contract
request, landowner accepts, contract activates, crop-specific milestones generate, workers
get jobs, a worker accepts and GPS-checks in, uploads evidence, evidence stores, AI analysis
runs on the image, a weather rule changes a task recommendation, buyer and landowner see
progress, admin sees the risk, and payment plus commission records exist.

Run it. If a step fails, report the failure and the PRD section it violates before fixing
anything.
```
