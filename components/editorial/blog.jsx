'use client';
import {useState} from 'react';
import {ArrowRight,ChevronRight,Clock3,FileText,ShieldCheck,BookOpen,CalendarDays} from 'lucide-react';
import {PageHero} from '@/components/ui/primitives.jsx';
import {Plate} from '@/components/ui/plate.jsx';
/* One of the three pages a stranger checks before trusting a site with their
   marks, their money or their phone number. Everything below is placeholder
   content for the prototype — the numbers are marked indicative wherever they
   appear, because a made-up placement statistic is exactly the kind of claim
   this product exists to argue against. */
const POSTS=[
  {slug:'nios-vs-bosse-2026',cat:'Boards',title:'NIOS or BOSSE in 2026: which open school actually fits you',
   dek:'Both are recognised. They differ on exam windows, credit transfer and how quickly a result reaches a university admission desk.',
   author:'Ritu Anand',role:'Board research',date:'18 Aug 2026',mins:9,featured:true,
   body:['Every week somebody asks us whether an open-school certificate will be "accepted". The honest answer is that acceptance is rarely the problem — timing is. Both NIOS and BOSSE are recognised for higher education and for most government recruitment, and both publish their results on a fixed calendar. What separates them, for a student with a deadline, is when that calendar lands.',
     'NIOS runs two public examination cycles a year with an on-demand option for several subjects. That flexibility is genuinely useful if you failed one paper and cannot afford to lose a year. BOSSE, being younger, has a shorter queue and tends to turn results around faster, which matters when a university admission window closes in six weeks.',
     'The second difference is credit transfer. If you have already cleared some subjects at another board, both will let you carry those forward, but the paperwork is not identical and the fee is not identical either. Read the transfer clause before you pay the registration, not after.',
     'Our advice is unglamorous. Work backwards from the admission deadline you actually care about, check which board can put a result in your hand before it, and choose that one. Prestige between the two is not the deciding factor for any university we have spoken to.']},
  {slug:'distance-degree-worth-it',cat:'Distance',title:'Is a distance degree worth it? Read the approval line first',
   dek:'A UGC-DEB entitlement letter is a specific document with a specific validity period. Here is how to check one in under two minutes.',
   author:'Sandeep Kumar',role:'Programme verification',date:'02 Aug 2026',mins:7,
   body:['A distance degree is worth exactly as much as the approval behind it, and approvals are narrower than the marketing suggests. A university can be UGC-recognised and still be running a programme its distance entitlement does not cover.',
     'Look for three things: the UGC-DEB entitlement letter, the specific programmes it names, and the academic years it covers. All three appear on the letter. If a counsellor sends you a screenshot of only the first page, ask for the rest.',
     'The check takes two minutes and it is the single highest-value thing you can do before paying a rupee. We run it on every programme listed here and we say plainly when a listing is pending re-verification.']},
  {slug:'first-job-without-experience',cat:'Jobs',title:'How to write a first resume when you have never had a job',
   dek:'Recruiters are not looking for experience on a fresher resume. They are looking for evidence that you finish things.',
   author:'Farah Qureshi',role:'Hiring desk',date:'26 Jul 2026',mins:6,
   body:['The blank-resume problem is really a translation problem. You have done work — a college project, a family shop, a semester of tutoring — and none of it is written down in the language a hiring manager scans for.',
     'Take the project you are proudest of and write three lines about it: what you built, who used it, and what changed because it existed. Put a number in one of those lines. That is a bullet point, and it is worth more than a paragraph about being a hard-working team player.',
     'Then name the role you want at the top of the page. "Fresher" is not a role. "Accounts Executive" is. A recruiter spends about ten seconds deciding whether to keep reading, and the top third of the page is all they see.']},
  {slug:'emi-without-a-cibil-score',cat:'Money',title:'Course EMIs when you have no credit history',
   dek:'No-cost EMI, a co-applicant, an education loan and a scholarship are four different things. Only one of them is free.',
   author:'Sandeep Kumar',role:'Programme verification',date:'14 Jul 2026',mins:8,
   body:['Most first-year students have no credit file at all, which is not a rejection — it is an absence. Lenders handle it with a co-applicant, usually a parent or guardian whose income and repayment record carry the application.',
     '"No-cost EMI" means the interest has been moved into the sticker price, not that it vanished. Ask what the same programme costs paid in full. If the difference is zero, the offer is real. If it is not, you are paying interest under another name.',
     'Scholarships and fee waivers are the only genuinely free money in this list, and they close earlier than admissions do. Check the state portal before you commit to a payment plan.']},
  {slug:'what-verified-means-here',cat:'How we work',title:'What the word “verified” means on this site',
   dek:'It is not a badge we hand out. It is a checklist, and this is the whole of it.',
   author:'Ritu Anand',role:'Board research',date:'30 Jun 2026',mins:5,
   body:['A listing carries a verified mark when four things are true: the approval document is on file and in date, the fee has been confirmed with the institution in the current academic year, the contact details reach a human, and nothing on the page contradicts the official prospectus.',
     'When one of those lapses, the mark comes off until it is restored. We would rather show you a listing with an honest gap in it than a page that looks complete and is not.',
     'This is also why some well-known names are missing. Absence here is usually paperwork we have not finished, not a judgement.']},
  {slug:'walk-in-interview-checklist',cat:'Jobs',title:'The walk-in interview checklist nobody gives you',
   dek:'Two documents, one question and a rule about fees that will save you a wasted afternoon.',
   author:'Farah Qureshi',role:'Hiring desk',date:'11 Jun 2026',mins:4,
   body:['Carry two printed copies of your resume and one photo ID. Digital copies fail exactly when the office wifi does.',
     'Ask one question before the interview starts: what is the monthly in-hand figure, and what is the deduction structure. An employer who will not answer that at the door will not answer it after you join.',
     'And the rule: a genuine employer never charges you to apply, to be trained, or to be placed. Registration fees, security deposits, kit charges — walk out. Report the posting to us and we will take it down.']}];

export function BlogPage({path,go}){
  const slug=path?.replace(/^\/blog\/?/,'');
  const post=POSTS.find(p=>p.slug===slug);
  const [cat,setCat]=useState('All');
  const cats=['All',...new Set(POSTS.map(p=>p.cat))];

  if(post){
    const more=POSTS.filter(p=>p.slug!==post.slug&&p.cat===post.cat).slice(0,2);
    return <main id="main" tabIndex={-1} className="tool-page article-page">
      <div className="container breadcrumbs">
        <button className="linkish" onClick={()=>go('/blog')}>Blog</button><ChevronRight/><span>{post.cat}</span>
      </div>
      <article className="container article">
        <span className="kicker">{post.cat.toUpperCase()}</span>
        <h1>{post.title}</h1>
        <p className="art-dek">{post.dek}</p>
        <div className="art-meta">
          <span className="am-mark" aria-hidden="true">{post.author.split(' ').map(w=>w[0]).join('')}</span>
          <div><b>{post.author}</b><small>{post.role}</small></div>
          <span className="am-when"><CalendarDays/>{post.date}</span>
          <span className="am-when"><Clock3/>{post.mins} min read</span>
        </div>
        <div className="art-plate"><Plate seed={post.slug} tag={post.cat}/></div>
        <div className="art-body">{post.body.map((para,i)=><p key={i}>{para}</p>)}</div>
        <p className="note"><ShieldCheck/>Written by the DCW research desk. Indicative editorial content for this prototype — no advertiser had sight of it.</p>
      </article>
      {more.length>0&&<section className="container art-more">
        <h2 className="about-h2">More on {post.cat.toLowerCase()}</h2>
        <div className="blog-grid">{more.map(p=><PostCard key={p.slug} post={p} go={go}/>)}</div>
      </section>}
    </main>;
  }

  const lead=POSTS.find(p=>p.featured)||POSTS[0];
  /* The featured slot is only an "All" affordance. Once somebody picks a
     topic they want every piece in it, so the lead drops back into the grid
     rather than disappearing and leaving the count lying. */
  const rest=cat==='All'?POSTS.filter(p=>p!==lead):POSTS.filter(p=>p.cat===cat);
  return <main id="main" tabIndex={-1} className="tool-page blog-page">
    <PageHero
      tone="indigo"
      kicker="DCW JOURNAL"
      title={<>Plain answers to<br/><em>the expensive questions.</em></>}
      lead="Approvals, fees, boards and first jobs — written by the people who keep the records, and published whether or not it suits an advertiser."
      pills={<>
        <span><FileText/>{POSTS.length} articles</span>
        <span><ShieldCheck/>No sponsored placements</span>
      </>}/>
    <div className="container">
      {cat==='All'&&<button className="blog-lead" onClick={()=>go(`/blog/${lead.slug}`)}>
        <Plate seed={lead.slug} tag={lead.cat}/>
        <div>
          <span className="kicker">{lead.cat.toUpperCase()} · FEATURED</span>
          <h2>{lead.title}</h2>
          <p>{lead.dek}</p>
          <span className="bl-meta"><b>{lead.author}</b><i/>{lead.date}<i/>{lead.mins} min read</span>
          <span className="bl-go">Read the piece<ArrowRight/></span>
        </div>
      </button>}

      <div className="city-chips blog-chips" role="group" aria-label="Filter by topic">
        {cats.map(c=><button key={c} className={cat===c?'chip on':'chip'} onClick={()=>setCat(c)}
          aria-pressed={cat===c}>{c}<small>{c==='All'?POSTS.length:POSTS.filter(p=>p.cat===c).length}</small></button>)}
      </div>

      {rest.length>0
        ?<div className="blog-grid">{rest.map((p,i)=><PostCard key={p.slug} post={p} i={i} go={go}/>)}</div>
        :<div className="empty"><BookOpen/><h2>Nothing here yet</h2><p>No other pieces filed under {cat}. Try another topic.</p></div>}
    </div>
  </main>;
}

function PostCard({post,i=0,go}){
  return <button className="post-card" onClick={()=>go(`/blog/${post.slug}`)}>
    <Plate seed={post.slug} tag={post.cat}/>
    <div className="pc-body">
      <h3>{post.title}</h3>
      <p>{post.dek}</p>
      <span className="pc-meta"><b>{post.author}</b><i/>{post.date}<i/>{post.mins} min</span>
    </div>
  </button>;
}

export default BlogPage;
