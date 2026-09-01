# Client prototype — `dcw-superapp-prototype.jsx`

Source: artifact 541946df-64ef-4a87-b0f0-034ad08d92a3 (shared by client, 581 lines).
Retrieved 2026-09-01. Self-described: "clickable layout prototype … saara data DEMO hai."

## Palette — matches PRD §4 exactly

| vertical | accent | accent2 | tint |
|---|---|---|---|
| distance | `#2C3EE0` | `#6B4BEA` | `#ECEEFF` |
| colleges | `#00786A` | `#14A88F` | `#E2F5F1` |
| jobs     | `#D93A17` | `#FF7A1A` | `#FFEDE6` |

Contrast (white text on the colour):
accent 7.31 / 5.39 / 4.60 — all pass AA.
accent2 5.50 / **2.99** / **2.61** — accent2 is gradient-only in the prototype
(`linear-gradient(120deg,var(--a),var(--a2))`), never a text ground on its own. Keep it that way.
`.rate` green `#0E8A4A` on white = 4.42 — marginally under 4.5 for normal text.

## Type
- display: **Bricolage Grotesque** 800, `letter-spacing:-.02em`, `line-height:1.05`
- body: **Instrument Sans** 400/500/600
- numerics: **IBM Plex Mono** 500/600 via `.mono` (fees, salaries, counts)

## Form factor
Mobile app shell, not a responsive site: `max-width:452px`, centred on `#1A1A2E`,
`min-height:100vh`, fixed 5-item bottom nav (Home / Compare / Counsellor / Applications / Profile).

## Structural signatures
- Sticky gradient header `linear-gradient(118deg, accent, accent2)`
- Location row: "Deliver counselling to · Patna, Bihar 800001"
- Vertical switcher = segmented control inside the header, white active pill
- Per-vertical Hinglish ticker with a pulsing dot
- Category **pucks**: 60px rounded tiles, horizontal scroll, `--tint` ground
- **Fee comparison bars** with a `grow` keyframe — the comparison signature
- Gradient banners with a 15%-opacity background icon bleeding off the corner
- 2x2 tool tiles; trust triples
- Compare tray docked above the bottom nav
- Copy is **Hinglish throughout** ("Board kaunsa sahi hai?", "Degree ho gayi. Ab kaam.")

## Adopted into the build (2026-09-01)

Content only — palette, fonts and form factor were **not** changed.

- Distance catalogue: Amity Online (₹1,49,000 / MRP ₹1,80,000 / EMI ₹6,208, rating 4.4),
  Lovely Professional University (Distance BBA ₹78,000 / ₹92,000 / ₹3,250, UGC-DEB + AICTE, 4.2),
  IGNOU (BA General ₹16,200, 4.5). Client's editorial order is now the default sort.
- Colleges: GMC Patna, Tbilisi State Medical University, NIT Patna — added. Vertical is no
  longer medical-only; streams now include Engineering, Management, Law, Commerce.
- Jobs: Bajaj Finserv field sales (24), Teleperformance Hindi support WFH (60),
  Vibrant Infotech data entry, Boring Road (12).
- Boards: recognition wording, on-demand exam frequency, BOSSE 45-day result, and the
  client's acceptance weights (NIOS 88 / BOSSE 62 / BBOSE 45).
- Study abroad: Canada and UK added — the client's abroad scope is not MBBS-only.
- Skill courses: durations aligned (Digital Marketing 6w, Spoken English 12w, Interview Prep).
- Stats: 12,000+ admitted, 100% verified, 1:1 counsellor; jobs 1,240 / 18 / 312.
- Tickers: the client's three Hinglish lines, verbatim.
