'use client';
import {useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {ArrowRight,Check,ChevronDown,ShieldCheck,BookOpen,RotateCcw,Zap,IndianRupee,BadgeCheck} from 'lucide-react';
import {Plate} from '@/components/ui/plate.jsx';
import {SectionTitle} from '@/components/ui/primitives.jsx';
import {CatalogGrid} from '@/components/discovery/catalog-states.jsx';
import {EntityCard} from '@/components/discovery/entity-card.jsx';
import {useApi} from '@/lib/client/api.js';

/* ---------- Board comparison ------------------------------------------------
   Was a bare table plus a quiz. Item 6 asked for a hero, real cards and the
   universities a certificate actually leads to. Order follows the decision, not
   the data: see the three routes -> read the facts side by side -> answer four
   questions -> see where it takes you -> apply. The table stays, because
   comparison is the one job a table does better than cards.

   The three boards used to be written out twice in this file — once as a
   `BOARDS` array for the cards and again as a literal 7×4 grid for the table —
   so correcting a fee meant editing two places and shipping a build. Both now
   come from /api/boards, which is the record /admin/boards edits. */
const ICONS={badge:<BadgeCheck/>,zap:<Zap/>,rupee:<IndianRupee/>};
/* The quiz's first question, hoisted so a link can arrive having already
   answered it: /distance/boards?goal=Fastest%20result opens on question two.
   Nothing in the app links that way today — the /distance path card that did
   was removed at the client's request — but the parameter is part of the page's
   contract with campaigns and counsellors who send a board-specific link, so it
   stays supported and is validated against this list rather than trusted. */
const GOALS=['Widest acceptance','Fastest result','Lowest fee'];

export function Boards(ctx){const {setLead,go}=ctx;
  const {data,state}=useApi('/api/boards');
  const BOARDS=data?.rows??[];
  const fields=data?.comparison??[];
  /* Seeding from the URL rather than firing an effect after mount: the first
     paint should already show question two, not show question one and then
     move. A goal we do not recognise is ignored and the quiz starts at the
     beginning. */
  const goalParam=useSearchParams().get('goal');
  const goal=GOALS.includes(goalParam)?goalParam:null;
  const [step,setStep]=useState(goal?1:0),[answers,setAnswers]=useState(goal?[goal]:[]);
  const qs=[['What matters most?',GOALS],['When do you want to appear?',['Next available exam','Within 3 months','No rush']],['Where will you use it?',['College admission','Government job','Skill course']],['Your location?',['Bihar','Elsewhere in India','Abroad']]];
  /* Each answer leans towards one route. Scored against the live list by id, so
     a board retired in /admin cannot be recommended by a quiz that has not
     heard about it. */
  const WEIGHTS={nios:['Widest acceptance','College admission','Government job','Abroad'],bosse:['Fastest result','Next available exam','Within 3 months','Skill course'],bbose:['Lowest fee','Bihar','No rush']};
  const winner=BOARDS.map(b=>[b,answers.filter(a=>(WEIGHTS[b.id]??[]).includes(a)).length]).sort((x,y)=>y[1]-x[1])[0]?.[0]??null;
  const rationale={nios:'Best aligned with broad acceptance and mainstream admission or government-job use.',bosse:'Best aligned with faster examination cycles and flexible completion.',bbose:'Best aligned with budget-conscious Bihar learners who can follow a regular schedule.'}[winner?.id]??winner?.bestFor??'';
  const applyTo=b=>setLead({mode:'apply',title:`Apply through ${b.name}`,interest:b.id,interestType:'board',course:`Class 12 via ${b.name}`,courses:[`Class 10 via ${b.name}`,`Class 12 via ${b.name}`],where:b.full});
  return <main id="main" tabIndex={-1} className="tool-page">
    <section className="tool-hero">
      <picture>
        <source type="image/webp" media="(max-width:900px)" srcSet="/dcw-journey-hero-900.webp"/>
        <source type="image/webp" srcSet="/dcw-journey-hero-full.webp"/>
        <img src="/dcw-journey-hero.png" alt="Student looking toward a bright education and career pathway" decoding="async"/>
      </picture>
      <div className="hero-shade"/>
      <div className="container tool-hero-copy">
        <span className="eyebrow"><BookOpen size={16}/>BOARD DECISION GUIDE</span>
        <h1>Finish 10th or 12th<br/><em>on a board that counts.</em></h1>
        <p>Three recognised open-school routes, compared on the things that decide it — acceptance, exam cycle, result time and total fee. Then apply, with a counsellor checking your documents first.</p>
        <div className="hero-ctas">
          <button className="btn primary tactile" onClick={()=>BOARDS[0]&&applyTo(BOARDS[0])} disabled={!BOARDS.length}>Apply for admission<ArrowRight/></button>
          <a className="btn ghost" href="#compare">Compare all three<ChevronDown/></a>
          {/* Only when the person arrived on a link that already answered
              the first question. The quiz sits below the hero and the comparison
              table; without this they would have to scroll past both to find the
              thing their click was about. */}
          {goal&&<a className="btn ghost" href="#quiz">Your recommendation<ArrowRight/></a>}
        </div>
      </div>
    </section>

    <section className="section container">
      <SectionTitle kicker="YOUR THREE ROUTES" title="Pick the board that matches your deadline" action="Jump to comparison" onAction={()=>document.getElementById('compare')?.scrollIntoView({behavior:'smooth',block:'start'})}/>
      <div className="path-grid board-grid">{state==='loading'&&BOARDS.length===0&&[0,1,2].map(i=>
        <article className="path-card board-card" key={i}><div className="bc-skel"/></article>)}
      {BOARDS.map(b=>
        <article className="path-card board-card" key={b.id}>
          <Plate seed={b.full} mark={b.name} tag={b.kicker} icon={ICONS[b.iconKey]??ICONS.badge}/>
          <div className="pc-body">
            <h3>{b.name}</h3>
            <p className="bc-full">{b.full}</p>
            {/* The sentence a student who failed a board exam can act on, before
                any of the numbers underneath it. */}
            <p className="bc-plain">{b.plain}</p>
            <dl className="bc-facts">
              <div><dt>Result in</dt><dd>{b.resultLabel}</dd></div>
              <div><dt>Exam cycle</dt><dd>{b.examLabel}</dd></div>
              <div><dt>Indicative fee</dt><dd>{b.feeLabel}</dd></div>
              <div><dt>Acceptance</dt><dd>{b.acceptanceLabel}</dd></div>
            </dl>
            <p className="bc-best"><Check/>{b.bestFor}</p>
            <div className="bc-foot">
              <button className="btn primary small" onClick={()=>applyTo(b)}>Apply<ArrowRight/></button>
              <button className="btn outline small" onClick={()=>setLead({title:`${b.name} eligibility check`,interest:b.id})}>Check eligibility</button>
            </div>
          </div>
        </article>)}
      </div>
    </section>

    <section className="section wash" id="compare">
      <div className="container">
        <SectionTitle kicker="SIDE BY SIDE" title={`The same ${fields.length||7} facts, for all ${BOARDS.length||3} boards`}/>
        <div className="board-table" style={{'--board-cols':BOARDS.length||3}}>
          <div className="board-row head"><b>What matters</b>{BOARDS.map(b=><b key={b.id}>{b.name}</b>)}</div>
          {fields.map(f=>
            <div className="board-row" key={f.field}><span>{f.label}</span>{f.values.map((x,i)=><span key={i}>{x}</span>)}</div>)}
        </div>
        <p className="note"><ShieldCheck/> Checked against board circulars each admission cycle, and edited in the admin console rather than in code.</p>
      </div>
    </section>

    <section className="container quiz" id="quiz">
      <div><span className="kicker">2-MINUTE RECOMMENDATION</span><h2>{step<4?`Question ${step+1} of 4`:'Your best starting point'}</h2><div className="quiz-progress"><i style={{width:`${Math.min(step+1,4)*25}%`}}/></div></div>
      {/* Says out loud what the URL did. A quiz that opens on question two
          without explanation reads as a bug; saying which answer was carried
          over — and offering to undo it in one click — makes the head start
          something the person can see and refuse. */}
      {goal&&step>0&&answers[0]===goal&&<p className="quiz-carried">Carried over from your choice: <b>{goal}</b><button className="linkish" onClick={()=>{setStep(0);setAnswers([]);go('/distance/boards')}}>Change</button></p>}
      {step<4
        ? <div className="question"><h3>{qs[step][0]}</h3>{qs[step][1].map(x=><button key={x} onClick={()=>{setAnswers([...answers,x]);setStep(step+1)}}>{x}<ArrowRight/></button>)}</div>
        : winner?<div className="recommend"><span className="entity-mark large">{winner.name.slice(0,2)}</span><div><span className="verified"><Check/> BEST FIT FROM YOUR ANSWERS</span><h3>Start with {winner.name}</h3><p>{rationale}</p><div className="bc-foot"><button className="btn primary" onClick={()=>applyTo(winner)}>Apply through {winner.name}<ArrowRight/></button><button className="text-btn" onClick={()=>{setStep(0);setAnswers([])}}><RotateCcw/>Restart quiz</button></div></div></div>
        :<p className="note">Loading the board list…</p>}
    </section>

    <section className="section container">
      <SectionTitle kicker="WHERE IT TAKES YOU NEXT" title="Universities that admit open-school students" action="See all universities" onAction={()=>go('/distance/universities')}/>
      <p className="section-lede">Every board on this page is UGC-recognised for further study. These universities accept an open-school certificate directly — no bridge course, no extra year.</p>
      <div className="card-grid"><CatalogGrid catalog={ctx.catalog} skeleton={3}>{['amity-online','lpu','ignou'].map(id=>ctx.catalog.rows.find(u=>u.id===id)).filter(Boolean).map(u=><EntityCard key={u.id} item={u} {...ctx}/>)}</CatalogGrid></div>
    </section>
  </main>;
}

export default Boards;
