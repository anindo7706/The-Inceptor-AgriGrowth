# AgriGrowth — Build Plan

Working checklist for the phased build. Tick items as they land. Each phase has **exit
criteria** — do not start the next phase until they all pass.

- Spec: [`docs/PRD.md`](docs/PRD.md) · Conventions: [`CLAUDE.md`](CLAUDE.md) · Endpoints: [`docs/API_SURFACE.md`](docs/API_SURFACE.md)
- `§n` refers to a PRD section. `R-n` refers to a resolution in Part 1.

---

# Part 1 — Review findings

Read this before writing any schema. These are logical errors and gaps found by analyzing
the PRD against itself. **The first six change the data model**, so resolving them after
Phase 1 means a migration and a rewrite.

Each has a recommended resolution. Confirm or override them in Phase 0.

## Blocking — decide before Phase 1

### R-1 · Milestones and tasks belong to a parcel, not a contract

§17 says "a contract should generate milestones." But §8 lets one contract span **multiple
parcels, owned by different landowners, in different locations**. Those parcels have
different areas, different planting dates, different weather, and different worker counts.

One timeline per contract is wrong, and it breaks three downstream systems at once: workforce
sizing (§20 multiplies by land area — which parcel's?), weather rules (§18 needs coordinates
— which parcel's?), and evidence GPS (§26 compares against "the contract land coordinates" —
there are several).

> **Resolution:** `Milestone` and `Task` hang off **`ContractLand`**, not `Contract`. A
> contract's progress is the aggregate of its parcels' progress. This is the single most
> consequential decision in the schema.

### R-2 · Land is a point in §12 but a boundary in §29A

§12 registers "Land coordinates" and "Land size" — a point plus an area. But §29A.2 requires
an inspector to verify "the inspected field boundaries and location are consistent with the
registered land coordinates," and §8 draws parcels on a map. You cannot verify a boundary
against a point.

This also breaks GPS verification. §26 checks whether the worker is "within allowed radius"
of the land. With a centroid and a fixed radius, a 50-acre parcel fails legitimate check-ins
— its edge is roughly 450 m from the centre — while a 1-acre parcel accepts someone two
fields away.

> **Resolution:** store a **GeoJSON polygon** as the parcel boundary, with centroid and area
> derived from it. GPS verification tests point-in-polygon first, falling back to
> `distance ≤ boundary + configured tolerance`. Keep a point-only registration path for
> landowners who can only drop a pin, and flag those parcels as `GEOMETRY_APPROXIMATE`.

### R-3 · Nothing ever sets a planting date

§16 is explicit that tasks derive from "Crop + Planting Date + Crop Stage Rules." §17 needs
planned start and end dates for every milestone. But no flow in the PRD ever captures a
planting date — not the buyer demand wizard (§5), not contract acceptance (§13), not
activation (§14). Phase 6 cannot start without one.

> **Resolution:** `ContractLand.plantedAt`, nullable. On activation, seed it as
> `activationDate + crop.preparationLeadDays` and mark the timeline **provisional**. The
> landowner confirms or corrects the actual planting date; on confirmation the timeline
> regenerates from the real date. Follows §16's "monitor actual conditions, adjust future
> tasks."

### R-4 · Offers never expire, so land can be reserved forever

§47's land machine goes `AVAILABLE → RESERVED → UNDER_CONTRACT`. A parcel is reserved when
an offer is sent. If the landowner simply never opens the app, that parcel is locked out of
every other buyer's search permanently. No TTL exists anywhere in the PRD.

> **Resolution:** every offer carries `expiresAt` (config: `OFFER_TTL_HOURS`, default 72). A
> scheduled job releases expired offers, returns the parcel to `AVAILABLE`, writes an audit
> row, and notifies both parties.

### R-5 · A partially-accepted contract has no way to reach ACTIVE

§14 allows `PARTIALLY_ACCEPTED` and tracks "remaining production requirement." But offers go
only to the parcels the buyer picked (§10), and there is no re-offer path. If one of three
landowners declines, the contract is stuck: short on production, with no mechanism to find
more land and no defined failure state.

> **Resolution:** on decline or expiry, the platform re-offers to the next-best **candidate
> parcels** from the original suitability ranking, up to `MAX_REOFFER_ROUNDS`. If the
> shortfall persists, escalate to the buyer with three choices — accept reduced volume at a
> pro-rata price (R-7), extend the search radius, or cancel. Add `AWAITING_BUYER_DECISION`
> to the contract machine.

### R-6 · The three state machines contradict the sections that define them

§14, §17 and §47 give different vocabularies for the same machines:

| Entity | Listed in the feature section | Listed in §47 | Conflict |
|---|---|---|---|
| Contract | `UNDER_REVIEW` (§14) | absent | §4's "admin validates the request" step has no status |
| Contract | absent (§14) | `DECLINED` (§47) | terminal state not in the canonical list |
| Task | `UPCOMING`, `UNDER_REVIEW` (§17) | `SUBMITTED_FOR_REVIEW`, `REJECTED`, `REVIEW_REQUIRED` (§47) | two names for review, plus an unlisted rejection state |
| Land | `UNAVAILABLE` (§12) | absent (§47) | no transitions in or out |

`UNDER_REVIEW` is not cosmetic — §4's workflow requires admin validation between submission
and offer, and dropping it removes the platform's only gate on a bad contract request.

> **Resolution:** one canonical enum per entity in `src/lib/domain/state-machines/`, taking
> the **union** of both lists, with `UNDER_REVIEW` (contract) and `REVIEW_REQUIRED` (task)
> as the surviving review names. Write the full transition table including illegal
> transitions, and unit-test the rejections.

## Important — decide before the phase that needs them

### R-7 · Partial acceptance has no pricing rule *(Phase 5)*

The buyer proposes one amount for the whole demand (§10). If only 70 % of the land accepts,
§14 tracks the shortfall but §11 never says the money changes.

> **Resolution:** contract value scales pro-rata on estimated production from accepted
> parcels. Any reduction requires explicit buyer confirmation before activation — never
> silent. Landowner allocation splits pro-rata by `accepted area × crop yield`, which §11
> also leaves undefined for multi-parcel contracts.

### R-8 · The production forecast is circular and will look fake *(Phase 4 / 11)*

§7 computes required land as `quantity ÷ expected yield per acre`. §31 forecasts production
from land area and yield. Using one yield constant for both means the day-one forecast
always equals the ordered quantity exactly — a number that looks like a prediction but
contains no information.

> **Resolution:** two distinct constants. `planningYieldPerAcre` is conservative and includes
> the §7 safety buffer, used only to size land. `forecastYieldPerAcre` starts at the regional
> baseline and moves with crop health, weather and stage progress. Show the forecast as a
> range, never a point estimate, and label it estimated (§48).

### R-9 · Two contradictory payment triggers *(Phase 11)*

§4 and §45 settle after harvest and "final verification." §30 ends its chain at "Delivery
Confirmation → Payment / Settlement." Those are different events, potentially weeks apart.

> **Resolution:** they are separate ledger events, not one. **Landowner and worker payments**
> release on harvest verification. **Buyer settlement and commission recognition** occur on
> delivery confirmation at the warehouse. Model them independently from the first migration
> so Phase 13 does not require a payments rewrite.

### R-10 · The worker budget is fixed but worker cost is variable *(Phase 7 / 11)*

§11 fixes a worker budget when the contract is signed. §20 sizes the workforce dynamically
per stage, and §18 can SKIP whole tasks for weather. Actual spend will not match the budget.

> **Resolution:** treat the budget as a ceiling with variance tracking. Track
> `committed / spent / remaining`. Crossing `WORKER_BUDGET_ALERT_PCT` raises an admin alert;
> exceeding it blocks new job creation pending admin approval.

### R-11 · The risk index is load-bearing and undefined *(Phase 10 / 12)*

§29A.7 constrains how the risk index must behave but no section defines it. Meanwhile §14's
`AT_RISK` contract status — introduced back in Phase 5 — has no other input.

> **Resolution:** define it in Phase 10 as a 0-100 rules-based score over weighted signals
> (missed and delayed tasks, AI risk flags, weather stress, evidence anomalies, inspection
> findings). Ship v1 with the inspection weight present but zero; Phase 12 activates it with
> the **highest** weight, satisfying §29A.7's requirement that inspection outrank
> self-submitted photos.

### R-12 · A partially-completed job has no defined outcome *(Phase 8)*

A job may require 20 workers (§20). If 18 submit valid evidence and 2 fail GPS, the PRD does
not say whether the task completes, whether the job completes, or who gets paid.

> **Resolution:** task completion tests against a configurable
> `TASK_COMPLETION_THRESHOLD_PCT` of assigned workers verified. Payment is **per worker on
> that worker's own verified evidence**, independent of whether the task closed. Below the
> threshold, the task goes to `REVIEW_REQUIRED`, not `COMPLETED`.

### R-18 · One role per user breaks the most common rural case

Found while adapting the Arva reference, whose hero offers a single "I'm a Farmer" choice
(see [`DESIGN.md`](DESIGN.md) §5).

A smallholder who owns two acres **and** does paid work on a neighbour's land is both a
landowner and a worker. In rural India that is the common case, not an edge case. A single
`User.role` column forces that person into two accounts, two phone numbers, and two separate
identities in the audit log — which also corrupts worker performance history (§21) and the
contact-sharing rules (§23).

The PRD appears to have anticipated this and then lost it: **§46 lists `User` and `UserRole`
as two separate entities**, which is the shape of a join table, not a column. §3's prose then
describes each role as if it were exclusive.

> **Resolution:** `UserRole` is a join table — a user holds one or more roles. `INSPECTOR` and
> `ADMIN` remain admin-granted and are mutually exclusive with the self-service three
> (an inspector must not verify land they own or work; §29A.1's independence requirement).
> Authorization checks ask "does this user hold role X", never "is this user's role X".
> Signup collects **one** primary role; the second is added later from settings, and the app
> header gains a role switcher.

Decide this before Phase 2 — it changes the schema and every `requireRole()` call site.

## Gaps to fill in passing

- **R-13 · Inspector onboarding is undefined** (§29A.1 says only "authorized by AgriGrowth").
  Needs registration, admin approval, a service area, and an assignment rule — nearest
  available authorized inspector, excluding any prior involvement with that contract.
  *(Phase 12)*
- **R-14 · Notifications are referenced everywhere and specified nowhere.** Build a typed
  notification catalogue — event, recipient role, channel, template — in Phase 1 and add to
  it each phase, rather than scattering ad-hoc inserts. *(Phase 1)*
- **R-15 · Low AI confidence is not listed as an inspection trigger.** §29's sub-60 % branch
  says "request additional evidence or manual review"; §29A lists its own triggers and omits
  it. Make every inspection trigger a config row so the overlap is explicit. *(Phase 12)*
- **R-16 · "Contact shared if appropriate" (§22) is undefined.** Make it a rule: contacts
  unlock on assignment + acceptance (§23), are audit-logged on access, and re-lock when the
  assignment ends. *(Phase 7)*
- **R-17 · `UNAVAILABLE` land has no transitions** (§12 vs §47). Define it as an owner-set
  state, enterable only from `AVAILABLE`, blocked while `RESERVED` or `UNDER_CONTRACT`.
  *(Phase 3)*

---

# Part 2 — Phase checklist

## Phase 0 · Audit and decisions

*No application code.*

- [ ] Inventory the repository as it actually exists; report findings
- [ ] Confirm the **five-role** model (§3 lists four; §29A adds Inspector)
- [ ] Full entity list with fields and relations — §46 plus §29A and §30 entities
- [ ] Mark each entity: Phase 1 schema, or deferred to Phase 12/13
- [ ] Transition tables for all five state machines, including illegal transitions (R-6)
- [ ] Config key register: key, seed value, PRD section, owning phase
- [ ] Decide **R-1 … R-6** with the user — these change the schema
- [ ] Note **R-7 … R-17** against their phases
- [ ] Phase 1 implementation plan: files, order, verification

**Exit:** user has confirmed R-1 through R-6 and the role model.

## Phase 1 · Foundation

*§33, §34, §46, §47*

- [ ] **Prerequisite:** [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) complete — its
      §8 verification list passes
- [ ] Next.js + TypeScript strict, folder layout per CLAUDE.md §3
- [ ] Prisma pointed at Supabase Postgres: `DATABASE_URL` pooled, `directUrl` unpooled
- [ ] Prisma schema — Phase 1 entities, initial migration checked in
- [ ] `public.User.id` is a **uuid** mirroring `auth.users.id`; no app-generated user ids
- [ ] Prisma migrations touch `public` only — never the `auth` schema Supabase owns
- [ ] Money as `BigInt` paise from the **first** migration
- [ ] `ContractLand` carries milestones, tasks and `plantedAt` (R-1, R-3)
- [ ] Land geometry column: polygon + derived centroid + area (R-2)
- [ ] `AuditLog` with actor, entity, from, to, reason, timestamp
- [ ] `PlatformConfig` table + `src/lib/config/` typed accessors — no magic numbers
- [ ] State machines with guarded transitions; illegal transitions throw (R-6)
- [ ] Zod validation, response envelope, typed errors, one shared route wrapper
- [ ] Prove the API layer: `GET /api/categories`, `GET /api/crops`
- [ ] Notification catalogue scaffold (R-14)
- [ ] `prisma/seed.ts` — categories, crops, ≥2 full crop plans (paddy + one vegetable),
      every config key, one demo user per role, `isDemo` flag
- [ ] Integration interfaces in `src/lib/integrations/` as marked stubs — no live calls
- [ ] Tailwind v4 `@theme` seeded from `docs/design/theme.css` **plus** the semantic tokens
      and the `muted` replacement in DESIGN.md §2 — `pewter` forbidden in app code
- [ ] Status → colour map exported as one object (DESIGN.md §7)
- [ ] Motion tokens — durations and easings — in the same `@theme` block (DESIGN.md §12.1)
- [ ] `prefers-reduced-motion` handled by substitution, not deletion (§12.6)
- [ ] Vitest configured; state machines and config accessors tested
- [ ] `.env.example` with a comment per variable
- [ ] npm scripts: `dev verify test test:e2e db:migrate db:seed db:studio`

**Exit:** `npm run verify` green · seed runs on a clean database · every state machine
rejects its illegal transitions in a test.

## Phase 2 · Auth and roles

*§35*

- [ ] Decide first: **email-only, or phone OTP for workers** (SMS provider + cost)
- [ ] Decide: **Google sign-in** — buyer/landowner paths only, or not at all (DESIGN.md §5.1)
- [ ] Supabase Auth via `@supabase/ssr` — browser, server and middleware clients
- [ ] Middleware refreshing the session cookie on every request
- [ ] Signup → `public.User` row created with the Supabase uuid and a role
- [ ] Login, logout, session, password reset
- [ ] Decide **R-18** first: `UserRole` join table vs single `role` column
- [ ] Five roles: `BUYER LANDOWNER WORKER INSPECTOR ADMIN`
- [ ] Split-screen login per DESIGN.md §5.1 — our radii, not the reference's 12px
- [ ] Single email-or-phone field; detect identifier type and route to the right method
- [ ] Sign-up link present (the reference omits it), OTP entry screen, all error states
- [ ] Login responsive: photo panel → banner → header strip; marketing copy removed on mobile
- [ ] Three-card role entry screen, plain language (DESIGN.md §5.2) — not Arva's two pills
- [ ] Self-service roles limited to `BUYER LANDOWNER WORKER`; inspector and admin granted
- [ ] Role switcher in the header if R-18 lands as multi-role
- [ ] `requireRole()` reading **`public.User.role`**, never `user_metadata`
- [ ] Server-side checks use `getUser()`, never `getSession()`
- [ ] Service-role key server-only; absent from the client bundle and from `NEXT_PUBLIC_*`
- [ ] Role-protected layouts per route group
- [ ] Negative tests: buyer → admin route, worker → contract mutation, landowner → another
      landowner's contract — all denied
- [ ] **Escalation test:** a worker who writes `role: ADMIN` into their own `user_metadata`
      gains nothing
- [ ] Demo OTP path removed (§35)

**Exit:** every Phase 1 route enforces a role · negative and escalation tests pass · no
service-role key in the client bundle.

## Phase 3 · Land management

*§12, §37*

- [ ] Land registration: owner, boundary, area, availability, optional soil and irrigation
- [ ] Map draw-polygon input, with drop-a-pin fallback → `GEOMETRY_APPROXIMATE` (R-2)
- [ ] Derived centroid and area; reject self-intersecting polygons
- [ ] Land state machine incl. `UNAVAILABLE` (R-17)
- [ ] CRUD + `/api/lands/available` + `/api/lands/search`
- [ ] Availability query excludes reserved, contracted and admin-blocked parcels
- [ ] Landowner dashboard: land list and status

**Exit:** a landowner can register a parcel and toggle availability · unavailable land never
appears in buyer search.

## Phase 4 · Buyer demand flow

*§5-§10, §38*

- [ ] Category → crop selection, backend-driven (§6)
- [ ] Quantity input → land estimation using `planningYieldPerAcre` (R-8)
- [ ] `src/lib/domain/land-estimation.ts` — pure, config-driven, unit-tested
- [ ] `src/lib/domain/suitability.ts` — 0-100 score, rule-based (§9), unit-tested
- [ ] Map view of available parcels with area, suitability and status
- [ ] Multi-parcel selection with running total against required production
- [ ] Selection blocked for contracted, unavailable, crop-incompatible or restricted land
- [ ] Financial proposal constrained to the admin range (§10)
- [ ] Demand submission → contract request
- [ ] Suitability and estimates labelled **estimated**, never guaranteed (§9, §48)

**Exit:** buyer completes crop → quantity → estimate → map → parcels → proposal → submit,
against seeded data.

## Phase 5 · Contract engine

*§10, §11, §13, §14, §47*

- [ ] Contract creation from demand; `DRAFT → SUBMITTED → UNDER_REVIEW` (R-6)
- [ ] Admin validation gate (§4)
- [ ] Offer generation to selected parcels' owners, with `expiresAt` (R-4)
- [ ] Land reserved on offer; **serializable transaction with row lock**
- [ ] Landowner accept / decline
- [ ] Partial fulfilment accounting: required, accepted, estimated, remaining (§14)
- [ ] Re-offer rounds on decline or expiry (R-5)
- [ ] `AWAITING_BUYER_DECISION` escalation on persistent shortfall (R-5)
- [ ] Offer expiry job releasing reserved land (R-4)
- [ ] Pro-rata contract value on partial acceptance, **buyer-confirmed** (R-7)
- [ ] `src/lib/domain/finance.ts` — split, commission, per-landowner pro-rata (R-7)
- [ ] Activation: land → `UNDER_CONTRACT`, `plantedAt` seeded provisionally (R-3)
- [ ] Concurrency test: two buyers racing for one parcel — exactly one wins
- [ ] Concurrency test: landowner accepting twice — second is rejected

**Exit:** full contract lifecycle to `ACTIVE` · money reconciles to the total in paise · both
race tests pass.

## Phase 6 · Crop timeline and tasks

*§15-§17, §40*

- [ ] Admin-editable crop plans: stages, activities, evidence and worker rules
- [ ] `src/lib/domain/crop-timeline.ts` — plan + planting date → milestones, unit-tested
- [ ] **Milestones and tasks generated per `ContractLand`** (R-1)
- [ ] Provisional timeline on activation; landowner confirms actual planting date (R-3)
- [ ] Timeline regenerates on confirmation, preserving completed work
- [ ] Task machine with the unified vocabulary (R-6)
- [ ] Contract progress aggregates parcel progress
- [ ] Notifications on milestone start and task assignment (R-14)
- [ ] Test: two crops with different durations produce genuinely different schedules (§16)

**Exit:** paddy and the vegetable crop generate distinct, crop-correct timelines · a
three-parcel contract produces three independent timelines.

## Phase 7 · Workforce

*§19-§24, §42*

- [ ] `src/lib/domain/workforce.ts` — `area × workerFactor × taskFactor`, per parcel (R-1),
      unit-tested
- [ ] Admin-configurable factors per task type (§20)
- [ ] Job creation on stage entry only, not continuously (§24)
- [ ] Worker eligibility by location and availability (§21)
- [ ] Job feed: title, crop, location, date, duration, payment
- [ ] Accept / decline with **row-locked** capacity checks
- [ ] Overbooking, over-assignment and filled-job acceptance all rejected at the DB level
- [ ] Job machine: `OPEN → PARTIALLY_FILLED → FILLED → IN_PROGRESS → COMPLETED`
- [ ] Contact unlock on assignment + acceptance, audit-logged, re-locking on release (R-16)
- [ ] Worker budget tracking: committed / spent / remaining (R-10)
- [ ] Concurrency test: 30 workers racing for 20 slots — exactly 20 succeed

**Exit:** stage entry creates correctly-sized per-parcel jobs · the race test passes ·
contacts are invisible before acceptance.

## Phase 8 · GPS and evidence

*§25-§27, §41*

- [ ] `src/lib/domain/gps.ts` — point-in-polygon, then distance with tolerance (R-2)
- [ ] Verdicts: `VERIFIED TOO_FAR LOW_ACCURACY LOCATION_DENIED REVIEW_REQUIRED`
- [ ] Check-in / check-out with lat, lng, accuracy, timestamp
- [ ] Presigned upload; DB stores URL and metadata only (§27)
- [ ] Evidence linked to contract, parcel, milestone, task, user, timestamp, location
- [ ] Configurable evidence requirements per task type (§25)
- [ ] Upload state motion: queued / uploading / uploaded / failed, per DESIGN.md §12.4 —
      `scaleX` progress, no shake on failure
- [ ] GPS acquiring → verdict resolves with identical motion for every verdict
- [ ] Task completion threshold; sub-threshold → `REVIEW_REQUIRED` (R-12)
- [ ] Per-worker payment eligibility on that worker's own evidence (R-12)
- [ ] GPS never treated as sole proof (§26)
- [ ] Test: large-parcel edge check-in passes; neighbouring-field check-in fails

**Exit:** a worker completes the full check-in → work → evidence → submit → verify loop ·
the large-parcel test passes.

## Phase 9 · Weather

*§18, §43*

- [ ] `WeatherProvider` interface + Open-Meteo implementation
- [ ] Per-parcel coordinates (R-1); forecast, current, historical rainfall
- [ ] Caching and graceful degradation — the platform works when weather is down (§32)
- [ ] `src/lib/domain/weather-rules.ts` → `PROCEED | SKIP | DELAY | REVIEW`, unit-tested
- [ ] Rules configurable per crop and task type; thresholds in config
- [ ] Skipped and delayed tasks record a human-readable reason (§18)
- [ ] Landowner notified with the explanation
- [ ] Test: heavy rainfall skips irrigation and does **not** skip harvest

**Exit:** weather changes a real task recommendation and the reason surfaces in the UI.

## Phase 10 · AI

*§28, §29, §31, §32, §44*

- [ ] `CropAnalyzer` interface; Anthropic implementation, server-side only
- [ ] `claude-opus-5`, adaptive thinking, structured outputs (CLAUDE.md §2)
- [ ] Image validation before dispatch
- [ ] Result: analysis, confidence, risk level, recommendations, review flag
- [ ] Confidence thresholds from config → `NORMAL WARNING HIGH_RISK REVIEW_REQUIRED` (§29)
- [ ] Admin review queue for high-risk alerts
- [ ] `src/lib/domain/risk.ts` — risk index v1, inspection weight present but zero (R-11)
- [ ] `AT_RISK` contract status driven by the index (§14)
- [ ] Production forecast using `forecastYieldPerAcre`, shown as a range (R-8)
- [ ] Platform degrades cleanly when AI is unavailable (§32)
- [ ] Every AI output labelled estimated with confidence, never a diagnosis (§28)

**Exit:** a crop image produces a stored analysis with confidence · a low-confidence result
lands in the admin queue · disabling the AI key breaks nothing else.

## Phase 11 · Payments

*§11, §45*

- [ ] Ledger: buyer payment, landowner allocation, worker payments, commission
- [ ] Statuses: `PENDING AUTHORIZED PAID FAILED REFUNDED`
- [ ] **Separate** triggers — landowner and worker on harvest verification, buyer settlement
      and commission on delivery confirmation (R-9)
- [ ] Worker budget variance alerts and over-budget block (R-10)
- [ ] All amounts integer paise; ledger reconciles to the contract total exactly
- [ ] Simulated settlement behind a `PaymentProvider` interface
- [ ] Server-side financial records only (§45)
- [ ] Test: full contract's ledger sums to the contract value, to the paisa

**Exit:** an end-to-end contract produces a balanced ledger.

## Phase 12 · Field inspection

*§29A*

- [ ] Inspector registration, admin authorization, service area (R-13)
- [ ] Assignment rule: nearest available authorized inspector, prior involvement excluded
- [ ] `InspectionJob` with unique Job ID, linked to contract, parcel, milestone, inspector
- [ ] Configurable triggers, incl. the low-AI-confidence overlap (R-15)
- [ ] Multi-area field evidence — a single sample cannot represent the parcel (§29A.4)
- [ ] Inspector GPS + accuracy + photo/video capture
- [ ] Outcomes: `VERIFIED VERIFIED_WITH_OBSERVATIONS EVIDENCE_MISMATCH REINSPECTION_REQUIRED HIGH_RISK SUSPECTED_FRAUD FAILED`
- [ ] **Append-only** records; corrections add rows and never overwrite (§29A.8)
- [ ] Inspection weight activated in the risk index at the highest weighting (R-11, §29A.7)
- [ ] Failure actions: review, re-inspection, risk adjustment, payment hold, dispute
- [ ] Inspectors see only their own assigned jobs
- [ ] Test: healthy-photo submission plus a failed inspection **raises** contract risk

**Exit:** the §29A.4 bypass scenario is defeated · the audit trail reconstructs every
inspection decision.

## Phase 13 · Logistics

*§30*

- [ ] `CollectionCenter` registry with coordinates and capacity
- [ ] Nearest-centre selection from parcel coordinates
- [ ] `HarvestLot` per parcel: farm → centre last-mile leg
- [ ] Physical weighing and quality recording at the centre
- [ ] Aggregation of lots into a `Shipment`
- [ ] Bulk transport leg: centre → warehouse / buyer
- [ ] Delivery confirmation → buyer settlement (R-9)
- [ ] Traceability: farm → centre → warehouse → buyer, per lot
- [ ] Route optimization, fleet tracking and transporter database explicitly **not** built,
      and not claimed anywhere in the UI (§30)

**Exit:** three parcels' harvests aggregate into one shipment with an intact trace.

## Phase 14 · MVP acceptance

- [ ] Playwright test covering the PRD's *MVP Success Criteria*, start to finish
- [ ] Demo, estimated, AI-predicted and verified data visually distinguished (§48)
- [ ] Contrast audit: every field screen clears 7:1; no `pewter` in app code
- [ ] Field screens verified at 16px type floor and 48px touch targets
- [ ] Motion audit: 60fps on a mid-range Android; no layout-triggering properties animated
- [ ] Bundle check: no animation library in the worker or inspector routes (§12.7)
- [ ] No count-up animation on any estimated value (§12.5)
- [ ] No secret reachable from the client bundle
- [ ] Every tunable is a config row — grep the codebase for stray numeric literals
- [ ] `.env.example` complete
- [ ] Seed produces a demoable dataset from empty

**Exit:** the full flow runs green against seeded data.

---

# Part 3 — Every phase

Check these before declaring any phase done.

- [ ] Calculations live in `src/lib/domain/` as pure functions, unit-tested at boundaries
- [ ] Orchestration lives in `src/lib/services/`, inside transactions
- [ ] Every status change goes through a state machine and writes an `AuditLog` row
- [ ] Every mutation validates role and ownership server-side
- [ ] Every tunable reads from config, not a literal
- [ ] Money is `BigInt` paise everywhere
- [ ] Estimates are labelled as estimates
- [ ] `npm run verify` green
- [ ] Changed files and new env vars reported
- [ ] No earlier phase was modified without saying so first
