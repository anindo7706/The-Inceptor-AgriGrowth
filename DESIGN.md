# DESIGN.md — AgriGrowth

Visual system, derived from the **Arva** reference (arva.com) and adapted for a five-role
platform used both at a desk and standing in a field.

**Source files** — treat as read-only reference, do not edit:

| File | What it is |
|---|---|
| [`docs/design/arva-reference.md`](docs/design/arva-reference.md) | The extracted Arva style guide, verbatim |
| [`docs/design/tokens.json`](docs/design/tokens.json) | Design tokens, W3C format |
| [`docs/design/variables.css`](docs/design/variables.css) | CSS custom properties |
| [`docs/design/theme.css`](docs/design/theme.css) | Tailwind v4 `@theme` block |
| [`docs/design/references/`](docs/design/references/) | Your own reference images |

This file is what we actually build to. Where it departs from Arva, the reason is stated.

---

## 1 · The core adaptation: two surfaces, one system

Arva is a **marketing site**. AgriGrowth is a marketing site *plus* five role-based
applications. Arva's own summary says its layout is "spacious and editorial, not
information-dense" — which is correct for a landing page and wrong for an admin review queue
or a worker's task list.

So the system splits in two. Same tokens, same palette, same shape language; different
density.

| | **Marketing surface** | **Application surface** |
|---|---|---|
| Where | Landing, role entry, about, public crop pages | Every signed-in screen |
| Treatment | Full Arva editorial — full-bleed photography, 57–80 px serif headlines, lime marquee, quilted pastel rows | Derived: same palette, tighter spacing, functional type scale |
| Type scale | `display` 80 / `heading-lg` 57 / `heading` 45 | `subheading` 24 max on app screens; 37 only on empty states |
| Section gap | 50 px | 24–30 px |
| Card padding | 30 px | 20 px desktop · 16 px mobile |
| Photography | Dominant, full-bleed | Absent. Content is data and evidence photos |

**Do not carry the editorial voice into the app.** A 57 px serif headline over a worker's job
list wastes the screen a worker is squinting at in sunlight. The serif appears in the app only
on empty states and confirmation screens.

---

## 2 · Palette

Arva's palette, unchanged. It suits the domain — the warm bone canvas and forest green read
agricultural rather than corporate, and the contrast is unusually good for a design of this
kind.

### Base — from Arva

| Token | Hex | Use |
|---|---|---|
| `forest-ink` | `#07503f` | Brand, header, nav, footer, primary action |
| `bone` | `#f1efdf` | Page canvas — **never** pure white |
| `pure-white` | `#ffffff` | Cards, inputs, surfaces on canvas |
| `ash-gray` | `#efefef` | Secondary card surface, dividers |
| `charcoal` | `#212529` | Primary text |
| `graphite` | `#353535` | Secondary text, borders |
| `moss` | `#c3cda7` | Borders and dividers only — **never text** (1.44:1) |
| `vivid-lime` | `#e8fe85` | Marketing marquee only. Not an app colour |
| `sky-card` `peach-card` `sage-card` | `#b2cee7` `#fceace` `#e6ecd5` | Quilted tiles, marketing |

### Two corrections

**`pewter` `#6d6d6d` is retired for body text.** It measures **4.47:1** on bone — below the
4.5:1 AA floor, and far below what a phone screen in direct sunlight needs. Arva uses it for
"muted helper text," which is exactly the case where it fails.

> Replacement: **`muted` `#545454`** — 6.55:1 on bone, 7.57:1 on white. Visually
> near-identical, and it passes. Keep `pewter` in the token file for marketing parity;
> forbid it in the app.

**Arva has no semantic colours.** Its rule — "do not introduce new saturated colours beyond
Forest Ink and Vivid Lime" — cannot survive contact with a platform that must show
`SUSPECTED_FRAUD` distinctly from `VERIFIED`. Resolved by adding *desaturated, earth-toned*
semantics that sit inside the palette's warmth rather than fighting it.

| Token | Hex | On bone | On white | Meaning |
|---|---|---|---|---|
| `verified` | `#07503f` | 8.15:1 | 9.42:1 | Confirmed by evidence — reuses the brand green deliberately |
| `estimated` | `#6b5220` | 6.36:1 | 7.36:1 | Forecast, score, AI result — warm ochre, provisional |
| `warning` | `#74400a` | 7.32:1 | 8.47:1 | Needs attention |
| `risk` | `#8f2018` | 7.60:1 | 8.79:1 | At risk, high risk, fraud — muted brick, not fire-engine red |
| `neutral` | `#353535` | 10.60:1 | 12.27:1 | Pending, upcoming |
| `muted` | `#545454` | 6.55:1 | 7.57:1 | Helper and tertiary text |

Every one clears 6:1 on both surfaces; four clear 7:1. All measured, not estimated.

### Verified base contrasts

| Pair | Ratio |
|---|---|
| Charcoal on bone | 13.33:1 |
| Graphite on bone | 10.60:1 |
| Forest ink on bone | 8.15:1 |
| White on forest ink | 9.42:1 |
| Charcoal on any pastel tile | 9.46 – 13.42:1 |

---

## 3 · Typography

### The font problem, stated plainly

**Reckless is a commercial licence** (Displaay). Arva's suggested substitutes — Cormorant
Garamond, GT Sectra, Source Serif — are Latin-only. **None of them, and not Inter either,
covers Devanagari.** If any screen shows Hindi or a regional language, a Latin-only stack
falls back mid-sentence and the UI looks broken.

Resolution — three roles, cleanly separated:

| Role | Font | Where |
|---|---|---|
| Editorial display | **Reckless**, or Cormorant Garamond as the free substitute | Marketing headlines ≥ 24 px, Latin only |
| UI and body | **Inter** | Everything functional. Already free, already in the tokens |
| Indic | **Noto Sans Devanagari** | Automatic fallback for Devanagari ranges, matched to Inter's metrics |

Never set a serif headline in a language the serif cannot render. If the marketing page is
translated, its headlines switch to Inter at a heavier weight — the editorial voice is a
Latin-only luxury.

**Drop from the tokens:** `FKGrotesk`, `Helvetica`, and the literal `sans-serif` family are
extraction artefacts from the scrape, not deliberate choices. Three fonts, not six.

### Scale

Marketing uses Arva's full scale. The app uses only the lower half:

| Token | Size | App usage |
|---|---|---|
| `caption` | 12 px | Timestamps, metadata. **Desktop only** — never on a field screen |
| `body-sm` | 14 px | Table cells, secondary text |
| `body` | 16 px | **Minimum on any worker or inspector screen** |
| `subheading` | 24 px | Card and section titles |
| `heading-sm` | 37 px | Empty states, confirmations |
| `heading` – `display` | 45–80 px | Marketing only |

Field screens have a 16 px floor. 12 px on a scratched phone in sunlight is not readable, and
no amount of contrast fixes it.

**Numerals:** enable tabular figures (`font-variant-numeric: tabular-nums`) on every quantity,
area, currency and date. Columns of ₹ figures that shift width while loading look broken.

---

## 4 · Shape, spacing, elevation

From Arva, kept:

- **Radii:** cards 20 px · inputs 33 px · buttons 100 px · nav pills 110 px. The pill is the
  brand signature — "this is a field, not a dashboard." Keep it even on dense screens.
- **No shadows, ever.** Depth comes from surface shifts — white or pastel on bone, or a solid
  forest band. This holds in the app too.
- **No sharp corners** on interactive surfaces.

Adapted:

- **Spacing in the app** uses the 8/12/16/20/24/30 subset. Arva's 50/64/193 px steps are
  marketing-only.
- **Touch targets ≥ 48 px** on field screens, ≥ 8 px apart. A 48 px-tall button at 100 px
  radius is a clean stadium shape — the pill language survives the accessibility floor intact.
- **Page max-width 1200 px** for marketing. App shells go full-width; data tables need it.

---

## 5 · Auth screens

Two screens, complementary: **5.1** is where a returning user lands, **5.2** is where a new
user chooses what they are.

### 5.1 Login — split-screen

Per the AgriConnect reference (save it as
`docs/design/references/login-reference.png`). It already sits close to the Arva system —
cream canvas, deep forest green, serif headline over sans body, full-bleed agricultural
photography. Three things are changed; they are marked ⚠ below.

**Layout — desktop ≥ 1024 px.** Two panels, roughly 48 / 52, both with 20 px outer radius on
a bone canvas.

*Left panel — photographic:*

- Full-bleed field photograph, warm golden light, rows of crops receding. Naturalistic, no
  duotone, no overlay box (Arva imagery rules).
- Serif headline, 3 lines, ~45 px, charcoal: *"Growing a better tomorrow"*
- Short forest-green rule beneath, ~48 px wide
- Body in Inter 16 px, max ~34ch
- Bottom: dark translucent glass card, three feature columns with line icons — headline
  14 px semibold white, caption 12 px white at 80 % opacity
- Small circular leaf badge, top-left and bottom-left

*Right panel — form, centred, max 400 px wide:*

| Element | Spec |
|---|---|
| Language selector | Pill, top-right, globe + label + chevron. 110 px radius |
| Logo | Forest-green rounded square, ~56 px, leaf mark |
| Wordmark | **Agri** charcoal + **Growth** forest green, serif, ~32 px |
| Tagline | Inter 14 px ⚠ *see contrast note* |
| Divider | Short forest rule, ~40 px |
| Heading | *"Welcome Back!"* serif ~24 px, forest ink |
| Subtext | *"Login to continue your journey"* Inter 14 px, `muted` |
| Field 1 | Email **or** phone — person icon left. One field, both identifiers |
| Field 2 | Password — lock icon left, eye toggle right |
| Row | "Remember me" checkbox · "Forgot Password?" forest link |
| Primary | Full-width forest-ink button, white label, leaf glyph right |
| Divider | Rule · "or" · rule |
| Secondary | "Continue with Google" ⚠ · "Continue with OTP" — white fill, moss border |
| Footer | Soft `ash-gray` card, shield icon, security reassurance |

**One field for email or phone is the right call** and worth keeping — it matches the split we
already planned (email for buyers, landowners, inspectors; phone OTP for workers) without
making the user categorise themselves at the door. Detect the identifier type on input and
route to the correct Supabase method.

#### ⚠ Change 1 — radii

The reference uses ~12 px radius on inputs and buttons. Our system is **inputs 33 px,
buttons 100 px**, and Arva's rule is explicit: *"do not apply small radii (4–8 px) to buttons
or cards; the 20 px+ and 100 px+ radii are non-negotiable."*

> **Resolved: keep the reference layout, apply our radii.** Login is the first authenticated
> screen a user ever sees; if the pill language breaks here, the system fractures at the front
> door. The layout is what makes this reference good — the corner radius is not.

#### ⚠ Change 2 — Google sign-in

The reference offers Google OAuth. [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) §3
currently says to disable every social provider.

Both positions are defensible, and they split by role:

- **For buyers** — companies on Google Workspace, genuinely useful, reduces password support.
- **For workers** — close to useless. Many have no Google account, the OAuth consent screen is
  a confusing detour on a low-end phone, and it adds an identity provider to the trust chain.

> **Recommendation:** enable Google, but render it **only on the buyer and landowner path**.
> Workers see phone OTP as the primary route, not a secondary option below a password field.
> This needs your decision — it changes the Supabase provider config in §3 of the setup guide.

#### ⚠ Change 3 — contrast and honesty

- The tagline and left-panel body copy read as light grey on cream in the reference. At that
  weight they will fail AA. Use `muted` `#545454` minimum, `graphite` `#353535` over
  photography.
- Text over the photograph needs a guaranteed floor — either a scrim or a crop-locked light
  region. A headline that is legible over *this* photo may vanish over the next one.
- *"We use advanced encryption"* overclaims in the vague way §10 forbids. Say something true
  and specific, or say less: *"Your land records and payments are protected."*

#### Missing from the reference

- **No sign-up link.** New users have no path to 5.2. Add *"New to AgriGrowth? Get started"*
  below the footer card, at equal prominence to "Forgot Password?".
- **No error states.** Wrong password, unknown account, expired OTP, rate-limited — each names
  the field, states what is wrong, and says how to fix it (§8).
- **No OTP entry screen.** The step after "Continue with OTP" — six inputs, resend timer,
  change-number link.

#### Mobile — below 1024 px

The left panel is marketing, and a worker signing in from a field must not scroll past it.

- **≥ 768 px:** stack — photo panel becomes a 200 px banner, feature cards drop.
- **< 768 px:** photo panel becomes a ~120 px header strip with the logo only. Form fills the
  viewport. Headline, body copy and feature cards are **removed, not collapsed**.
- Inputs ≥ 48 px tall, 16 px type — never smaller, or iOS zooms on focus.

### 5.2 Role entry — the main structural change

Arva's hero offers **two** choices: *I'm a Farmer* / *I'm a Company*. AgriGrowth has three
self-service roles, and the split does not map:

| Arva | AgriGrowth | Why it differs |
|---|---|---|
| I'm a Farmer | **Landowner** *and* **Worker** — two distinct roles | Arva's "farmer" conflates owning land with working it. Our data model separates them: a landowner registers parcels and accepts contracts; a worker accepts jobs and submits GPS evidence. Different dashboards, different permissions |
| I'm a Company | **Buyer** | Direct match |
| — | **Inspector**, **Admin** | Not self-service. §29A.1 requires inspectors to be *authorized by AgriGrowth*; admins are internal |

### The entry screen

Three choices, not two, and **cards rather than pills**. Three 100 px pills in a row collapse
badly on a 360 px phone, and this choice matters more than Arva's does — pick wrong and you
land in the wrong dashboard.

```
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │   I own      │  │   I work     │  │   I buy      │
        │   farmland   │  │   in fields  │  │   produce    │
        │              │  │              │  │              │
        │  Register    │  │  Find work   │  │  Contract    │
        │  your land   │  │  near you    │  │  production  │
        │  and receive │  │  and get     │  │  against     │
        │  contract    │  │  paid per    │  │  real land   │
        │  offers      │  │  task        │  │              │
        └──────────────┘  └──────────────┘  └──────────────┘
              LANDOWNER         WORKER            BUYER
```

Rules for this screen:

- **Plain language, not job titles.** "I own farmland" beats "Landowner" — role nouns are
  platform vocabulary the user has not learned yet.
- Each card carries a one-line description of what that role *does*, not what it is called.
- Cards use three of the pastel tiles (sage, peach, sky) in Arva's quilt rotation — one
  surface colour per card, never mixed.
- **Stack vertically below 640 px.** Full width, ≥ 72 px tall, generous tap area.
- Pair with an equally prominent **"I already have an account → Log in"**. Returning workers
  will hit this screen far more often than new ones.
- Buyer entry may keep Arva's pill-button treatment on the marketing hero as a secondary CTA;
  the three-card chooser is the canonical path.

### The case Arva does not have, and neither does our schema yet

**A smallholder who owns two acres and also does paid work on a neighbour's land is both a
landowner and a worker.** In rural India this is not an edge case — it is the common case.

Our current model has one role per user, which forces that person into two accounts, two
phone numbers, and two identities in the audit log.

The PRD may already anticipate this: §46 lists **`User` and `UserRole` as separate
entities** — which is the shape of a join table, not a single column. This is raised as
**PLAN.md R-18** and needs deciding before Phase 2.

Interface consequence, if multi-role is adopted: the entry screen still asks for **one**
primary role — asking a first-time user to self-classify twice is a bad first screen. The
second role is added later from account settings, and the app gains a role switcher in the
header. Do not build a fourth "I do both" card.

---

## 6 · Estimated vs verified — required, and now colour-backed

CLAUDE.md invariant 7 and PRD §9, §28, §31, §48 require these to be visually distinct.

| Kind | Token | Treatment |
|---|---|---|
| **Verified** | `verified` `#07503f` | Solid forest, filled badge, check glyph, plus *who or what* verified it |
| **Estimated** | `estimated` `#6b5220` | Ochre, **outlined** badge (never filled), always with a confidence or range |
| **Recorded** | `neutral` `#353535` | Plain, no badge |

Non-negotiable:

- Colour alone never carries this. Fill vs outline does the work, so it survives colour
  blindness and sunlight flattening.
- Every AI result shows its confidence next to it (§28, §29). Never a bare verdict.
- Forecasts render as **ranges**, not point values (PLAN.md R-8).
- An estimate never uses the filled treatment. Ever.

---

## 7 · Status colours across the five state machines

Five machines — land, contract, task, job, inspection (§47, §29A.6). One mapping, defined once
and exported as a single object so a new enum value cannot render unstyled.

| Semantic | Token | Examples |
|---|---|---|
| Available / open | `verified` outlined | `AVAILABLE`, `OPEN` |
| In progress | `forest-ink` | `ACTIVE`, `IN_PROGRESS`, `UNDER_CONTRACT` |
| Pending / upcoming | `neutral` | `PENDING`, `UPCOMING`, `DRAFT`, `SUBMITTED` |
| Reserved / provisional | `estimated` | `RESERVED`, `OFFERED`, `PARTIALLY_ACCEPTED` |
| Needs attention | `warning` | `DELAYED`, `REVIEW_REQUIRED`, `UNDER_REVIEW` |
| At risk | `risk` | `AT_RISK`, `HIGH_RISK`, `FAILED`, `DISPUTED` |
| Complete | `verified` filled | `COMPLETED`, `VERIFIED`, `PAID` |
| Inactive | `muted` | `CANCELLED`, `SKIPPED`, `UNAVAILABLE` |

**Inspection outcomes need more than colour.** Seven outcomes (§29A.6), and the pairs that
matter most are adjacent in severity:

- `VERIFIED` — filled forest, check
- `VERIFIED_WITH_OBSERVATIONS` — outlined forest, check with a dot. *Not* the same as verified
- `REINSPECTION_REQUIRED` — warning, cycle glyph
- `EVIDENCE_MISMATCH` — warning, split glyph
- `HIGH_RISK` — risk, outlined
- `FAILED` — risk, filled
- `SUSPECTED_FRAUD` — risk, filled, **with a text label always visible**, never icon-only

`SUSPECTED_FRAUD` is an accusation about a person. It never renders as a bare coloured dot.

---

## 8 · Field-use constraints

For every worker and inspector screen. These outrank visual preference.

- **Touch targets ≥ 48 px**, ≥ 8 px apart. Gloved, dusty, one-handed.
- **16 px type floor.** No captions, no 12–14 px text.
- **7:1 contrast target**, not 4.5:1. Every colour in §2 is chosen to clear it.
- **No hover-dependent information.** Touch has no hover.
- **Icon plus text label**, never icon alone. Icon conventions are learned, and literacy varies.
- **Minimal typing.** Selection, camera and GPS over free text.
- **Offline state always visible** — queued, uploading, uploaded, failed. A worker who loses
  signal mid-upload must be able to tell what happened.
- **Client-side photo compression** before upload. Assume a low-end Android on a slow link.
- **No lime.** `vivid-lime` is a marketing accent; on a field screen it reads as a status
  colour it isn't.

---

## 9 · The map

Land selection (§8) and registration (R-2 polygon drawing) are map-first.

- Parcels are **polygons**, not pins. Area and suitability render on the parcel.
- Availability must be distinguishable **without colour alone** — outline weight and fill
  pattern as well as hue. MapLibre styling, not CSS.
- Multi-select shows a persistent running total against required quantity (§8).
- Unavailable parcels stay **visible but clearly non-selectable**. Hiding them makes a buyer
  think there is no land there.
- Map styling uses the palette: forest for selected, moss for available fill, muted for
  unavailable. Bone does not work as a map fill — it disappears against OSM's base.

---

## 10 · Honesty in the interface

The PRD returns to this repeatedly (§9, §28, §31, §48):

- No dial, gauge or score styled to read as a guarantee.
- Suitability scores show contributing factors (§9), not just a number.
- Weather-driven skips show the reason in plain language (§18).
- Contact details are **absent** before assignment and acceptance (§23) — not greyed, not
  blurred. A blurred phone number still tells you one exists.
- Arva's marketing confidence stops at the login boundary. Inside the app, an estimate is
  labelled an estimate even when that is less impressive.

---

## 11 · Money and quantities

- **₹ with Indian digit grouping** — `₹5,50,000`, not `₹550,000`.
- Integer paise in storage; formatted only at the render edge (CLAUDE.md invariant 1).
- Tabular figures throughout.
- Units always stated — tonnes, acres, kg. Never a bare number.

---

## 12 · Motion

Arva's typography philosophy says the design "whispers" — weight 300 serif at 57 px is more
confident than bold. Motion follows the same principle: **calm, brief, and mostly invisible.**
A platform handling land records, contracts and payments earns trust by feeling steady, not
lively.

Same split as everything else — the marketing surface may be expressive, the application
surface may not.

### 12.1 Duration and easing tokens

```css
--ease-standard:  cubic-bezier(0.2, 0, 0, 1);   /* default — decelerating */
--ease-entrance:  cubic-bezier(0, 0, 0, 1);     /* things arriving */
--ease-exit:      cubic-bezier(0.3, 0, 1, 1);   /* things leaving, faster */

--duration-instant:   100ms;  /* checkbox, toggle, radio */
--duration-fast:      150ms;  /* hover, focus ring, button press */
--duration-base:      200ms;  /* the default for almost everything */
--duration-slow:      300ms;  /* sheets, drawers, accordions */
--duration-deliberate:500ms;  /* route transitions, map fly-to */
--duration-editorial: 800ms;  /* marketing reveals only */
```

**No spring or bounce in the application.** Overshoot reads as playful, which is wrong on a
screen showing a payment or a fraud flag. Gentle spring is permitted on the marketing surface
only.

### 12.2 The performance rule

A worker's phone is the constraint. Assume a low-end Android on a weak battery in the sun.

- **Animate `transform` and `opacity` only.** Never `width`, `height`, `top`, `left`, `margin`
  — those trigger layout on every frame and drop below 60 fps on cheap hardware.
- **No `box-shadow` transitions.** Arva has no shadows anyway; depth comes from surface shifts,
  so cross-fade the surface colour instead.
- **No parallax, no scroll-jacking, no scroll-linked animation on mobile.**
- **No shimmer on skeletons on field screens.** A shimmering gradient repaints continuously
  for as long as the network is slow — which is exactly when the battery is already suffering.
  Static skeletons there; shimmer is permitted on desktop.
- **Nothing animates during map pan or zoom.** MapLibre is already working hard.
- Budget: if a screen cannot hold 60 fps on a mid-range Android, the animation is cut, not
  optimised.

### 12.3 Motion vocabulary

Four patterns cover nearly everything. Resist inventing a fifth.

| Pattern | Where | Spec |
|---|---|---|
| **Fade** | Content arriving, tab and route changes | opacity 0 → 1, `base`, `ease-entrance` |
| **Fade + rise** | Cards, list items, toasts | opacity + `translateY(8px)` → 0, `base` |
| **Slide** | Sheets, drawers, mobile nav | `translateX/Y(100%)` → 0, `slow`, `ease-standard` |
| **Surface shift** | Hover, selection, status change | `background-color` cross-fade, `fast` |

Lists stagger at **30 ms per item, capped at 6 items** — beyond that it reads as slow, and a
worker's job feed may hold forty rows.

### 12.4 Where motion does real work

These are functional, not decorative. Each one answers a question the user is actually asking.

**Evidence upload (§27, Phase 8)** — the most important motion in the product. A worker who
loses signal mid-upload must be able to tell what happened *at a glance*:

- `queued` → static, muted, no motion. Nothing is happening and the UI should say so.
- `uploading` → determinate progress on `transform: scaleX()`, never animated width.
- `uploaded` → surface shift to `verified`, 200 ms. One check glyph. No celebration.
- `failed` → surface shift to `risk`, with a retry control. **No shake, no buzz.** A failed
  upload after an hour's work is not a moment to be cute.

**GPS check-in (§26, Phase 8)** — a genuine async wait with a real verdict. Pulse the location
glyph while acquiring, then resolve to the verdict state. Crucially: `TOO_FAR` and
`LOW_ACCURACY` resolve with the *same* motion as `VERIFIED`, only different colour and label.
Motion must never editorialise the outcome.

**Map parcel selection (§8, Phase 4)** — fill opacity and outline weight transition at `fast`.
The running total against required quantity updates with a cross-fade, **not** a count-up.

**Milestone timeline (§17, Phase 6)** — the progress line draws once on first view at
`deliberate`, then never again. Re-animating on every visit is noise.

**AI analysis (§28, Phase 10)** — indeterminate pulse while the request is in flight. When it
returns, the confidence value and the verdict fade in **together**. Never reveal a verdict
before its confidence — that is the interface implying certainty it does not have (§10).

### 12.5 Motion and honesty

The §10 principle extends to movement:

- **Never animate a number counting up for an estimate.** A count-up implies the system
  arrived at a precise value. Yield forecasts, suitability scores and production estimates
  **cross-fade in** as ranges. Count-up is permitted only on recorded, verified quantities —
  a weighed harvest lot, a settled payment.
- **No celebratory motion on ambiguous outcomes.** A task reaching `REVIEW_REQUIRED` gets the
  same quiet transition as one reaching `COMPLETED`. Confetti on a submitted task teaches a
  worker that submitting *is* completing.
- **Loading states must not resolve optimistically.** Do not transition to a success state and
  then correct it. Hold the pending state until the server answers.
- **Skeletons must match the real content's shape.** A skeleton implying three rows that
  resolves to one is a small lie the user notices.

### 12.6 Reduced motion

`prefers-reduced-motion: reduce` is not "turn everything off" — removing a transition entirely
can make a UI feel broken or hide a state change. Replace, don't delete:

| Normal | Reduced |
|---|---|
| Fade + rise | Fade only |
| Slide-in sheet | Instant, with a brief fade |
| Progress animation | Kept — it conveys real information |
| Stagger | Removed, all at once |
| Pulse / marquee / decorative loop | Removed entirely |

Progress indicators and loading states survive reduced motion, because they carry meaning
rather than decoration.

### 12.7 Library choice

Layered, so the worker bundle stays small:

1. **CSS transitions + `tailwindcss-animate`** — the default, and enough for perhaps 90 % of
   this. Already present with shadcn/ui. Zero bundle cost.
2. **View Transitions API** — route transitions between dashboard pages. Native, cheap,
   degrades silently where unsupported.
3. **Motion** (`motion/react`) — only where genuine orchestration is needed: the marketing
   hero, the map interaction layer, the role-entry cards.

> **Rule:** Motion must not appear in the worker or inspector bundles. Those are the low-end
> devices, and a ~30 kB animation library buys nothing there that CSS cannot do. Import it in
> marketing and buyer/admin routes only, and check the bundle in Phase 14.

### 12.8 What not to build

- Page-load spinners that delay first interaction
- Autoplaying carousels
- Hover-triggered motion that carries information (touch devices have no hover — §8)
- Animated illustrations or mascots
- Motion on every dashboard card entry — the third visit makes it tedious
- Anything that moves while a form is being filled

---

## 13 · Implementation

Tailwind v4 + shadcn/ui (CLAUDE.md §2).

- `docs/design/theme.css` is the starting point for `@theme`, **plus** the semantic tokens
  from §2 and the `muted` replacement. Copy it into the app's stylesheet; do not import from
  `docs/`.
- Semantic tokens are named for **meaning**: `text-estimated`, never `text-amber-700`. The
  meaning survives a palette change.
- The status → colour map is one exported object consumed by every status component.
- shadcn defaults must be overridden for radius — its 6 px default fights the 20 px/100 px
  language everywhere.
- **Dark mode: not in the MVP.** Outdoor screens want maximum brightness, the palette is
  built on a warm light canvas, and it would double the contrast surface to test.
- Motion tokens from §12.1 live in the same `@theme` block as colour and spacing.
- Accessibility floor: WCAG 2.2 AA, exceeded on field screens per §8. Full keyboard
  navigation on desktop. Visible focus — forest ink ring, per Arva's input spec. Reduced
  motion handled by substitution, not deletion (§12.6).

---

## Open decisions

| | Decision | Needed by |
|---|---|---|
| 1 | **R-18** — multi-role users (§5.2). Changes the schema | Phase 2 |
| 2 | **Google sign-in** — enable for buyers/landowners only, or not at all (§5.1) | Phase 2 |
| 3 | Reckless licence, or Cormorant Garamond substitute | Marketing build |
| 4 | Will the UI be translated? The reference has a language selector — decides whether
      Noto Sans Devanagari ships in Phase 1 | Phase 1 |
| 5 | Auth-screen copy in Hindi and target regional languages | Phase 2 |
| 6 | Motion library — confirm Motion stays out of the worker/inspector bundles (§12.7) | Phase 1 |
