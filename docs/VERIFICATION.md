# Verification log

Every number below was measured. Nothing here is estimated. Where a metric could
not be produced in this environment, the reason is stated instead of a value.

## Environment limits that shape this log

Verification runs in the in-app browser pane. The pane can be *displayed* or
*hidden*, and every run recorded here was made while it was hidden, which is
what the limits below describe. They are confirmed behaviours, not assumptions.

- `document.visibilityState === "hidden"`, so Chrome emits **no `paint` and no
  `largest-contentful-paint` entries** — the tab never composites a frame.
  `PerformanceObserver.supportedEntryTypes` includes both types, and observers
  were installed with `buffered:true` after load; the buffers are empty because
  the events never occurred. **FCP, LCP and CLS therefore cannot be measured
  here.** They are not reported and they are not estimated.
- Screenshots and `document.hasFocus()` work **only while the pane is
  displayed**. With it hidden, screenshots come back blank and `hasFocus()` is
  permanently `false`, so Chrome never applies `:focus`. Focus styling was
  verified through the CSSOM (rule presence and cascade order) and through
  `document.activeElement`, not by looking at a rendered ring.
- **Time-based CSS animations do not advance in a hidden tab.** Anything that
  starts at `opacity:0` and animates in stays at `opacity:0` forever, which
  reads as invisible text to any audit. Every audit in this log therefore calls
  `document.getAnimations().forEach(a => a.finish())` first, and adds the
  `.in-view` class that the scroll-reveal wrapper (`.motion-ready`) is waiting
  for.
- **JS count-up counters are not advanced by that** and read `0`. They are
  driven by `requestAnimationFrame` in a React component, not by the Web
  Animations API, so `finish()` does not touch them. Their true values were read
  off the React fiber (`__reactFiber$…`, the node whose `memoizedProps` carries
  both `value` and `delay`) rather than off the rendered text.
- **Synthetic key injection does not fire an element's default action.** A
  dispatched `keydown` on a button runs the page's handlers but does not click
  it, so keyboard *activation* was verified through the equivalent pointer path
  and through the handler bindings, while keyboard *focus order* — which depends
  only on `document.activeElement` — is genuinely testable and was tested.
- **Smooth scrolling is suppressed while the pane is hidden**;
  `scrollIntoView({behavior:'instant'})` works, and all scroll-dependent
  measurement uses it.
- Viewport size does not persist by itself: it must be set explicitly with the
  resize tool before any DOM measurement, and the emulated width is asserted in
  the result of every sweep below (`vw`).
- `javascript_tool` evaluations time out at 45 s, so multi-route sweeps are run
  in chunks of three or four routes.

**Lighthouse was not run.** There is no `lighthouse` or `lhci` binary in
`node_modules/.bin` and `package.json` defines only `dev`, `build`, `start`.
No Lighthouse category scores are reported, and none are estimated.

### Dev server: Turbopack cache panic

During this work the Turbopack dev server twice panicked with
`File is not valid JSON: EOF while parsing a value at line 1 column 0 at .`
under `get_transpiled_packages`, after which every route returned 500. The
project's own JSON files were checked and are valid (`package.json`,
`jsconfig.json`, `.claude/launch.json` all parse; no zero-length JSON exists in
the tree, in `node_modules` or in `.next`), and the fault returned on a clean
`.next`. Verification now runs the dev server on `next dev --webpack`, changed
in `.claude/launch.json` only — `package.json`'s `dev` script is untouched, and
the production build below was still produced by Turbopack.

## Production build

`npx next build` — Next.js 16.3.1 (Turbopack).

- Compiled successfully; TypeScript check passed. Re-run after the reflow and
  hero-scrim CSS changes: **exit 0**, compiled in 11.2 s from a cold cache
  (764 ms warm), TypeScript finished clean.
- Re-run again after the font and stylesheet changes recorded below: **exit 0**,
  "Compiled successfully in 4.1 s" from a cold cache, "Finished TypeScript in
  5 ms", 26 static pages in 134 ms. No warnings introduced.
- Re-run again after the component extraction recorded below: **exit 0**,
  "Compiled successfully in 195 ms", "Finished TypeScript in 5 ms", 26/26 static
  pages in 139 ms. Same 33 routes. No warnings introduced.
- 26 static pages generated in 138 ms across 7 workers.
- 33 routes: the public site is one dynamic catch-all (`/[[...slug]]`),
  `/admin/*`, `/login`, `/_not-found` and `/sitemap.xml` are static, and the
  rest are `/api/*` server routes.
- Next 16's build output does not print a per-route First Load JS table, so
  payload weight below is measured in the browser instead.

Served with `next start -p 3100` (`.claude/launch.json` → `dcw-prod`).

## Measured: navigation timing, production server

Route `/distance/universities`, viewport 1440×1000, fresh navigation
(`navigation.type === "navigate"`, document not served from cache —
`transferSize` 5 988 B against `decodedBodySize` 21 993 B, i.e. compression is
active):

| Metric | Value |
| --- | --- |
| TTFB | 8 ms |
| DOMContentLoaded | 27 ms |
| Load event | 40 ms |
| Requests | 21 |
| Long tasks (>50 ms) | **0** |
| Total blocking time from long tasks | **0 ms** |

Route `/jobs`, viewport 390×844:

| Metric | Value |
| --- | --- |
| TTFB | 10 ms |
| DOMContentLoaded | 23 ms |
| Load event | 49 ms |
| Requests | 22 |
| Long tasks (>50 ms) | **0** |
| Horizontal overflow | **0 px** (`scrollWidth` 390 = `innerWidth` 390) |

These are localhost figures on a development machine. They say the server and
the hydration work are not the bottleneck; they say nothing about field LCP,
which depends on paint and on network conditions this environment cannot
produce.

## Measured: payload weight

**Correction to the earlier figures in this log.** The previous table read
"JavaScript 611 KB, CSS 153 KB" and labelled them decoded bytes because repeat
navigations report `transferSize` 0. That is true of `transferSize`, but
`encodedBodySize` is *not* zeroed by the cache: it is the compressed size the
resource has on the wire, and it was available all along. The site ships roughly
a third of what the old table implied. Both columns are given below so the two
readings can be reconciled rather than silently replaced.

Measured on a production server (`next start -p 3100`) built from the current
tree, `/distance/universities` at 1440×1000, in a **freshly created tab**
(see the note on tab pollution under *Measured: web fonts*):

| Asset class | Wire (`encodedBodySize`) | Unpacked (`decodedBodySize`) |
| --- | --- | --- |
| JavaScript | **184 KB** | 615 KB |
| CSS | 33 KB | 166 KB |
| Fonts (woff2) | 113 KB | 113 KB (already compressed) |
| Document | 6 KB | 22 KB |
| Images | 145 KB | 145 KB |
| **Total** | **~481 KB** over 19 requests | — |

Third-party origins: **none**. Long tasks >50 ms: **0**. TTFB 8 ms,
DOMContentLoaded 52 ms, load 118 ms.

Homepage `/`, same tab, first load: 113 KB of fonts, wire total ~340 KB over
20 requests. `/login`: 137 KB of fonts over 6 files, 137 KB of JS, 18 requests —
the extra font file is Manrope, which that route genuinely uses.

**This was the real performance finding**, and the figures above are the
*before* reading: 184 KB compressed is 615 KB the browser must parse and
execute, and at the time of that measurement the entire public site lived in one
client component (`app/[[...slug]]/page.jsx`, ~150 KB of source), so every
visitor downloaded and hydrated every vertical's UI regardless of the route they
asked for. The next section records what splitting it actually bought.

## Measured: component extraction and code splitting

The route file has been split into the domain component families named in
`docs/IMPLEMENTATION-MAP.md`. Two stages, each built and exercised in the
browser before the next began.

**Stage 1 — shared low-level primitives** (nothing here knows what a course or a
job is):

| Module | Holds |
| --- | --- |
| `components/ui/plate.jsx` | the generated card artwork and its six motifs |
| `components/ui/primitives.jsx` | `SectionTitle`, `PageHero`, `Accordion` |
| `components/discovery/catalog-states.jsx` | skeleton, empty, error, grid, fallback |
| `components/forms/fields.jsx` | `Repeater`, `ChipInput` |

**Stage 2 — domain surfaces**:

| Module | Holds | How it loads |
| --- | --- | --- |
| `lib/format.js` | `fmt` — one money format for the product | static |
| `lib/content/courses.js` | `COURSES`, `coursesOf` | static |
| `components/discovery/entity-card.jsx` | `PathCard`, `EntityCard` | static (core routes) |
| `components/tools/boards.jsx` | `BOARDS`, `Boards` | `next/dynamic` |
| `components/tools/predictor.jsx` | `BUCKETS`, `BUDGET_BANDS`, `Predictor` | `next/dynamic` |
| `components/tools/resume-builder.jsx` | `RESUME_*`, `ResumeDoc`, `ResumeBuilder` | `next/dynamic` |
| `components/editorial/about.jsx` | `MILESTONES`, `PRINCIPLES`, `AboutPage` | `next/dynamic` |
| `components/editorial/blog.jsx` | `POSTS`, `PostCard`, `BlogPage` | `next/dynamic` |
| `components/editorial/reviews.jsx` | `REVIEWS`, `ReviewsPage` | `next/dynamic` |
| `components/account/saved.jsx` | `SavedPage` | `next/dynamic` |
| `components/account/applications.jsx` | `ApplicationsPage` | `next/dynamic` |
| `components/account/account.jsx` | `AccountPage` (profile + notifications) | `next/dynamic` |
| `components/account/compare.jsx` | `ComparePage` | `next/dynamic` |
| `components/account/automations.jsx` | `AutomationCenter` | `next/dynamic` |

SSR is left on for all eleven dynamic imports. `/about`, `/blog` and `/reviews` are
the pages a stranger reads before deciding whether to trust the site with their
phone number, and they have to arrive as HTML.

`app/[[...slug]]/page.jsx`: **159 001 bytes / 1657 lines → 74 591 bytes / 584
lines**, a little over half its previous size. The lucide icon import in the
route file was pruned from 50 names to the 43 it still uses.

Payload, same method as the table above — production server, freshly created
tab, `/distance/universities` at 1440×1000:

| | Before | After stage 2a | After stage 2b |
| --- | --- | --- | --- |
| JavaScript, wire | 184 KB | 172 KB | **169 KB** |
| JavaScript, unpacked | 615 KB | 571 KB | **560 KB** |
| Requests | 19 | 20 | 20 |
| CSS / fonts / images | 33 / 113 / 145 KB | unchanged | unchanged |
| TTFB · DCL · load | 8 · 52 · 118 ms | 14 · 33 · 60 ms | 10 · 29 · 58 ms |

(2a = tools and editorial; 2b = the account family.)

`/jobs/resume-builder`, measured the same way, is 176 KB wire / 584 KB unpacked
over 10 JS files — so the builder now costs about 4 KB on the wire on the one
route that uses it, and nothing at all on the routes that do not. Before the
split it was in every route's 184 KB.

**Read this honestly: 15 KB on the wire, 55 KB unpacked, roughly 9 %.** It is a
real reduction and it is measured, not estimated, but it is not the order-of-
magnitude change the earlier note implied was available. The reason is that the
bulk of the route file was never the tools, the editorial pages or the account
surfaces: it is `Listing`, `Detail`, `LeadFlow`, `AskDCW`, `SearchPanel` and the
header/hero furniture. Every one of those is on the critical path of the routes
that matter most, so none of them can be deferred without paying for it
somewhere the visitor will feel it.

`LeadFlow` and `SearchPanel` are the two that *could* be deferred — both render
only behind a condition (`{lead && …}`, `{searchOpen && …}`), so a dynamic
import would genuinely keep them out of the first load. That has deliberately
**not** been done. They are about 9 KB of source between them, perhaps 3 KB on
the wire, and the cost is a chunk fetch on the click that opens the lead dialog
— the one interaction in the product that converts. Trading a measurable delay
on the conversion path for 3 KB is the wrong way round. It is recorded here as a
considered decision, not an oversight.

The honest conclusion is that the architectural benefit of this work is the one
the directive asked for — separate domain components instead of one file with
everything in it — and the payload reduction, while real, is secondary.

Verified in the browser after the split, on a production build, fresh tab, no
console errors at any point:

| Surface | Check |
| --- | --- |
| `/about` | hero, 8 timeline/principle items |
| `/blog` | 5 post cards, 6 category chips |
| `/blog/nios-vs-bosse-2026` | article renders; related-posts block correctly absent (one post in that category) |
| `/reviews` | 9 review cards, filter chip sets `aria-pressed` |
| `/distance/boards` | 4 board cards, comparison table, 3 universities from the live catalogue |
| `/colleges/neet-predictor` | form submits to `/api/tools/rank-predictor` and returns buckets with real cutoffs |
| `/jobs/resume-builder` | A4 preview renders and tracks the form |
| `/distance/universities` | 6 entity cards, fee via `fmt`, "4 courses" via `coursesOf` |
| `/distance/university/amity-online` | detail page, course menu, fees |
| `/jobs` | 3 job cards, salary and eligibility rows |
| `/saved` | "Saved for later.", empty state when the shortlist is empty |
| `/applications` | "Applications & updates.", reads the receipts back from local storage |
| `/profile` | "Profile & preferences." |
| `/notifications` | 4 notices in `.notification-list` |
| `/compare` | "Compare without the clutter." |
| `/automations` | 3 groups, 9 toggles; state flips on and back off after the move |

At 390×844: no horizontal page overflow on any of the six moved surfaces, and
the board comparison table still scrolls inside its own container (700 px of
content in a 320 px box, `overflow-x: auto`) rather than pushing the page.

Timings move between runs — the row above is one cold-start reading, and the
same page on a warm server measured 16 · 73 · 121 ms on a later run. The byte
counts are stable and reproducible; the millisecond figures are indicative of a
localhost production server, not of production hardware, and should not be read
as field data.

**One defect came out of verifying `/automations`, and it was not the move.**
The nine preference toggles were plain `<button>` elements whose only state
signal was a CSS class on a decorative `<i>`. Visually they read as switches;
to a screen reader they announced their label and nothing else, so there was no
way to hear whether a preference was on or off. These are consent controls —
they decide what the product is allowed to send someone — so an unannounced
state is a real failure, not a nicety. They now carry `role="switch"` with
`aria-checked` bound to the same state the class uses, and the decorative `<i>`
is `aria-hidden`. Re-verified in the browser: 9 switches, `aria-checked`
`true,true,false,true,false,false,false,false,false` on load, flipping to
`false` and back on two clicks of the first one, no console errors.

## Measured: web fonts

Both stylesheets used to open with `@import url(fonts.googleapis.com…)`. Fonts
are now self-hosted through `next/font/google` in `app/layout.jsx`. Four things
came out of doing that, and only the first was the intended change.

**Noto Sans Devanagari rendered zero glyphs.** A stylesheet comment claimed it
was needed for "the Hindi strings in the ticker and job copy". A sweep of `app/`
and `lib/` for U+0900–U+097F returns nothing, and the seed data's only
non-ASCII characters are `₹`, `★`, arrows and typographic punctuation. It cost
**143 KB** — 118 KB of Devanagari plus a 25 KB Latin subset duplicating Open
Sans — preloaded on every route. Removed. `system-ui` remains in the
`--font-body` chain, so Devanagari entered later through the admin console still
renders on every OS that ships a face for it.

**~30 rules asking for `font-weight:800` had been rendering at 700.** Google
serves Open Sans as a variable font, so the four discrete `weight` values
emitted four `@font-face` rules over the *same file*, each pinned to one weight.
Nothing matched 800, so it snapped back to 700. Dropping `weight` emits a single
`font-weight:300 800` face over that same 42 KB file. Verified in the built CSS:
`font-weight:300 800` on every Open Sans face. Zero byte cost.

**A hand-written `fallback` array was silently disabling `adjustFontFallback`.**
Supplying `fallback` turns off the metric-matched local face `next/font`
otherwise synthesises — the one that makes the system font shown during
`display:swap` occupy the same space as the real one. Grepping the *built*
production CSS (`.next/static/chunks/*.css`, not the stale
`.next/dev/static/css/`) found **zero** `@font-face` carrying `size-adjust`
before the change and **three** after: `Lato Fallback` 97.69 %, `Open Sans
Fallback` 105.15 %, `Manrope Fallback` 103.19 %. CLS cannot be measured in this
pane, so this was fixed structurally rather than by measurement, and no CLS
figure is claimed.

**Manrope was being fetched on public routes that never paint it.** It was the
`body` default in `globals.css`, which looked harmless because `.app` overrides
it on every public page — but "overridden everywhere visible" is not "unused".
Next renders `<next-route-announcer>`, the visually-hidden live region that
reads the new page title after a client-side navigation, as a direct child of
`<body>`, outside `.app`. It inherited Manrope and Chrome fetched 24 KB of
webfont to typeset text that is never painted. `body` now falls to
`--font-body`, and Manrope is named where it is wanted: `.adm, .lg` in
`globals.css`, plus `.app .resume-doc`.

Font payload after all four changes, per route, measured in a clean tab:

| Route | woff2 files | Wire | Preloaded |
| --- | --- | --- | --- |
| `/` | 5 | 113 KB | 4 files / 82 KB |
| `/distance/universities` | 5 | 113 KB | 4 files / 82 KB |
| `/login` | 6 | 137 KB | 4 files / 82 KB |

Before this work: 7 files, ~250 KB preloaded on every route.

### A false positive worth recording: Resource Timing replays cached fonts

After the announcer fix, `/` and `/distance/universities` still reported the
24 KB Manrope file in `performance.getEntriesByType('resource')` —
`initiatorType: "css"`, no preload link, `transferSize: 0`. That reading was
wrong, and it took four checks to establish which of the two contradictory
signals to believe:

- Scanning every element *and* its `::before`/`::after` for a computed
  `font-family` containing Manrope returned **0 matches**.
- `[...document.fonts].filter(f => f.family === 'Manrope')` reported all six
  faces `status: "unloaded"` — a face Chrome had actually needed would read
  `"loaded"`.
- The served HTML contains no `.adm`, `.lg` or `.resume-doc`, and the generated
  `.manrope_…__variable` class sets only the custom property, not `font-family`.
- Loading `/` as the **first navigation in a brand-new tab** produced no Manrope
  entry at all, and 113 KB of fonts instead of 140 KB.

The tab being measured had visited `/login` earlier in the session. Resource
Timing replays memory-cache hits from *earlier documents in the same tab*, so a
font legitimately loaded by one route keeps appearing in the next route's
resource list. Every payload figure in this log was therefore re-taken in a
freshly created tab. Nothing was changed in the code to "fix" this, because
there was nothing wrong with the code.

## Verified: catalogue caching and network failure

Reading the network log rather than the summary counters showed the public site
re-fetching the whole catalogue on every route hop: each of `/`, `/distance`,
`/colleges` and `/jobs` re-ran the same three `/api/*` requests, because the
site is one client-side route tree and every navigation remounts the surfaces
that fetch. `lib/client/catalog.js` now holds a 60 s promise cache keyed by
vertical.

| Check | Before | After |
| --- | --- | --- |
| Catalogue requests over a 7-hop SPA walk | one set per hop | **3** (one per vertical) |
| Simultaneous mounts on a page using `useAllCatalogs` | 3 parallel identical requests | 1 shared promise per vertical |
| Cards rendered per vertical | 3 | 3 (unchanged) |

The entry stores the in-flight promise rather than the resolved rows, so several
components mounting in the same tick share one request. `fetchedAt` reports when
the data was *read*, not when it was displayed, so a surface reporting freshness
still tells the truth from cache. A rejection evicts its entry immediately.

**Failure path, tested against a genuinely cold cache.** The first attempt at
this test was a non-test: patching `window.fetch` to reject `/api/jobs?` while
the cache was still warm produced `jobsRequestsAfterFail: 1` and
`errorSurfaced: null` because the patched fetch was never called. Re-run on a
cold mount:

| Step | Result |
| --- | --- |
| Cold mount, endpoint rejecting | 0 cards, "Catalogue unavailable", "Try again" control present |
| Network restored, "Try again" pressed | **3 cards, error cleared** |

That last row is the point: `reload()` drops the cache entry, so a failure is
never what the reader is stuck with. Console errors during both runs: **none**.
All network responses 200/304.

The clipped-text and overflow sweep was re-run after the weight change (800 now
renders at 800, so text sets wider): **24 route × viewport combinations, zero
clipped text, zero document overflow.**

## Measured: layout, at the required viewports

`documentElement.scrollWidth − innerWidth`, public routes:

| Viewport | Overflow |
| --- | --- |
| 1440×1000 | −15 px (scrollbar) |
| 1280×800 | −15 px |
| 1024×768 | −15 px |
| 768×1024 | 0 px |
| 430×932 | 0 px |
| 390×844 | 0 px |
| 360×800 | 0 px |

No horizontal overflow at any required width.

Skeleton-to-card height parity (loading placeholder against the real row it
replaces), measured after the listing-row breakpoint was raised from 761 px to
1000 px:

| Width | Delta |
| --- | --- |
| 768 px | −15 px |
| 900 px | −6 px |
| ≥1000 px | 0 px |
| 360–999 px, jobs | ≤3 px |

## Verified: accessibility

Manual, on `/distance/universities`:

- one `h1`, no skipped heading levels;
- `header`, `nav` (3), `main`, `footer` landmarks present;
- no unnamed interactive controls; no `img` without `alt`;
- skip link present, moves focus to `MAIN#main`;
- all three overlays (lead modal, search palette, nearby popover) take focus on
  open on the first real control, trap Tab in both directions (7 focusables,
  `wrapForward` and `wrapBackward` both true), close on Escape, and restore
  focus to the opener (`restoredTo: "Apply now"`). The nearby popover
  deliberately does not trap.

### The keyboard walk, done with real Tab presses

The sweep above was assembled from the DOM. This one was driven from the
keyboard on `/distance/universities`, 1440 x 1000, reading `document.activeElement`
after each press. **22 stops**, and for each: name, tag, computed outline, and
whether the element was on screen.

- Every stop had a **visible focus indicator** — a 2 px or 3 px solid outline;
  none relied on colour alone.
- **No positive `tabindex`** anywhere, so DOM order is tab order.
- **No unnamed control** in the 22.
- Order matched reading order: skip link, utility bar (2), masthead (9),
  hero actions (2), filter panel (6), sort. The sort control comes after the
  filter sidebar, which is the normal sidebar-then-content order, not a jump.

### Defect: the hidden "scroll to top" button was in the tab order

`MotionLayer` renders the scroll-to-top button **first in the document**, above
the skip link, and hides it with `opacity:0; pointer-events:none`. Neither of
those removes an element from the tab order. So the **first Tab press on every
page** landed on an invisible control, before the skip link — the one stop that
exists specifically to be first.

Fixed at the source of the state rather than in CSS: the button already knows
whether it is showing, so it now carries `tabIndex={showTop?0:-1}` and
`aria-hidden={!showTop}`. Re-verified in the browser: at `scrollY 0` the button
reports `tabIndex -1, aria-hidden "true"` and the keyboard walk now starts on
the skip link; past the 650 px threshold it reports `tabIndex 0,
aria-hidden "false"` and takes focus normally.

### Skip link, verified rather than assumed

Activated it and followed what happened: `location.hash` becomes `#main`, focus
lands on `main#main`, the page scrolls to it, and **the next Tab press lands on
"Browse 6 results", the first control inside `main`** — so it genuinely skips
all 12 header stops rather than merely existing.

### Defect: focus was not restored when a dialog with autoFocus closed

The earlier entry above recorded focus restoration passing on the lead modal,
and that was true. The search palette fails, and the difference explains the
bug: its input carries `autoFocus`, which React applies **during commit**, before
`useDialogA11y`'s passive effect runs. The effect read `document.activeElement`
to decide where to return focus and therefore captured *the dialog's own input*.
On close it restored focus to a node that had just been removed, which silently
drops focus to `<body>` — a keyboard user who opened search and pressed Escape
lost their place and had to tab from the top of the page.

Measured before the fix: `dialogGone: true, focusRestored: false, active: "body"`.

The hook now tracks the last element focused **outside** any `[role="dialog"]`,
from a single capturing `focusin` listener registered at module load — not from
inside the hook, which only runs once a dialog has already mounted, by which
point the opener has long since lost focus. Restoration prefers the live
`activeElement` when it is outside the dialog and falls back to that tracked
element, and it only focuses a node still in the document, because focusing a
detached one is exactly what produced the `body` result.

Re-verified in the browser on both overlays:

| Overlay | Opened from | After Escape |
| --- | --- | --- |
| Search palette (Cmd+K) | "Save Lovely Professional University" | `focusRestored: true` |
| Lead modal ("Apply now") | "Apply now" | `focusRestored: true` |

Trap behaviour re-confirmed at the same time: 14 forward Tabs and 3 shift+Tabs
all stayed inside the palette, and Escape closed it.

### Dialog names

Read off the live elements rather than the source: the palette is
`aria-label="Search Distance"`; the lead modal is `aria-modal="true"` with
`aria-labelledby="lead-title"` resolving to **"Apply to Amity University
Online"**. Both have a real accessible name.

### The same sweep, across ten routes

The keyboard walk above was done by hand on one listing route. Repeating 22
real Tab presses on every route is not affordable in this pane, so the rest were
swept from the DOM instead — same checks, one call per route, against the
production build at 1440 x 1000. Every route below returned
`first: "Skip to main content"`, `positiveTabindex: 0`, `unnamed: []`,
`h1: 1`, `headingSkips: false`, `imgNoAlt: 0`, `labelless: 0` and
`overflowX: false`.

| Route | Focusable stops | header / nav / main / footer |
| --- | --- | --- |
| `/` | 54 | 1 / 2 / 1 / 1 |
| `/jobs/search` | 123 | 1 / 2 / 1 / 1 |
| `/colleges/search` | 73 | 1 / 2 / 1 / 1 |
| `/about` | 28 | 1 / 2 / 1 / 1 |
| `/blog` | 35 | 1 / 2 / 1 / 1 |
| `/reviews` | 39 | 1 / 2 / 1 / 1 |
| `/distance/university/amity-online` | 42 | 1 / 3 / 1 / 1 |
| `/distance/tools/resume-builder` | 37 | 1 / 2 / 1 / 1 |
| `/automations` | 32 | 1 / 2 / 1 / 1 |
| `/saved` | 25 | 1 / 2 / 1 / 1 |

`/automations` additionally reports **9 `role="switch"` controls, 0 of them
missing `aria-checked`** — the automation toggles announce their state rather
than relying on the visual knob position.

This is a weaker instrument than the hand walk: it proves that every control has
an accessible name and that nothing has jumped the tab order with a positive
`tabindex`, but it does not prove each focus ring is visible at each stop. Only
`/distance/universities` has had that treatment.

### A third false reading: `/reviews` appeared to have ten banner landmarks

The first pass on `/reviews` returned `landmarks: [10, 2, 1, 10]` — ten
`<header>` and ten `<footer>` elements where every other route had one. That
would have been a real defect: repeated banner and contentinfo landmarks make a
screen-reader landmark list useless.

It was my counter, not the page:

```
{"headers":10,"headersScoped":9,"topLevelHeader":1,
 "footers":10,"footersScoped":9,"topLevelFooter":1,
 "banner":0,"contentinfo":0}
```

Nine of each sit inside an `article` or `section` — each review card carries its
own `<header>` (initials mark, reviewer name, city and date, verified badge) and
its own `<footer>` (vertical tag, "Helpful" button).
A `<header>` scoped to a sectioning element is **not** a banner landmark, and a
scoped `<footer>` is not contentinfo; only the top-level pair are, and there is
exactly one of each. Valid HTML, correct semantics. The counter was corrected to
exclude anything with an `article, section, aside, nav, main` ancestor, and the
table above is the corrected count.

### Touch targets: the cards are the target, not the title text

Measuring `.pc-link` and `.ec-link` with `getBoundingClientRect()` gives
**22-23 px tall** elements, which reads as a straight WCAG target-size failure.
It is a false reading, because both are stretched links:

```css
.pc-link::after { content:""; position:absolute; inset:0 }
.ec-link::after { content:""; position:absolute; inset:0; z-index:1 }
```

inside a `position: relative` card. Both are `<button>` elements whose own box is
the title text, while the `::after` makes the hit area the whole card. Rect
measurement cannot see that, so they were hit-tested with `elementFromPoint` at
four probes per card instead:

| Card | Card box | Probes hitting the link |
| --- | --- | --- |
| `.pc-link` (pathway) | 403 x 186 | 4 of 4 |
| `.ec-link` (entity) | 399 x 406 | 3 of 4 |

The entity card's bottom-left probe correctly lands on `.entity-foot`, whose own
controls sit above the stretched link's `::after`: the "Compare" checkbox and
label, the "Details" / "View job" button and "Apply now". Those are separate
full-size targets with their own accessible names, so the probe missing the
stretched link there is the intended behaviour, not a dead zone. (The "Save"
heart is not in the footer — it is a separately positioned control over the card
plate, with an `aria-pressed` state.)

One thing to note for anyone repeating this: the first hit-test returned `null`
at every probe because the cards were below the fold and `scrollIntoView` had
not applied within the same tick. `scrollIntoView` and `window.scrollTo` need an
awaited delay (~400 ms) before rects can be read.

### Two false readings of my own, recorded so they are not repeated

- **"The skip link does not work."** Wrong. `computer{action:"key"}` delivers a
  key event but **not** the browser's default activation, so Enter on the anchor
  did nothing. A native `<button>` under the same injected Return also recorded
  zero clicks, which is what proved it was the harness. Enter- and
  Space-activation therefore **cannot be tested in this pane**; anchor and
  button behaviour was tested through a real click instead, and that limit is
  reported rather than papered over.
- **"Every `.entity-card` is remounted on any re-render."** Wrong, and it would
  have sent me rewriting the listing. An earlier stray click had navigated the
  tab to a detail route, so `document.querySelector('.entity-card')` was
  returning `null` and every `document.contains` check read false. Re-measured
  on the listing with the route asserted in the same call: cards and their
  buttons survive a dialog open and close (`cardAlive: true`,
  `triggerAlive: true`). **Assert the route in the same call as the assertion.**

Still not run: **reduced motion**, which cannot be emulated in this pane and is
therefore reported as source inspection only, and **Enter/Space activation**,
for the harness reason above. The full hand-driven keyboard walk exists for
`/distance/universities` alone; the other nine routes have the DOM sweep only.

## Verified: consent, end to end

- `POST /api/leads` without `consent.contact` → **422 `CONSENT_REQUIRED`**.
- Same with `consent.contact: false` → **422 `CONSENT_REQUIRED`**.
- Full browser journey (fill → tick → OTP → verify) → lead `SKY-00003` created;
  `GET /api/leads` shows the record carrying the **verbatim wording that was
  displayed**, `consent.whatsapp: false`, `whatsappSame: false`, and **no
  WhatsApp message queued** (`skipped: "no_whatsapp_consent"`).

The leads created during testing (`SKY-00001`–`SKY-00003`) are in the in-memory
demo CRM and clear on restart.

## Verified: the lead form, case by case

The directive's form checklist, run against the production build. Empty
submission, invalid input, valid input, keyboard-only, consent-unchecked,
loading state and server-side validation were done earlier and are above; this
covers the six that were still open, and it found three defects.

### OTP lifecycle, at node level

The five-minute expiry cannot be waited out against a live server, so
`lib/integrations/otp.js` was driven directly with `Date.now` stubbed. **21/21**:

| Behaviour | Result |
| --- | --- |
| Rejects a landline-style number, and 9 digits | pass |
| Verify before send | `NOT_REQUESTED` |
| Send returns a 6-digit code, TTL 300 s | pass |
| Wrong code | `INCORRECT`, `attemptsLeft: 4`, counting down to 0 |
| 6th attempt | `TOO_MANY_ATTEMPTS`, record destroyed |
| Correct code | verifies once; **replay of the same code** → `NOT_REQUESTED` |
| Verified claim | held 15 min, then expires |
| At 4 min | still valid |
| **At 5 min + 1 s** | **`EXPIRED`**, and the record is cleared, not left stale |
| 6th send within the hour | `RATE_LIMITED`; allowed again after an hour |

The UI path for `EXPIRED` is the same one `INCORRECT` takes — `setError` into the
`role="alert"` banner — and that was exercised in the browser below.

### Defect: a pasted "+91 …" number silently became a different valid number

The phone field ran `value.replace(/\D/g,'').slice(0,10)`. Nobody types ten bare
digits; they paste the number as their own contacts store it. The product's own
resume builder prints its sample contact as `+91 98765 43210`, which is exactly
the string a visitor will paste.

Measured, before the fix:

```
paste "+91 98765-43210"  ->  field shows 9198765432
isValidPhone("9198765432") -> true
```

The country code was absorbed, the last two digits fell off the end, and the
result still began with 9 — so it passed the client's length check *and* the
server's `/^[6-9]\d{9}$/`. The OTP would have gone to a stranger's handset and
the visitor would have sat waiting for a code that was never coming.

Fixed with `phoneDigits()` in `lib/format.js`, which drops the country code
before truncating and only at lengths where that is unambiguous — 14 digits
beginning `00`, 13 beginning `091`, 12 beginning `91`, 11 beginning `0`. A
half-typed 11-digit string is left alone and merely truncated as before, so
someone who fumbles an extra digit is not handed a different number.

15/15 at node level, and re-measured in the browser against the rebuilt bundle:

| Pasted | Field shows |
| --- | --- |
| `+91 98765-43210` | `9876543210` |
| `+919876543210` | `9876543210` |
| `098765 43210` | `9876543210` |
| `0091 98765 43210` | `9876543210` |
| `9187654321` (a real number that begins 91) | `9187654321`, untouched |
| `9876543210` | `9876543210` |

The verify step then reads **"Sent to 9876543210"**, so the corrected number is
shown back before the visitor commits to it.

Clipboard note: `navigator.clipboard.writeText` is denied in this pane, so a real
cmd+V could not be driven. These were done with `document.execCommand('insertText')`,
which is a genuine native multi-character insertion firing the same
`beforeinput`/`input` pair a paste fires — not a synthetic React event, but not a
true clipboard paste either, and recorded as such.

### Defect: nothing prevented a double submission

`busy` drove `disabled` and `aria-busy`, but it is React state: the prop only
lands on the next render, so clicks dispatched in the same tick all got through.
Measured by counting `fetch` calls:

| Action | Before | After |
| --- | --- | --- |
| 3 clicks on "Send verification code" | **3** `/api/otp/send` | **1** |
| 3 clicks on "Verify & submit" | 3 attempts | **1** `/api/otp/verify`, **1** `/api/leads` |
| Error banner on the success screen | **"Request a code first."** | none |
| Local records written | 1 | 1 |

Two distinct harms. Three sends burned three of the five codes a number is
allowed per hour, so a determined double-tapper could lock themselves out of
their own application for an hour. And because the OTP is single-use, the losing
submits failed with `NOT_REQUESTED`, whose message was painted into the
`role="alert"` banner **above the success screen the winner had just rendered** —
a screen reader would announce "Request a code first" immediately after
"Application submitted".

Fixed with a `useRef` in-flight flag read and written synchronously at the top of
both handlers. `busy` still drives the visible state; the ref does the guarding.

### Network failure

`/api/otp/send` was made to reject with a `TypeError`. The form stayed on step 0,
kept the typed name and number, showed a `role="alert"` banner, released the
button, and a retry went straight through to the code step.

One defect: the banner read **"Failed to fetch"** — the raw browser string, in a
live region, to a student on a patchy mobile connection. Now:

> Could not reach DCW. Check your internet connection and try again — nothing has
> been sent yet.

Verified in the rebuilt bundle. The change is scoped to the public site's `api`
helper; the remaining raw-`e.message` sites are all under `/admin/*`, a staff
console where the developer wording is the useful one.

### Refresh and recovery

Submitted an application, then loaded a **fresh document** at `/applications`:
the record survived, and the page shows the reference `SKY-00001`, the course
`Online MBA` and the kind `Application`. The applicant's own name is not
reprinted, which is a reasonable choice for a personal list rather than an
omission.

An in-progress, unsent form does **not** survive a refresh. That is the intended
trade: nothing typed into a consent-gated form is persisted before consent is
given.

### Back navigation — measured, not fixed

With the dialog open, `history.back()` leaves the route entirely (to the previous
entry) rather than closing the dialog. The dialog does close, since it unmounts
with the route, so nobody is stranded — but on a phone, Back is the natural
"close this sheet" gesture, and here it exits the page and discards what was
typed.

Not fixed, deliberately. Making Back close the overlay means pushing a synthetic
`history` entry alongside the Next App Router, and this repo's `AGENTS.md` warns
that this is not a Next.js whose behaviour can be assumed. The supported
alternative — intercepting routes — would restructure a single catch-all client
route into parallel routes, which is the framework rewrite the directive tells me
to avoid. Recorded as a known behaviour with a recommendation rather than gambled
on.

### Mobile keyboard, 390 x 844

| Check | Measured |
| --- | --- |
| Font size of every text input and select | **16 px** — so iOS does not zoom the page on focus |
| Input and select height | 48 px |
| Primary button | 326 x 46 |
| Modal | 362 x 793 in an 844 viewport, top 25, `overflow-y: auto` so it scrolls itself once the keyboard takes the bottom half |
| Phone and OTP fields | `inputMode="numeric"` — numeric pad, not the full keyboard |
| OTP field on arrival | autofocused |
| Pasting a whole SMS, "Your DCW code is 000000" | field takes `000000` |

Two controls measure under 44 px and both are fine on inspection:

- the consent checkboxes are 20 x 20, but the real target is the
  `label.check` wrapping them — **300 x 39**, hit at 4 of 4 probes, and tapping
  the sentence toggles the box (verified by clicking the far bottom-right of the
  label text and watching `checked` flip). Same lesson as the stretched card
  links: measure the label, not the input.
- the modal Close button is 40 x 40. That clears WCAG 2.2 **2.5.8 Target Size
  (Minimum), 24 x 24, at AA**; it is under the 44 x 44 of 2.5.5, which is AAA.
  Stated rather than reported as a failure, and the dialog also closes on Escape
  and on an overlay click.

### Two more false readings of my own

- **"The OTP is rejected even when correct."** My test regex was `/(\d{6})/`
  against the line "Sent to 9876543210. Demo code: 421000", so it matched
  `987654` — the first six digits of the *phone number*. Anchor the pattern to
  the label (`/Demo code:\s*(\d{6})/`), not to shape.
- **"The page cannot be scrolled."** `window.scrollBy` moved nothing on
  `/saved`, and then moved nothing on `/` either — which is what gave it away.
  The Browser pane had been hidden, and a hidden pane is not composited, so
  scrolling cannot complete; the tool says so when a real wheel gesture is
  attempted. A page-level conclusion drawn from a scroll reading is only safe
  while the pane is visible.

## Measured: text contrast over photographic heroes

Contrast over a photograph cannot be read off the stylesheet, because the
"background colour" of a hero label is the crop underneath it composited through
one or more gradient scrims. The instrument used here walks every text node in a
hero, takes `Range.getClientRects()` for the node itself (not the parent box),
samples 21 points across each rect, and at each point composites: the page
ground, the hero's own background, every scrim child, and every ancestor
background between the text and the hero — then computes the WCAG ratio against
the threshold that node's size and weight actually require.

It reported four sets of failures that turned out to be its own defects. Each
was found by checking the reported background against the geometry and finding
the value physically impossible, and each was fixed in the instrument, not in
the code under test:

1. **Ancestor backgrounds ignored.** A label inside a `#ffffffb8` glass button
   was measured against the photograph behind the button. Fixed by compositing
   the ancestor chain.
2. **Non-90/180deg gradients sampled on the wrong axis.** The tool-hero wash is
   `96deg`; the code tested `abs(angle − 90) < 1` for "horizontal" and otherwise
   sampled vertically, producing four bogus failures on `/colleges/search`.
   Fixed with real gradient-line projection: direction `(sin a, −cos a)`, length
   `|w·sin a| + |h·cos a|`, progress `t = ((x−cx)·sin a − (y−cy)·cos a + L/2)/L`.
3. **180deg gradients discarded entirely.** Chrome omits the angle when
   serialising a 180deg gradient, and the direction test fell through to `null`,
   so every mobile sweep reported catastrophic 1.0–2.4 ratios. Fixed with an
   explicit direction test.
4. **Heroes with no `<img>` measured against grey.** `/blog`, `/reviews` and
   `/jobs/resume-builder` paint their hero with a CSS gradient rather than a
   photograph and fell through to a `[128,128,128]` fallback. Fixed by walking
   out to the first opaque ancestor background.

Chrome serialises modern colours as `color(srgb r g b / a)` with 0–1 floats;
those are scaled by 255 before compositing.

### Defect: the desktop atlas-hero wash under-covered its own copy column

`.hero-shade` stops are percentages **of the hero**, but the copy sits in a
column that is 61.8 % of a container of `min(1280px, 100% − 48px)` — so its right
edge lands at about **61 % of the hero at every width from 761 px up**, and the
proof rail under the headline runs that full width. The wash held .92 only to
42 % and was down to .38 by 72 %. Worst sample, the third proof label on `/jobs`
("hiring employers", 12 px, white at .76), against the 4.5:1 that size requires:

| Width | Before | After |
| --- | --- | --- |
| 768 | 3.54 | 8.98 |
| 1024 | 3.96 | 9.08 |
| 1101 | 4.20 | 9.08 |
| 1280 | 4.67 | 9.17 |
| 1440 | 5.20 | 9.18 |

Two of those widths passed before, which is why a desktop-only look read this as
a near miss: the number tracks how bright the crop happens to be behind the rail,
not how well the scrim is doing its job. It was one defect at every width above
the stacking breakpoint. Fixed by moving the shoulder out to where the copy
actually ends and compressing the release into the remaining third
(`app/design-system.css`, `@media(min-width:761px)`), so the photograph still
opens up on the right. All four vertical homepages (`/`, `/distance`,
`/colleges`, `/jobs`) then read clean at 1440, 1280, 1024, 768, 430, 390 and 360.

### Defect: the tool-hero wash under-covered a copy block that is not a column

Same class, different geometry. `.tool-hero-copy` is the plain container, so the
text does not hold a constant share: the standfirst wraps at 58ch and the proof
pills wrap onto fewer lines as the viewport widens. Text extent as a percentage
of hero width, worst route at each width — 1728: 57, 1440: 58, 1280: 56,
1101: 66, 1024: 71, 768: 91, 761: 94.

Above ~1200 the right third of the hero is empty and the existing 96deg wash is
correct there, so it was left alone. Below it the wash was releasing the scrim
underneath live text. Worst sample per affected route:

| Width | Route | Before | After |
| --- | --- | --- | --- |
| 761 | `/jobs/search` | 2.27 | 5.51 |
| 761 | `/distance/universities` | 4.43 | 7.95 |
| 761 | `/colleges/search` | 5.29 | 5.84 |
| 768 | `/jobs/search` | 3.22 | 5.51 |
| 768 | `/about` | 3.24 | 7.66 |
| 900 | `/jobs/search` | 4.00 | 5.51 |
| 1024 | `/jobs/search` | 5.26 | 5.51 |

Two changes, both in `app/design-system.css`:

- `@media(min-width:761px) and (max-width:1200px)` moves the tool-hero shoulder
  out to 78 % and compresses the release into the last fifth.
- `.hero-pills span` no longer uses a plain white film at .13. A white film
  *lightens* whatever is under it, so over a bright crop it pushed white text
  toward white-on-white; the chip is now an ink base with a light sheen on top,
  which reads darker than a bright photograph and slightly lighter than the deep
  scrim, and gives the label a floor that does not depend on the crop. The ink
  is `--ink-deep`, which is derived from `--accent`, so the chip carries each
  vertical's hue rather than a fixed grey.

After: the worst small text anywhere in the seven tool heroes is **5.51**, and
that is a solid-filled button label rather than anything sitting on the
photograph. Swept at 360, 390, 430, 761, 768, 900, 1024, 1200, 1201, 1280 and
1440 on `/about`, `/blog`, `/reviews`, `/jobs/search`, `/colleges/search`,
`/distance/universities` and `/jobs/resume-builder`; both sides of the
1200/1201 boundary read the same. The four vertical homepages were re-checked at
390, 768 and 1440 and are unchanged. `.detail-banner` on `/colleges/gmc-patna`
and `/jobs/junior-frontend-bengaluru` was already clean at 768 and still is.

### Earlier defects found and fixed the same way

Found in previous passes of the same sweep, each verified fixed before being
recorded: a stat-note contrast failure; a "LIVE" pill rendered with no
accessible name; three scrim and token defects on interior surfaces; a landmark
counter that miscounted because a `<header>` inside a plain `<div>` is still a
`banner` landmark (only `article`, `aside`, `main`, `nav` or `section` scope it);
a path-card whose hit area did not cover its own label; a heading-level break on
`/automations`; a masthead vertical-switcher that was unreachable; and a
route-visual chip that rendered the wrong vertical's mark. Fabricated content
found during the same passes — a hard-coded "Verified 12 Aug 2026" among it —
was removed rather than restyled.

## Measured: reflow and 200 % zoom

Zoom is a viewport measurement, so it was tested as one: 200 % zoom of a
1280×1024 screen is a 640×512 CSS viewport, and WCAG 1.4.10's own target — 400 %
of 1280 — is 320 CSS px. Both were swept across eleven routes (`/`, `/distance`,
`/colleges`, `/jobs`, `/colleges/search`, `/jobs/search`,
`/distance/universities`, `/about`, `/jobs/resume-builder`,
`/colleges/gmc-patna`, `/jobs/junior-frontend-bengaluru`), checking document
overflow and, separately, every element that clips its own text
(`scrollWidth > clientWidth` on a box whose overflow is not visible — the check
that catches a label cut off inside a control that itself fits).

Document overflow was 0 at every width. The text check found two defects, both
invisible on a device-sized viewport and both real:

### Defect: buttons shrank past their own labels

A `<button>` carries `overflow:hidden` from the UA stylesheet, so as a flex item
its automatic minimum size resolves to **0** — it shrinks past its own label
instead of refusing to, and clips the text with no scrollbar and no ellipsis.

| Width | Where | Label | Needs | Got |
| --- | --- | --- | --- | --- |
| 320 | card foot | "Details" | 66 px | 56 px |
| 320 | card foot | "Apply now" | 103 px | 81 px |
| 768 | closing CTA | "Book a free call" | 154 px | 130 px |

The card foot needs 282 px of content box and had 250 at 320 px wide; it fits
from about 350 up, which is why every device width in the sweep passed and only
the reflow target failed. Fixed at the root — `.app .btn{min-width:fit-content}`
restores the content floor every other flex item already has — plus
`flex-wrap:wrap` on the two rows that then have to break (`.entity-foot`,
`.human-cta`), so a row that cannot fit wraps rather than truncates.

### Defect: the trust strip scrolled sideways inside a vertically-scrolling page

Below 761 px the strip set `overflow:auto` with `white-space:nowrap`, so at
320 px the third item ("Updated every admission cycle") sat off-screen behind a
horizontal scroll. Three short factual statements do not need a two-dimensional
layout, so the 1.4.10 exception does not apply. They now wrap: measured at 320,
360, 390 and 430 the container's `scrollWidth` equals its `clientWidth` and the
strip is 120 px tall over three lines; at 760 it is one line at 56 px and at 768
one line at 82 px, unchanged from before.

### After

Swept again at 320, 360, 390, 430, 512, 640, 768, 1024, 1280 and 1440 across all
eleven routes: **no clipped text and no document overflow anywhere.** The only
remaining hit is `span.sr-only`, whose 1 px clipped box is what makes it a
visually-hidden label — an instrument false positive, corrected by excluding it.
The desktop composition is unchanged: the closing CTA still lays out as text
left, button right at 1440, and the trust strip is still a single 82 px row.

## Slice D: the eight optional job fields, end to end

The public jobs listing has always been able to show a city facet, a map pin,
an eligibility line, a role label, approval badges and a deadline string. Until
now nothing could put them there. `createJob` in `lib/jobs-repo.js` built its
record from the required fields only and dropped every optional one on the
floor, and `updateJob`'s `writable` list did not include them either, so a job
posted through /admin could never carry the coordinates or the city facet the
listing needs. The fields existed at both ends of the pipe and nowhere in the
middle.

Three files changed: the repository (validation, creation, update), the admin
form (`app/admin/jobs/JobForm.jsx`), and the console styles for the disclosure
that holds them.

### Validation rules added

- Latitude must be a finite number in [-90, 90]; longitude in [-180, 180].
- Coordinates move as a pair. Half a pair is rejected on the field that is
  missing, because a job with one coordinate is worse than a job with none — it
  sorts as though it were on the equator.
- Optional text fields that arrive blank stay **absent** rather than becoming
  empty strings, because the public card derives a fallback for every one of
  them and an empty string would win over that fallback.
- On PATCH, an explicit empty value **clears** the stored key. Anything a form
  can set, the same form has to be able to unset.

### Node-level test, before the browser

A small script against the repository module directly: create with all eight
fields, create with `lat` and no `lng`, patch each field to empty, patch it
back. All four behaved as specified — the half-pair create returned a field
error rather than storing half a position, and the cleared keys were gone from
the record rather than present and blank.

### Measured in the browser, production server

| Step | Result |
| --- | --- |
| POST a job with `lat` and no `lng` | **422**, error rendered on the `lng` field |
| POST with all eight fields | **201**, record stored complete |
| PATCH each optional field to empty | key removed, listing falls back |
| PATCH the same fields back | values restored |
| Validation error inside the collapsed disclosure | disclosure **auto-opens** on submit |
| `/api/jobs?city=Nagpur` | returns the new job |
| `/api/jobs?city=Pune` | does not |
| `/jobs/search` | 21 cards, no console errors, no horizontal overflow |

The disclosure behaviour is worth naming. The eight fields sit behind a
`<details>` so the already-long drawer does not grow by half again for fields
that all have working fallbacks. That creates a failure mode: a server
validation error on a field nobody can see, with a banner saying something
needs attention and every visible field looking fine. The submit handler opens
the disclosure when the error is in there. It does that **once**, as a one-shot
`setShowMore(true)` rather than a derived-open expression, so a user who
collapses it again while the error still stands is not fought by the UI.

### The public projection, checked with the right field names

`lib/store.js` `jobCard()` renames on the way out, and checking for the stored
names on a public card gives a false "data lost" reading. Checked against the
projected names instead, on `/jobs/warehouse-picker-nagpur-maharashtra`:

| Stored field | Projected as | Rendered |
| --- | --- | --- |
| `city` + `area` | `place`, `city` | "Bluebird Logistics • MIHAN, Nagpur" |
| `lat` / `lng` | `pos: [21.1458, 79.0882]` | map container present |
| `eligibility` | `course` | "10th pass, no experience needed" |
| `roleType` | `mode` | "Warehouse" |
| `tags` | `approval` | "Immediate joining", "PF & ESI" |
| `deadlineLabel` | `deadline` | "Rolling — walk in any weekday" |

All six strings appear in the rendered page text; `h1` is "Warehouse Picker".
No console errors on a tab created fresh for the check. `overflowX` false at
1440 and again at 375, where the same six values still render.

Two false readings during this work are recorded because both would have looked
like defects. `/api/jobs` paginates at 20 and the public param is `pageSize`,
not `limit`; a `limit=50` query silently returned the first page and the new
job, at position 21, appeared to be missing. And three 422s in the console on
`/jobs/search` were my own deliberate validation-failure submissions still
sitting in the SPA's buffer from the admin console — a fresh tab showed no
console logs at all.

## Verified: the college-seeker journey, and three defects on the compare page

Run on the production server at 1440 x 1000, then re-run at 360 x 800.

The journey itself passes: on `/colleges` the Type=Government filter narrows
8 entries to 5, the results header updates to "5 results", the compare
checkboxes select, the tray (`.compare-tray glass-dark`, 62 px tall) appears
reading "2 of 3 selected / Ready to compare side by side / Compare now", and
that button carries the selection through to `/colleges/compare`. Selection
survives a full page load — it is persisted in `localStorage` under
`dcw-compare-v2`.

Then I measured the comparison table itself, and it was wrong.

### Defect: every value was printed one row below its own label

Each `.compare-col` is its **own** grid. The columns line up only because they
share one fixed row template, `grid-template-rows:70px repeat(5,62px)` — six
rows. The label column had six children. Every data column had **seven**: the
monogram, the name, and five values. So the seventh fell into an implicit row
and everything above it sat one row too low.

This is what the reader actually saw, by measured `top` offset:

| top | labels column | data column |
|-----|---------------|-------------|
| 536 | Choice | *(monogram)* |
| 606 | Total fee / salary | **Government Medical College** |
| 668 | Duration / eligibility | **₹6.5L** |
| 730 | Approval | **5.5 years** |
| 792 | Rating | **NMC approved** |
| 854 | Deadline | **4.3 ★** |
| 916 | *(nothing — past the end)* | **Bihar UGMAC** |

The fee was printed against "Duration / eligibility" and the rating against
"Deadline", on the one page in the product whose entire job is to let someone
read a value against its label. Nothing about it looks broken in a screenshot —
every row is populated and neatly aligned. It is only wrong if you read it.

The fix is to stop the child counts from disagreeing: the monogram and the name
are now one `.cc-head` cell, so both columns have exactly six children and
cannot drift. Header row 70 px -> 118 px to hold the mark above a two-line name.
After the fix, all four columns report identical row tops:

| | measured tops |
|---|---|
| labels | 536, 654, 716, 778, 840, 902 |
| Government Medical College | 536, 654, 716, 778, 840, 902 |
| Tbilisi State Medical University | 536, 654, 716, 778, 840, 902 |
| Dr. D.Y. Patil Medical College | 536, 654, 716, 778, 840, 902 |

At 360 x 800 the same holds, all four columns reporting
532/650/712/774/836/898. The grid scrolls sideways inside itself as designed
(`scrollWidth` 670 in a 324 px box) while the page does not: measured page
overflow 0. The longest name, "Tbilisi State Medical University", wraps to two
lines in a 149 px cell with `scrollWidth == clientWidth` — no clipping, no
horizontal spill.

### Defect: comparing two choices left an empty third column

`grid-template-columns:200px repeat(3,minmax(190px,1fr))` hardcoded three data
tracks whatever the item count. With two colleges the measured tracks were
`200px 346px 346px 346px` — a 346 px blank column beside the comparison.

Replaced with `grid-auto-flow:column` plus `grid-auto-columns`, so the tracks
follow the content and no count is hardcoded anywhere. Measured after: two
items give `200px 519px 519px`, three give `200px 346px 346px 346px`, and
removing one live re-collapses to `200px 519px 519px` with alignment intact.

### Defect: the values had no accessible names, and the remove button had none at all

The grid is `div`s, so a value cell was related to its label by grid position
only — visual, not programmatic. A screen reader reached "₹6.5L" with nothing
tying it to "Total fee / salary". The remove button was an icon-only `<button>`
containing an SVG, so it announced as just "button", three times over.

I did not convert this to a real `<table>`. The responsive behaviour depends on
these being independent column grids, and naive ARIA table roles would map
*wrongly* here: the DOM is column-major (a separate label column, then one
column per entity), not row-major, so `role="row"` would describe columns as
rows and make the announcement worse than silence. The contained fix is to make
each cell self-describing, which leaves layout and CSS untouched:

| control | accessible name, measured in the page |
|---|---|
| fee cell | "Total fee / salary for Government Medical College: ₹6.5L" |
| duration cell | "Duration / eligibility for Government Medical College: 5.5 years" |
| approval cell | "Approval for Government Medical College: NMC approved" |
| rating cell | "Rating for Government Medical College: 4.3 out of 5" |
| deadline cell | "Deadline for Government Medical College: Bihar UGMAC" |
| remove button | "Remove Tbilisi State Medical University from the comparison" |

The rating cell speaks "4.3 out of 5" rather than "4.3 ★", because the star is
decoration and its screen-reader rendering is unpredictable. The monogram is
`aria-hidden` — it is a typographic stand-in for a logo we do not hold, and the
name is already in the header.

### The hero was making a claim the page did not keep

The hero says "only meaningful differences are highlighted". The `different`
class was hardcoded onto the fee row, so the fee was accented whether or not it
differed, and a genuinely deciding difference elsewhere was not. The rows are
now declared once and the accent is computed per row — highlighted only where
the compared values actually disagree. Measured with three colleges: Approval
("NMC approved" for all three) is the only row not accented; fee, duration,
rating and deadline all differ and all are. Removing a column recomputes it.

### Touch target

The remove button measured 32 x 32. That still clears WCAG 2.2 **2.5.8, 24 x
24, at AA**, so it was not a conformance failure — but it sits directly beside
the entity name in a cramped column header, which is the situation the AAA
44 x 44 target exists for. Raised to 44 x 44 with the icon held at its old size
by padding. Re-measured: 44 x 44, `elementFromPoint` at its centre resolves to
`.remove`, and it does not overlap the name cell.

To be explicit about the standard being applied, because an earlier draft of
this section overstated it: the bar this audit holds the product to is **AA,
24 x 24**. 44 x 44 is treated as a goal, met where a control is small and
crowded, not as a pass/fail line. The card controls measured below sit between
the two and are recorded, not reported as defects.

### A sixth false reading of my own: six 422s in the console

`read_console_messages` reported six `422 (Unprocessable Entity)` errors on the
compare page, which would have been a release blocker under the no-console-
errors rule. They were not from this page. No 422 appears anywhere in the
network capture for any load of it, and the count never grew across reloads.
The Browser pane's console buffer is **per tab and survives navigation**, and
the `seed` tab is *reused* by `preview_start` rather than recreated — so both
tabs were still holding the 422s from the deliberately invalid form submissions
tested earlier, which is the server validating correctly.

Settled by opening a genuinely new tab and loading the page: **no console logs
of any kind**. Recorded because the instinct to trust a red console line and
"fix" a page that is behaving correctly is exactly how invented defects get
written up as real ones.

## Verified: the job-seeker journey

Run on the production server at 1440 x 1000. `/jobs` -> "Find verified jobs" ->
`/jobs/search`, which renders 20 cards.

The count is honest, which was worth checking rather than assuming: the public
`/api/jobs` pages at 20, so a header reading "20 matching openings" could have
been page one of something larger presented as the whole. The API reports
`total: 20, totalPages: 1, hasMore: false` — 20 is the real catalogue size, not
a page boundary.

### City filter (punch-list item 9)

Present as both chips with counts and a `City` select.

| action | header | cards | check |
|---|---|---|---|
| City = Patna | "7 matching openings in Patna" | 7 | all 7 genuinely Patna addresses (Kankarbagh, Boring Road, Exhibition Road, Bailey Road, Fatuha, and two unqualified "Patna") |
| \+ Job type = Internship | "0 matching openings in Patna" | 0 | empty state, below |
| Reset filters | "20 matching openings" | 20 | full catalogue restored |

The zero-result case is a designed state, not a blank region: a `.state-panel`
reading "No exact matches / Adjust the filters or reset them to see every
option." with a "Reset filters" button, above it an `.active-filters` row
showing "Internship" and "Patna" as individually removable chips plus
"Clear all". Both recovery paths were exercised and both restore 20.

### "Jobs near me" (punch-list item 10)

Geolocation is requested **only** on an explicit press of "Use my location" —
never on page load. Confirmed by counting calls against a stubbed
`navigator.geolocation`: zero until the button is pressed, one after.

Both branches were driven by stubbing the API rather than answering a native
permission prompt, which cannot be driven in this pane.

**Denied.** The list is left exactly as it was — 20 cards, unchanged order, no
error dialog — and the copy under the heading becomes "Location is off, so pick
your city below — nothing else changes." All four states carry their own
wording (`ok`, `denied`, `error`, `unsupported`), so a browser that has no
geolocation at all is not shown a permission message.

**Granted** (Patna, 25.5941 / 85.1376). Sort switches to a "Nearest first"
option that only exists once a location is known, and every card gains a
distance signal. Measured across all 20:

- 18 cards carry a distance, and the sequence is strictly ascending:
  &lt;1, &lt;1, 2, 2, 4, 5, 19, 247, 436, 473, 594, 839, 860, 941, 1143, 1406,
  1452, 1612 km.
- The 2 that carry none are both "Work from home" (Teleperformance, Inkspan),
  and they sort to the end rather than to 0 km.
- The summary reads "7 within a 60 km commute", which matches the measured
  distances exactly — the seven at 19 km or less. It is computed from the same
  numbers the cards print, not asserted.

### Defect: the location result was announced to nobody

Pressing "Use my location" re-sorts all twenty cards and rewrites the heading
copy. None of it was in a live region, so a screen-reader user pressed a button
and received silence while the page reorganised underneath them.

The conditional swaps the whole paragraph, so the fix could not be an
`aria-live` on the paragraph itself — a live region that appears at the same
moment as its content is announced unreliably. A persistent wrapper
(`.locator-msg`, `role="status"`) now sits around all four states. Verified in
the browser that it is the **same DOM node** before and after the geolocation
resolves (`sameNode: true`), which is the property that makes the announcement
work, and that it then contains "Closest to Patna · 7 within a 60 km commute".

`role="status"` rather than `alert`: it follows a deliberate press and should
not interrupt.

The wrapper is a flex box sized to its child, so the layout is unchanged —
measured at the same x/y/width/height as the bare paragraph occupied before
(374, 583, 342 x 21).

### Not fixed: filter state is still absent from the URL

`/jobs/search` keeps every filter in component state. After narrowing to seven
Patna jobs the address bar still reads `/jobs/search` with no query string, so
a filtered view cannot be linked to, shared, or restored by a refresh. Recorded
as a known limitation rather than fixed: it is a routing change across all
three listing surfaces, not a job-page tweak, and it is listed as outstanding
below.

### Save, apply, and the job detail page

Completing the journey past the filters.

**Save.** The heart on a card toggles `aria-pressed` false/true, swaps its
accessible name between "Save X" and "Remove X from saved", adds an `active`
class, writes `["junior-frontend-bengaluru"]` to `dcw-saved-v2`, and fires a
"Saved for later" toast. `elementFromPoint` at its centre resolves to the
button itself, so nothing overlays it. Measured 38 x 38, as are the "View job"
and "Apply now" buttons — above the AA minimum, below the AAA 44, recorded per
the note above.

**Detail page.** "View job" reaches `/jobs/junior-frontend-bengaluru`, one
`<h1>`, header/nav/main/footer landmarks present.

**Apply.** The footer's "Apply now" opens a dialog named "Apply for Junior
Frontend Developer" with focus moved into it. Consent unchecked leaves the
submit button `disabled` (opacity .45, `cursor:not-allowed`) — pressing it does
nothing, which is correct, and the reason is bound to the checkbox itself via
`aria-describedby="consent-why"` ("We cannot pass your details to a counsellor
without the first permission"), so it is available to a screen reader at the
control rather than only as loose text. Ticking consent enables the button in
the same frame. Verification code -> "Verify & submit application" ->
"Application submitted", reference `SKY-00001`, labelled "Demo mode: no real
SMS, WhatsApp or CRM record was created."

### Defect: submitting the application threw focus out of the dialog

On reaching the success step, `document.activeElement` was `<body>`.

Steps 0 and 1 each `autoFocus` an input, so focus stays inside the dialog while
the user moves through them. Step 2 has no input: the "Verify & submit" button
unmounted, and focus fell to the document.

That is the worst place to lose it. The dialog stays open and stays
`aria-modal="true"`, which tells assistive technology to ignore everything
outside it — so the user was left with focus in the one region their screen
reader has been told not to read. Nothing was announced, the "Done" button was
unreachable, and the only way out was to know to press Escape. Measured before
the fix: `focusInDialog: false`, `activeTag: "BODY"`, and zero live regions
inside the dialog.

Fixed by focusing the success heading (`tabIndex={-1}`) when the step changes.
Re-measured: `activeTag: "H2"`, `activeId: "lead-title"`, text "Application
submitted", `focusInDialog: true`. Focusing the heading also announces it, so
the step needs no separate live region — the confirmation and the focus target
are the same element. All focus outlines in this codebase are keyed to
`:focus-visible`, so the ring appears for the keyboard user and not for the
mouse user.

### Defect: a heading above the page's own heading

The interior hero band added for the "hero image inside pages" item rendered
the employer — or, on a college page, a shortened copy of the page title — as
an `<h2>`. It sits above the `<h1>` in the DOM, so the outline began
`H2 ("Zerofold Labs") -> H1 ("Junior Frontend Developer") -> H2`. Anyone
navigating by heading met a section heading before they met the page.

It is a display label over an image, not a section of content, so it left the
outline: now a `<span class="db-name">` carrying the same styling. The employer
is still reachable as text — it is the "Employer" row of the role facts list —
so nothing was lost. Re-measured: outline starts `H1 -> H2 -> H2 -> H3`, zero
`h2` in `.detail-banner`, and the band is unchanged at 40 px white.

### Defect: all ~30 URLs shared one page title

Every public URL is served by one catch-all route, and nothing set `<title>`,
so all of them carried the default from `layout.jsx`: the same text in every
bookmark, every shared link, every search result, and as the first thing a
screen reader announces on load.

Two attempts at this were wrong, and both are worth recording because both
*looked* like they worked:

1. **Setting `document.title` in a `useEffect`.** Detail routes updated;
   `/about`, `/reviews` and `/jobs/search` silently did not. The effect runs
   during hydration and Next applies its own metadata after it, putting the
   default straight back. Detail routes only appeared to work because their
   effect re-runs later, when the catalogue resolves and the entity arrives —
   by then Next has finished.
2. **Rendering a `<title>` element** and letting React 19 hoist it. This
   produced **three** `<title>` tags in `<head>`, with the default still
   winning on document order.

Both share a deeper fault: a title set in the browser is not in the HTML, which
is the version a crawler or a link preview reads. `next/dist/docs/01-app/
03-api-reference/04-functions/generate-metadata.md` gives the supported pattern
under "Why generateMetadata is Server Component only" — keep `page.jsx` on the
server and move the client half to its own file.

So `app/[[...slug]]/page.jsx` is now a server component exporting
`generateMetadata`, and the client application moved unchanged to
`app/[[...slug]]/site-app.jsx` (via `git mv`, so its history follows it). Route
titles live in `lib/page-title.js` as a pure function, and detail titles are
resolved server-side through the same `getJob` / `getInstitution` the API uses.

Deliberately **not** derived from each page's `<h1>`: that was the first idea
and it is a trap. The hero headings are marketing copy split across a `<br>` —
`"Less searching.<br>More moving forward."` — which reads as one run-on word
and names neither the section nor the subject.

Measured from `curl`, so this is the server HTML and not the hydrated DOM:

| Route | `<title>` count | Title |
| --- | --- | --- |
| `/` | 1 | DCW — Your next move, made visible |
| `/about` | 1 | About us — DCW |
| `/reviews` | 1 | Student reviews — DCW |
| `/jobs` | 1 | Jobs — DCW |
| `/jobs/search` | 1 | Search jobs — DCW |
| `/jobs/junior-frontend-bengaluru` | 1 | Junior Frontend Developer — DCW |
| `/colleges/college/gmc-patna` | 1 | Government Medical College — DCW |
| `/distance/compare` | 1 | Compare distance courses — DCW |
| `/saved` | 1 | Saved for later — DCW |
| `/jobs/nope-not-a-job` | 1 | Jobs — DCW |

The home page keeps the site default deliberately. An unknown slug falls back
to the section title rather than inventing one from the slug.

**Regression check on the split**, since moving a 650-line file is the largest
structural change in this pass: `/distance` (9 cards), `/colleges` (13 cards),
`/distance/boards`, `/jobs/resume-builder` and `/jobs/search` (20 cards, city
chips with counts, geolocation button, live region intact) all render, save
still persists, the apply dialog still opens and submits, no horizontal
overflow at 1440, and **no console messages of any kind** on a freshly created
tab.

## Verified: the distance-learner journey, and twelve cards that led to three pages

Run on the dev server first and then re-run in full against a fresh production
build (`npx next build`, exit 0, `/[[...slug]]` still emitted as `ƒ`, server
restarted so nothing stale was in memory). Every number below is a reading from
the production run unless it says otherwise.

### The defect: twelve category cards, three destinations

Each of the three homepages opens with a `.path-grid` of category cards —
six on `/distance`, six on `/colleges`, four on `/jobs`. Clicking through all
sixteen showed the actual problem behind "why all tabs are not working": the
cards were not broken, they were **indistinguishable**. Twelve of them resolved
to three pages.

| homepage | cards | distinct destinations, before |
|---|---|---|
| `/distance` | Complete 10th, Complete 12th, UG distance, PG distance, Online degree, Fast track | 2 — `/distance/boards` (×3), `/distance/universities` (×3) |
| `/colleges` | Medical, Engineering, Management, Law, Study abroad, Commerce | 1 — `/colleges/search` (×6) |
| `/jobs` | Jobs near me, Free resume builder, Skill to job, Sarkari exam alerts | 3 — resume builder, `/jobs/search` (×3) |

A person who read "Online degree", picked it, and landed on the same unfiltered
list of six universities they would have got from "UG distance" has been told
the site does not know the difference. It does — the catalogue records it — the
listing simply never asked.

### What was added, and where the data came from

Nothing here invents a row. Three facts were already in the seed and were being
dropped before they reached the UI:

- `lib/content/courses.js` — each of the 24 course rows carries an explicit
  `level` (`ug` / `pg`) and `mode` (`online` / `distance`). These are stated per
  row, not inferred by regex from the course name: a pattern would have worked
  for today's 24 rows and quietly mislabelled the first one that did not fit.
- `lib/store.js` `institutionCard` — now also projects `streams` (the distinct
  set of `stream` values across that institution's courses) and `country`. Both
  additive; no existing consumer sees a changed field.
- `lib/content/streams.js` — the colleges vocabulary and its two predicates,
  `matchesStream` and `isAbroad`.

`Listing` reads `?path=`, `?stream=`, `?abroad=1` and `?city=` from
`useSearchParams()` rather than holding them in local state, so a filtered view
survives reload, Back, and being pasted into a message. "Reset filters" now
clears the query string as well as the state — otherwise the address bar stayed
filtered while the list did not.

### Measured, production server, port 3100

| URL | header | cards | narrowing shown |
|---|---|---|---|
| `/distance/universities?path=online` | "4 matching results offering fully online degrees" | 4 | chip "Fully online degrees"; each card "4 fully online courses" |
| `?path=ug` | "6 matching results offering bachelor's programmes" | 6 | "2 bachelor's courses" on five cards, "3" on IGNOU |
| `?path=pg` | "6 matching results offering master's programmes" | 6 | "2 master's courses"; IGNOU shows no count chip because it has a single PG course |
| `?path=bogus` | "6 matching results" | 6 | no chip — an unrecognised value is ignored, not an error page |
| `/colleges/search?stream=Engineering` | "1 matching result offering Engineering" | 1 | chip "Engineering", clear link "Show all colleges", card: NIT Patna |
| `/colleges/search?abroad=1` | "1 matching result outside India" | 1 | chip "Studying abroad", card: Tbilisi State Medical University |
| `/jobs/search?city=Patna` | "7 matching openings in Patna" | 7 | all seven genuinely Patna; Reset restores "20 matching openings" and an empty query string |

Console on a **fresh** tab across all of these: no errors. (The `seed` tab still
shows the pre-fix crash in its buffer — the console buffer is per-tab and
survives both navigation and a server restart, which is worth knowing before
reading it as a live failure. A new tab re-run confirmed clean.)

### The empty state had to distinguish two different emptinesses

The catalogue publishes 7 Medical colleges and 1 Engineering college. Four of
the six colleges cards — Management, Law, Commerce, and in part Study abroad —
name things the data does not contain. The options were to invent rows, to
leave all six pointing at one list, or to say so:

> **No law colleges listed yet**
> We publish every college we have checked, and none of them is a law college
> yet. A counsellor can tell you what is opening for the next intake.
> [See every college]

Measured at `/colleges/search?stream=Law`: header "0 matching results offering
Law", the panel above verbatim. This is deliberately **not** the "No exact
matches / Reset filters" state, which would be advice that cannot work — no
combination of sidebar filters produces a law college. The distinction is
computed against `initial`, the vertical's full row set before a single sidebar
filter, so it can only claim "nothing published" when that is literally true.
Filter-caused emptiness still gets "Reset filters", unchanged.

### "Fast track" — the one card the quiz could actually answer

Three of the six distance cards pointed at `/distance/boards`. Two of them
honestly belong there: the same four open boards serve both a 10th and a 12th
completion, so sending both to one page is the correct answer, not a missing
feature. The third promised "the fastest legitimate path", and the boards page
already runs a four-question quiz whose **first** question is "What matters
most? — Widest acceptance / Fastest result / Lowest fee".

So `Fast track` now links to `/distance/boards?goal=Fastest%20result`, and the
quiz opens having already answered its own first question. Seeded from the URL
at first render rather than by an effect after mount, so the first paint shows
question two instead of showing question one and then moving.

Measured (production):

- opens on **"Question 2 of 4"**
- a line reads "Carried over from your choice: **Fastest result**" with a
  **Change** control — a quiz silently starting at question two reads as a bug,
  so it says why
- **Change** returns it to "Question 1 of 4", removes that line, *and* clears
  `?goal=` from the URL, so a reload does not silently re-seed the answer the
  person just rejected
- the hero gains a third CTA, "Your recommendation", anchored to `#quiz` —
  the quiz sits ~6100px down, below the hero and the comparison table, so
  arriving with an answer already carried and no way to see it would have been
  pointless
- an unrecognised `?goal=` value is ignored and the quiz starts at question one

### Not fixed, and why: two jobs cards

"Skill to job" and "Sarkari exam alerts" still both land on `/jobs/search`.
This is recorded as a finding rather than fixed, because every honest
destination for them requires data or a capability that does not exist:

- **Sarkari exam alerts** — the catalogue holds 20 jobs and **not one
  government/sarkari posting**. There is also no alert-sending capability
  anywhere in the repo: no scheduler, no email or SMS transport for
  notifications, no subscription record. A filter would return zero rows and the
  card's own promise ("pushed before the deadline") would still be unkept.
- **Skill to job** — the six-to-twelve-week courses named on the `/jobs`
  homepage are marketing copy in the page, not catalogue entities. There is
  nothing to link to that is not the general job list.

Filling either in would mean fabricating listings or a feature. Both are listed
in "Still outstanding" as product gaps for the client to fill, not as bugs.

### Two smaller fixes found along the way

**The chosen course was dropped at the API boundary.** A visitor who opened the
lead form from a specific programme had that programme captured in the form and
then discarded before the CRM saw it — `course` was not forwarded through
`app/api/leads/route.js` -> `lib/integrations/crm.js` -> `lib/data/schema.js`,
so every enquiry reached the admin console attributed only to a vertical. Now
forwarded end to end and rendered in `app/admin/leads/page.jsx`.

**Missing `autocomplete` tokens.** WCAG **1.3.5 Identify Input Purpose is Level
AA**, not AAA, and it requires the tokens. The lead form and the resume builder
collected name, email, phone and address with none. Added.

**Pluralisation.** The header read "1 matching results". Now singular at one.

### A defect I introduced, and how it was found

Adding the narrowing prop crashed **every** `/distance` route — "This page
couldn't load", console `TypeError: Cannot read properties of undefined
(reading 'toLowerCase')` — while `/colleges` and `/jobs` kept working.

The cause is worth writing down because the shape recurs. The context object
every page receives is:

```js
const ctx={path,vertical,cfg,go,saved,toggleSave,compare,toggleCompare,
           setLead,query,setQuery,setSearchOpen,notify,auth,catalog};
```

`ctx.path` is **the router pathname**. `EntityCard` had been given a prop also
named `path`, and the call site was written `<EntityCard item={x} path={path}
{...ctx}/>` — the spread last, so it silently overwrote the explicit prop with
`"/distance"`. `PATHS["/distance"]` is `undefined`, and `.toLowerCase()` threw.
Only distance broke because colleges and jobs cards fall back to a single
course, so the `list.length > 1` chip that calls `toLowerCase` never rendered.

The minified stack was no help — the reported frame was React's scheduler
rethrow, and the dev server's stack was truncated. It was found by grepping
every `toLowerCase` in `components/` and then reading `const ctx=`.

Fixed by renaming the prop to `coursePath` in both files and ordering the call
site `{...ctx}` **first**, `coursePath={coursePath}` last. Comments in both
files record the collision so the next person does not re-introduce it.

## Verified: the returning-user journey

Run on the production server. The point of this journey is that nothing a
visitor builds up should evaporate on a reload, and that none of it should
require an account.

1. `/distance/universities`, signed out. Saved two universities (Amity Online,
   LPU) and added two to compare (Amity Online, IGNOU).
   `localStorage` after: `dcw-saved-v2 = ["amity-online","lpu"]`,
   `dcw-compare-v2 = {"distance":["amity-online","ignou"],…}`. The compare tray
   reads "2 of 3 selected / Ready to compare side by side".
2. **Full page load** of the same URL. Save buttons come back with
   `aria-pressed="true"` on exactly the two saved cards, the compare checkboxes
   come back checked on exactly the two compared cards, and the tray still says
   "2 of 3 selected". Nothing had to be redone.
3. `/saved` — "Saved for later." lists both, each with a Remove control, plus a
   "Compare these / 2 saved / Ready to compare" panel. The lead copy states
   where the list lives: "kept on this device, so it survives a refresh". That
   is accurate, and saying so matters, because it is the honest limit — this is
   per-device, not per-account.
4. `/distance/compare` — both choices rendered with real catalogue values
   (Amity ₹1.5L / 2 years / UGC entitled; IGNOU ₹16,200 / 3 years / UGC
   entitled) and a single "Enquire about all 2" action.

All four steps pass. The compare page's own defects — values printed a row
below their labels, an empty third column, missing accessible names — were
found and fixed earlier; see the college-seeker section.

## Verified: the anonymous-student journey, and a fabricated person

Run signed out, on the dev server for the fix and again on production.
Home -> category card -> filtered listing -> detail -> apply.

| step | result |
|---|---|
| `/` | "See the whole path. Choose your next move.", six category cards, three catalogue cards, heading order H1 -> H2 -> H3 |
| "Online degree" card | `/distance/universities?path=online`, "4 matching results offering fully online degrees" |
| "Details" on a card | `/distance/university/amity-online`, title "Amity University Online — DCW", sections: what matters, course-wise fees, proof, process, before you decide |
| "Apply now" | dialog labelled "Apply to Amity University Online" opens, focus moves to the **course select** — the thing the dialog is for — not to the close button |
| the form | every control has a real label: course, full name (`autocomplete="name"`), mobile (`autocomplete="tel-national"`), qualification, a contact-consent checkbox, and a *separate* optional WhatsApp checkbox |
| Escape | dialog closes, focus returns to the "Apply now" button that opened it |
| "Save for later" | works with no account; label changes to "Saved", `dcw-saved-v2` updated |

Nothing in the path from arriving to applying asks for an account, which is the
right answer for this audience.

### Defect: signed out, the site showed a person who does not exist

Two places invented an identity for a visitor who had never signed in.

**The masthead avatar.** `Header` computed
`const initials = user ? … : 'AK'` — a hardcoded fallback. Those initials belong
to a real account on this install (Alok, the admin user in `lib/auth.js`), so
every anonymous visitor was shown somebody else's monogram, next to a button
labelled "Open profile" that led to `/profile`. Signed out there is nobody to
abbreviate: the avatar is now a neutral `UserRound` glyph, labelled **"Sign
in"**, and it routes to `/login`.

**The profile page.** `/profile` rendered, under the heading "YOUR ACCOUNT —
Profile & preferences" and the line "The details we reuse to prefill
applications and sharpen recommendations":

> **AK — Amit Kumar — Graduate · Patna, Bihar**

There is no Amit Kumar. It was placeholder text presented to every signed-out
visitor as their own account details, which is exactly the failure mode the
brief forbids — a development fixture shown as live information. Replaced with
three real states:

- `auth.state === 'loading'` -> "Loading your account… / Checking whether you
  are signed in." so the page does not flash a wrong answer before the session
  request returns
- signed in -> the session's actual `name` (with the parenthetical role
  stripped) and a truthful second line derived from `role`
- signed out -> "You are not signed in / Your shortlist is kept on this device,
  so it works without an account. Sign in to keep applications and alerts with
  you across devices." with a **Sign in** button

Measured after the fix at `/profile`, signed out: the panel reads exactly the
signed-out text above, and the masthead avatar is a glyph rather than "AK".

The **signed-in** branch is verified as a code path but **not** in the browser:
confirming it visually means typing a passcode into a login form, which is
outside what I will do unattended even with a demo credential. It reads the same
`auth.user.name` the utility bar was already observed rendering correctly while
a session was live ("Alok (Admin)"), so the field is known to arrive; the
rendering of it is not independently measured. Recorded as a gap rather than a
pass.

### A false reading of my own, recorded so it is not repeated

First measurement said Escape closed the lead dialog and dropped focus on
`<body>` — a focus-restoration failure. It was not. `useDialogA11y` restores to
the last element focused *outside* any dialog, and I had opened the dialog with
a programmatic `element.click()`, which does not focus the element it clicks.
There was no outside focus to restore to. Re-run with `trigger.focus()` before
the click — which is what a keyboard or pointer user actually does — focus
returns to the "Apply now" button. The restoration logic is correct; the test
was wrong.

## Final regression sweep

Run last, against the rebuilt production server (`npx next build` exit 0,
server stopped and restarted so nothing stale was held in memory), in a **fresh
browser tab** so the console buffer contained only this run.

Fifteen routes, each loaded directly by URL and then measured: `/`, `/colleges`,
`/jobs`, `/distance/universities` (plus `?path=ug|pg|online|bogus`),
`/distance/boards` (plus `?goal=`), `/distance/compare`,
`/colleges/search` (plus `?stream=Engineering|Law`, `?abroad=1`),
`/colleges/college/gmc-patna`, `/colleges/neet-predictor`,
`/jobs/search` (plus `?city=Patna`), `/jobs/junior-frontend-bengaluru`,
`/jobs/resume-builder`, `/about`, `/reviews`, `/saved`, `/applications`,
`/notifications`, `/automations`, `/profile`.

Every one of them:

- rendered — no "This page couldn't load" anywhere
- carried its **own** `<title>`, not a shared one
- had exactly one `<h1>`
- reported `scrollWidth - clientWidth === 0` — no horizontal overflow

Console across the whole sweep: **no errors**. `/profile` was additionally
measured at 1440 x 1000, 768 x 1024, 390 x 844 and 360 x 800 because its
signed-out panel is new markup — no overflow at any of them, and the Sign in
button measures 96 x 40, above the 24 x 24 minimum of WCAG 2.5.8 (Level AA).

One harness note worth keeping: the console buffer is **per tab** and survives
both navigation and a server restart. A tab that saw the pre-fix crash still
lists it afterwards. Read a console in a tab opened after the fix, or the same
bug appears to still be live.

## Still outstanding

Recorded here so the gaps are not mistaken for passes:

- All five interaction journeys have now been run end to end and written up
  above: the lead/apply journey; the **college seeker** journey (four defects on
  the compare page, all fixed and re-measured); the **job seeker** journey
  including the city filter and "jobs near me" (one accessibility defect fixed);
  the **distance learner** journey (the twelve-cards-three-destinations defect,
  plus a crash I introduced fixing it); the **returning user** journey (save and
  compare survive a full load, `/saved` and `/compare` both correct); and the
  **anonymous student** journey (two places showing a fabricated identity to
  signed-out visitors, both fixed). What is *not* covered: the **signed-in**
  rendering of `/profile`, because confirming it means typing a passcode into a
  login form. The reasoning is in the anonymous-student section.
- **Sidebar** filter state — type, sort, fee ceiling, must-haves — is still
  not reflected in the URL on any of the three listing surfaces, so a view
  narrowed with the sidebar cannot be shared or survive a refresh. The
  *category* filters now are: `?path=`, `?stream=`, `?abroad=1` and `?city=` are
  read from the URL, cleared by Reset, and survive reload, Back and sharing.
  Extending the same treatment to the sidebar is the remaining half.
- Form cases: **done** — the whole checklist is written up above, and it found
  three defects (pasted `+91` numbers, duplicate submission, a raw
  "Failed to fetch" shown to the visitor), all three fixed and re-measured.
  Back-navigation-closes-the-overlay is measured and deliberately **not** fixed;
  the reasoning is in that subsection. A true clipboard paste could not be
  driven in this pane — `execCommand('insertText')` stood in for it.
- Accessibility: the hand-driven keyboard tab-order walk is **done** on
  `/distance/universities`; the other nine routes have had the DOM sweep only
  (names, tab order, headings, landmarks, labels, overflow — all clean), which
  does not prove each focus ring is visible at each stop. Both are written up
  above. Reduced motion **cannot be emulated in this pane** —
  the `prefers-reduced-motion` handling has been inspected in source only, and
  that is not the same as testing it. Enter/Space activation cannot be tested
  here either; see the harness limit recorded in the accessibility section.
- Further code splitting. The domain extraction is finished and measured
  (15 KB wire / 55 KB unpacked across the tools, editorial and account
  families); the remaining weight is `Listing`, `Detail`, `LeadFlow`, `AskDCW`
  and `SearchPanel` in the shell. `LeadFlow` and `SearchPanel` could be
  deferred and deliberately have not been — see the reasoning in the splitting
  section. This is a closed decision, not a pending task; it is listed here
  only so nobody re-opens it thinking it was overlooked.
- The entity-detail "Proof you can inspect" buttons still call a
  `notify("… document preview opened")` stub that opens nothing.
- Two `/jobs` homepage cards — **"Skill to job"** and **"Sarkari exam alerts"** —
  still land on the unfiltered job list, and cannot honestly do otherwise until
  the client supplies what they promise: the catalogue holds **no government
  postings**, there is **no alert-sending capability** in the repo (no
  scheduler, no notification transport, no subscription record), and the short
  courses named on that page are copy rather than catalogue entities. Product
  gaps, not bugs; reasoning in the distance-learner section above.
- **Four of the six `/colleges` category cards point at streams the catalogue
  does not publish.** Management, Law and Commerce return zero rows today, and
  Study abroad returns exactly one (Tbilisi). The pages are honest — a written
  "nothing published yet" state, distinct from "no matches" — but the gap is in
  the data, and closing it needs real colleges, not code.
- Lighthouse category scores. Still unrunnable here; see the environment limits
  at the top. No scores are estimated.

## Data provenance

`DATA_PROVENANCE = 'demo'`. Nothing in this repository is live institutional
data, and no ranking, rating, deadline or job count in the UI should be
presented to the public as fact until a real source is connected.
