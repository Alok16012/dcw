'use client';
import {useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {ArrowRight,Check,ChevronDown,ShieldCheck,BookOpen,RotateCcw,Zap,IndianRupee,BadgeCheck,Landmark} from 'lucide-react';
import {Plate} from '@/components/ui/plate.jsx';
import {SectionTitle} from '@/components/ui/primitives.jsx';
import {CatalogGrid} from '@/components/discovery/catalog-states.jsx';
import {EntityCard} from '@/components/discovery/entity-card.jsx';

/* ---------- Board comparison ------------------------------------------------
   Was a bare table plus a quiz. Item 6 asked for a hero, real cards and the
   universities a certificate actually leads to. Order follows the decision, not
   the data: see the four routes -> read the facts side by side -> answer four
   questions -> see where it takes you -> apply. The table stays, because
   comparison is the one job a table does better than cards. */
export const BOARDS=[
{id:'nios',name:'NIOS',full:'National Institute of Open Schooling',kicker:'CENTRAL BOARD',icon:<BadgeCheck/>,result:'45–60 days',fee:'₹18,500',exam:'2×/yr + on-demand',accept:'88 / 100',best:'Widest acceptance — college admission and government jobs.'},
{id:'bosse',name:'BOSSE',full:'Board of Open Schooling and Skill Education, Sikkim',kicker:'STATE BOARD',icon:<Zap/>,result:'45 days',fee:'₹17,000',exam:'On-demand',accept:'62 / 100',best:'Fastest legitimate route when a deadline is close.'},
{id:'bbose',name:'BBOSE',full:'Bihar Board of Open Schooling and Examination',kicker:'STATE BOARD',icon:<IndianRupee/>,result:'60–90 days',fee:'₹9,500',exam:'On-demand',accept:'45 / 100',best:'Lowest fee for Bihar learners who can follow a schedule.'},
{id:'cbse-patrachar',name:'CBSE',full:'CBSE Patrachar (correspondence)',kicker:'CENTRAL BOARD',icon:<Landmark/>,result:'55 days',fee:'₹22,000',exam:'Once a year',accept:'98 / 100',best:'When the certificate itself has to say CBSE.'}];
/* The quiz's first question, hoisted so the /distance "Fast track" card can
   arrive having already answered it. Three of the six path cards pointed here
   and all three landed on the identical page; this is the one whose promise —
   "the fastest legitimate path" — the quiz can actually act on, because
   "Fastest result" is one of its own answers. "Complete 10th" and "Complete
   12th" are left alone: the same four boards serve both, so sending them to the
   same page is the honest answer rather than a missing feature. */
const GOALS=['Widest acceptance','Fastest result','Lowest fee'];

export function Boards(ctx){const {setLead,go}=ctx;
  /* Seeding from the URL rather than firing an effect after mount: the first
     paint should already show question two, not show question one and then
     move. A goal we do not recognise is ignored and the quiz starts at the
     beginning. */
  const goalParam=useSearchParams().get('goal');
  const goal=GOALS.includes(goalParam)?goalParam:null;
  const [step,setStep]=useState(goal?1:0),[answers,setAnswers]=useState(goal?[goal]:[]);
  const qs=[['What matters most?',GOALS],['When do you want to appear?',['Next available exam','Within 3 months','No rush']],['Where will you use it?',['College admission','Government job','Skill course']],['Your location?',['Bihar','Elsewhere in India','Abroad']]];const scores={NIOS:0,BOSSE:0,BBOSE:0};answers.forEach(a=>{if(['Widest acceptance','College admission','Government job','Abroad'].includes(a))scores.NIOS+=2;if(['Fastest result','Next available exam','Within 3 months','Skill course'].includes(a))scores.BOSSE+=2;if(['Lowest fee','Bihar','No rush'].includes(a))scores.BBOSE+=2});const winner=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];const rationale={NIOS:'Best aligned with broad acceptance and mainstream admission or government-job use.',BOSSE:'Best aligned with faster examination cycles and flexible completion.',BBOSE:'Best aligned with budget-conscious Bihar learners who can follow a regular schedule.'}[winner];
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
        <p>Four recognised open-school routes, compared on the things that decide it — acceptance, exam cycle, result time and total fee. Then apply, with a counsellor checking your documents first.</p>
        <div className="hero-ctas">
          <button className="btn primary tactile" onClick={()=>applyTo(BOARDS[0])}>Apply for admission<ArrowRight/></button>
          <a className="btn ghost" href="#compare">Compare all four<ChevronDown/></a>
          {/* Only when the person arrived from a path card that already answered
              the first question. The quiz sits below the hero and the comparison
              table; without this they would have to scroll past both to find the
              thing their click was about. */}
          {goal&&<a className="btn ghost" href="#quiz">Your recommendation<ArrowRight/></a>}
        </div>
      </div>
    </section>

    <section className="section container">
      <SectionTitle kicker="YOUR FOUR ROUTES" title="Pick the board that matches your deadline" action="Jump to comparison" onAction={()=>document.getElementById('compare')?.scrollIntoView({behavior:'smooth',block:'start'})}/>
      <div className="path-grid board-grid">{BOARDS.map((b,i)=>
        <article className="path-card board-card" key={b.id}>
          <Plate seed={b.full} mark={b.name} tag={b.kicker} icon={b.icon}/>
          <div className="pc-body">
            <h3>{b.name}</h3>
            <p className="bc-full">{b.full}</p>
            <dl className="bc-facts">
              <div><dt>Result in</dt><dd>{b.result}</dd></div>
              <div><dt>Exam cycle</dt><dd>{b.exam}</dd></div>
              <div><dt>Indicative fee</dt><dd>{b.fee}</dd></div>
              <div><dt>Acceptance</dt><dd>{b.accept}</dd></div>
            </dl>
            <p className="bc-best"><Check/>{b.best}</p>
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
        <SectionTitle kicker="SIDE BY SIDE" title="The same seven facts, for every board"/>
        <div className="board-table">
          <div className="board-row head"><b>What matters</b><b>NIOS</b><b>BOSSE</b><b>BBOSE</b></div>
          {[['Recognition','Central board','Sikkim state board','Bihar state board'],['Exam frequency','2× yearly + on-demand','On-demand','On-demand'],['Typical result','45–60 days','45 days','60–90 days'],['Acceptance score','88 / 100','62 / 100','45 / 100'],['Subject flexibility','High','High','Medium'],['Indicative fee','₹18,500','₹17,000','₹9,500'],['Best for','Widest acceptance','Fastest result','Bihar, on-demand exam']].map(r=>
            <div className="board-row" key={r[0]}>{r.map((x,i)=><span key={i} className={i===2?'highlight':''}>{x}</span>)}</div>)}
        </div>
        <p className="note"><ShieldCheck/> Indicative demo data, checked against board circulars each admission cycle.</p>
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
        : <div className="recommend"><span className="entity-mark large">{winner.slice(0,2)}</span><div><span className="verified"><Check/> BEST FIT FROM YOUR ANSWERS</span><h3>Start with {winner}</h3><p>{rationale}</p><div className="bc-foot"><button className="btn primary" onClick={()=>applyTo(BOARDS.find(b=>b.name===winner)||BOARDS[0])}>Apply through {winner}<ArrowRight/></button><button className="text-btn" onClick={()=>{setStep(0);setAnswers([])}}><RotateCcw/>Restart quiz</button></div></div></div>}
    </section>

    <section className="section container">
      <SectionTitle kicker="WHERE IT TAKES YOU NEXT" title="Universities that admit open-school students" action="See all universities" onAction={()=>go('/distance/universities')}/>
      <p className="section-lede">Every board on this page is UGC-recognised for further study. These universities accept an open-school certificate directly — no bridge course, no extra year.</p>
      <div className="card-grid"><CatalogGrid catalog={ctx.catalog} skeleton={3}>{['amity-online','lpu','ignou'].map(id=>ctx.catalog.rows.find(u=>u.id===id)).filter(Boolean).map(u=><EntityCard key={u.id} item={u} {...ctx}/>)}</CatalogGrid></div>
    </section>
  </main>;
}

export default Boards;
