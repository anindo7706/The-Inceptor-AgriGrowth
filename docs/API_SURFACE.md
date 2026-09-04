# API surface

Two lists: **external services** we call out to, and the **internal API** we build.

Endpoints marked **(PRD)** are written verbatim in the PRD. Endpoints marked **(inferred)**
are not enumerated there but are required by behaviour the PRD describes — confirm them
during the Phase 0 audit before building.

---

## Part 1 — External services

| Service | Used for | Key? | Cost | Phase |
|---|---|---|---|---|
| **Supabase Auth** | Login, signup, sessions (§35) | Yes | Free to 50k monthly active users | 2 |
| **Supabase Postgres** | The database — same project as Auth | Yes | Free tier, then paid | 1 |
| **Open-Meteo** | Forecast + historical rainfall (§18, §43) | No | Free under 10k calls/day, non-commercial | 9 |
| **OpenStreetMap tiles** | Map basemap for land selection (§8) | No | Free, light use only — see caveat | 4 |
| **MapLibre GL JS** | Map rendering library (client-side) | No | Open source | 4 |
| **Browser Geolocation** | Worker GPS check-in (§26) | No | Free — `navigator.geolocation`, not a network API | 8 |
| **Anthropic API** | Crop image analysis, vision (§28, §44) | Yes | Paid, per token | 10 |
| **S3-compatible storage** | Evidence photos (§27) — Cloudflare R2 or AWS S3 | Yes | R2: free egress; S3: paid | 8 |
| **Nominatim** (optional) | Address → coordinates when registering land | No | Free, 1 req/sec hard cap | 3 |
| **SMS provider** | Phone OTP login, later worker alerts | Yes | Paid, per message | 2 (if phone login) |
| **Payment gateway** (deferred) | Real settlement (§45) | Yes | Paid | post-MVP |

### Caveats worth deciding early

- **OSM tiles are not a production CDN.** `tile.openstreetmap.org` is fine for development
  and demos, but its usage policy prohibits heavy or commercial traffic. Before launch, move
  to MapTiler, Protomaps, or self-hosted tiles. The MapLibre code does not change — only the
  style URL. Budget for this.
- **Open-Meteo's free tier is non-commercial.** Same shape of problem: fine now, needs their
  paid plan (or a swap to another provider) at launch. The `WeatherProvider` interface in
  `src/lib/integrations/weather/` is what makes that a config change.
- **Nominatim is rate-limited to 1 request/second** and requires attribution. Only use it if
  landowners type addresses instead of dropping a map pin. Dropping a pin avoids the
  dependency entirely — prefer that.
- **SMS is now a Phase 2 question, not a post-MVP one.** Supabase supports phone OTP, which
  suits a rural workforce far better than email — but it needs an SMS provider (Twilio,
  MSG91) wired into the Supabase project, and every OTP costs money. Decide before Phase 2:
  email-only for the MVP demo, or phone OTP for workers from the start. §21 and §24 also
  assume workers get notified when their stage arrives, which pushes the same way.
- **Supabase Storage could replace S3/R2.** It is in the same project, uses the same keys,
  and would drop one vendor and one set of credentials from the stack. Not changed here
  because you only asked about auth — say the word and I will switch Phase 8.

Keys needed for the MVP: **Supabase** (URL, anon key, service-role key, database URL),
**Anthropic**, and **object storage**. Maps and weather stay keyless.

---

## Part 2 — Internal API

Route root is `src/app/api/`. Every route: validate with Zod → authenticate → authorize by
role → execute → structured response. No exceptions (§34).

### Auth — Phase 2 (§35)

Supabase handles the credential exchange itself — signup, login, OTP, password reset and
token refresh happen against Supabase, not against routes we write. What we own is the
session bridge and the app-side user record.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/auth/callback` | (inferred) exchanges the Supabase code for a cookie session |
| POST | `/api/auth/signout` | (inferred) clears the session cookie |
| GET | `/api/auth/me` | (inferred) current `public.User` row — id, role, profile |
| POST | `/api/auth/complete-profile` | (inferred) creates the `public.User` row after first signup, with role |

Middleware refreshes the Supabase session on every request. Role protection is the point: a
buyer cannot reach admin routes, a worker cannot modify contracts, a landowner cannot read
another landowner's contracts — all checked against `public.User.role`, never against
`user_metadata` (see CLAUDE.md §2).

### Crops and categories — Phase 1 (§36)

| Method | Path | Role | |
|---|---|---|---|
| GET | `/api/categories` | any | (PRD) |
| GET | `/api/categories/{id}/crops` | any | (PRD) |
| GET | `/api/crops` | any | (PRD) |
| GET | `/api/crops/{id}` | any | (PRD) |
| POST | `/api/crops` | admin | (PRD) |
| PATCH | `/api/crops/{id}` | admin | (PRD) |
| DELETE | `/api/crops/{id}` | admin | (PRD) |
| GET/PUT | `/api/admin/config` | admin | (inferred) — the tunables in CLAUDE.md §4.4 |

### Land — Phase 3 (§37)

| Method | Path | Role | |
|---|---|---|---|
| POST | `/api/lands` | landowner | (PRD) |
| GET | `/api/lands` | landowner/admin | (PRD) |
| GET | `/api/lands/{id}` | owner/admin | (PRD) |
| PATCH | `/api/lands/{id}` | owner | (PRD) |
| DELETE | `/api/lands/{id}` | owner | (PRD) |
| GET | `/api/lands/available` | buyer | (PRD) — the map query |
| GET | `/api/lands/search` | buyer | (PRD) — filter by crop, radius, area |

`/api/lands/available` must exclude land that is under contract, reserved, incompatible with
the crop, or blocked by admin rule (§8).

### Buyer demand — Phase 4 (§38)

| Method | Path | Role | |
|---|---|---|---|
| POST | `/api/demands` | buyer | (PRD) |
| GET | `/api/demands` | buyer/admin | (PRD) |
| GET | `/api/demands/{id}` | owner/admin | (PRD) |
| PATCH | `/api/demands/{id}` | buyer/admin | (PRD) |
| POST | `/api/demands/estimate-land` | buyer | (inferred) — §7 quantity → required area |
| GET | `/api/lands/{id}/suitability?cropId=` | buyer | (inferred) — §9 score |

### Contracts — Phase 5 (§39)

| Method | Path | Role | |
|---|---|---|---|
| POST | `/api/contracts` | buyer | (PRD) |
| GET | `/api/contracts` | any (scoped) | (PRD) |
| GET | `/api/contracts/{id}` | party/admin | (PRD) |
| PATCH | `/api/contracts/{id}` | admin | (PRD) |
| POST | `/api/contracts/{id}/accept` | landowner | (PRD) |
| POST | `/api/contracts/{id}/decline` | landowner | (PRD) |
| GET | `/api/contracts/{id}/allocation` | party/admin | (inferred) — §11 financial split |

Accept/decline are the concurrency hotspot: serializable transaction, row lock on the land
parcels, partial-fulfilment accounting (§14).

### Tasks and milestones — Phase 6 (§40)

| Method | Path | Role | |
|---|---|---|---|
| GET | `/api/contracts/{id}/tasks` | party | (PRD) |
| POST | `/api/tasks` | system/admin | (PRD) |
| GET | `/api/tasks/{id}` | party | (PRD) |
| PATCH | `/api/tasks/{id}` | party | (PRD) |
| POST | `/api/tasks/{id}/complete` | worker | (PRD) — triggers verification |
| GET | `/api/contracts/{id}/milestones` | party | (inferred) |

### Workforce — Phase 7 (§42)

| Method | Path | Role | |
|---|---|---|---|
| GET | `/api/jobs` | worker | (PRD) |
| POST | `/api/jobs` | system/landowner | (PRD) |
| GET | `/api/jobs/{id}` | worker/party | (PRD) |
| POST | `/api/jobs/{id}/accept` | worker | (PRD) |
| POST | `/api/jobs/{id}/decline` | worker | (PRD) |
| GET | `/api/workers/available` | landowner/admin | (PRD) |

Accept must reject double-booking, over-assignment, and already-filled jobs at the database
level, not in application logic (§22).

### GPS and evidence — Phase 8 (§41, §26)

| Method | Path | Role | |
|---|---|---|---|
| POST | `/api/evidence/upload` | worker/landowner | (PRD) — returns presigned URL |
| GET | `/api/evidence/{id}` | party | (PRD) |
| GET | `/api/tasks/{id}/evidence` | party | (PRD) |
| POST | `/api/tasks/{id}/checkin` | worker | (inferred) — §26 |
| POST | `/api/tasks/{id}/checkout` | worker | (inferred) — §26 |

### Weather — Phase 9 (§43)

| Method | Path | Role | |
|---|---|---|---|
| GET | `/api/weather?landId=` | party | (inferred) — current + forecast + rainfall |
| POST | `/api/weather/evaluate-task` | system | (inferred) — returns `PROCEED \| SKIP \| DELAY \| REVIEW` |

### AI — Phase 10 (§44)

| Method | Path | Role | |
|---|---|---|---|
| POST | `/api/ai/analyze-crop` | system/party | (PRD) |
| GET | `/api/ai/alerts` | admin | (inferred) — §29 review queue |
| POST | `/api/ai/alerts/{id}/review` | admin | (inferred) |

Returns analysis + confidence + risk level + recommendations + whether review is required.
Never a guaranteed diagnosis (§28).

### Payments — Phase 11 (§45)

| Method | Path | Role | |
|---|---|---|---|
| GET | `/api/payments` | scoped | (inferred) |
| GET | `/api/contracts/{id}/payments` | party | (inferred) |
| POST | `/api/payments/{id}/settle` | admin | (inferred) — simulated in MVP |

### Notifications — Phase 6 onward (§34)

| Method | Path | Role | |
|---|---|---|---|
| GET | `/api/notifications` | any | (inferred) |
| PATCH | `/api/notifications/{id}/read` | owner | (inferred) |

### Field inspection — Phase 12 (§29A)

Not enumerated in the PRD at all. All inferred from §29A's described behaviour:

| Method | Path | Role |
|---|---|---|
| POST | `/api/inspections` | system/admin — create inspection job |
| GET | `/api/inspections` | inspector/admin — scoped to assignee |
| GET | `/api/inspections/{id}` | assignee/admin |
| POST | `/api/inspections/{id}/accept` | inspector |
| POST | `/api/inspections/{id}/submit` | inspector — findings + GPS + photos |
| POST | `/api/inspections/{id}/review` | admin — final outcome |
| GET | `/api/contracts/{id}/risk` | party/admin — risk index (§29A.7) |

Inspection records are append-only. A correction creates a new record and an audit entry; it
never overwrites the original (§29A.8).

### Logistics — Phase 13 (§30)

Also entirely inferred:

| Method | Path | Role |
|---|---|---|
| GET/POST | `/api/logistics/collection-centers` | admin |
| GET | `/api/logistics/collection-centers/nearest?landId=` | any party |
| POST | `/api/logistics/harvest-lots` | landowner |
| POST | `/api/logistics/harvest-lots/{id}/receive` | collection center |
| POST | `/api/logistics/shipments` | admin |
| POST | `/api/logistics/shipments/{id}/deliver` | admin |

Two-stage only: farm → collection center, then aggregated bulk → warehouse/buyer. Route
optimization, fleet tracking and a transporter database are explicitly out of scope (§30).

---

## Counting it

Roughly **65 internal endpoints**, of which the PRD names about 40 directly. **9 external
services**, of which 2 need paid keys for the MVP and 2 more need paid plans before launch.
