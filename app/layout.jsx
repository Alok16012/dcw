import {Lato,Open_Sans,Manrope} from 'next/font/google';
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

   Two faces from the old @import are gone as well, for reasons the import
   hid and self-hosting made measurable:

   • Noto Sans Devanagari. The stylesheet comment said it was there for "the
     Hindi strings in the ticker and job copy". There are none: a sweep of
     app/ and lib/ for U+0900–U+097F returns nothing, and the seed data's only
     non-ASCII characters are ₹, ★, arrows and typographic punctuation. It was
     costing 143 KB — 118 KB of Devanagari plus a 25 KB Latin subset that
     duplicated Open Sans — preloaded on every page to render zero glyphs.
     Should Hindi arrive through the admin console, `system-ui` in the
     --font-body chain renders it on every OS that ships a Devanagari face.

   • The four discrete Open Sans weights. Google serves Open Sans as a variable
     font, so all four @font-face rules pointed at the same file — but each
     declared one fixed weight, and roughly thirty rules here ask for
     `font-weight:800`, which had no face to match and snapped back to 700.
     Dropping `weight` emits a single `font-weight:300 800` face over the same
     42 KB file, so 800 now renders as 800.

   Manrope keeps `preload:false`: globals.css sets it on `body`, but on the
   public site `.app` overrides it immediately, so it paints only on /admin,
   /login and inside `.resume-doc`. A font nothing paints should not be
   preloaded on the pages that do not paint it.

   None of the three declares `fallback`. A hand-written chain looks harmless
   and is not: supplying one turns off `adjustFontFallback`, and the built CSS
   then contained no `@font-face` carrying `size-adjust`/`ascent-override` —
   the metric-matched local face next/font synthesises so that the system font
   shown during `display:swap` occupies the same space as the real one. Without
   it every swap reflows the text it sits in. Left to itself next/font emits
   `__Lato_Fallback_…` beside `__Lato_…`, and the fallback tails in
   design-system.css become the last resort they were meant to be. */
const lato=Lato({subsets:['latin'],weight:['400','700','900'],display:'swap',variable:'--f-display'});
const openSans=Open_Sans({subsets:['latin'],display:'swap',variable:'--f-body'});
const manrope=Manrope({subsets:['latin'],display:'swap',preload:false,variable:'--f-manrope'});
const fontVars=[lato.variable,openSans.variable,manrope.variable].join(' ');

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

export const viewport={themeColor:'#0B4DA8',width:'device-width',initialScale:1};

export default function Layout({children}){return <html lang="en" className={fontVars}><body>{children}</body></html>}
