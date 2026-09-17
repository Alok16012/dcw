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

/* Read down a column, not across a row: each vertical gets four pictures that
   suit what it is selling, and no picture is used twice in the same column. A
   photograph may repeat across columns — nobody sees two verticals at once.

   One shape rule sits underneath the taste: the `popup` slot is a 272px column
   running the full height of a dialog, so it must be given one of the three
   4:5 portraits (classroom-session, home-study, campus-steps). A 16:9 banner
   put there survives `object-fit:cover` only as a crop of its own middle —
   tried with office-front, and what reached the screen was a stretch of
   out-of-focus wall. The wide pictures earn their keep in the hero and the
   closing band, which are wide. */
export const ROTATION = {
  distance: {hero: 'dcw-journey-hero', process: 'home-study',       close: 'counsellor-desk',  popup: 'campus-steps'},
  colleges: {hero: 'campus-steps',     process: 'classroom-session', close: 'campus-editorial', popup: 'home-study'},
  jobs:     {hero: 'career-editorial', process: 'workplace-team',    close: 'office-front',     popup: 'campus-steps'}
};

/* An unknown vertical falls back to the distance set rather than to nothing:
   a missing picture is a hole in the layout, and the layouts below reserve
   their height in CSS whether or not an image arrives. */
export const photoFor = (vertical, slot) =>
  (ROTATION[vertical] ?? ROTATION.distance)[slot];
