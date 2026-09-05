# CLAUDE CODE EXECUTION DIRECTIVE — AUTOMATED CRM

Build the automated CRM layer for this repository (DCW SuperApp, Next.js App
Router, hand-rolled CSS, no Tailwind). Read `AGENTS.md` first and read the
relevant guide in `node_modules/next/dist/docs/` before writing any route or
server code — this is not the Next.js in your training data.

## What already exists — extend it, do not replace it

- `lib/integrations/index.js` — driver pattern. `DCW_INTEGRATION_DRIVER=demo`
  is in-process and side-effect free; `live` throws unless env is present.
  Every new outbound dependency must sit behind this same pattern.
- `lib/integrations/crm.js` — Sky-High adapter. Leads in a module-level array,
  30-day phone dedupe, round-robin assignment per vertical, `applyStatusChange`
  for the inbound webhook, `activity[]` audit log.
- `lib/integrations/ats.js` — the recruiter-side pipeline (`STAGES`,
  `allowedTransitions`), deliberately separate from the counselling CRM and
  linked by `leadId`.
- `lib/integrations/whatsapp.js` — template outbox, demo driver queues in memory.
- `lib/integrations/otp.js` — `isPhoneVerified` is checked server-side against
  the OTP store, never from the request body.
- `app/api/leads/route.js` — the single lead endpoint. Consent is a
  precondition: no `consent.contact` means 422, not a flagged record.
- `app/api/webhooks/crm-status/route.js` — inbound status changes.
- `app/admin/` — AdminShell plus leads, jobs and applications screens, own
  `admin.css`, outside the `.app` scope that `design-system.css` uses.
- `lib/auth.js` — HMAC-signed cookie sessions with three roles, but a **demo
  directory with published passcodes and no hashing**.
- `components/account/automations.jsx` — the `/automations` page. It records
  which nudges a person wants and **sends nothing**. The engine you build must
  honour these toggles as the consent record they claim to be.

## Blockers you must clear before automation is honest

State the decision you take on each, then proceed.

1. **Persistence.** Every store above is a module-level array. It dies on
   restart and is per-instance, so on `render.yaml` a second instance would
   hold a different CRM. Nothing scheduled or retried can be trusted on that.
   Pick one durable store, put it behind the existing repo/adapter seams
   (`lib/store.js`, `lib/jobs-repo.js`, the integration drivers) so call sites
   do not change, and keep migrations reversible.
2. **Identity.** `lib/auth.js` is demo auth on a public remote, and
   `DCW_SESSION_SECRET` falls back to a hard-coded string. A CRM holding real
   candidate phone numbers cannot ship on it. Either replace it as part of this
   work or refuse to enable the live driver until it is replaced — say which,
   in writing, in the completion report.
3. **System of record.** Decide whether Sky-High stays authoritative and this
   is a satellite that mirrors and automates, or this becomes the record and
   Sky-High is one sync target. Write the answer at the top of the CRM module.
   Do not build something whose ownership is ambiguous.

## What "automated" has to mean here

Not a screen with more buttons. A rules engine over a durable pipeline:

- **Ingestion** — every lead source in one funnel: `/api/leads`, job
  applications, resume-builder completions, compare-page enquiries,
  abandoned forms. Attribution (UTM, page URL, device) carried through.
- **Deduplication and identity resolution** — the 30-day phone rule exists;
  extend it to merge across verticals so one person is one contact with three
  interests, which is the PRD's whole monetisation thesis (school → college →
  placement).
- **Assignment** — replace naive round-robin with rules: vertical, city,
  language, counsellor load, working hours, and an explicit fallback when no
  rule matches. Never leave a lead unassigned silently.
- **SLA timers** — first-response and next-action clocks per stage, with
  escalation when they breach. Breaches must be visible in the admin UI, not
  only in a log.
- **Follow-up cadence** — stage-driven sequences (New → Contacted →
  Documents pending → Submitted → Confirmed / Dropped), each step gated on
  consent, channel opt-in, quiet hours, a per-contact frequency cap, and an
  immediate stop on reply or stage change.
- **Task queue** — what a counsellor should do next, ordered, with a reason.
- **Webhooks both ways** — outbound status push, inbound `crm-status` already
  exists; both must be idempotent and signature-verified.
- **Reporting** — funnel conversion, source quality, counsellor load, SLA
  breach rate, computed from real records only.

Every automated action needs: a scheduler that survives restart, an idempotency
key, a retry policy with backoff, a dead-letter path, and one audit row per
attempt recording who or what triggered it.

## Data origin — the seed's shape, the sources' values

The client's requirement is that all data is pulled and extrapolated from
existing information, and the existing information is two things: the demo seed
already in `lib/data/`, and public published records (UGC-DEB, NIRF, NAAC/AICTE,
institution websites and prospectuses). Treat them very differently.

**From the seed, keep the shape. Discard the values.** `lib/data/schema.js`
states in its own header that fees, ratings, cutoffs, packages and approval
claims are indicative placeholders. They sit against real, named institutions —
Amity University Online carries `rating: 4.4`, `reviews: 1284`,
`averagePkg: 520000` and a UGC-DEB entitlement `validTill: '2027-06-30'`, none
of which came from a source. The schema, slugs, relationships, course
structure, filter facets and page contracts are all reusable and should be
preserved exactly so no call site changes. The external-fact values are not a
base to extrapolate from; extrapolating from a placeholder yields a fabrication
with more decimal places.

**From public sources, take values with citations.** Every ingested value
carries `source` (the specific publication), `sourceUrl`, `asOf` (the date the
publication says it was true) and `retrievedAt`. Build a source registry
module listing each publication, its cadence, its licence or terms position,
and the parser that reads it. Verify each format at first run rather than
assuming it — do not hard-code a layout you have not seen.

Every value then carries one of three origins, and the origin travels with the
value to the UI:

- `sourced` — from a registered publication, with the four fields above.
- `derived` — computed deterministically from `sourced` values, carrying the
  formula and its inputs so the number can be recomputed and audited.
- `demo` — a fixture. Prototype only, always labelled, never in a public build.

Rules:

1. **Taint propagates.** A `derived` value may take only `sourced` inputs.
   Derive from a `demo` value and the result is `demo`. Enforce it in code and
   prove it with a test.
2. **Deterministic derivation only.** Arithmetic, aggregation, matching, and
   ranking by a stated rule. No estimation, no interpolation, no filling a gap
   with a plausible number.
3. **Do not map a fact across entities.** NIRF ranks a university; it does not
   rank that university's online arm as a separate entity. Attaching a parent
   institution's rank, NAAC grade or placement record to its online or distance
   offering is a misrepresentation even though both facts are published.
   `nirfRank: null` on an online entity is the correct answer, not a gap.
4. **Do not derive an external fact.** Ratings, review counts, placement
   packages, seat counts, admission deadlines, salary ranges and employer job
   counts are claims about the outside world. Sourced or absent — the app
   already has written "not published yet" states, and they are the honest
   output when no publication covers a field.
5. **Derive freely inside a record.** Per-year and per-month fee, EMI from fee
   and tenure, discount against MRP, duration in years, streams and levels
   offered, cutoff spread across categories, eligibility matching,
   similar-institution sets from shared stream/level/fee band, comparison
   tables and every filter facet count. These restate a sourced value; they do
   not add a claim.
6. **Derive the CRM entirely from real records.** Funnel conversion, source
   quality, counsellor load, SLA breach rate, lead score, next-best-action and
   a contact's interests come from leads, applications, saves and compares the
   app actually captured. No seeded CRM metrics, and no projection presented as
   a measurement.
7. **Staleness is a state.** A sourced value past its publication cycle renders
   with its `asOf`, and the ingestion job reports what went stale. An approval
   validity date that has passed must never render as current entitlement.
8. **Build gate.** A public build that would render a `demo`-origin value
   fails. Keep `DATA_PROVENANCE` as the switch and test that the gate fires.

Before writing ingestion code, produce a coverage map: every field in
`lib/data/schema.js`, which registered source can fill it, and which cannot.
Fields no source covers are reported as gaps for the client to supply from
their own records. They are not gaps to fill.

## Non-negotiables

- **Consent gates every outbound message.** WhatsApp is a separate opt-in from
  contact permission; a person who declines it on a later enquiry has withdrawn
  it. Honour `/automations` toggles. Quiet hours and frequency caps apply to
  automated sends and not to a counsellor typing manually. Build unsubscribe
  and a global kill switch that stops all automation in one action, and test
  that switch.
- **DPDP Act 2023 shape**: purpose limitation, retention window, export and
  erasure for a data principal, and a record of what consent was given when.
  If a field has no defined destination or lawful purpose, do not collect it.
- **The demo driver sends nothing.** Automation in demo mode queues to an
  inspectable outbox and says so on screen. Never present a queued demo message
  as delivered.
- `DATA_PROVENANCE = 'demo'` stays until real sources are connected. Do not
  fabricate lead counts, conversion rates, revenue or counsellor statistics —
  seed realistic fixtures and label them as fixtures.
- Do not expose secrets, do not commit environment files, do not silently
  change existing API contracts, and do not delete legacy code until a
  reference search proves it is unused.
- No mocks replacing working backend behaviour; no commented-out functionality;
  no suppressed errors; no console errors.

## Build in slices, verify each before starting the next

1. Persistence + migration of the three in-memory stores, with the seams intact.
2. Contact/identity resolution and the unified funnel.
3. Assignment rules + SLA timers.
4. The scheduler, job queue, retries, dead letters, audit trail.
5. Cadence engine wired to consent, quiet hours, caps, kill switch.
6. Admin UI: pipeline board, contact timeline, rule editor, SLA and queue
   health, automation log. Match `app/admin/admin.css`; it is outside the
   `.app` scope, so `design-system.css` does not apply to it.
7. Reporting from real records.

## Verification — measured, not asserted

- Add real tests. `package.json` currently has no lint, typecheck or test
  script and pins every dependency to `"latest"`; add a test runner and pin the
  dependencies you rely on.
- Prove each of these with output pasted into the report: a duplicate enquiry
  creates activity and not a second contact; a lead with no consent is refused;
  a cadence step for a declined channel is skipped with a recorded reason; the
  kill switch stops an in-flight sequence; a webhook delivered twice applies
  once; a job that fails three times lands in the dead-letter queue; an SLA
  breach appears in the UI; a restart loses nothing.
- Admin screens verified in the browser at 1440×1000, 1280×800, 1024×768,
  768×1024 and 390×844 — no horizontal overflow, no console errors, visible
  focus, touch targets at or above 24×24 (WCAG 2.5.8 AA), and a keyboard walk
  of the pipeline board. Do not judge visual quality by reading CSS.
- Record measured numbers in `docs/VERIFICATION.md` in that file's existing
  style: values or a stated reason why a value could not be produced. Never
  invent a score.

## Completion report

State what was implemented and verified, what was deliberately left out and
why, the three blocker decisions above with your reasoning, and anything you
could not test in this environment. Do not describe an item as complete unless
it has been implemented and verified. Do not stop after planning. Do not
commit or push unless I ask.
