# Phase 1 — Forensic analysis of the reference

Source: screenshot of the CollegeVidya × Distance Courses Wala homepage, ~1586px wide.
Values marked (m) are measured off the image; (i) are inferred, with confidence noted.
Colours are sampled by eye from the rendered screenshot, so treat them as ±3 per channel.

---

## 1. Typography

### Face identification

**Display + body: one family, geometric-humanist.**

Letterform evidence from "See the whole path." and the body paragraph:

| Feature | Observation | Rules out |
|---|---|---|
| `a` | double-storey, small bowl, straight stem, no spur | Poppins, Futura, Century Gothic — all single-storey |
| `g` | single-storey, open descender hook | Garamond-alikes, Lato (Lato's `g` is also single-storey but with a tighter, more calligraphic ear) |
| `e` | moderate aperture, horizontal bar | Neo-grotesques with closed apertures |
| `t` | slanted/angled top-left terminal | Inter, Helvetica (flat) |
| `o` | near-circular, minimal stroke modulation | Manrope (visibly flat-sided), Roboto (ovoid) |
| `y` | straight diagonal tail, no curve | Nunito (rounded terminals) |
| Terminals | cut horizontal, no flare | Humanist-with-flare (Frutiger, Myriad) |
| x-height | high — roughly 0.54 of cap height (m) | Old-style faces |

**Top candidate: Mulish** (ex-Muli). Geometric skeleton with humanist proportions,
double-storey `a`, single-storey `g`, circular `o`, high x-height, variable 200–1000 so the
heavy display weights are real rather than synthesised.
**Fallback 2: Nunito Sans** — same genus, slightly softer terminals.
**Fallback 3: Manrope** — closest weight behaviour, but its flat-sided `o` and quirky `g`
are visibly wrong against the reference at display size.

Classification: **geometric-humanist**, not neo-grotesque. This matters — a neo-grotesque
substitution (Inter, Helvetica Now) reads colder and kills the friendliness the page is
built on.

### Scale (at ~1586px viewport)

| Role | Size (m) | Weight | Line-height | Tracking | Case |
|---|---|---|---|---|---|
| Hero H1 | ~62px | 800 | 1.06 | −0.022em | Sentence |
| Hero sub | 18px | 400 | 1.55 | 0 | Sentence |
| Section H2 ("Popular Programs") | 32px | 800 | 1.2 | −0.018em | Sentence |
| Section sub | 15px | 400 | 1.5 | 0 | Sentence |
| Stat numeral | 27px | 800 | 1.15 | −0.01em | — |
| Stat label | 15px | 400 | 1.4 | 0 | Sentence |
| Nav item | 15px | 600 | 1.35 | 0 | Sentence |
| Card title | 14.5px | 700 | 1.3 | 0 | Sentence |
| Card footer link | 13px | 600 | 1.35 | 0 | Sentence |
| Badge chip | 11.5px | 700 | 1.2 | +0.01em | Sentence |
| Utility bar | 13px | 500 | 1.3 | 0 | Sentence |

No clean geometric ratio — it is a hand-tuned scale that clusters hard at 13–15px for UI
and then jumps to 32 and 62. That gap **is** the hierarchy: there is almost nothing between
18 and 32, so headings never compete with text.

### The tri-colour headline

The single most identifiable device on the page. Three lines, three colours:

```
See the whole path.      → deep navy   #0A2B5E
Choose your next         → brand blue  #1263E0
move.                    → amber       #F7A928
```

It is not decoration — it is a reading gradient. The eye is pulled top-to-bottom by
increasing warmth, and the amber word is the one that carries the verb. Copying the palette
without copying the *ordering* (cold → warm, ending on the action) misses the point.

### The script accent

"Your Education Partner", top-right, in a blue informal script with a hand-drawn amber
underline swash. A **second display voice**, used exactly once, as a margin annotation
rather than as content. Its whole job is to make the page feel authored.

### Optical details

- Tracking is negative only at 32px and above; UI sizes sit at 0. Correct — Mulish's
  default fit is already tight at text size.
- Numerals are **lining and proportional** ("1.25 Lakh+", "4.7/5 (3,508)"). Not tabular —
  nothing here is a column that needs to align.
- All copy is **ragged-right**, including the hero paragraph, which breaks at ~52ch.

---

## 2. Colour

| Role | Hex | Notes |
|---|---|---|
| Utility bar | `#0F5BD6` | flat, no gradient |
| Brand primary | `#1263E0` | CTAs, links, headline line 2, icons |
| Brand deep / heading ink | `#0A2B5E` | headline line 1, nav, card titles |
| Amber accent | `#F7A928` | headline line 3, script underline |
| Page canvas | `#FFFFFF` | |
| Hero wash | `#E8F1FE` → `#F7FAFF` | ~160° linear |
| Stats panel | `#F1F6FE` | |
| Card surface | `#FFFFFF` | |
| Hairline | `#E6EBF2` | 1px, everywhere |
| Body ink | `#3D4A5C` | |
| Muted ink | `#6B7A8D` | card subtitles, stat labels |

### Tinted chips

| Chip | Wash | Ink | Ratio |
|---|---|---|---|
| Green ("Right MBA", "Trending", "ROI 100%") | `#E7F7EC` | `#14804A` | **4.62:1** ✅ |
| Amber ("91+ Specializations") | `#FDF2E1` | `#8A5A00` | **5.98:1** ✅ |
| Blue ("NEW") | `#E9F1FE` | `#1250B8` | **6.31:1** ✅ |

These pass, which is unusual for a page this decorated. The chips are the one place the
reference is genuinely careful.

Where it is **not** careful: the utility-bar text at 13px/500 on `#0F5BD6` measures ~4.9:1
in white — fine — but the hero sub at `#6B7A8D` on the `#E8F1FE` wash measures **3.98:1**,
below AA. Noted for Phase 2; we darken it rather than reproduce the failure.

### Hero background construction

Three layers, back to front:
1. A `160deg` linear gradient, `#E8F1FE` → `#F7FAFF`, full-bleed to the masthead edge.
2. A soft blue organic blob (`#CFE2FB`, ~55% opacity, heavily blurred) sitting behind and
   slightly right of the subject's head — it exists to separate the cutout from the wash.
3. The photograph: a waist-up cutout of a student, **not** a rectangle. Behind it, a
   desaturated blue-graded photo of a clock-tower building, feathered to nothing on its
   left edge so it never competes with the headline.

---

## 3. Layout & spacing

- **Container**: ~1240px content width inside a 1586px viewport (m), so gutters run
  ~170px at this size — i.e. a fixed max-width, not a percentage.
- **Page gutter**: 24px minimum at narrow widths (i, high confidence).
- **Programme card grid**: 6 columns × ~148px with a 16px gap (m). It overflows
  horizontally rather than wrapping — a scroll rail, not a wrapping grid.
- **Spacing base**: 4px. Observed values are all multiples: 8, 12, 16, 24, 32, 48, 64.
- **Vertical rhythm**: two beats. Tight bands ~48px (utility → masthead → hero), full
  bands ~72–80px (hero → stats → programmes).
- **Masthead**: five zones on one row — `[brand] │ [co-brand lockup] [nav] [search] [CTA]`,
  with a real vertical rule between the two brand lockups. Brand and CTA are fixed-width;
  nav and search absorb the slack.
- **Popular Programs module**: a section header (title + subtitle left, "View All →" right)
  above a two-column body — a ~340px left rail of category tabs beside the card grid. One
  rail item is selected and carries a filled pill sub-badge; the others show a plain
  subtitle.

---

## 4. Components

| Component | Radius | Border | Padding | Shadow |
|---|---|---|---|---|
| Utility bar | 0 | none | 0 24px, h=44px | none |
| Masthead | 0 | 1px bottom `#E6EBF2` | 0 24px, h=90px | none |
| Nav item + chevron | — | none | 8px 12px | none |
| Search input | 12px | 1px `#E6EBF2` | 12px 16px, h=46px | none |
| Search submit (hero) | 10px | none | 14px 22px | none |
| "Talk to us" CTA | 999px (pill) | none | 12px 22px | `0 2px 8px rgb(18 99 224/.28)` |
| Hero secondary btns | 999px (pill) | 1px `#1263E0` | 12px 20px | none |
| Hero search | 12px | 1px `#E6EBF2` | h=64px | `0 4px 20px rgb(11 43 94/.06)` |
| Stats strip | 18px | none | 28px 40px | none — it is a wash, not a card |
| Programme card | 12px | 1px `#E6EBF2` | 12px | `0 1px 2px rgb(11 43 94/.04)` |
| Badge chip | 999px | none | 4px 10px | none |
| Category rail item | 12px | none (selected: white surface) | 14px 16px | selected only |

Two structural notes:

- The **stats strip** separates its three cells with 1px vertical rules, not gaps. This is
  what makes it read as one instrument rather than three cards.
- The **programme card** is centred: badge row (left-aligned), then a centred icon, then a
  centred title, then a footer link row separated by a hairline. Centring a card this small
  is a real choice — it makes a 6-across rail scannable as a texture rather than as text.

---

## 5. Iconography & imagery

- **Icons**: outline, ~1.75px stroke, rounded caps and joins, 20–22px. Lucide-family
  geometry. Bare (no container) inside cards; inside the stats strip and the category rail
  they sit in a **filled circle / rounded square of a 10%-brand wash** at ~44px.
- **Photography**: single subject, waist-up, three-quarter turn, eyes up and to the left —
  looking *toward* the headline, which is why the composition works. Warm neutral grade on
  the subject; the building behind is desaturated ~60% and pushed blue to sit inside the
  wash. Cutout at the shoulders, bleeding off the bottom edge.

---

## 6. Character summary

It reads as **institutional but not cold**: a civic blue and a single warm accent, one
geometric-humanist family doing all the work, and generous white space that never becomes
emptiness because every band is anchored by a tinted surface.

The three moves a lazy imitation misses:

1. **The tri-colour headline is ordered cold→warm and ends on the verb.** Reproducing three
   colours in any other order produces noise.
2. **The stats strip is divided by rules, not gaps** — one instrument, not three cards.
   Gaps would turn the page's most confident element into filler.
3. **Almost nothing has a shadow.** Depth is carried by 1px hairlines and tinted washes.
   Adding elevation "to make it pop" is precisely what would make it look generic.
