# Implementation map

Phase 1 of the execution directive. Current state as measured on branch
`client-content-and-data-layer`, not as described by comments in the code.

Stack facts that constrain every row below: Next.js 16.3.1 App Router with
Turbopack, React 19, hand-written CSS (no Tailwind, no component library),
`lucide-react` for icons, `images.unoptimized: true`. The entire public site is
one client component at `app/[[...slug]]/page.jsx` — a catch-all route holding
~50 component functions in ~150 KB of near-minified source. `app/admin/*` is a
separate, conventionally structured area. Data flows
`lib/data/*` (frozen seed) → `lib/jobs-repo.js` (mutable working copy) →
`lib/store.js` (query + card projection) → `/api/*` → UI.

## Area map

| Area | Existing implementation | Problem | Proposed replacement | Data dependency | Files affected |
|---|---|---|---|---|---|
| Global shell | `App()` in the catch-all; path parsed by hand into `vertical` + segments | No route boundaries, so no per-route metadata, streaming, or error boundary; every page ships the whole bundle | Keep the catch-all for now; extract the shell (`Header`, `Footer`, `MobileNav`, `CompareTray`, `AskDCW`) into `components/shell/` and pass a typed `ctx` | none | `app/[[...slug]]/page.jsx`, new `components/shell/*` |
| Desktop nav | `Header` + `UtilityBar`, vertical switcher buttons | Switcher buttons have no accessible name; utility bar is decorative at ≥1200 and cramped below | Named buttons with `aria-current`, utility bar collapses to a single row under 1100 | none | `components/shell/Header.jsx` |
| Mobile nav | `MobileNav`, bottom bar | Overlaps the assistant launcher and the compare tray at 360–430 | One fixed-bottom stack with a shared z-index scale and safe-area padding | none | `components/shell/MobileNav.jsx`, `app/design-system.css` |
| Announcements | none | No mechanism for intake deadlines or outage notices | `Announcement` primitive fed by a typed source; absent until real content exists | needs a content source (not built) | `components/ui/Announcement.jsx` |
| Global search | `SearchPanel`, filters `catalog.rows` client-side | Only searches the active vertical's fetched page; `/api/search` exists and is unused by the UI | Point the panel at `/api/search` (already returns `current` + `other`), keep client filtering as the offline path | `/api/search` (exists) | `app/[[...slug]]/page.jsx`, `lib/client/catalog.js` |
| Distance discovery | `Listing` with `vertical='distance'`, `Boards`, `DecisionBlock` | Facets are derived in the component from the fetched page, so they describe 50 rows, not the catalogue | Server-computed facets returned alongside `rows` | `/api/[vertical]/institutions` must return a `facets` block | `app/api/[vertical]/institutions/route.js`, `lib/store.js` |
| College discovery | Same `Listing` component, different labels | Same component for a comparison decision (colleges) and a browse decision (distance) — the repetition the brief objects to | Separate `colleges/CollegeResult` (cutoff, seats, category) from `courses/CourseResult` (fee, EMI, mode, approval) over shared `ui/` primitives | none | new `components/colleges/*`, `components/courses/*` |
| College results | `.results > .entity-card` recomposed to a row at ≥1000px | Fixed | — | — | `app/design-system.css` |
| Study abroad | `checkAbroadEligibility` in `lib/store.js`, no UI route | Backend capability with no surface | Eligibility form + country comparison table | `countries` in `lib/data/reference.js` (exists) | new `components/forms/AbroadEligibility.jsx` |
| Jobs discovery | `Listing` with `vertical='jobs'`, city/sector/wfh/qualification facets | Facets now derive from real card fields (done); "near me" ranks on `pos` (done) | Add commute band and salary band once coordinates exist for every row | `lat`/`lng` present on seed jobs only; admin-created jobs have none | `lib/data/jobs.js`, `app/api/admin/jobs/route.js` |
| Job results | Shared `EntityCard` | A job decision is pay + distance + eligibility + recency; the card renders them in institution slots | `jobs/JobResult` with its own composition | `jobCard` already carries `postedDays`, `city`, `wfh`, `qualification` | new `components/jobs/*` |
| Comparison | `ComparePage` + `CompareTray`, ids in `localStorage['dcw-compare-v2']` | Compares within one vertical; `/api/compare` marks differing rows and is unused | Use `/api/compare` so "differs" is computed once | `/api/compare` (exists) | `app/[[...slug]]/page.jsx` |
| Saved items | `SavedPage` + `useAllCatalogs()`, ids in `localStorage['dcw-saved-v2']` | Anonymous only; nothing survives a device change | Keep local as the default; sync on sign-in | needs a per-user store (not built) | `lib/client/catalog.js` |
| Personalisation | `Predictor` (rank → strong/possible/backup), `nearestCity` | Predictor is real (`predictColleges` uses seeded cutoffs); nothing else personalises | "Find my next move" reading saved + compare + last search | none for v1 | new `components/discovery/NextMove.jsx` |
| Data-capture forms | `LeadFlow` → `/api/leads` → `upsertLead` + WhatsApp `lead_confirmation` | **No consent control.** `whatsappSame:true` is hardcoded; the word "consent" appears in the page only as body copy | Explicit unchecked checkbox per channel, carried to the API and stored with the lead; no message sent without it | `/api/leads` must accept and persist `consent` | `app/[[...slug]]/page.jsx`, `app/api/leads/route.js`, `lib/integrations/*` |
| Consent | none | Same as above; also no cookie/analytics consent surface | Consent state as a first-class field, not a default | as above | as above |
| Footer | `Footer` | Fine | — | — | — |
| Chatbot | `AskDCW` launcher | Overlaps card padding below ~1376px and a hero stat tile at 430px | Dock into the same fixed-bottom stack as the mobile nav | none | `app/design-system.css` |
| Responsive | Breakpoints at 760/761, 900, 1000 (new), 1200 | Was 761: the row card left a 470px body that wrapped every line and measured 631px tall | Row layout now starts at 1000px; verified 360–1440 | — | `app/design-system.css` |
| Accessibility | `.sr-only`, `role="status"` on loading, `role="alert"` on errors | Vertical switcher unnamed; keyboard walk not yet performed | Named controls, focus trap on the lead modal, manual keyboard pass | — | shell components |
| Performance | `npx next build` passes, 33 routes | No measured LCP/INP/CLS; skeletons now match card height within ~25px at every tested width | Measure against a production build and record actual numbers | — | — |

## Components

**Retain as-is:** `Plate`, `PageHero`, `CardWash`, `PathCard`, `Accordion`,
`Repeater`, `ChipInput`, `StatNumber`, `BrandLockup`, `VerticalLogo`,
`MotionLayer`, `Footer`, `PostCard`, `ResumeDoc`.

**Refactor (extract, keep behaviour):** `Header`, `UtilityBar`, `MobileNav`,
`CompareTray`, `AskDCW`, `SearchPanel`, `Listing`, `Detail`, `ComparePage`,
`SavedPage`, `Boards`, `Predictor`, `LeadFlow`, `ResumeBuilder`.

**Replace:** `EntityCard` — one card serving three unrelated decisions is the
root of the repetition. Split into `courses/CourseResult`,
`colleges/CollegeResult`, `jobs/JobResult` over shared `ui/` primitives
(`Plate`, `MetricRow`, `TagRow`, `SaveButton`).

**Remove:** nothing yet. `app/concepts/[variant]` is a design sandbox and is
still referenced; no component has been confirmed unreferenced.

## Missing backend or data capabilities

1. **Consent storage.** `/api/leads` has no consent field and messaging fires
   unconditionally. Blocking for anything that stores real candidate data.
2. **Authentication.** `lib/auth.js` is demo-grade: published passcodes, no
   password hashing, and `DCW_SESSION_SECRET` falls back to a literal. Must be
   replaced before real personal data is handled.
3. **Facet counts.** Filters are computed from the fetched page, so counts are
   page-scoped rather than catalogue-scoped.
4. **Admin job fields.** `city`, `area`, `lat`, `lng`, `tags`, `eligibility`,
   `roleType`, `deadlineLabel` exist on the Job type and in `jobCard` but the
   admin create/update route does not accept them.
5. **Per-user persistence.** Saved and compare live in `localStorage` only.
6. **Licensed imagery.** No campus photography or institution logos.
   `Plate` and `PathCard` both take an `image` prop, so assets drop in unchanged.

## Provenance

`DATA_PROVENANCE = 'demo'` and every API response carries it in
`meta.provenance`. Nothing in this repository is live institutional data.
