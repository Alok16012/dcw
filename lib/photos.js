/* The photographic library, and the rule for spending it.

   Every photograph is committed in /public as a three-file set — `NAME.png` for
   the fallback, `NAME-900.webp` for phones and `NAME-full.webp` for everything
   wider — which is the contract <Photo/> in components/ui/primitives.jsx reads.
   Adding another photograph means adding those three files and one row to
   PHOTOS; nothing else has to change.

   The newer editorial scenes are generated images, not photographs of anybody who walked
   into the Patna office. They are staged the way a stock library is staged, and
   the site treats them that way: they illustrate a counselling desk, a
   classroom, a workplace. None of them is ever captioned with a name, a mark, a
   result or a testimonial, because doing that would turn an illustration into a
   claim about a person who does not exist. Real student photographs, with
   consent, should replace these as they arrive — drop the three files in and
   change the name here.

   ROTATION is why this file exists rather than string literals scattered
   through the page. A homepage that wants to feel photographic needs a picture
   in several bands, and the only way to do that without the same face appearing
   twice on one screen is to assign each band a different one *per vertical*.
   Each column below is a permutation: on any given page the hero, the process
   ladder, the closing band and the enquiry pop-up are four different pictures.

   The alt text is written once, here, next to the file it describes. It was
   getting retyped at every call site and drifting — the same photograph was
   "students on campus" in one place and "campus" in another. */
export const PHOTOS = {
  'dcw-journey-hero': 'A student setting out on a lit path toward a university and a city skyline',
  'campus-editorial': 'Indian college students walking together across a campus with their files',
  'career-editorial': 'Two young professionals working through something together at a laptop',
  'counsellor-desk': 'A counsellor and a student going through a course brochure across a desk',
  'classroom-session': 'Students at their benches in a daylit classroom, one with her hand raised',
  'home-study': 'A student working through her notes at a desk at home beside a laptop',
  'campus-steps': 'Two students on the steps of a college building, looking at something on a phone',
  'university-campus': 'An illustrative university campus with students walking between academic buildings',
  'office-front': 'A visitor being welcomed at the front desk of a counselling office',
  'workplace-team': 'Three colleagues working together around a desk in a bright office'
};

/* Read down a column, not across a row. A photograph may repeat across columns
   — nobody sees two verticals at once — but within one column it should not.

   The `hero` slot used to live here. It now belongs to HERO_STORIES in
   app/[[...slug]]/site-app.jsx, because the hero became a three-slide carousel
   and each slide carries its picture next to the headline and the link it
   opens; splitting the image away from the sentence it illustrates only made
   the two drift apart. What that means for this file is that the homepage has
   nine *large* photographic slots per vertical — three hero slides, three
   offer cards, the process ladder, the closing band and the enquiry pop-up —
   and exactly ten photographs to spend. Eight of the nine are different
   pictures on every vertical; the ninth, the pop-up, has to reuse one, because
   the shape rule below leaves it only three photographs to choose from. That
   is the least damaging place for the repeat: the pop-up is an overlay that
   covers the page it repeats. The small category thumbnails are also allowed
   to repeat: they are tiles behind an icon, not scenes.

   One shape rule sits underneath the taste: the `popup` slot is a 272px column
   running the full height of a dialog, so it must be given one of the three
   4:5 portraits (classroom-session, home-study, campus-steps). A 16:9 banner
   put there survives `object-fit:cover` only as a crop of its own middle —
   tried with office-front, and what reached the screen was a stretch of
   out-of-focus wall. The wide pictures earn their keep in the hero and the
   closing band, which are wide. */
export const ROTATION = {
  distance: {process: 'campus-steps',     close: 'office-front',      popup: 'home-study'},
  colleges: {process: 'counsellor-desk',  close: 'office-front',      popup: 'home-study'},
  jobs:     {process: 'campus-steps',     close: 'campus-editorial',  popup: 'home-study'}
};

/* An unknown vertical falls back to the distance set rather than to nothing:
   a missing picture is a hole in the layout, and the layouts below reserve
   their height in CSS whether or not an image arrives. */
export const photoFor = (vertical, slot) =>
  (ROTATION[vertical] ?? ROTATION.distance)[slot];

/* The file the browser actually fetches. `<Photo/>` builds its own <picture>
   from the three-file set; these are for the places that take a bare `src` —
   next/image inside <Plate/>, and any plain <img>. 900w is the card size (a
   card plate is never wider than ~420 CSS px, so the 900 covers 2× on a
   phone); 'full' is 1600w, for a band that runs the width of the page. */
export const photoSrc = (name, size = 'card') =>
  `/${name}${size === 'full' ? '-full' : '-900'}.webp`;

/* ── A picture for every institution ──────────────────────────────────────
   University and college cards opened with a drawn plate and a two-letter
   monogram, because DCW holds no licensed photograph of the Amity campus and
   drawing one would be a lie told in pixels. That has not changed. What has
   changed is that the card can now say which of two things it is showing.

   1. A photograph the institution supplied. It lives on the record as `image`,
      is set in /admin → Catalogue, and is captioned with whatever alt text the
      person who uploaded it wrote. This is the real answer and it is the one
      the console exists to produce.
   2. Failing that, one of the library scenes at the top of this file, standing
      in for a campus. It is picked by a hash of the institution's own id, so
      the listing looks the same on every visit rather than reshuffling under
      the reader, and it is returned with `illustrative:true` and an alt text
      that says the word out loud. Every surface that renders one is required
      to show that label to sighted readers too — see `.plate-note` in
      design-system.css and the detail hero in site-app.jsx.

   The pool is the six scenes that can plausibly be a place of study. The
   workplace and journey pictures are left out: a card for a university should
   not open on three people at an office desk. */
const CAMPUS_POOL = ['university-campus', 'campus-editorial', 'campus-steps',
  'classroom-session', 'counsellor-desk', 'home-study'];

/* FNV-1a. components/ui/plate.jsx carries the same four lines for its motif
   seed; copied rather than imported because that module is 'use client' and
   this one is read on the server by lib/store.js. */
function hash(s) {
  let h = 2166136261; const t = String(s ?? '');
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * @param {{id?:string,slug?:string,name?:string,image?:string|null,imageAlt?:string|null}} inst
 * @returns {{src:string,srcFull:string,alt:string,illustrative:boolean}}
 */
export function institutionPhoto(inst = {}) {
  if (inst.image) {
    return {
      src: inst.image, srcFull: inst.image,
      alt: inst.imageAlt || `${inst.name ?? 'The institution'}, photograph supplied by the institution`,
      illustrative: false
    };
  }
  const name = CAMPUS_POOL[hash(inst.id ?? inst.slug ?? inst.name) % CAMPUS_POOL.length];
  return {
    src: photoSrc(name), srcFull: photoSrc(name, 'full'),
    alt: `Illustrative photograph: ${PHOTOS[name]}`,
    illustrative: true
  };
}
