/* The photographic library, and the rule for spending it.

   We own three photographs. Every one of them is already committed in /public
   as a three-file set — `NAME.png` for the fallback, `NAME-900.webp` for phones
   and `NAME-full.webp` for everything wider — which is the contract <Photo/> in
   components/ui/primitives.jsx reads. Adding a fourth photograph means adding
   those three files and one row to PHOTOS; nothing else has to change.

   ROTATION is why this file exists rather than three string literals scattered
   through the page. A homepage that wants to feel photographic needs a picture
   in several bands, and with three assets the only way to do that without the
   same face appearing twice on one screen is to assign each band a different
   one *per vertical*. Each column below is a permutation: on any given page the
   hero, the process ladder and the closing band are three different pictures.

   The alt text is written once, here, next to the file it describes. It was
   getting retyped at every call site and drifting — the same photograph was
   "students on campus" in one place and "campus" in another. */
export const PHOTOS = {
  'dcw-journey-hero': 'A student setting out on a lit path toward a university and a city skyline',
  'campus-editorial': 'Indian college students walking together across a campus with their files',
  'career-editorial': 'Two young professionals working through something together at a laptop'
};

export const ROTATION = {
  distance: {hero: 'dcw-journey-hero', process: 'campus-editorial', close: 'career-editorial'},
  colleges: {hero: 'campus-editorial', process: 'career-editorial', close: 'dcw-journey-hero'},
  jobs:     {hero: 'career-editorial', process: 'campus-editorial', close: 'dcw-journey-hero'}
};

/* An unknown vertical falls back to the distance set rather than to nothing:
   a missing picture is a hole in the layout, and the layouts below reserve
   their height in CSS whether or not an image arrives. */
export const photoFor = (vertical, slot) =>
  (ROTATION[vertical] ?? ROTATION.distance)[slot];
