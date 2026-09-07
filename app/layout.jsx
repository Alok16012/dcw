import {Mulish,Manrope} from 'next/font/google';
import './globals.css';
import './design-system.css';

/* Both stylesheets used to open with `@import url(fonts.googleapis.com…)`, which
   is the slowest way to load a web font: the browser has to fetch the CSS file,
   parse it, discover the import, fetch a second stylesheet from a third party,
   parse that, and only then start on the font files — a four-hop chain with
   every hop render-blocking. It also sent every visitor's IP to Google on page
   load. `next/font` self-hosts the woff2 files at build time and emits a
   preload, so the fonts ship from our own origin with no third-party request.
   Source Serif 4 was imported but never rendered — `.app .hero-copy h1 em`
   overrides it back to the display face — so it is not carried over.

   Noto Sans Devanagari went with it. The stylesheet comment said it was there
   for "the Hindi strings in the ticker and job copy". There are none: a sweep
   of app/ and lib/ for U+0900–U+097F returns nothing, and the seed data's only
   non-ASCII characters are ₹, ★, arrows and typographic punctuation. It was
   costing 143 KB, preloaded on every page to render zero glyphs. Should Hindi
   arrive through the admin console, `system-ui` in the --font-body chain
   renders it on every OS that ships a Devanagari face.

   Manrope keeps `preload:false`: globals.css sets it on `body`, but on the
   public site `.app` overrides it immediately, so it paints only on /admin,
   /login and inside `.resume-doc`. A font nothing paints should not be
   preloaded on the pages that do not paint it.

   Neither declares `fallback`. A hand-written chain looks harmless and is not:
   supplying one turns off `adjustFontFallback`, and the built CSS then
   contained no `@font-face` carrying `size-adjust`/`ascent-override` — the
   metric-matched local face next/font synthesises so that the system font
   shown during `display:swap` occupies the same space as the real one. Without
   it every swap reflows the text it sits in. Left to itself next/font emits
   `__Mulish_Fallback_…` beside `__Mulish_…`, and the fallback tails in
   design-system.css become the last resort they were meant to be. */

/* One family now carries both roles. Lato + Open Sans was a humanist pairing;
   the reference the public site is being matched to is geometric-humanist —
   double-storey `a`, single-storey `g`, near-circular `o`, high x-height — and
   Mulish is the closest thing to it on Google Fonts. Two consequences worth
   writing down:

   • It is one variable file spanning 200–1000, so the display weight (800) and
     the body weight (400) come from the same face at no extra transfer cost.
     The old pairing shipped Lato at three discrete weights plus the Open Sans
     variable file; this is strictly less to download, not more.
   • Only --f-display is emitted here. Calling Mulish() a second time for
     --f-body would preload the identical woff2 twice; design-system.css
     aliases --f-body to it in one line instead. The two names are kept
     because the system's distinction is between the display ROLE and the body
     ROLE — re-splitting them into two families later is a one-line change
     here, with nothing downstream to touch. */
const mulish=Mulish({subsets:['latin'],display:'swap',variable:'--f-display'});
const manrope=Manrope({subsets:['latin'],display:'swap',preload:false,variable:'--f-manrope'});
const fontVars=[mulish.variable,manrope.variable].join(' ');

const site=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
const title='DCW — Your next move, made visible';
const description='Compare verified courses, colleges and jobs with clear guidance from DCW.';

export const metadata={
  metadataBase:new URL(site),
  title:{default:title,template:'%s — DCW'},
  description,
  applicationName:'DCW',
  openGraph:{title,description,url:site,siteName:'DCW',locale:'en_IN',type:'website'},
  twitter:{card:'summary_large_image',title,description},
  robots:{index:true,follow:true}
};

export const viewport={themeColor:'#1263E0',width:'device-width',initialScale:1};

export default function Layout({children}){return <html lang="en" className={fontVars}><body>{children}</body></html>}
