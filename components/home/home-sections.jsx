'use client';
import {ArrowRight,ScrollText,GraduationCap,Award,Search,TrendingUp,Plane,MapPin,FileText,Wrench,
  Phone,MessageCircle,Mail,Navigation,ClipboardCheck,UserCheck,Send,LineChart,Headset} from 'lucide-react';
import {SectionTitle,Accordion,Photo} from '@/components/ui/primitives.jsx';
import {CONTACT,officePlaceUrl} from '@/lib/contact.js';
import {photoFor} from '@/lib/photos.js';

/* ═══════════════════════════════════════════════════════════════════════════
   The four homepage bands the reference leads with and this site did not have:
   three primary offering cards, a contact strip, a process ladder and an FAQ.

   They live here rather than in site-app.jsx because none of them needs the
   catalogue, the session or the router's internals — each takes `vertical` and
   `go` and renders. site-app.jsx is already 1,100 lines of page shell.

   EVERY DESTINATION BELOW IS A ROUTE THAT ALREADY EXISTS. The cards are the
   loudest thing on the page and a loud card that opens nothing is worse than no
   card, so each href was taken from the routes categories() and Footer already
   link to rather than written to fit the copy.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ---------- B. Three primary offerings -------------------------------------
   The reference's signature band: three solid-filled cards, one per major
   entry route, each with a mark, a heading, one supporting line and a large
   white pill button.

   `tone` is 1/2/3, not a colour. The three fills are purple, light blue and
   teal and they are *functional* — they separate three routes on one page —
   which is why they are their own scale rather than the vertical's accent.
   The accent still owns the header, the buttons and the links; these three
   own nothing but themselves, so the brand is not competing with itself.

   The heading is the visitor's need in their own words, not the product name:
   somebody who left school after 10th searches for finishing 10th, not for
   "open schooling". The programme name goes in the supporting line where it
   can be learned rather than guessed. */
const OFFERS = {
  distance: [
    {tone: 1, image: 'classroom-session', icon: <ScrollText/>, need: 'Finish your 10th or 12th',
      line: 'Recognised open boards with flexible exam cycles. A gap of a few years is not a problem.',
      cta: 'See open boards', href: '/distance/boards'},
    {tone: 2, image: 'campus-editorial', icon: <GraduationCap/>, need: 'Complete your graduation',
      line: 'BA, B.Com, BSc and more from UGC-DEB approved universities, built around a job.',
      cta: 'View universities', href: '/distance/universities?path=ug'},
    {tone: 3, image: 'career-editorial', icon: <Award/>, need: 'Add a master’s degree',
      line: 'MA, MBA and MCA programmes you can finish without leaving the work you have.',
      cta: 'View PG courses', href: '/distance/universities?path=pg'}
  ],
  colleges: [
    {tone: 1, image: 'university-campus', icon: <Search/>, need: 'Shortlist the right college',
      line: 'Compare cutoffs, seats and the total cost — not just the tuition line.',
      cta: 'Start comparing', href: '/colleges/search'},
    {tone: 2, image: 'home-study', icon: <TrendingUp/>, need: 'Check your NEET chances',
      line: 'Turn one rank into strong, possible and backup choices for your category and state.',
      cta: 'Open the predictor', href: '/colleges/neet-predictor'},
    {tone: 3, image: 'dcw-journey-hero', icon: <Plane/>, need: 'Study abroad',
      line: 'Country-wise cost, approvals and intake timelines, side by side in one place.',
      cta: 'Compare countries', href: '/colleges/search?abroad=1'}
  ],
  jobs: [
    {tone: 1, image: 'counsellor-desk', icon: <MapPin/>, need: 'Find a job near you',
      line: 'Openings from employers we have checked, with the salary stated on every listing.',
      cta: 'See openings', href: '/jobs/search?city=Patna'},
    {tone: 2, image: 'home-study', icon: <FileText/>, need: 'Build a free resume',
      line: 'A clean, recruiter-ready resume in three guided steps. No charge at any point.',
      cta: 'Build my resume', href: '/jobs/resume-builder'},
    {tone: 3, image: 'classroom-session', icon: <Wrench/>, need: 'Learn a job-ready skill',
      line: 'Short, job-linked courses from six weeks, with help applying once you finish.',
      cta: 'See short courses', href: '/jobs/search'}
  ]
};

export function OfferCards({vertical, go}){
  const rows = OFFERS[vertical] ?? OFFERS.distance;
  return <section className="section container offer-band" aria-labelledby="offer-h">
    <h2 id="offer-h" className="offer-h">What would you like to do first?</h2>
    <div className="offer-grid">{rows.map(o =>
      <article key={o.need} className={`offer-card tone-${o.tone}`}>
        <div className="oc-image"><Photo name={o.image}/><i className="oc-icon" aria-hidden="true">{o.icon}</i></div>
        <div className="oc-body"><h3>{o.need}</h3><p>{o.line}</p>
          <button type="button" className="oc-go" onClick={() => go(o.href)}>
            {o.cta}<ArrowRight aria-hidden="true"/>
          </button></div>
      </article>)}
    </div>
  </section>;
}

/* ---------- C. Contact strip ------------------------------------------------
   The reference runs three branches here. We have one office, so this shows
   one office and three ways to reach it rather than inventing two more pins —
   every number, address and inbox below is the one in lib/contact.js, which is
   the same source the footer and the map already read.

   `tel:` and `wa.me` are real links, not buttons that open a form: on a phone
   they dial and open WhatsApp, and on a desktop they hand off to whatever the
   person has installed. The WhatsApp number is our own verified line — the
   same E.164 digits `tel:` uses, with the leading + dropped the way wa.me
   wants them. */
const waHref = `https://wa.me/${CONTACT.phone.href.replace(/\D/g, '')}`
  + `?text=${encodeURIComponent('Hi DCW, I would like to know more about my options.')}`;

export function ContactStrip({vertical}){
  const what = vertical === 'jobs' ? 'about a job or your resume'
    : vertical === 'colleges' ? 'about a college shortlist'
    : 'about a course or admission';
  return <section className="contact-strip" aria-labelledby="cs-h">
    <div className="container cs-inner">
      <div className="cs-lead">
        <h2 id="cs-h">Speak to a counsellor</h2>
        <p>Free, and with nothing to sell you. Call or message us {what}.</p>
        <small>{CONTACT.hours}</small>
      </div>
      <ul className="cs-rows">
        <li><a href={CONTACT.phone.href}>
          <i aria-hidden="true"><Phone/></i>
          <span><small>Call us</small><b>{CONTACT.phone.display}</b></span>
        </a></li>
        <li><a href={waHref} target="_blank" rel="noopener noreferrer">
          <i aria-hidden="true"><MessageCircle/></i>
          <span><small>WhatsApp</small><b>{CONTACT.phone.display}</b></span>
        </a></li>
        <li><a href={CONTACT.email.href}>
          <i aria-hidden="true"><Mail/></i>
          <span><small>Email us</small><b>{CONTACT.email.display}</b></span>
        </a></li>
        <li><a href={officePlaceUrl()} target="_blank" rel="noopener noreferrer">
          <i aria-hidden="true"><Navigation/></i>
          {/* The locality and the city, not the full address. The footer prints
              all three lines and the map draws the pin; this row only has to be
              recognisable enough that somebody local knows where we are. */}
          <span><small>Visit us</small><b>Kankarbagh, Patna</b></span>
        </a></li>
      </ul>
    </div>
  </section>;
}

/* ---------- E. Process ------------------------------------------------------
   Four steps on the two education verticals, three on jobs, because that is
   what each one actually does: a job application has no document verification
   and no institution to submit to, and padding it to four to match the others
   would be describing a step that does not happen. */
const STEPS = {
  distance: [
    {icon: <UserCheck/>, t: 'Tell us where you stopped', d: 'Your last qualification and the year. That alone decides most of what is open to you.'},
    {icon: <ClipboardCheck/>, t: 'Check eligibility and documents', d: 'A counsellor confirms what you qualify for and the exact papers the university will ask for.'},
    {icon: <Send/>, t: 'Apply to the university', d: 'We submit your file to the institution and tell you what it costs before anything is paid.'},
    {icon: <LineChart/>, t: 'Track it to enrolment', d: 'Every stage shows in your account, and you hear from us when it moves.'}
  ],
  colleges: [
    {icon: <UserCheck/>, t: 'Tell us your marks and budget', d: 'Your score, category and what you can spend. Those three narrow the list fast.'},
    {icon: <ClipboardCheck/>, t: 'Build a shortlist you can defend', d: 'Compare cutoffs, seats and total cost side by side — strong, possible and backup.'},
    {icon: <Send/>, t: 'Apply to your choices', d: 'We help with the forms and the documents each college asks for.'},
    {icon: <LineChart/>, t: 'Track every application', d: 'One place to see where each one stands instead of four different portals.'}
  ],
  jobs: [
    {icon: <UserCheck/>, t: 'Build your profile once', d: 'Use the free resume builder, or upload a resume you already have.'},
    {icon: <Send/>, t: 'Apply to checked openings', d: 'Every posting names its employer and states its salary. Applying is free.'},
    {icon: <LineChart/>, t: 'Track what happens next', d: 'Interview details and status updates reach you on WhatsApp and in your account.'}
  ]
};

/* The reference lays this band out as a numbered ladder down the left with a
   tall photograph holding the right half, and it is the single strongest device
   on that page: the steps read as one continuous sequence instead of four
   parallel tiles, and the photograph gives the column of text something to be
   next to. Four cards in a row said "here are four unrelated features"; a
   ladder says "this, then this".

   The badge over the photograph is the reference's floating pill. What it says
   is ours and is checkable — counselling is free and the hours are the ones in
   lib/contact.js, the same string the footer prints. The reference's version of
   this badge carries a student count; we do not publish one we can stand
   behind, so it carries an offer we can. */
export function ProcessSteps({vertical}){
  const steps = STEPS[vertical] ?? STEPS.distance;
  return <section className="section wash process-band">
    <div className="container">
      <SectionTitle kicker="HOW IT WORKS"
        title={`${steps.length} steps, and you can see all of them`}
        sub="No hidden stage, no surprise fee. You are told what happens next before it happens."/>
      <div className="proc-split">
        {/* The step count stays on the element: three steps and four steps need
            different vertical rhythm against a photograph of fixed height. */}
        <ol className={`proc-grid steps-${steps.length}`}>{steps.map((s, i) =>
          <li key={s.t} className="proc-step">
            <span className="ps-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            {/* The icon sits inside the heading rather than beside it: as a
                sibling it took a grid cell of its own next to the numeral, and
                two badges on one rung is one badge too many. */}
            <b><i className="ps-icon" aria-hidden="true">{s.icon}</i>{s.t}</b>
            <p>{s.d}</p>
          </li>)}
        </ol>
        <figure className="proc-photo">
          <Photo name={photoFor(vertical, 'process')}/>
          <figcaption>
            <i aria-hidden="true"><Headset/></i>
            <span><b>Counselling is free</b><small>{CONTACT.hours}</small></span>
          </figcaption>
        </figure>
      </div>
    </div>
  </section>;
}

/* ---------- The closing photographic band ----------------------------------
   The device the reference repeats twice and we had nowhere: a wide rounded
   banner, copy held left, a photograph bleeding off the right edge under a
   scrim dark enough for white text to clear AA against it.

   It is placed where the page previously ended in three consecutive bands of
   flat colour. Both buttons do something that already existed — the first opens
   the same enquiry form the hero's button opens, the second goes to the
   vertical's own listing — because a banner this loud is the last thing a
   visitor reads, and a dead button there is worse than no banner. */
const CLOSE = {
  distance: {k: 'STILL DECIDING?', h: 'Tell us where you stopped. We will tell you what is open.',
    p: 'One call, no form-filling, nothing to buy. A counsellor reads your case and names the boards and universities you actually qualify for today.',
    cta: 'Talk to a counsellor', alt: 'See universities', href: '/distance/universities'},
  colleges: {k: 'STILL DECIDING?', h: 'Bring us your rank. We will bring you a shortlist.',
    p: 'Strong, possible and backup — with the cutoffs, the seats and the total cost behind each one, so the list is something you can defend at home.',
    cta: 'Talk to a counsellor', alt: 'Compare colleges', href: '/colleges/search'},
  jobs: {k: 'READY TO APPLY?', h: 'A resume, and openings that state the salary.',
    p: 'Build the resume free in three steps, then apply to employers we have checked. No fee to you at any stage — not for a listing, an interview or a placement.',
    cta: 'Talk to our team', alt: 'See openings', href: '/jobs/search'}
};

export function PhotoCta({vertical, go, setLead}){
  const c = CLOSE[vertical] ?? CLOSE.distance;
  return <section className="section container photo-cta-band">
    <div className="photo-cta">
      <div className="pc-copy">
        <span className="kicker">{c.k}</span>
        <h2>{c.h}</h2>
        <p>{c.p}</p>
        <div className="pc-actions">
          <button type="button" className="btn light"
            onClick={() => setLead({title: c.cta, interest: vertical})}>
            {c.cta}<ArrowRight aria-hidden="true"/>
          </button>
          {/* .btn.ghost is a dark-on-light outline everywhere else on the site;
              the rule under .pc-actions repaints it for this one dark band
              rather than adding a variant class nothing else would use. */}
          <button type="button" className="btn ghost" onClick={() => go(c.href)}>{c.alt}</button>
        </div>
      </div>
      <Photo name={photoFor(vertical, 'close')} className="pc-photo"/>
      <span className="pc-scrim" aria-hidden="true"/>
    </div>
  </section>;
}

/* ---------- I. FAQ ----------------------------------------------------------
   Answers are limited to what this product can actually stand behind: what we
   charge, where a number came from, what happens after a click. There is no
   pass guarantee, no admission deadline and no recognition claim made on an
   institution's behalf — the listing says what was verified, and these answers
   point at the listing rather than repeating it louder. */
const FAQS = {
  distance: [
    ['Is a distance degree valid for a job or for higher studies?',
      'A degree from a university approved by UGC-DEB carries the same standing as its regular counterpart. Each listing shows the approvals we were able to check at source, and names the source, so you can confirm it yourself before you decide.'],
    ['What does DCW charge me?',
      'Nothing for browsing or for counselling. Course fees are set by the university, not by us, and the fee shown on a listing is the one the university publishes.'],
    ['I have a gap of a few years. Can I still enrol?',
      'Open boards and most distance programmes accept gaps. Tell a counsellor your last qualification and the year you finished it, and they will tell you which options are open to you now.'],
    ['How long does an admission take?',
      'It depends on the university and the session you apply in. Your counsellor gives you the timeline for your own application, and each stage shows in your account as it moves.']
  ],
  colleges: [
    ['Do colleges pay to appear higher in the list?',
      'No. Nothing on this site is ranked by payment. The order you see follows the filters and the sort you chose.'],
    ['Where do the cutoffs and fees come from?',
      'From each institution’s own published material, re-checked every admission cycle. Where we could not verify a figure, the listing says so rather than filling the gap with a guess.'],
    ['Does counselling cost anything?',
      'No. Shortlisting and counselling are free. You pay the college, and only the college.'],
    ['Can I compare colleges side by side?',
      'Yes. Add up to three to the compare tray and you will see fees, duration, approvals and ratings together on one screen.']
  ],
  jobs: [
    ['Do I have to pay to apply?',
      'No. Applying through Berojgar Bharat is free, and we will never ask a candidate for money — for a listing, an interview or a placement.'],
    ['Are the employers checked?',
      'We check the employer before a posting goes live, and every listing states its salary rather than leaving it as “negotiable”.'],
    ['I am a fresher with no experience. Is there anything for me?',
      'Yes. Many of the roles here are open to freshers, and the free resume builder will put your profile together before you start applying.'],
    ['What happens after I apply?',
      'Your applications and their current status sit under Applications in your account, and interview details reach you on WhatsApp.']
  ]
};

export function HomeFaq({vertical, go, setLead}){
  const rows = FAQS[vertical] ?? FAQS.distance;
  return <section className="section container faq-band" aria-labelledby="faq-h">
    <div className="faq-grid">
      <div className="faq-side">
        <span className="kicker">COMMON QUESTIONS</span>
        <h2 id="faq-h">Before you decide</h2>
        <p>The things people ask us most often, answered plainly. If yours is not here, ask a counsellor — it costs nothing.</p>
        <button type="button" className="btn outline"
          onClick={() => setLead({title: 'Ask a DCW counsellor', interest: vertical})}>
          Ask your question<ArrowRight aria-hidden="true"/>
        </button>
      </div>
      <div className="faq-list">{rows.map(([q, a]) =>
        <Accordion key={q} title={q}>{a}</Accordion>)}
      </div>
    </div>
  </section>;
}
