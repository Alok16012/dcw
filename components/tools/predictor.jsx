'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,MapPin} from 'lucide-react';
import {SectionTitle} from '@/components/ui/primitives.jsx';
import {CatalogError,EmptyState} from '@/components/discovery/catalog-states.jsx';

/* ---------- NEET rank predictor ---------------------------------------------
   The first version predicted in the browser: it scraped a cutoff out of the
   card's display string, added invented category offsets (OBC +9000, SC
   +26000 …) that appear in no dataset, and then labelled whichever three
   colleges were numerically nearest "Strong", "Possible" and "Backup" by
   position. A college far above the visitor's reach could therefore be called
   a strong chance, and a NEET rank was matched against NIT Patna's JEE Main
   closing rank.

   Prediction is now one server call to /api/tools/rank-predictor, which reads
   the recorded per-category closing ranks, keeps to the colleges that accept
   the exam in question, and buckets by the distance between rank and cutoff.
   The component's job is to ask, to wait, and to explain the answer. */
const BUDGET_BANDS = {'25': 2500000, '50': 5000000, plus: null};
const BUCKETS = [
  ['strong', 'Strong chance', 'Your rank clears last year’s closing rank with room to spare.'],
  ['possible', 'Possible', 'Your rank sits close to the closing rank — it turns on this year’s competition.'],
  ['backup', 'Backup', 'Above last year’s closing rank, so worth holding as an alternative.']
];

export function Predictor({setLead}){
  const resultsRef=useRef(null);
  const [rank,setRank]=useState('45000'),[category,setCategory]=useState('General'),
        [domicile,setDomicile]=useState('Bihar'),[budget,setBudget]=useState('25');
  const [res,setRes]=useState(null);            // last successful prediction
  const [status,setStatus]=useState('idle');    // idle | loading | error | done
  const [error,setError]=useState('');
  const n=Math.max(1,Math.min(2500000,Number(rank)||1));

  const run=useCallback(async()=>{
    setStatus('loading');setError('');
    try{
      const r=await fetch('/api/tools/rank-predictor',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({rank:n,category,budget:BUDGET_BANDS[budget],exam:'NEET-UG'})
      });
      const body=await r.json().catch(()=>null);
      if(!r.ok||!body||body.ok===false)throw new Error(body?.message||`Prediction unavailable (${r.status})`);
      setRes(body.data);setStatus('done');
    }catch(err){
      setError(err.message||'Prediction unavailable');setStatus('error');setRes(null);
    }
  },[n,category,budget]);

  /* Focus alone does not reliably scroll a freshly mounted region into view,
     and on a phone the shortlist starts a screen and a half below the form. */
  useEffect(()=>{
    if(status==='idle')return;
    const el=resultsRef.current;if(!el)return;
    el.focus({preventScroll:true});el.scrollIntoView({block:'start'});
  },[status,res]);

  const groups=res?BUCKETS.map(([k,label,note])=>[k,label,note,res.results?.[k]??[]]).filter(g=>g[3].length):[];
  const shown=groups.reduce((t,g)=>t+g[3].length,0);

  return <main id="main" tabIndex={-1} className="tool-page">
    <div className="container predictor">
      <div className="predict-copy">
        <span className="kicker">NEET COLLEGE PREDICTOR</span>
        <h1>Turn your rank into a realistic shortlist.</h1>
        <p>We compare your rank against the closing ranks recorded for each college, and group the results by how much room you have.</p>
        <ul><li><Check/> Three results shown free</li><li><Check/> Matched on your category&rsquo;s closing rank</li><li><Check/> Budget included in the match</li></ul>
      </div>
      <form onSubmit={e=>{e.preventDefault();run()}} className="predict-form">
        <label>NEET rank<input value={rank} min="1" max="2500000" onChange={e=>setRank(e.target.value.replace(/\D/g,''))} required inputMode="numeric"/></label>
        <div className="form-grid">
          <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option>General</option><option>OBC</option><option>SC</option><option>ST</option></select></label>
          <label>Domicile<select value={domicile} onChange={e=>setDomicile(e.target.value)}><option>Bihar</option><option>Delhi</option><option>Uttar Pradesh</option></select></label>
        </div>
        <label>Total budget<select value={budget} onChange={e=>setBudget(e.target.value)}><option value="25">Up to &#8377;25 lakh</option><option value="50">Up to &#8377;50 lakh</option><option value="plus">&#8377;50 lakh+</option></select></label>
        <button className="btn primary" disabled={status==='loading'}>{status==='loading'?'Checking cutoffs…':<>Show my college chances<ArrowRight/></>}</button>
        <small>Grouped from recorded closing ranks&mdash;not official counselling advice.</small>
      </form>
    </div>

    {status!=='idle'&&<section className="container prediction-results" ref={resultsRef} tabIndex={-1} aria-label="Your predicted colleges" aria-busy={status==='loading'}>
      {status==='loading'&&<p role="status" className="predict-status">Checking your rank against recorded cutoffs&hellip;</p>}
      {status==='error'&&<CatalogError title="We could not run the prediction" error={error} retry={run}/>}
      {status==='done'&&shown===0&&<EmptyState title="No match at this rank and budget" body="No college in the catalogue records a NEET closing rank that fits this combination. Widening the budget band is usually the change that helps."/>}
      {status==='done'&&shown>0&&<>
        <SectionTitle kicker={`RANK ${n.toLocaleString('en-IN')} · ${category.toUpperCase()} · ${domicile.toUpperCase()}`} title={shown<res.total?`Showing ${shown} of ${res.total} matching colleges`:`${shown} matching ${shown===1?'college':'colleges'}`}/>
        {groups.map(([k,label,note,rows])=><div key={k} className="bucket-group">
          <h3 className={`bucket b-${k}`}>{label}</h3>
          <p className="bucket-note">{note}</p>
          <div className="bucket-grid">{rows.map(c=><article key={c.id}>
            <div className="entity-top"><span className="entity-mark">{c.mark}</span><div><h4>{c.name}</h4><p><MapPin/>{c.place}</p></div></div>
            <dl className="cutoff-line">
              <div><dt>Cutoff ({c.cutoffCategory})</dt><dd>{c.closingRank.toLocaleString('en-IN')}</dd></div>
              <div><dt>Your rank</dt><dd>{n.toLocaleString('en-IN')}</dd></div>
              <div><dt>Total fee</dt><dd>{'₹'+(c.fee/100000).toFixed(1)+' L'}</dd></div>
            </dl>
            {!c.exactCategory&&<small className="cutoff-caveat">No {category} cutoff recorded &mdash; compared against the General closing rank.</small>}
          </article>)}</div>
        </div>)}
        {res.gated&&res.total>shown&&<button className="btn primary unlock" onClick={()=>setLead({title:'Unlock full NEET shortlist',interest:`neet-${n}-${category}-${domicile}`})}>See the other {res.total-shown} matches<ArrowRight/></button>}
      </>}
    </section>}
  </main>;
}


export default Predictor;
