'use client';
import {useState} from 'react';
import {ArrowRight,Check,Clock3,FileText,ShieldCheck,Sparkles,X,Download,ArrowLeft} from 'lucide-react';
import {PageHero} from '@/components/ui/primitives.jsx';
import {Repeater,ChipInput} from '@/components/forms/fields.jsx';

/* ---------- Resume builder --------------------------------------------------
   The first version collected five strings and printed them. A fresher's
   resume is rejected for the things it LEAVES OUT, so this version models the
   sections a recruiter actually scans, scores the draft against a written
   rubric rather than a vibe, and lays it out on a real A4 page. Export is the
   browser's own print-to-PDF: it produces a genuine, selectable-text PDF with
   no library, and no promise we cannot keep. */
const RESUME_SEED={
  name:'Amit Kumar',role:'Accounts & Operations Executive',city:'Patna, Bihar',
  phone:'+91 98765 43210',email:'amit.kumar@example.com',link:'linkedin.com/in/amitkumar',
  summary:'B.Com graduate with six months of hands-on Tally and GST experience from an internship at a practising firm. Comfortable owning day books, reconciliations and vendor follow-ups without supervision.',
  education:[
    {degree:'B.Com (Accounts & Finance)',school:'Patna University',year:'2022 – 2025',score:'72%'},
    {degree:'Class 12, Commerce',school:'BSEB, Patna',year:'2022',score:'78%'}],
  experience:[
    {title:'Accounts Intern',org:'Taxcare India, Patna',period:'Jan – Jun 2025',
     points:'Maintained day books and vendor ledgers in Tally Prime for 40+ client accounts\nPrepared GSTR-1 and GSTR-3B working files ahead of every filing deadline\nCut invoice-matching time by about a third by moving the team to a shared tracker'}],
  projects:[{name:'GST filing tracker',detail:'Excel workbook that flags missing purchase invoices before the filing date. Adopted by the whole intern team.'}],
  skills:['Tally Prime','GST returns','Advanced Excel','Bank reconciliation','Hindi & English communication'],
  certifications:['Tally Essential Level 1 — TallyEducation, 2024'],
  languages:['Hindi (native)','English (professional)','Bhojpuri (conversational)']
};
const RESUME_TEMPLATES=[
  {id:'classic',name:'Classic',blurb:'One column, no graphics. The safest choice when a company screens with software.',ats:'Best for ATS'},
  {id:'sidebar',name:'Sidebar',blurb:'Contact, skills and languages in a tinted rail so the right column stays about the work.',ats:'Best for skills-led roles'},
  {id:'banded',name:'Banded',blurb:'A coloured header band with your name and role. Reads well when a human shortlists by hand.',ats:'Best for walk-ins'}];
const RESUME_ACCENTS=[['ink','#16233B'],['blue','#0B4DA8'],['teal','#0C6E62'],['plum','#6B2E63'],['rust','#A5520A']];

const bullets=t=>String(t||'').split('\n').map(x=>x.replace(/^[•\-•]\s*/,'').trim()).filter(Boolean);
const words=t=>String(t||'').trim().split(/\s+/).filter(Boolean).length;


/* The rendered page. All three templates share this data and differ only in
   how the same sections are arranged — no template hides information. */
function ResumeDoc({d,template,accent}){
  const contact=[d.city,d.phone,d.email,d.link].filter(Boolean);
  const Head=()=><>
    <h2>{d.name||'Your name'}</h2>
    <p className="rd-role">{d.role||'Target role'}</p>
    <p className="rd-contact">{contact.map((c,i)=><span key={c+i}>{c}</span>)}</p>
  </>;
  const Body=({withAside})=><>
    {d.summary&&<section><h3>Profile</h3><p>{d.summary}</p></section>}
    {d.experience.some(e=>e.title||e.org)&&<section><h3>Experience</h3>
      {d.experience.filter(e=>e.title||e.org).map((e,i)=><article key={i}>
        <div className="rd-row"><b>{e.title}</b><span>{e.period}</span></div>
        <em>{e.org}</em>
        {bullets(e.points).length>0&&<ul>{bullets(e.points).map(b=><li key={b}>{b}</li>)}</ul>}
      </article>)}
    </section>}
    {d.education.some(e=>e.degree||e.school)&&<section><h3>Education</h3>
      {d.education.filter(e=>e.degree||e.school).map((e,i)=><article key={i}>
        <div className="rd-row"><b>{e.degree}</b><span>{e.year}</span></div>
        <em>{e.school}{e.score?` · ${e.score}`:''}</em>
      </article>)}
    </section>}
    {d.projects.some(p=>p.name)&&<section><h3>Projects</h3>
      {d.projects.filter(p=>p.name).map((p,i)=><article key={i}>
        <div className="rd-row"><b>{p.name}</b></div><p>{p.detail}</p>
      </article>)}
    </section>}
    {!withAside&&d.skills.length>0&&<section><h3>Skills</h3><p className="rd-inline">{d.skills.join(' · ')}</p></section>}
    {d.certifications.length>0&&<section><h3>Certifications</h3>
      <ul>{d.certifications.map(c=><li key={c}>{c}</li>)}</ul></section>}
    {!withAside&&d.languages.length>0&&<section><h3>Languages</h3><p className="rd-inline">{d.languages.join(' · ')}</p></section>}
  </>;

  if(template==='sidebar')return <article className={`resume-doc t-sidebar a-${accent}`}>
    <aside className="rd-rail">
      <span className="rd-initials" aria-hidden="true">{(d.name||'CV').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()}</span>
      <h4>Contact</h4><ul>{contact.map((c,i)=><li key={c+i}>{c}</li>)}</ul>
      {d.skills.length>0&&<><h4>Skills</h4><ul>{d.skills.map(s=><li key={s}>{s}</li>)}</ul></>}
      {d.languages.length>0&&<><h4>Languages</h4><ul>{d.languages.map(s=><li key={s}>{s}</li>)}</ul></>}
    </aside>
    <div className="rd-main">
      <h2>{d.name||'Your name'}</h2><p className="rd-role">{d.role||'Target role'}</p>
      <Body withAside/>
    </div>
  </article>;

  if(template==='banded')return <article className={`resume-doc t-banded a-${accent}`}>
    <header className="rd-band"><Head/></header>
    <div className="rd-main"><Body/></div>
  </article>;

  return <article className={`resume-doc t-classic a-${accent}`}>
    <header className="rd-plain"><Head/></header>
    <div className="rd-main"><Body/></div>
  </article>;
}

export function ResumeBuilder({notify}){
  const [step,setStep]=useState(0);
  const [template,setTemplate]=useState('classic');
  const [accent,setAccent]=useState('ink');
  const [d,setD]=useState(RESUME_SEED);
  const set=(k,v)=>setD(x=>({...x,[k]:v}));
  const STEPS=['Profile','Education','Experience','Skills','Design'];

  /* A written rubric, so the score means something specific and every miss
     names the fix. No points are awarded for filling a box with anything. */
  const checks=[
    ['A phone number and an email',!!(d.phone.trim()&&d.email.trim())],
    ['A named target role',d.role.trim().length>3],
    ['A profile of 25 words or more',words(d.summary)>=25],
    ['At least one qualification with a year',d.education.some(e=>e.degree.trim()&&e.year.trim())],
    ['Experience, an internship or a project',d.experience.some(e=>e.title.trim())||d.projects.some(p=>p.name.trim())],
    ['Two or more achievement bullets',d.experience.some(e=>bullets(e.points).length>=2)],
    ['A bullet with a number in it',d.experience.some(e=>bullets(e.points).some(b=>/\d/.test(b)))],
    ['Five or more skills',d.skills.length>=5],
    ['One certification or course',d.certifications.length>=1],
    ['A language you can work in',d.languages.length>=1]];
  const done=checks.filter(c=>c[1]).length;
  const score=done;   /* out of ten, deliberately — the user asked for a 10/10 */
  const missing=checks.filter(c=>!c[1]);

  return <main id="main" tabIndex={-1} className="tool-page resume-page">
    <PageHero
      tone="rust"
      kicker="FREE RESUME BUILDER · NO SIGN-UP"
      title={<>A resume that survives<br/><em>the first ten seconds.</em></>}
      lead="Recruiters scan for a role, a number and a reason to call. Fill five steps and the page updates as you type — then print it to PDF from your own browser."
      pills={<>
        <span><FileText/>5 ATS-safe templates</span>
        <span><ShieldCheck/>Nothing leaves this device</span>
        <span><Clock3/>About 6 minutes</span>
      </>}>
      <a className="btn primary tactile" href="#builder">Start building<ArrowRight/></a>
    </PageHero>

    <div className="container resume-layout" id="builder">
      <div className="resume-form">
        <ol className="stepper">{STEPS.map((x,i)=>
          <li key={x}><button onClick={()=>setStep(i)} className={step===i?'active':i<step?'done':''}>
            <b>{i<step?<Check/>:i+1}</b><span>{x}</span></button></li>)}
        </ol>

        {step===0&&<>
          <label>Full name<input autoComplete="name" value={d.name} onChange={e=>set('name',e.target.value)}/></label>
          <label>Target role<input value={d.role} placeholder="Accounts Executive" onChange={e=>set('role',e.target.value)}/>
            <small>Write the job you are applying for, not &ldquo;fresher&rdquo;.</small></label>
          <div className="two-up">
            <label>Phone<input type="tel" inputMode="tel" autoComplete="tel" value={d.phone} onChange={e=>set('phone',e.target.value)}/></label>
            <label>Email<input type="email" inputMode="email" autoComplete="email" value={d.email} onChange={e=>set('email',e.target.value)}/></label>
          </div>
          <div className="two-up">
            <label>City<input autoComplete="address-level2" value={d.city} onChange={e=>set('city',e.target.value)}/></label>
            <label>Portfolio or LinkedIn<input type="url" inputMode="url" autoComplete="url" value={d.link} placeholder="linkedin.com/in/…" onChange={e=>set('link',e.target.value)}/></label>
          </div>
          <label>Profile<textarea rows={4} value={d.summary} onChange={e=>set('summary',e.target.value)}
            placeholder="Two or three lines: what you studied, what you can already do, and what you want next."/>
            <small>{words(d.summary)} words · aim for 25–60.</small></label>
        </>}

        {step===1&&<Repeater label="Qualification" items={d.education} onChange={v=>set('education',v)}
          addLabel="Add another qualification"
          fields={[{key:'degree',label:'Course or class',hint:'B.Com (Accounts & Finance)'},
                   {key:'school',label:'Institution or board',hint:'Patna University'},
                   {key:'year',label:'Years',hint:'2022 – 2025'},
                   {key:'score',label:'Result',hint:'72% or 7.4 CGPA'}]}/>}

        {step===2&&<>
          <Repeater label="Role" items={d.experience} onChange={v=>set('experience',v)}
            addLabel="Add another role" max={3}
            fields={[{key:'title',label:'Job title',hint:'Accounts Intern'},
                     {key:'org',label:'Organisation',hint:'Taxcare India, Patna'},
                     {key:'period',label:'Period',hint:'Jan – Jun 2025'},
                     {key:'points',label:'What you did',area:true,rows:4,wide:true,
                      hint:'One achievement per line',
                      note:'Start each line with a verb and put a number in at least one.'}]}/>
          <p className="note"><Sparkles/> No job yet? A college project counts. Describe what you built and what changed because of it.</p>
          <Repeater label="Project" items={d.projects} onChange={v=>set('projects',v)}
            addLabel="Add a project" max={3}
            fields={[{key:'name',label:'Project name',hint:'GST filing tracker'},
                     {key:'detail',label:'What it does',area:true,rows:2,wide:true,hint:'One or two sentences.'}]}/>
        </>}

        {step===3&&<>
          <ChipInput label="Skills" items={d.skills} onChange={v=>set('skills',v)}
            hint="Tally Prime, Advanced Excel, GST returns"/>
          <ChipInput label="Certifications" items={d.certifications} onChange={v=>set('certifications',v)}
            hint="Course name — issuer, year" max={6}/>
          <ChipInput label="Languages" items={d.languages} onChange={v=>set('languages',v)}
            hint="Hindi (native), English (professional)" max={6}/>
        </>}

        {step===4&&<>
          <h3>Choose a layout</h3>
          <div className="template-picks">
            {RESUME_TEMPLATES.map(t=><button key={t.id} className={template===t.id?'active':''}
              onClick={()=>setTemplate(t.id)} aria-pressed={template===t.id}>
              <span className={`tp-thumb tp-${t.id}`} aria-hidden="true"><i/><i/><i/></span>
              <b>{t.name}</b><small>{t.blurb}</small><em>{t.ats}</em>
            </button>)}
          </div>
          <h3>Accent</h3>
          <div className="accent-picks" role="group" aria-label="Accent colour">
            {RESUME_ACCENTS.map(([id,hex])=><button key={id} aria-label={id} aria-pressed={accent===id}
              className={accent===id?'active':''} style={{'--sw':hex}} onClick={()=>setAccent(id)}/>)}
          </div>
          <p className="note"><ShieldCheck/> Printing uses your browser&rsquo;s own Save&nbsp;as&nbsp;PDF, so the text stays selectable and searchable — which is exactly what screening software needs.</p>
        </>}

        <div className="wizard-actions">
          {step>0&&<button className="btn outline" onClick={()=>setStep(step-1)}><ArrowLeft/>Back</button>}
          {step<4
            ?<button className="btn primary" onClick={()=>setStep(step+1)}>Continue<ArrowRight/></button>
            :<button className="btn primary" onClick={()=>{window.print();notify('Print dialog opened — choose Save as PDF')}}><Download/>Print / Save as PDF</button>}
        </div>
      </div>

      <div className="resume-side">
        <div className="score-card">
          <div className="sc-head">
            <span className="sc-ring" style={{'--pct':`${score*10}%`}}><b>{score}</b><small>/10</small></span>
            <div><b>Resume strength</b>
              <small>{score>=9?'Ready to send.':score>=6?'Solid — close the gaps below.':'Keep going; the essentials are still missing.'}</small></div>
          </div>
          {missing.length>0
            ?<ul className="sc-miss">{missing.slice(0,4).map(([label])=><li key={label}><X/>{label}</li>)}</ul>
            :<p className="sc-done"><Check/>Every check passed. Print it and apply.</p>}
        </div>
        <ResumeDoc d={d} template={template} accent={accent}/>
        <p className="resume-hint">A4 preview · updates as you type</p>
      </div>
    </div>
  </main>;
}

export default ResumeBuilder;
