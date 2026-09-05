'use client';
import {ArrowRight,ShieldCheck,Star,UserRound,MessageCircle,Scale,IndianRupee} from 'lucide-react';
/* One of the three pages a stranger checks before trusting a site with their
   marks, their money or their phone number. Everything below is placeholder
   content for the prototype — the numbers are marked indicative wherever they
   appear, because a made-up placement statistic is exactly the kind of claim
   this product exists to argue against. */
const MILESTONES=[
  {year:'2019',title:'A counselling desk in Patna',body:'Two counsellors, one whiteboard of admission dates, and a queue outside. Every answer was given face to face.'},
  {year:'2021',title:'The first fee database',body:'We started writing down what each university actually charged, semester by semester, because the brochures kept disagreeing with the accounts office.'},
  {year:'2023',title:'Jobs joined the list',body:'Students who finished a course kept asking the same next question. Berojgar Bharat began as a shared spreadsheet of verified local vacancies.'},
  {year:'2026',title:'One platform, three doors',body:'Distance, Colleges and Jobs run on the same verified records, so a decision made on one side carries into the next.'}];

const PRINCIPLES=[
  {icon:<ShieldCheck/>,title:'We name the source',body:'Every fee, approval and salary band on this site points at where it came from. If we cannot source it, it does not go up.'},
  {icon:<IndianRupee/>,title:'The fee you see is the fee',body:'Total programme cost, not the first instalment. Exam and re-registration charges are listed separately rather than buried.'},
  {icon:<Scale/>,title:'Ranking is not for sale',body:'Universities and employers can advertise on DCW. They cannot buy a position in a comparison or a higher rating.'},
  {icon:<UserRound/>,title:'A person, when you want one',body:'Counselling is free and optional. Nobody on the team is paid a commission on where you enrol.'}];

export function AboutPage({go,notify}){
  return <main id="main" tabIndex={-1} className="tool-page about-page">
    <section className="tool-hero about-hero">
      <picture>
        <source type="image/webp" media="(max-width:900px)" srcSet="/dcw-journey-hero-900.webp"/>
        <source type="image/webp" srcSet="/dcw-journey-hero-full.webp"/>
        <img src="/dcw-journey-hero.png" alt="Students walking through a college campus in India" decoding="async"/>
      </picture>
      <span className="hero-shade" aria-hidden="true"/>
      <div className="container tool-hero-copy">
        <span className="kicker">ABOUT DCW</span>
        <h1>We started because the brochure<br/><em>and the accounts office disagreed.</em></h1>
        <p>Distance Courses Wala began as a counselling desk in Patna in 2019. It grew into three connected products because the questions never stopped at admission — they ran on into fees, into results, and into the first job.</p>
        <div className="tool-hero-cta">
          <button className="btn primary" onClick={()=>go('/reviews')}><Star/>Read what students say</button>
          <a className="btn ghost" href="#principles">How we work<ArrowRight/></a>
        </div>
      </div>
    </section>

    {/* Numbers are the first thing a stranger tests you on, so they are stated
        with their basis attached rather than as decoration. */}
    <section className="container about-figures">
      <article><b>2.4 lakh</b><small>Students guided since 2019</small><em>Counselling sessions logged, indicative</em></article>
      <article><b>180+</b><small>Programmes with approvals on file</small><em>Entitlement letters held and dated</em></article>
      <article><b>4 states</b><small>Bihar, Jharkhand, UP, Delhi NCR</small><em>Where our counsellors work in person</em></article>
      <article><b>₹0</b><small>What our guidance costs a student</small><em>Institutions pay us, students never do</em></article>
      <p className="figures-note"><ShieldCheck/>Prototype build. These figures are indicative placeholders and will carry a published basis before launch.</p>
    </section>

    <section className="container about-split">
      <div className="as-copy">
        <span className="kicker">WHY WE EXIST</span>
        <h2>Nobody should have to guess what a degree costs.</h2>
        <p>The information a student needs to make this decision already exists. It is just scattered across prospectuses, agent WhatsApp forwards, and a phone number that rings out. The gap is not knowledge — it is that nobody has put it in one place and stood behind it.</p>
        <p>So that is the whole job: collect the record, check it against the institution, publish it with its source, and let a person read the comparison themselves. Where somebody wants to talk it through, a counsellor picks up. Where they do not, nothing on this site chases them.</p>
        <button className="btn outline" onClick={()=>go('/distance/universities')}>See how a listing is built<ArrowRight/></button>
      </div>
      <ul className="as-principles" id="principles">
        {PRINCIPLES.map(p=><li key={p.title}><span className="ap-icon">{p.icon}</span>
          <div><b>{p.title}</b><small>{p.body}</small></div></li>)}
      </ul>
    </section>

    <section className="wash section">
      <div className="container">
        <span className="kicker">THE ROAD SO FAR</span>
        <h2 className="about-h2">Seven years, one question at a time.</h2>
        <ol className="timeline-rail">
          {MILESTONES.map((m,i)=><li key={m.year} className={i===MILESTONES.length-1?'now':''}>
            <span className="tr-year">{m.year}</span>
            <div className="tr-card"><b>{m.title}</b><p>{m.body}</p></div>
          </li>)}
        </ol>
      </div>
    </section>

    {/* Money is the question people are too polite to ask, so it is answered
        before they have to. */}
    <section className="container about-money">
      <div>
        <span className="kicker">HOW WE ARE PAID</span>
        <h2 className="about-h2">Institutions pay us. You do not.</h2>
      </div>
      <div className="am-grid">
        <article><b>Listing and advertising</b><p>Universities, colleges and employers pay to appear and to advertise. Advertising is labelled as advertising, every time.</p></article>
        <article><b>Admission referrals</b><p>When a student enrols through us, the institution pays a referral fee. It is the same fee across institutions in a category, so it cannot tilt what we recommend.</p></article>
        <article><b>What we never do</b><p>We do not sell placement in a comparison, we do not sell your phone number, and no counsellor earns a commission tied to where you enrol.</p></article>
      </div>
    </section>

    <section className="container about-contact">
      <div>
        <h2 className="about-h2">Come and argue with us.</h2>
        <p>If a fee on this site is wrong, a listing is stale, or a posting asked you for money, tell us and we will fix it or take it down.</p>
      </div>
      <dl>
        <div><dt>Office</dt><dd>Boring Road, Patna, Bihar 800001</dd></div>
        <div><dt>Corrections</dt><dd>corrections@dcw.example</dd></div>
        <div><dt>Counselling</dt><dd>Mon–Sat, 9am–7pm IST</dd></div>
      </dl>
      <div className="ac-actions">
        <button className="btn primary" onClick={()=>notify('Counselling request noted — a counsellor will call you back')}><MessageCircle/>Request a callback</button>
        <button className="btn outline" onClick={()=>go('/blog')}>Read the blog<ArrowRight/></button>
      </div>
    </section>
  </main>;
}

export default AboutPage;
